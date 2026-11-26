"use client";
// components/logistics/useLogisticsData.ts
// Données partagées par les trois pages Logistique (envois, transporteurs, analyse).
// Chaque page appelle ce hook avec ce dont elle a besoin : lib/apiCache.ts dédoublonne les lectures identiques,
// et toute écriture vide ce cache, donc `reload()` après une modification relit bien le serveur.
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/session";
import { LogisticsApiError, logisticsApi } from "./api";
import type { Carrier, LogisticsStats, Shipment } from "./types";

type Wanted = { shipments?: boolean; carriers?: boolean; stats?: boolean };

interface Loaded {
  shipments: Shipment[] | null;
  carriers: Carrier[] | null;
  stats: LogisticsStats | null;
}

interface Failures {
  shipments: LogisticsApiError | null;
  carriers: LogisticsApiError | null;
  stats: LogisticsApiError | null;
}

export interface LogisticsData extends Loaded {
  /** Erreur de chaque lecture : une liste en échec n'est jamais présentée comme une liste vide. */
  errors: Failures;
  /** Premier chargement en cours (rien à afficher encore). */
  loading: boolean;
  /** Relecture en cours : les données déjà affichées restent à l'écran. */
  refreshing: boolean;
  reload: () => Promise<void>;
}

const NOTHING: Loaded = { shipments: null, carriers: null, stats: null };
const NO_FAILURE: Failures = { shipments: null, carriers: null, stats: null };

type Settled<T> = { ok: true; value: T } | { ok: false; error: LogisticsApiError };

async function settle<T>(request: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await request };
  } catch (e) {
    return { ok: false, error: e instanceof LogisticsApiError ? e : new LogisticsApiError("", 0) };
  }
}

/** Une réponse qui n'est pas un tableau est une erreur, pas « aucun envoi ». */
async function readList<T>(path: string): Promise<T[]> {
  const data = await logisticsApi<unknown>(path);
  if (!Array.isArray(data)) throw new LogisticsApiError("", 500);
  return data as T[];
}

async function readStats(): Promise<LogisticsStats> {
  const data = await logisticsApi<LogisticsStats>("/logistics/stats");
  if (!data || typeof data !== "object" || !Array.isArray(data.byCarrier) || !Array.isArray(data.byMonth)) throw new LogisticsApiError("", 500);
  return data;
}

// Le montant arrive sous forme de chaîne (colonne décimale) : on le convertit une fois, ici.
const toShipment = (row: Shipment): Shipment => ({ ...row, amount: Number(row.amount) || 0 });

export function useLogisticsData(wanted: Wanted): LogisticsData {
  const { shipments: wantShipments = false, carriers: wantCarriers = false, stats: wantStats = false } = wanted;
  const [data, setData] = useState<Loaded>(NOTHING);
  const [errors, setErrors] = useState<Failures>(NO_FAILURE);
  const [pending, setPending] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  // Seule la réponse de la dernière demande est retenue (deux relectures peuvent se croiser).
  const sequence = useRef(0);

  const reload = useCallback(async () => {
    // Sans jeton, la page renvoie vers la connexion (useRequireAuth) : inutile d'interroger le serveur.
    if (!getToken()) return;
    const id = ++sequence.current;
    setPending(true);
    const [shipments, carriers, stats] = await Promise.all([
      wantShipments ? settle(readList<Shipment>("/logistics/client/shipments")) : null,
      wantCarriers ? settle(readList<Carrier>("/transporteurs")) : null,
      wantStats ? settle(readStats()) : null,
    ]);
    if (id !== sequence.current) return;
    setData({
      shipments: shipments?.ok ? shipments.value.map(toShipment) : null,
      carriers: carriers?.ok ? carriers.value : null,
      stats: stats?.ok ? stats.value : null,
    });
    setErrors({
      shipments: shipments && !shipments.ok ? shipments.error : null,
      carriers: carriers && !carriers.ok ? carriers.error : null,
      stats: stats && !stats.ok ? stats.error : null,
    });
    setLoadedOnce(true);
    setPending(false);
  }, [wantShipments, wantCarriers, wantStats]);

  useEffect(() => { void reload(); }, [reload]);

  return { ...data, errors, loading: pending && !loadedOnce, refreshing: pending && loadedOnce, reload };
}

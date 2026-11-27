"use client";
/**
 * Gestion du stock : niveaux par dépôt, dépôts, mouvements, lots, inventaires, alertes, rotation, valorisation,
 * avec les opérations d'ajustement et de transfert. L'onglet vient de l'adresse (/dashboard/stock/levels, /warehouses…) ;
 * l'écran est monté par layout.tsx et reste en place d'un onglet à l'autre (dépôts et produits chargés une seule fois).
 */
import React, { useCallback, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, Btn, ErrorBox, Page, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";
import StockNav, { STOCK_TAB_PATHS } from "@/components/stock/StockNav";
import { useRouteTab } from "@/lib/useRouteTab";
import { makeTr } from "@/components/stock/i18n";
import type { StockProduct, Warehouse } from "@/components/stock/shared";
import { AdjustModal, TransferModal } from "@/components/stock/Modals";
import { AlertsTab, CountsTab, RotationTab, ValuationTab } from "@/components/stock/TabsB";
import { LevelsTab, LotsTab, MovementsTab, WarehousesTab, type TabProps } from "@/components/stock/TabsA";

export default function StockManageApp() {
  useRequireAuth();
  const { language } = useLanguage();
  const tr = useMemo(() => makeTr(language), [language]);
  const [tab] = useRouteTab(STOCK_TAB_PATHS, "levels");
  const [notice, notify] = useNotice();
  const [refresh, setRefresh] = useState(0);
  const bump = useCallback(() => setRefresh((n) => n + 1), []);
  const [adjust, setAdjust] = useState<{ productId?: number } | null>(null);
  const [transfer, setTransfer] = useState(false);

  const wh = useLoad(() => api<Warehouse[]>("/stock/warehouses"), [refresh]);
  const prod = useLoad(() => api<StockProduct[]>("/products"), [refresh]);
  const warehouses = wh.data || [];
  // Les services n'ont pas de stock : ils ne se choisissent ni dans un ajustement, ni dans un transfert, ni dans un inventaire.
  const products = useMemo(() => (Array.isArray(prod.data) ? prod.data : []).filter((p) => p.isStockable !== false), [prod.data]);

  const subtitles: Record<string, string> = {
    levels: tr("Stock de chaque produit, réparti par dépôt, avec coût moyen et valeur.", "Each product's stock by warehouse, with average cost and value.", "Stock de cada producto por almacén, con costo medio y valor."),
    warehouses: tr("Vos lieux de stockage : création, dépôt par défaut, activation.", "Your storage locations: creation, default warehouse, activation.", "Sus lugares de almacenamiento: creación, almacén predeterminado, activación."),
    movements: tr("Journal complet des entrées, sorties, transferts et ajustements.", "Full log of receipts, issues, transfers and adjustments.", "Registro completo de entradas, salidas, transferencias y ajustes."),
    lots: tr("Lots en stock et dates de péremption.", "Lots in stock and expiry dates.", "Lotes en stock y fechas de caducidad."),
    counts: tr("Comptage physique d'un dépôt et correction automatique des écarts.", "Physical count of a warehouse and automatic correction of differences.", "Conteo físico de un almacén y corrección automática de diferencias."),
    alerts: tr("Ruptures, stocks bas et lots à surveiller.", "Stock-outs, low stock and lots to watch.", "Agotados, stock bajo y lotes a vigilar."),
    rotation: tr("Vitesse d'écoulement du stock et produits dormants.", "How fast stock moves, and dormant products.", "Velocidad de salida del stock y productos inactivos."),
    valuation: tr("Valeur du stock au coût moyen pondéré et contrôle de cohérence.", "Stock value at weighted average cost, and consistency check.", "Valor del stock a costo medio ponderado y control de coherencia."),
  };

  const common: TabProps = { tr, warehouses, products, notify, refresh, bump };
  const done = (message: string) => { setAdjust(null); setTransfer(false); notify(message); bump(); };

  return (
    <Page
      title={tr("Stock", "Stock", "Stock")}
      subtitle={subtitles[tab]}
      actions={<>
        <Btn onClick={() => setAdjust({})} disabled={wh.loading && !wh.data}>{tr("Ajustement", "Adjustment", "Ajuste")}</Btn>
        <Btn onClick={() => setTransfer(true)} disabled={wh.loading && !wh.data}>{tr("Transfert", "Transfer", "Transferencia")}</Btn>
      </>}
    >
      <StockNav />
      {notice}
      {wh.error && <ErrorBox message={wh.error} onRetry={wh.reload} />}
      {tab === "levels" && <LevelsTab {...common} onAdjust={(productId) => setAdjust({ productId })} />}
      {tab === "warehouses" && <WarehousesTab {...common} />}
      {tab === "movements" && <MovementsTab {...common} />}
      {tab === "lots" && <LotsTab {...common} />}
      {tab === "counts" && <CountsTab {...common} />}
      {tab === "alerts" && <AlertsTab {...common} onAdjust={(productId) => setAdjust({ productId })} />}
      {tab === "rotation" && <RotationTab {...common} />}
      {tab === "valuation" && <ValuationTab {...common} />}
      {adjust && (
        <AdjustModal
          tr={tr} products={products} warehouses={warehouses} product={adjust.productId ? products.find((p) => p.id === adjust.productId) || { id: adjust.productId, name: String(adjust.productId) } : null}
          onClose={() => setAdjust(null)} onDone={done}
        />
      )}
      {transfer && <TransferModal tr={tr} products={products} warehouses={warehouses} onClose={() => setTransfer(false)} onDone={done} />}
    </Page>
  );
}

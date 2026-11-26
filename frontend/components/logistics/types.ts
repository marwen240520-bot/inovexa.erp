// components/logistics/types.ts
// Formes des données du module Logistique, telles que l'API les renvoie (docs/SAAS-API.md, section « Logistique »).

export const SHIPMENT_STATUSES = ["pending", "in_transit", "delivered", "cancelled"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
/** Filtre de la liste des envois : un statut, ou tous. */
export type StatusFilter = "all" | ShipmentStatus;

export interface Shipment {
  id: number;
  trackingNumber: string;
  /** Destinataire du colis. */
  clientName: string;
  address: string;
  phone: string | null;
  /** Ligne de la table des transporteurs de la société (jamais celui d'une autre société). */
  transporteurId: number | null;
  /** Date prévue, enregistrée à minuit UTC. */
  estimatedDelivery: string | null;
  status: string;
  /** Converti en nombre au chargement : l'API renvoie une chaîne (« 245.50 »). */
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Carrier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
  /** false : le transporteur ne peut plus se connecter ni voir ses livraisons. */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierStats {
  id: number;
  name: string;
  isActive: boolean;
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  cancelled: number;
  amount: number;
}

export interface MonthStats {
  /** « AAAA-MM » (mois de création des envois). */
  month: string;
  total: number;
  delivered: number;
  amount: number;
}

/** Réponse de GET /logistics/stats : tous les chiffres sont calculés par le serveur. */
export interface LogisticsStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  unassigned: number;
  late: number;
  onTime: number;
  /** Nombre de livraisons datées sur lesquelles le taux est calculé ; 0 = pas de taux. */
  onTimeBase: number;
  onTimeRate: number | null;
  amount: number;
  carriers: number;
  activeCarriers: number;
  byCarrier: CarrierStats[];
  byMonth: MonthStats[];
}

export const isShipmentStatus = (value: unknown): value is ShipmentStatus =>
  typeof value === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(value);

/** Valeur de `?status=` dans l'adresse : tout ce qui n'est pas un statut connu vaut « tous ». */
export const parseStatusFilter = (value: string | null | undefined): StatusFilter => (isShipmentStatus(value) ? value : "all");

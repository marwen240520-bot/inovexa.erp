import { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL renvoie les colonnes `numeric` sous forme de TEXTE ("12.500").
 * Ce transformateur les convertit en vrais nombres pour que l'API (et le front) gardent le même comportement
 * que les anciennes colonnes entières : `product.quantity + 1` reste une addition, pas une concaténation.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | string | null) => (value === undefined || value === null || value === '' ? value : value),
  from: (value?: string | number | null) => (value === undefined || value === null ? value : Number(value)),
};

/** Valeurs par défaut des colonnes monétaires à 3 décimales (millimes). */
export const MONEY = { type: 'numeric' as const, precision: 14, scale: 3, transformer: numericTransformer };
/** Quantités (jusqu'à 3 décimales : kg, mètres, litres…). */
export const QTY = { type: 'numeric' as const, precision: 14, scale: 3, transformer: numericTransformer };

import { redirect } from "next/navigation";

/**
 * L'ancien module « Factures » est remplacé par les documents commerciaux (devis, factures, avoirs, achats).
 * Les factures saisies ici auparavant ont été reprises automatiquement dans Documents, avec leur numéro d'origine.
 */
export default function LegacyInvoicesPage() {
  redirect("/dashboard/documents?type=invoice");
}

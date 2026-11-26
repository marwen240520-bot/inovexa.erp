"use client";
// components/site/PaymentMethods.tsx
// Moyens de paiement réellement proposés (lus dans GET /public/config) : carte bancaire et carte e-Dinar en ligne,
// plus les moyens hors ligne si l'administrateur les a activés. Ceux du catalogue en attendant la réponse du serveur.
import React from "react";
import { ONLINE_PAYMENT_METHODS, PAYMENT_METHOD_LABELS, pick } from "@/lib/catalog";
import { usePublicConfig } from "@/lib/publicConfig";

export default function PaymentMethods({ lang }: { lang: string }) {
  const config = usePublicConfig();
  const methods = config?.paymentMethods?.length ? config.paymentMethods : ONLINE_PAYMENT_METHODS;
  return (
    <ul className="st-chips st-paychips">
      {methods.filter((code) => code !== "other" && PAYMENT_METHOD_LABELS[code]).map((code) => (
        <li key={code}>{pick(PAYMENT_METHOD_LABELS[code], lang)}</li>
      ))}
    </ul>
  );
}

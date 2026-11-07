"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DocumentEditor from "@/components/erp/DocumentEditor";
import { Loading, Page, useNotice, useRequireAuth } from "@/components/erp/kit";

const LABEL: Record<string, string> = {
  quote: "Nouveau devis", delivery_note: "Nouveau bon de livraison", invoice: "Nouvelle facture", credit_note: "Nouvel avoir",
  purchase_order: "Nouveau bon de commande", goods_receipt: "Nouvelle réception", supplier_invoice: "Nouvelle facture fournisseur", supplier_credit_note: "Nouvel avoir fournisseur",
};

function NewDocument() {
  useRequireAuth();
  const type = useSearchParams().get("type") || "invoice";
  const [notice, notify] = useNotice();
  return (
    <Page title={LABEL[type] || "Nouveau document"} subtitle="Le numéro légal est attribué à la validation ; tant que le document est en brouillon, tout reste modifiable.">
      {notice}
      <DocumentEditor type={type} onNotify={notify} />
    </Page>
  );
}

export default function NewDocumentPage() {
  return <Suspense fallback={<Loading />}><NewDocument /></Suspense>;
}

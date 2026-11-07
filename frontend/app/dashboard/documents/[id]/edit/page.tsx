"use client";
import React from "react";
import { useParams } from "next/navigation";
import DocumentEditor from "@/components/erp/DocumentEditor";
import { api, ErrorBox, Loading, Page, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";

export default function EditDocumentPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [notice, notify] = useNotice();
  const doc = useLoad(() => api(`/documents/${id}`), [id]);
  return (
    <Page title={doc.data ? `Modifier le brouillon — ${doc.data.typeLabel}` : "Modifier"}>
      {notice}
      {doc.error && <ErrorBox message={doc.error} onRetry={doc.reload} />}
      {doc.loading && !doc.data ? <Loading /> : doc.data && (
        doc.data.allowedActions?.edit
          ? <DocumentEditor type={doc.data.type} initial={doc.data} onNotify={notify} />
          : <ErrorBox message="Ce document est validé : il n’est plus modifiable. Corrigez-le par un avoir." />
      )}
    </Page>
  );
}

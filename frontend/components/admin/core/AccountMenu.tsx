"use client";
/**
 * Actions possibles sur un compte, selon son état (liste des comptes et fiche d'un compte) :
 * activer, prolonger l'essai, modifier l'abonnement, suspendre, réactiver, résilier. Chaque action ouvre sa fenêtre.
 */
import React, { useState } from "react";
import { Btn } from "@/components/erp/kit";
import { ActivateModal, CancelModal, ExtendTrialModal, ReactivateModal, SubscriptionModal, SuspendModal } from "@/components/admin/core/AccountActions";
import type { ActionTarget } from "@/components/admin/core/shared";
import type { Plan, Sector } from "@/lib/saas";

type Action = "activate" | "extend" | "subscription" | "suspend" | "reactivate" | "cancel";

export function AccountMenu({ target, plans, sectors, onDone, compact = false }: {
  target: ActionTarget; plans: Plan[]; sectors: Sector[]; onDone: (message: string) => void; compact?: boolean;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const status = target.account.status;
  const close = () => setAction(null);
  const done = (message: string) => { setAction(null); onDone(message); };
  const blocked = status === "SUSPENDED" || status === "CANCELLED";

  const buttons: Array<{ key: Action; label: string; variant?: "primary" | "danger" | "success" | "ghost"; show: boolean }> = [
    { key: "activate", label: status === "ACTIVE" ? "Prolonger" : "Activer", variant: "success", show: !blocked },
    { key: "extend", label: "Prolonger l’essai", show: status === "TRIAL" || (status === "EXPIRED" && target.account.reason === "TRIAL_EXPIRED") },
    { key: "subscription", label: "Formule et modules", show: true },
    { key: "reactivate", label: "Réactiver", variant: "success", show: blocked },
    { key: "suspend", label: "Suspendre", variant: "danger", show: !blocked },
    { key: "cancel", label: "Résilier", variant: "danger", show: status !== "CANCELLED" && !compact },
  ];

  return (
    <>
      <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {buttons.filter((b) => b.show).map((b) => (
          <Btn key={b.key} variant={b.variant || "ghost"} onClick={() => setAction(b.key)} style={compact ? { padding: "5px 10px", fontSize: 13 } : undefined}>{b.label}</Btn>
        ))}
      </span>
      {action === "activate" ? <ActivateModal target={target} plans={plans} onClose={close} onDone={done} /> : null}
      {action === "extend" ? <ExtendTrialModal target={target} onClose={close} onDone={done} /> : null}
      {action === "subscription" ? <SubscriptionModal target={target} plans={plans} sectors={sectors} onClose={close} onDone={done} /> : null}
      {action === "suspend" ? <SuspendModal target={target} onClose={close} onDone={done} /> : null}
      {action === "reactivate" ? <ReactivateModal target={target} onClose={close} onDone={done} /> : null}
      {action === "cancel" ? <CancelModal target={target} onClose={close} onDone={done} /> : null}
    </>
  );
}

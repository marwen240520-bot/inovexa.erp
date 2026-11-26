"use client";
/**
 * Actions possibles sur un compte, selon son état (liste des comptes et fiche d'un compte).
 *
 * L'administrateur ne décide rien à la place du client : le secteur, les modules et la formule sont choisis et payés
 * par le client lui-même, en ligne. Il garde seulement la modération du compte : prolonger un essai, suspendre,
 * réactiver ou résilier. Chaque action ouvre sa fenêtre.
 */
import React, { useState } from "react";
import { Btn } from "@/components/erp/kit";
import { CancelModal, ExtendTrialModal, ReactivateModal, SuspendModal } from "@/components/admin/core/AccountActions";
import type { ActionTarget } from "@/components/admin/core/shared";
import type { Plan, Sector } from "@/lib/saas";

type Action = "extend" | "suspend" | "reactivate" | "cancel";

export function AccountMenu({ target, onDone, compact = false }: {
  target: ActionTarget; plans?: Plan[]; sectors?: Sector[]; onDone: (message: string) => void; compact?: boolean;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const status = target.account.status;
  const close = () => setAction(null);
  const done = (message: string) => { setAction(null); onDone(message); };
  const blocked = status === "SUSPENDED" || status === "CANCELLED";

  const buttons: Array<{ key: Action; label: string; variant?: "primary" | "danger" | "success" | "ghost"; show: boolean }> = [
    { key: "extend", label: "Prolonger l’essai", show: status === "TRIAL" || (status === "EXPIRED" && target.account.reason === "TRIAL_EXPIRED") },
    { key: "reactivate", label: "Réactiver", variant: "success", show: blocked },
    { key: "suspend", label: "Suspendre", variant: "danger", show: !blocked },
    { key: "cancel", label: "Résilier", variant: "danger", show: status !== "CANCELLED" && !compact },
  ];
  const visible = buttons.filter((b) => b.show);

  return (
    <>
      <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.length === 0 ? <span style={{ opacity: 0.6, fontSize: 13 }}>—</span> : null}
        {visible.map((b) => (
          <Btn key={b.key} variant={b.variant || "ghost"} onClick={() => setAction(b.key)} style={compact ? { padding: "5px 10px", fontSize: 13 } : undefined}>{b.label}</Btn>
        ))}
      </span>
      {action === "extend" ? <ExtendTrialModal target={target} onClose={close} onDone={done} /> : null}
      {action === "suspend" ? <SuspendModal target={target} onClose={close} onDone={done} /> : null}
      {action === "reactivate" ? <ReactivateModal target={target} onClose={close} onDone={done} /> : null}
      {action === "cancel" ? <CancelModal target={target} onClose={close} onDone={done} /> : null}
    </>
  );
}

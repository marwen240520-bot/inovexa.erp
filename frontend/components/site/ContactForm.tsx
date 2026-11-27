// components/site/ContactForm.tsx
// Formulaire « Écrivez-nous » de la page Contact (question d'un visiteur avant ou après l'inscription ; il ne sert plus
// à demander une démonstration : l'essai et le paiement se font en ligne).
// Le message part par le serveur (POST /public/contact : e-mail à l'équipe, « répondre » écrit au visiteur).
// Quand le serveur ne peut pas l'envoyer (503 : e-mails non configurés, ou réseau coupé), le formulaire retombe sur
// l'application e-mail du visiteur avec le message pré-rempli (contact@inovexa-erp.com), comme avant.
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { apiMessage, isEmail } from "@/lib/apiError";

const CONTACT_EMAIL = "contact@inovexa-erp.com";
const WHATSAPP_URL = "https://wa.me/21626583168";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

type Phase = "idle" | "sending" | "sent" | "mailto";

const TEXT: Record<string, Record<string, string>> = {
  fr: {
    sending: "Envoi en cours…",
    sent: "Message envoyé. Nous vous répondons sous un jour ouvré, à l'adresse e-mail indiquée.",
    fallback: "Nous n'avons pas pu envoyer le message depuis le site. Votre application e-mail s'ouvre avec la demande pré-remplie : il ne reste qu'à l'envoyer. Rien ne s'ouvre ? Écrivez-nous directement :",
    rate: "Trop de messages envoyés depuis cette connexion. Réessayez dans quelques minutes ou écrivez-nous directement :",
    invalid: "Message refusé : ",
  },
  en: {
    sending: "Sending…",
    sent: "Message sent. We reply within one business day, at the email address you gave.",
    fallback: "We could not send the message from the site. Your email app opens with the request filled in: just press Send. Nothing happened? Write to us directly:",
    rate: "Too many messages from this connection. Try again in a few minutes or write to us directly:",
    invalid: "Message refused: ",
  },
  es: {
    sending: "Enviando…",
    sent: "Mensaje enviado. Respondemos en un día hábil, al correo indicado.",
    fallback: "No hemos podido enviar el mensaje desde el sitio. Se abre tu aplicación de correo con la solicitud rellenada: solo falta enviarla. ¿No se abre nada? Escríbenos directamente:",
    rate: "Demasiados mensajes desde esta conexión. Inténtalo de nuevo en unos minutos o escríbenos directamente:",
    invalid: "Mensaje rechazado: ",
  },
};

export default function ContactForm({ lang, labels }: { lang: string; labels: Record<string, string> }) {
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [rateLimited, setRateLimited] = useState(false);
  const text = TEXT[lang] || TEXT.en;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) || "").trim();

    const missing = ["firstName", "lastName", "company", "email"].filter((n) => !value(n));
    if (missing.length) {
      setInvalid(missing);
      setError(labels.errRequired);
      (form.elements.namedItem(missing[0]) as HTMLElement | null)?.focus();
      return;
    }
    if (!isEmail(value("email"))) {
      setInvalid(["email"]);
      setError(labels.errEmail);
      (form.elements.namedItem("email") as HTMLElement | null)?.focus();
      return;
    }
    setInvalid([]);
    setError("");
    setRateLimited(false);
    setPhase("sending");

    const payload = {
      firstName: value("firstName"), lastName: value("lastName"), company: value("company"), email: value("email"),
      phone: value("phone") || undefined, size: value("size") || undefined, message: value("message") || undefined,
      language: lang, website: value("website") || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/public/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        form.reset();
        setPhase("sent");
        return;
      }
      if (res.status === 400) {
        const body = await res.json().catch(() => null);
        setError(`${text.invalid}${apiMessage(body, "")}`.trim());
        setPhase("idle");
        return;
      }
      if (res.status === 429) {
        setRateLimited(true);
        setPhase("idle");
        return;
      }
      // 503 (e-mails non configurés) ou autre erreur du serveur : on ouvre la messagerie du visiteur.
      openMailClient(payload);
    } catch {
      // Réseau coupé : même repli.
      openMailClient(payload);
    }
  };

  const openMailClient = (p: Record<string, string | undefined>) => {
    const lines = [
      `${labels.labelFirstName}: ${p.firstName}`,
      `${labels.labelLastName}: ${p.lastName}`,
      `${labels.labelCompany}: ${p.company}`,
      `${labels.labelEmail}: ${p.email}`,
      `${labels.labelPhone}: ${p.phone || "-"}`,
      `${labels.labelSize}: ${p.size || "-"}`,
      "",
      p.message || "",
    ];
    const subject = `${labels.formTitle} - ${p.company}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setPhase("mailto");
    window.location.assign(mailto);
  };

  const bad = (name: string) => (invalid.includes(name) ? true : undefined);

  return (
    <form className="st-form" onSubmit={onSubmit} noValidate aria-busy={phase === "sending" || undefined}>
      <div className="st-form-row">
        <label>
          <span>{labels.labelFirstName} *</span>
          <input type="text" name="firstName" placeholder={labels.placeholderFirstName} autoComplete="given-name" required aria-required="true" aria-invalid={bad("firstName")} maxLength={80} />
        </label>
        <label>
          <span>{labels.labelLastName} *</span>
          <input type="text" name="lastName" placeholder={labels.placeholderLastName} autoComplete="family-name" required aria-required="true" aria-invalid={bad("lastName")} maxLength={80} />
        </label>
      </div>
      <div className="st-form-row">
        <label>
          <span>{labels.labelCompany} *</span>
          <input type="text" name="company" placeholder={labels.placeholderCompany} autoComplete="organization" required aria-required="true" aria-invalid={bad("company")} maxLength={160} />
        </label>
        <label>
          <span>{labels.labelEmail} *</span>
          <input type="email" name="email" placeholder={labels.placeholderEmail} autoComplete="email" required aria-required="true" aria-invalid={bad("email")} maxLength={160} />
        </label>
      </div>
      <div className="st-form-row">
        <label>
          <span>{labels.labelPhone}</span>
          <input type="tel" name="phone" placeholder={labels.placeholderPhone} autoComplete="tel" maxLength={40} />
        </label>
        <label>
          <span>{labels.labelSize}</span>
          <select name="size" defaultValue="">
            <option value="">{labels.labelSelectSize}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={labels["size" + n]}>
                {labels["size" + n]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>{labels.labelMessage}</span>
        <textarea name="message" rows={5} placeholder={labels.placeholderMessage} maxLength={4000} />
      </label>

      {/* Champ piège : invisible pour une personne, souvent rempli par les robots (le serveur ignore alors le message). */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="st-form-privacy">
        {labels.privacyA} <Link href="/privacy">{labels.privacyPolicy}</Link>
        {labels.privacyB}
      </p>

      {error ? (
        <p className="st-form-error" role="alert">
          {error}
        </p>
      ) : null}

      {rateLimited ? (
        <p className="st-form-error" role="alert">
          {text.rate} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </p>
      ) : null}

      <button type="submit" className="st-btn" disabled={phase === "sending"}>
        {phase === "sending" ? text.sending : labels.submit}
      </button>

      {phase === "sent" ? (
        <p className="st-form-note" role="status">
          {text.sent}
        </p>
      ) : null}

      {phase === "mailto" ? (
        <p className="st-form-note" role="status">
          {text.fallback} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </p>
      ) : null}
    </form>
  );
}

// components/site/ContactForm.tsx
// Formulaire de demande de démo. Il n'y a pas (encore) de point d'API pour recevoir ces demandes :
// à l'envoi, le formulaire ouvre l'application e-mail du visiteur avec la demande pré-remplie
// (contact@inovexa-erp.com). Pour un envoi direct, brancher ici un appel à l'API.
"use client";
import React, { useState } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "contact@inovexa-erp.com";
const WHATSAPP_URL = "https://wa.me/21626583168";

const OPENED_NOTE: Record<string, string> = {
  en: "Your email app opens with the request filled in: just press Send. Nothing happened? Write to us directly:",
  fr: "Votre application e-mail s'ouvre avec la demande pré-remplie : il ne reste qu'à l'envoyer. Rien ne s'ouvre ? Écrivez-nous directement :",
  es: "Se abre tu aplicación de correo con la solicitud rellenada: solo falta enviarla. ¿No se abre nada? Escríbenos directamente:",
};

export default function ContactForm({ lang, labels }: { lang: string; labels: Record<string, string> }) {
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) || "").trim();

    if (!value("firstName") || !value("lastName") || !value("company") || !value("email")) {
      setError(labels.errRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) {
      setError(labels.errEmail);
      return;
    }
    setError("");

    const lines = [
      `${labels.labelFirstName}: ${value("firstName")}`,
      `${labels.labelLastName}: ${value("lastName")}`,
      `${labels.labelCompany}: ${value("company")}`,
      `${labels.labelEmail}: ${value("email")}`,
      `${labels.labelPhone}: ${value("phone") || "-"}`,
      `${labels.labelSize}: ${value("size") || "-"}`,
      "",
      value("message"),
    ];
    const subject = `${labels.formTitle} - ${value("company")}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.assign(mailto);
    setOpened(true);
  };

  return (
    <form className="st-form" onSubmit={onSubmit} noValidate>
      <div className="st-form-row">
        <label>
          <span>{labels.labelFirstName} *</span>
          <input type="text" name="firstName" placeholder={labels.placeholderFirstName} autoComplete="given-name" required />
        </label>
        <label>
          <span>{labels.labelLastName} *</span>
          <input type="text" name="lastName" placeholder={labels.placeholderLastName} autoComplete="family-name" required />
        </label>
      </div>
      <div className="st-form-row">
        <label>
          <span>{labels.labelCompany} *</span>
          <input type="text" name="company" placeholder={labels.placeholderCompany} autoComplete="organization" required />
        </label>
        <label>
          <span>{labels.labelEmail} *</span>
          <input type="email" name="email" placeholder={labels.placeholderEmail} autoComplete="email" required />
        </label>
      </div>
      <div className="st-form-row">
        <label>
          <span>{labels.labelPhone}</span>
          <input type="tel" name="phone" placeholder={labels.placeholderPhone} autoComplete="tel" />
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
        <textarea name="message" rows={5} placeholder={labels.placeholderMessage} />
      </label>

      <p className="st-form-privacy">
        {labels.privacyA} <Link href="/privacy">{labels.privacyPolicy}</Link>
        {labels.privacyB}
      </p>

      {error ? (
        <p className="st-form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="st-btn">
        {labels.submit}
      </button>

      {opened ? (
        <p className="st-form-note" role="status">
          {OPENED_NOTE[lang] || OPENED_NOTE.en}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </p>
      ) : null}
    </form>
  );
}

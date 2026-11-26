import { MAIL_LANGS, pickMailLang, type MailLang } from '../../src/common/mail/auth-mails';
import { expiredMail, mailDate, mailMoney, paymentRejectedMail, receiptMail, refundMail, renewalReminderMail, suspendedMail, trialReminderMail } from '../../src/common/mail/billing-mails';

/** Emails d'abonnement : chaque message existe en français, anglais et espagnol, en texte et en HTML, et protège le HTML. */

const end = new Date('2027-03-12T10:30:00Z');
const url = 'https://www.exemple.tn/dashboard/billing';

describe('billing-mails — trois langues, texte + HTML', () => {
  const all = (lang: MailLang) => [
    receiptMail({ lang, name: 'Sami', online: true, amount: 34.51, currency: 'USD', planName: 'Business', periodEnd: end, receiptNumber: 'REC-2027-00001', url }),
    receiptMail({ lang, name: 'Sami', online: false, amount: 34.51, currency: 'USD', planName: 'Business', periodEnd: end, receiptNumber: 'REC-2027-00002', url }),
    expiredMail({ lang, name: 'Sami', reason: 'TRIAL_EXPIRED', url }),
    expiredMail({ lang, name: 'Sami', reason: 'SUBSCRIPTION_EXPIRED', url }),
    trialReminderMail({ lang, name: 'Sami', endsAt: end, url }),
    renewalReminderMail({ lang, name: 'Sami', endsAt: end, url }),
    suspendedMail({ lang, name: 'Sami', reason: 'Impayé', url }),
    paymentRejectedMail({ lang, name: 'Sami', amount: 120, currency: 'TND', reason: 'Virement introuvable', url }),
    refundMail({ lang, name: 'Sami', amount: 34.51, currency: 'USD', receiptNumber: 'REC-2027-00001', reason: 'Doublon', url }),
  ];

  it.each(MAIL_LANGS)('langue %s : sujet, texte et HTML complets, lien présent', (lang) => {
    for (const m of all(lang)) {
      expect(m.subject.length).toBeGreaterThan(8);
      expect(m.text).toContain(url);
      expect(m.html).toContain(`lang="${lang}"`);
      expect(m.html).toContain(`href="${url}"`);
      expect(m.text).toContain('Sami');
      expect(m.html).not.toMatch(/undefined|NaN|\[object/);
      expect(m.text).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('les trois langues diffèrent vraiment (aucune ne retombe sur le français)', () => {
    const subjects = MAIL_LANGS.map((l) => expiredMail({ lang: l, name: 'Sami', reason: 'TRIAL_EXPIRED', url }).subject);
    expect(new Set(subjects).size).toBe(3);
    expect(subjects[0]).toMatch(/essai gratuit/);
    expect(subjects[1]).toMatch(/free trial/);
    expect(subjects[2]).toMatch(/prueba gratuita/);
    expect(receiptMail({ lang: 'es', name: 'S', online: true, amount: 1, currency: 'USD', planName: 'P', periodEnd: end, receiptNumber: 'REC-2027-00001', url }).subject).toMatch(/Pago recibido/);
    expect(receiptMail({ lang: 'en', name: 'S', online: false, amount: 1, currency: 'USD', planName: 'P', periodEnd: end, receiptNumber: 'REC-2027-00001', url }).subject).toMatch(/Payment confirmed/);
  });

  it('le reçu contient le numéro, la formule, le montant et la date d’échéance de Tunis', () => {
    const m = receiptMail({ lang: 'fr', name: 'Sami', online: true, amount: 34.51, currency: 'USD', planName: 'Business', periodEnd: end, receiptNumber: 'REC-2027-00001', url });
    expect(m.subject).toBe('Paiement reçu — reçu REC-2027-00001');
    expect(m.text).toContain('34,51 USD TTC');
    expect(m.text).toContain('Business');
    expect(m.text).toMatch(/12 mars 2027/);
    expect(m.text).toMatch(/11:30/); // 10:30 UTC = 11:30 à Tunis (UTC+1, sans heure d'été)
  });

  it('le dinar s’écrit au millime, le dollar au centime', () => {
    expect(mailMoney('fr', 120, 'TND')).toBe('120,000 TND');
    expect(mailMoney('en', 34.5, 'USD')).toBe('34.50 USD');
    expect(mailMoney('es', 1234.5, 'EUR')).toMatch(/1\.?234,50 EUR/);
    expect(mailMoney('fr', 10, 'XXX')).toBe('10,00 XXX');
  });

  it('dates : tiret quand il n’y en a pas, texte brut sur une date invalide', () => {
    expect(mailDate('fr', null)).toBe('—');
    expect(mailDate('en', 'pas une date')).toBeTruthy();
  });

  it('le HTML neutralise les caractères dangereux d’un nom ou d’un motif', () => {
    const m = suspendedMail({ lang: 'fr', name: '<script>alert(1)</script>', reason: '"><img src=x onerror=alert(2)>', url: 'javascript:alert(3)' });
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<img');
    expect(m.html).toContain('&lt;script&gt;');
    // Un lien qui n'est pas http(s) est neutralisé dans le bouton.
    expect(m.html).not.toContain('href="javascript:');
  });

  it('langue du client : valeur inconnue (ou arabe, retiré) → français', () => {
    expect(pickMailLang('ar')).toBe('fr');
    expect(pickMailLang(undefined, null, 'es-ES')).toBe('es');
    expect(pickMailLang('EN')).toBe('en');
    expect(pickMailLang('de', 'es')).toBe('es');
  });
});

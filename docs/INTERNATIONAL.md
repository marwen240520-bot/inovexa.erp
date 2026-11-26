# Inovexa ERP hors de Tunisie (phase 1)

Une société de n'importe quel pays peut ouvrir un compte et facturer dans **sa devise**, avec **ses taux de TVA** et **son identifiant fiscal**. Ce qui n'existe qu'en Tunisie (timbre, retenue à la source, facture électronique TEIF / El Fatoora, paie CNSS et IRPP) reste réservé aux sociétés tunisiennes. Les sociétés tunisiennes existantes ne changent pas : leur pays vaut `TN`, leur devise `TND`.

## 1. Ce que chaque société règle

À l'inscription (formulaire, Google ou Apple), puis dans **Paramètres › Société & fiscalité** :

| Réglage | Champ API | Règle |
|---|---|---|
| Pays | `countryCode` | Code ISO 3166-1 à 2 lettres (250 pays). Défaut `TN`. |
| Devise des comptes | `currency` | Code ISO 4217. **Tunisie : toujours `TND`.** Ailleurs : la devise usuelle du pays est proposée (modifiable). Elle ne peut plus changer dès qu'une pièce **numérotée** existe : une comptabilité se tient dans une seule devise. |
| Taux de TVA | `vatRates` (liste) et `defaultVatRate` | Tunisie, tant que rien n'est réglé : 0, 7, 13 et 19 %. Ailleurs : 0 % ; la société ajoute ses taux (par exemple 5,5 ; 10 ; 20). Le taux par défaut fait toujours partie de la liste. 20 taux au plus, 0 à 100 %, deux décimales. |
| Identifiant fiscal | `taxId` | Tunisie : matricule fiscal contrôlé (ou CIN à 8 chiffres). Ailleurs : format libre de 3 à 40 caractères (lettres, chiffres, espace, point, tiret, barre oblique) : n° de TVA, SIREN, ICE, NIF, EIN… |
| Téléphone | `phone` | Tunisie : 8 chiffres acceptés. Ailleurs : **avec l'indicatif du pays** (`+33 6 12 34 56 78`). |

Changer le pays d'une société existante : l'identifiant fiscal déjà enregistré doit rester valable dans le nouveau pays (sinon le serveur demande de le corriger en même temps). Passer à la Tunisie impose le dinar.

## 2. Décimales et arrondis

Les montants sont calculés en **unités mineures entières** (millimes, centimes…), arrondis **par pièce** à la précision de la devise :

- 3 décimales : TND, KWD, BHD, OMR, JOD, IQD, LYD ;
- 0 décimale : JPY, KRW, VND, CLP, ISK, PYG, RWF, UGX, XOF, XAF et autres ;
- 2 décimales : toutes les autres (EUR, USD, GBP, MAD…).

Les règlements sont arrondis de la même façon : un solde ne dérive jamais d'un centime. Le montant en toutes lettres des PDF est géré pour le dinar tunisien et 18 autres devises (EUR, USD, CAD, AUD, GBP, CHF, MAD, DZD, LYD, EGP, SAR, AED, QAR, KWD, JPY, CNY, TRY, XOF, XAF) ; pour les autres devises, la phrase est omise.

## 3. Ce qui reste propre à la Tunisie

`localFeatures(pays)` (`backend/src/common/countries.ts`) décide, côté serveur et côté interface :

| Fonction | Hors Tunisie |
|---|---|
| Droit de timbre sur les factures | jamais appliqué ; champ masqué |
| Retenue à la source (taux client, seuil) | jamais appliquée ; champs masqués |
| Facture électronique TEIF / El Fatoora | refusée par l'API (400, message explicite) ; carte et badges masqués |
| Paie (CNSS, IRPP, CSS) et n° CNSS employeur | génération des bulletins et réglages de paie refusés par l'API (400, message explicite) ; onglets « Bulletins de paie » et « Paramètres de paie » masqués ; fiches employés et **congés** restent disponibles |

## 4. API

- `GET /company/profile` → `{ countryCode, countryName, currency, currencyDecimals, defaultVatRate, vatRates, taxIdLabel, features: { stampDuty, withholding, teif, payroll } }`. L'interface le charge à la connexion et s'y adapte (`frontend/lib/company-profile.ts`).
- `GET /company` et `PUT /company` renvoient aussi `profile`. `PUT /company` accepte `countryCode`, `currency`, `vatRates`, `defaultVatRate`.
- `GET /documents/meta` → `vatRates` de la société, `withholdingPresets` (vide hors Tunisie) et `features`.
- `POST /auth/register`, `/auth/google`, `/auth/apple` : `countryCode?`, `currency?`.

Migration : `1795720187386-CompanyCountry` (colonnes `companies.countryCode` — défaut `TN` — et `companies.vatRates`). Elle s'applique toute seule au démarrage de l'API.

## 5. Limites connues (à lire avant de vendre à l'étranger)

- **Le plan comptable reste tunisien** : les codes de comptes par défaut sont indicatifs et modifiables (`company.accountMap`), mais aucun plan national n'est fourni pour un autre pays. Un comptable local doit les adapter.
- **Pas de multi-devises** : une société = une devise, sans taux de change ; les factures en devise étrangère d'une société ne sont pas prévues.
- **PDF** : libellés en français, caractères latins uniquement (pas de PDF en arabe, chinois, cyrillique…).
- **Aucune règle fiscale locale** au-delà de la TVA en liste libre : pas de TVA intracommunautaire (autoliquidation), pas de taxe de vente par État, pas de facturation électronique étrangère (Factur-X, XRechnung, SDI, FatturaPA…).
- **L'abonnement à Inovexa** reste facturé en dollars avec un seul taux de TVA global (19 %), payé par carte via Konnect : ce taux n'est pas encore adapté au pays du client.
- **Suggestions de produits par secteur** : leurs prix de départ sont en dinars ; une société étrangère les corrige à la main.
- **Paie, TEIF, timbre, retenue** : Tunisie uniquement, voir § 3.

## 6. Suite possible

1. **Packs pays** : taux de TVA usuels, format de l'identifiant fiscal, plan comptable et mentions légales de quelques pays (France, Maroc, Algérie, Espagne…).
2. **Devises multiples et taux de change** (factures en devise étrangère, écarts de change), puis facturation électronique étrangère.
3. **Paiements internationaux** de l'abonnement (carte internationale, TVA du pays du client) en plus de Konnect.

# API de la couche SaaS

Référence des routes ajoutées par `backend/src/modules/saas`, `backend/src/modules/auth`, `backend/src/modules/appointments` et
`backend/src/modules/projects`. Toutes les réponses sont en JSON.
Les erreurs suivent le format NestJS : `{ "statusCode": 400, "message": "…" | ["…"], "error": "Bad Request" }`, avec en plus un `code`
lisible par l'interface quand le cas est connu (`MODULE_DISABLED`, `CODE_INVALID`, `SLOT_TAKEN`…).

- **Montants** : nombres, hors taxes sauf mention contraire, dans la devise des réglages (**dollar US par défaut**, `USD` ; `EUR` et `TND`
  sont aussi acceptés par le paiement en ligne). `null` = « sur devis ».
- **Dates** : chaînes ISO 8601 (UTC). L'interface les affiche à l'heure de Tunis.
- **Jeton** : `Authorization: Bearer <access_token>` sur toutes les routes marquées 🔒.

## Codes de réponse à connaître

| Code | Signification | Que fait l'interface |
| --- | --- | --- |
| 400 | Données refusées. Code de vérification : `{ code: "CODE_INVALID" \| "CODE_EXPIRED" \| "CODE_LOCKED", remainingAttempts? }` | Affiche le message du serveur |
| 401 | Pas de session, ou session fermée | Retour à `/auth/login` |
| 402 | Compte bloqué : `{ code: "SUBSCRIPTION_REQUIRED", status, reason, message }` | Redirection vers `/subscription` (faite une fois pour toutes dans `frontend/lib/apiCache.ts`) |
| 403 | Droit insuffisant, ou `{ code: "MODULE_DISABLED", module }`, `{ code: "MODULE_NOT_IN_PLAN", modules }`, `{ code: "MANUAL_PAYMENTS_DISABLED" }` | Affiche le message du serveur |
| 409 | Conflit (email déjà utilisé, paiement déjà traité, `{ code: "SLOT_TAKEN", conflictId }` pour un rendez-vous…) | Affiche le message du serveur |
| 429 | Trop de demandes : `{ code: "CODE_TOO_SOON", retryInSeconds }` pour un nouveau code, ou trop de tentatives de paiement | Affiche le message, attend |
| 502 / 503 | Prestataire de paiement injoignable (`PAYMENT_PROVIDER_ERROR`) / paiement en ligne pas encore configuré (`ONLINE_PAYMENT_UNAVAILABLE`) | Message simple, sans détail technique |

`reason` vaut `TRIAL_EXPIRED`, `SUBSCRIPTION_EXPIRED`, `SUSPENDED`, `CANCELLED` ou `EMAIL_NOT_VERIFIED`.
Un compte bloqué garde l'accès à `/auth/*`, `/billing/*`, `/public/*`, `GET /users/profile` et `GET /users/:id/modules`.

## Objet `account` (état du compte)

Renvoyé par `/auth/login`, `/auth/register`, `/auth/google`, `/auth/me`, `/auth/verify-email-code` et `/billing/subscription`.
`null` pour un administrateur ou un transporteur.

```json
{
  "status": "TRIAL", "blocked": false, "reason": null, "message": null,
  "trialStartedAt": "2026-11-25T10:00:00.000Z", "trialEndsAt": "2026-11-28T10:00:00.000Z",
  "subscriptionStart": null, "subscriptionEnd": null,
  "endsAt": "2026-11-28T10:00:00.000Z", "remainingSeconds": 259180, "serverTime": "2026-11-25T10:00:20.000Z",
  "planCode": null, "billingCycle": null, "sector": "restaurant", "userLimit": null,
  "emailVerified": true, "expiryEnforced": true
}
```

`remainingSeconds` est calculé par le serveur : le décompte affiché part de cette valeur, jamais de l'horloge du poste.

## Authentification (sans jeton, sauf mention)

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| POST | `/auth/register` | `name`, `companyName`, `email`, `phone`, `password`, `sector`, `acceptTerms: true` ; facultatifs : `city`, `address`, `legalForm`, `taxId` | 201 `{ access_token, user, account, emailSent, verification: { required, sent, expiresInMinutes: 15, resendInSeconds: 60 } }`. Tout autre champ (`role`, `modules`…) → 400. Quand `verification.required` est vrai, `account.blocked` vaut `true` (`reason: "EMAIL_NOT_VERIFIED"`) jusqu'à la saisie du code |
| POST | `/auth/login` | `email`, `password`, `otp?` | 200 `{ access_token, user, account }`. Double authentification active et pas de code : 401 `{ requires2fa: true }`. Un compte dont l'adresse n'est pas confirmée reçoit un nouveau code |
| POST 🔒 | `/auth/verify-email-code` | `code` (6 chiffres) | 200 `{ success, account, alreadyVerified? }` : l'accès s'ouvre. 400 `CODE_INVALID` (avec `remainingAttempts`), `CODE_EXPIRED` ou `CODE_LOCKED` (5 essais par code) |
| POST 🔒 | `/auth/resend-verification` | — | 200 `{ success, emailSent, required, sent, expiresInMinutes, resendInSeconds, message }`, ou `{ success, alreadyVerified: true }`. Un envoi par minute : 429 `CODE_TOO_SOON` `{ retryInSeconds }` |
| POST 🔒 | `/auth/change-email` | `email` (nouvelle adresse), `password` (mot de passe actuel), `language?` | 200 `{ success, changed, email, reverify, emailSent, verification }`. Corrige une faute de frappe faite à l'inscription, ou change d'adresse : le mot de passe est exigé (401 s'il est faux), 409 si l'adresse est déjà prise, 429 au-delà de 5 essais par 10 minutes. Un compte inscrit en libre-service reçoit un nouveau code à la nouvelle adresse et son accès se referme jusqu'à sa saisie (`reverify: true`) ; l'ancienne adresse reçoit un avis de changement |
| POST | `/auth/verify-email` | `email`, `token` | **Ancien lien de confirmation**, conservé pour les emails déjà envoyés. 200 `{ success, message, alreadyVerified? }` |
| POST | `/auth/google` | `credential` (jeton d'identité Google), `intent?: "login" \| "register"`, et pour une inscription `companyName`, `sector`, `phone?`, `acceptTerms: true`, `otp?` | 200 `{ access_token, user, account, created }`. Aucun compte et `intent` ≠ `register` : 404 `{ code: "ACCOUNT_NOT_FOUND", email, name }`. Google non configuré : 503 |
| POST | `/auth/apple` | `identityToken` (jeton d'identité « Sign in with Apple »), `intent?: "login" \| "register"`, `name?` (Apple ne le donne qu'à la première autorisation) et, pour une inscription, `companyName`, `sector`, `phone?`, `acceptTerms: true`, `otp?` | Mêmes réponses que `/auth/google`. 503 si `APPLE_CLIENT_ID` n'est pas défini. Le jeton est vérifié avec les clés publiques d'Apple (signature RS256, `iss`, `aud`, expiration) ; une adresse non vérifiée ne sert jamais à retrouver un compte |
| POST | `/auth/forgot-password` | `email` | 200 (même réponse que le compte existe ou non) |
| POST | `/auth/reset-password` | `email`, `token`, `newPassword` | 200 `{ success, message }` |
| GET 🔒 | `/auth/me` | — | profil + `account`, `sector`, `emailVerified`, `googleLinked`, `appleLinked`, `permissions` |
| POST 🔒 | `/auth/logout-all` | — | ferme toutes les sessions |
| POST 🔒 | `/auth/2fa/setup` | — | 200 `{ secret, otpauthUrl, qrCodeDataUrl }` : nouvelle clé TOTP (RFC 6238, 6 chiffres, 30 s) à scanner ; 400 si la double authentification est déjà activée. 10 appels par 10 minutes |
| POST 🔒 | `/auth/2fa/enable` | `code` (6 à 8 chiffres) | 200 `{ success, twoFactorEnabled: true }` : confirme la clé avec un code de l'application ; 400 `Code invalide…` sinon. Le titulaire est prévenu par email. 10 appels par 10 minutes |
| POST 🔒 | `/auth/2fa/disable` | `password`, `code` | 200 `{ success, twoFactorEnabled: false }` ; 401 `Mot de passe incorrect`, 400 `Code invalide.`. Le titulaire est prévenu par email. 10 appels par 10 minutes |
| PATCH 🔒 | `/users/change-password` | `oldPassword`, `newPassword` | `{ success, message, access_token }` — **remplacer le jeton enregistré** par `access_token` |

`user` : `{ id, email, name, role, companyName, modules, isTeamMember, ownerId, twoFactorEnabled, permissions, sector }`.
Mot de passe : voir « Sécurité » ci-dessous.

## Sécurité

**Mots de passe.** 8 à 128 caractères, avec au moins une lettre et un chiffre. Sont aussi refusés (400, message en français : `trop faible`,
`trop courant ou trop prévisible`, `ne doit pas contenir votre adresse email`) : les mots de passe parmi les plus répandus (`Password1`,
`Azerty123`, `Inovexa2026`… même avec une autre casse ou de la ponctuation), ceux qui ne répètent que quelques caractères (`aaaa1111`) et
ceux qui contiennent la partie de l'adresse email avant `@` (4 caractères au moins). La règle s'applique à l'inscription, à la
réinitialisation, au changement depuis le profil, aux comptes créés par l'administrateur et aux comptes transporteurs ; elle ne
refuse jamais un mot de passe déjà enregistré. Les mots de passe sont hachés avec bcrypt (coût 10).

**Blocage des tentatives de connexion.** Cinq échecs en 15 minutes pour un même couple *adresse + machine* : 429 `Trop de tentatives.
Réessayez dans N min.` pendant 15 minutes, même avec le bon mot de passe. Un compte visé depuis de nombreuses machines (30 échecs en
15 minutes) est bloqué pour tout le monde : c'est le prix à payer contre une attaque répartie. Les erreurs de code de double
authentification comptent comme des échecs ; une connexion réussie remet les compteurs à zéro. L'adresse de la machine vient de
`X-Forwarded-For` : un seul relais est supposé (Render, Railway…), réglable avec `TRUST_PROXY` (voir ci-dessous). S'y ajoutent les
limites par route (inscription, mot de passe oublié, codes de vérification) et la limite générale (120 requêtes par minute et par
adresse sans session, 900 avec session).

**Taille des requêtes.** Corps limité à 200 ko sur `/auth`, `/public` et pour toute requête sans session valide (413 au-delà) ;
50 Mo seulement avec une session valide (import de fichiers, pièces jointes).

**Fichiers envoyés.** La photo de profil est relue octet par octet : le contenu doit être un vrai JPEG, PNG, WebP ou GIF qui correspond
à l'extension ; sinon 400 `Ce fichier n’est pas une image valide` et le fichier est supprimé.

**Sessions.** Jeton de 12 h (`JWT_EXPIRES_IN`) ; le rôle est relu en base à chaque requête (un jeton falsifié ou périmé ne donne
aucun droit) ; changement de mot de passe, réinitialisation et « se déconnecter de tous les appareils » ferment toutes les autres sessions.

**Double authentification (TOTP).** Activable par chaque utilisateur depuis Profil › Sécurité (et par l'administrateur depuis
Réglages › Sécurité). Une fois active, `/auth/login` répond 401 `{ requires2fa: true }` tant que `otp` manque ou est faux. Il n'y a
pas de codes de secours : un client qui perd son téléphone demande au support, qui utilise `POST /admin/accounts/:id/reset-2fa`
(sessions fermées, client prévenu par email, action journalisée `two_factor_reset_by_admin`). Pour un compte administrateur,
la route répond 403 : la réinitialisation se fait depuis le serveur (`ADMIN_RESET_2FA=true`, voir `docs/OPERATIONS.md`).

**Alertes par email** (dans la langue du compte, jamais bloquantes) : mot de passe changé, double authentification activée,
désactivée ou réinitialisée, adresse email remplacée (envoyée à l'ancienne adresse).

**Contrôle de la configuration.** `GET /admin/security` (administrateur) renvoie `{ ok, errors, warnings, production, checks: [{ key,
ok, level, message }] }` : clé de session assez longue, HTTPS public, schéma géré par les migrations, documentation Swagger fermée,
emails, paiement, double authentification des administrateurs, sauvegardes. Jamais de valeur secrète dans la réponse. Le même
rapport est écrit dans les journaux au démarrage ; en production, une clé de session faible, des adresses locales (http) ou une base en
`synchronize` sont des erreurs (niveau `error`) à corriger. Le rapport informe : il n'empêche pas le serveur de démarrer.

**Langue des emails** : `language` (`fr`, `en` ou `es`) peut accompagner `/auth/register`, `/auth/forgot-password`, `/auth/change-email` et `PATCH /users/profile` ; elle est enregistrée sur le compte (`users.language`) et sert à tous les emails suivants (code, reçus, rappels, remboursement). Une valeur inconnue — l'arabe a été retiré — donne le français. L'espace d'administration reste en français.

`PATCH /users/profile` : changer d'adresse exige `currentPassword` (401 s'il est faux, 409 si l'adresse est prise) et répond `emailChange: { codeSent, verificationRequired }` ; le nom, le téléphone et la société se modifient sans mot de passe.

**Code de vérification** : 6 chiffres envoyés par email à l'inscription ; seule son empreinte (HMAC-SHA256 avec `JWT_SECRET`) est gardée en base.
Valable 15 minutes, 5 essais, un nouveau code par minute au plus. Le code n'est réellement exigé que si l'administrateur ne l'a pas
désactivé **et** que l'envoi d'emails (`SMTP_*`) est configuré : sans serveur d'envoi, l'inscription ouvre l'essai tout de suite plutôt
que d'enfermer le client (`GET /public/config` → `requireEmailVerification` reflète l'état réel). Les comptes créés avec Google ou Apple
sont déjà vérifiés.

## Site public (sans jeton)

| Route | Réponse |
| --- | --- |
| `GET /public/config` | `{ trialHours, currency, vatRate, requireEmailVerification, supportEmail, supportPhone, supportWhatsapp, googleClientId, appleClientId, paymentMethods, onlinePayment, modules }` — `googleClientId: null` / `appleClientId: null` = ne pas afficher le bouton ; `onlinePayment` = le paiement par carte est opérationnel ; `paymentMethods` = moyens proposés (`card`, `edinar`, et les moyens hors ligne seulement si l'administrateur les a ouverts) ; les coordonnées de paiement ne sont pas publiques |
| `GET /public/plans` | `{ currency, vatRate, trialHours, plans: Plan[] }` — seulement les formules publiées |
| `GET /public/sectors` | `Sector[]` (avec `itemCount` et la liste `modules` conseillée) |
| `GET /public/sectors/:code` | `{ sector, categories, items, serviceOffers, disclaimer }` |
| `GET /public/service-offers?sector=` | `ServiceOffer[]` publiées |
| `GET` ou `POST /public/payments/konnect/return?payment_ref=` | **Appelée par Konnect**, jamais par le site. La référence n'est pas crue : l'état du paiement est relu chez Konnect avec la clé du serveur. `GET` répond **302** vers `/subscription?checkout=<id>` du site d'où le client est parti ; `POST` répond 200 `{ received: true }` |

Types : voir `frontend/lib/saas.ts` (`Plan`, `Sector`, `SectorCategory`, `SectorItem`, `ServiceOffer`).
Une sous-catégorie est une `SectorCategory` dont `parentId` désigne sa catégorie (deux niveaux au maximum).

## Abonnement de la société 🔒 (`/billing`)

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| GET | `/billing/subscription` | — | `SubscriptionView` : `{ account, company, plan, users: { used, limit }, modules, pendingPayment, checkout, payment: { currency, vatRate, online: { enabled, provider, test, methods }, onlinePayment, manual, instructions, methods, link }, support, canManage, emailEnabled }`. `checkout` = page de paiement par carte encore ouverte (à reprendre). Un paiement par carte fait dans un autre onglet est reconnu ici |
| POST | `/billing/checkout` | `planCode`, `billingCycle: "monthly" \| "annual"` | 201 `{ id, payUrl, expiresAt, amountTTC, currency, resumed }` : rediriger le navigateur vers `payUrl`. **Le montant TTC est calculé par le serveur** (formule + TVA + devise des réglages) ; tout montant envoyé par le navigateur est ignoré. Même choix déjà ouvert : la même page est reprise (`resumed: true`). Formule sur devis ou gratuite : 400 ; compte suspendu : 403 ; 12 ouvertures par heure et par compte : 429 ; Konnect en panne : 502 ; paiement non configuré : 503. Propriétaire seulement |
| POST | `/billing/checkout/:id/verify` | — | 200 `{ status: "paid" \| "pending" \| "expired" \| "unknown", payment, account }`. Au retour de la page de paiement : relit l'état chez Konnect et, si c'est encaissé, **ouvre l'abonnement tout de suite**, sans administrateur. `unknown` = ce paiement n'appartient pas à cette société |
| GET | `/billing/modules` | — | `{ sector, plan: { code, name, allModules } \| null, trial, modules: [{ key, enabled, included, recommended }], sectors: [{ code, name, nameEn, modules }] }` — `included` : compris dans la formule ; `recommended` : conseillé pour le secteur ; pendant l'essai aucune formule ne limite les modules |
| PUT | `/billing/modules` | `{ modules: string[] }` | Le propriétaire ouvre ou ferme ses modules (tableau de bord, profil et réglages restent toujours ouverts). Module hors formule : 403 `MODULE_NOT_IN_PLAN` `{ modules }`. Renvoie la même vue que `GET /billing/modules` |
| PUT | `/billing/sector` | `{ sector, applyModules?: boolean }` | Le propriétaire change de secteur ; `applyModules: true` reprend les modules conseillés (dans la limite de la formule) |
| GET | `/billing/plans` | — | `{ currency, vatRate, plans }` |
| GET | `/billing/payments` | — | `SubscriptionPayment[]` (les pages de paiement non abouties n'y figurent pas) |
| POST | `/billing/payments` | `planCode`, `billingCycle`, `method`, `reference?`, `note?` | **Paiement hors ligne, facultatif** : 403 `MANUAL_PAYMENTS_DISABLED` tant que l'administrateur n'a pas activé `manualPayments`. Sinon 201 paiement `pending` (le montant vient de la formule) ; déjà un paiement en attente : 409 |
| DELETE | `/billing/payments/:id` | — | annule sa déclaration en attente |
| GET | `/billing/payments/:id/receipt` | — | `Receipt` (paiement validé seulement) |
| POST | `/billing/cancel` | `password`, `reason?` | résilie (propriétaire seulement) |
| GET | `/billing/suggestions?sector=` | — | `{ sectors: [{ code, name, nameEn, itemCount }], current, sector, categories, items, serviceOffers, disclaimer }` |
| POST | `/products/suggestions/import` | `itemIds: number[]`, `overrides?: { [itemId]: { price } }` | `{ created, skipped, products: [{ id, name }], details: [{ name, reason }], disclaimer }` |

Le formulaire « écrire à l'administrateur » (`POST /billing/contact`, `/admin/messages`) a été **retiré** : tout se fait en ligne, sans
intervention de l'administrateur. Ces routes répondent 404. La table `support_messages` est conservée pour ne perdre aucun ancien message.

Moyens de paiement : `card` et `edinar` (en ligne, par Konnect) ; hors ligne, seulement si l'administrateur les ouvre : `bank_transfer`,
`cash`, `cheque`, `d17`, `flouci`, `postal`, `other`. Côté Konnect, les moyens connus sont `bank_card` (`card`), `e-DINAR` (`edinar`) et `wallet`
(portefeuille Konnect) : `KONNECT_PAYMENT_METHODS` n'en accepte pas d'autres, toute valeur inconnue est ignorée.

### Paiement par carte (Konnect) : comment l'abonnement s'ouvre sans administrateur

1. Le client choisit sa formule → `POST /billing/checkout` : le serveur calcule le TTC, crée un paiement `initiated`
   (`provider: "konnect"`, `returnBase` = site d'où il vient, parmi `FRONTEND_URL`/`FRONTEND_URLS`) et ouvre le paiement chez Konnect
   (`POST /payments/init-payment`, clé `x-api-key` du serveur, `orderId` = notre numéro de paiement).
2. Le navigateur va sur `payUrl` (page Konnect : carte bancaire, e-Dinar). Konnect appelle ensuite `GET /public/payments/konnect/return?payment_ref=…`
   et renvoie le client sur `/subscription?checkout=<id>`.
3. **Trois chemins** peuvent confirmer le paiement, et un seul l'enregistre (ligne verrouillée en base, reçu unique) : le retour du client
   (`POST /billing/checkout/:id/verify`), la notification de Konnect, et le balayage périodique (`reconcileCheckouts`, relit les pages ouvertes
   depuis moins de 6 heures — il passe **avant** la vérification des essais terminés : un client qui a payé puis fermé l'onglet n'est pas expiré).
4. Rien n'est jamais cru sur parole : le paiement est relu chez Konnect (`GET /payments/:ref`) et n'est accepté que s'il est `completed`
   avec une transaction réussie, pour **la même commande** et **le même montant** (si Konnect annonce une autre devise, le montant n'est pas
   comparable — la commande l'est). Sinon : le paiement reste en attente et un événement `payment_mismatch` est écrit dans le journal.
5. Paiement enregistré : formule appliquée, reçu `REC-AAAA-NNNNN`, email de reçu, événement `payment_received`. Pendant l'essai, la période
   payée commence à la fin de l'essai ; en renouvellement avant l'échéance, elle s'ajoute à la suite. Un compte **suspendu par
   l'administrateur** reste suspendu (la période payée est conservée, l'accès revient à la réactivation).

Statuts d'un paiement : `initiated` (page ouverte), `expired` (abandonnée ou refusée par Konnect), `pending` (déclaration hors ligne),
`validated`, `rejected`, `cancelled`, `refunded` (remboursé par l'administrateur). Une page refermée mais payée quand même est reconnue.

**Paiement partiel** : si Konnect indique qu'une partie seulement du montant est réglée (`reachedAmount` inférieur à `amount`), le paiement n'est
pas pris en compte (un avertissement est écrit dans les journaux du serveur) ; l'administrateur peut le relire plus tard.

**Reçus sans trou** : le numéro `REC-AAAA-NNNNN` est attribué à l'encaissement, depuis un compteur de la plateforme (table `number_sequences`,
clé `platform_receipt`, par année), dans la même transaction que l'ouverture de l'abonnement. La suite est donc continue, même quand des pages de
paiement ont été abandonnées. Le numéro reste attaché à un paiement remboursé (son reçu n'est plus téléchargeable). `Receipt.issuer` porte l'identité
légale de l'éditeur (`issuerName`, `issuerTaxId`, `issuerAddress`, `issuerRegistry` des réglages, plus l'email et le téléphone de support) ; il vaut
`null` tant que la raison sociale n'est pas renseignée. **Un reçu n'est pas une facture légale** : la facture de l'abonnement reste à émettre par l'éditeur.

**Remboursement** : Konnect n'a pas d'API de remboursement — l'argent se rend depuis le tableau de bord Konnect. `POST /admin/payments/:id/refund`
remet ensuite l'abonnement en accord : seul le paiement validé **le plus récent** d'un compte peut être remboursé (409 sinon, avec le numéro du reçu à
rembourser d'abord) ; la période qu'il avait ouverte est retirée (retour à l'échéance et à la formule d'avant ; l'essai reprend là où il en était s'il
court encore, sinon l'accès se ferme — les données sont conservées) et le client reçoit un email dans sa langue.

## Agenda 🔒 (module `appointments`)

Rendez-vous, réservations de tables, séances. Toutes les routes sont filtrées sur la société de la personne connectée.

| Méthode | Route | Corps / paramètres |
| --- | --- | --- |
| GET | `/appointments` | `from`, `to` (AAAA-MM-JJ ou ISO ; par défaut de J-7 à J+60), `status`, `resource`, `q` (objet, client, téléphone, prestation) → tableau trié par date |
| GET | `/appointments/summary` | `{ resources, services, today: { planned, done, cancelled, noShow }, upcoming7Days, serverTime }` (ressources et prestations déjà utilisées, proposées à la saisie) |
| GET | `/appointments/:id` | |
| POST | `/appointments` | `title`*, `startAt`*, `endAt?` ou `durationMinutes?` (30 par défaut, de 5 minutes à 24 h), `clientId?`, `clientName?`, `clientPhone?`, `service?`, `resource?`, `status?` (`scheduled`, `confirmed`, `done`, `cancelled`, `no_show`), `partySize?`, `price?`, `notes?`, `allowOverlap?` |
| PUT | `/appointments/:id` | mêmes champs, tous facultatifs |
| PATCH | `/appointments/:id/status` | `{ status }` — rouvrir un rendez-vous annulé exige que le créneau soit encore libre |
| DELETE | `/appointments/:id` | |

Deux rendez-vous ne peuvent pas occuper la même **ressource** (praticien, salle, table, pont d'atelier…, casse ignorée) sur des créneaux qui se
chevauchent : 409 `SLOT_TAKEN` `{ conflictId }`, sauf `allowOverlap: true`. Seuls `scheduled`, `confirmed` et `done` occupent le créneau ;
un rendez-vous annulé ou manqué le libère. Un créneau qui commence à la fin du précédent est accepté.
Écriture fermée (403 `MODULE_DISABLED`) quand le module n'est pas ouvert ; la lecture reste possible.

## Projets 🔒 (module `projects`, ou `finance` pour la compatibilité avec l'ancien écran)

| Méthode | Route | Corps / paramètres |
| --- | --- | --- |
| GET | `/projects` | projets avec `tasksTotal`, `tasksDone`, `tasksLate` |
| GET | `/projects/tasks/late` | tâches non terminées dont l'échéance est passée, avec `projectName` |
| GET | `/projects/:id` | le projet et ses `tasks` |
| POST | `/projects` | `name`*, `code?`, `department?`, `description?`, `location?`, `manager?`, `clientId?`, `clientName?`, `startDate?`, `endDate?`, `budget?`, `cost?`, `status?` (`planned`, `active`, `on_hold`, `done`, `cancelled`), `priority?` (`low`, `normal`, `high`), `progress?` (0–100), `tasks?: (string \| { title, assignee?, dueDate? })[]` |
| PUT | `/projects/:id` | mêmes champs |
| DELETE | `/projects/:id` | supprime aussi ses tâches |
| POST | `/projects/:id/tasks` | `title`*, `assignee?`, `dueDate?`, `status?` (`todo`, `doing`, `done`), `sortOrder?` |
| PATCH / DELETE | `/projects/:id/tasks/:taskId` | |

Dès qu'un projet a des tâches, son **avancement est calculé** : tâches terminées / total. Une fiche client rattachée doit appartenir à la société (400 sinon).

## Logistique 🔒

| Méthode | Route | Notes |
| --- | --- | --- |
| GET | `/logistics/client/shipments` | expéditions de la société (tableau) |
| POST | `/logistics/client/shipments` | `clientName`*, `address`*, `trackingNumber?` (proposé si vide), `phone?`, `amount?`, `transporteurId?`, `estimatedDelivery?`, `status?` |
| PUT | `/logistics/client/shipments/:id` | mêmes champs, tous facultatifs |
| PATCH | `/logistics/client/shipments/:id/status` | `{ status }` : `pending`, `in_transit`, `delivered`, `cancelled` |
| PATCH | `/logistics/client/shipments/:id/assign` | `{ transporteurId }` |
| DELETE | `/logistics/client/shipments/:id` | |
| GET | `/logistics/stats` | `{ total, pending, inTransit, delivered, cancelled, unassigned, late, onTime, onTimeBase, onTimeRate, amount, carriers, activeCarriers, byCarrier: [{ id, name, isActive, total, delivered, inTransit, pending, cancelled, amount }], byMonth: [{ month, total, delivered, amount }] }` |
| GET/POST | `/transporteurs` | transporteurs de la société ; création : `name`*, `email`*, `password`* (8 caractères, lettre + chiffre), `phone?`, `companyName?`, `address?` |
| PUT/DELETE | `/transporteurs/:id` | modification : `status: "active" \| "inactive"`, `password` facultatif |

Le numéro de suivi est unique **par société**. Un transporteur connecté utilise `/transporteur/shipments`, `/transporteur/stats`,
`PATCH /transporteur/shipments/:id/status`.

## Administration de la plateforme 🔒 (rôle `admin` ou `super_admin`, sinon 403)

L'administrateur **supervise** : il ne décide de rien pour le client. Le client s'inscrit, choisit son secteur, ses modules et sa formule,
et paie par carte ; l'administrateur voit les chiffres, publie ou retire des formules, règle les paramètres de la plateforme, et peut
suspendre un compte en cas d'abus.

### Tableau de bord
`GET /admin/overview?from=AAAA-MM-JJ&to=AAAA-MM-JJ` (30 derniers jours par défaut) :

```json
{
  "range": { "from": "…", "to": "…" }, "currency": "USD",
  "customers": { "total": 5, "trial": 2, "active": 2, "expired": 0, "expiredTrials": 0, "suspended": 0, "cancelled": 1, "paying": 2 },
  "newRegistrations": 5, "mrr": 58, "revenue": { "ht": 290, "ttc": 345.1 },
  "revenueByMonth": [{ "month": "2026-11", "ht": 290, "ttc": 345.1, "payments": 2 }],
  "registrationsByMonth": [{ "month": "2026-11", "count": 5 }],
  "conversion": { "signups": 5, "signupsPaid": 2, "subscriptionRate": 40, "trialsEnded": 2, "trialsConverted": 2, "trialToPaidRate": 100 },
  "cancellations": 1,
  "plans": [{ "code": "starter", "name": "Starter", "count": 1 }],
  "modules": [{ "key": "sales", "count": 4 }],
  "sectors": [{ "code": "restaurant", "name": "Restaurants et cafés", "count": 1 }],
  "pendingPayments": 0, "note": "…"
}
```

Tous les chiffres viennent des comptes et des paiements **validés** (par carte ou saisis par l'administrateur). Un taux vaut `null` quand il n'y a
pas de base de calcul. `pendingPayments` ne compte que les déclarations hors ligne en attente (toujours 0 si elles sont fermées).

### Comptes
| Méthode | Route | Corps / paramètres |
| --- | --- | --- |
| GET | `/admin/accounts` | `q`, `status`, `sector` (`none` = sans secteur), `plan` (`none`), `source` (`self`, `google`, `admin`), `sort` (`name`, `end`, `login`), `limit`, `offset` → `{ total, limit, offset, items: [{ id, email, name, companyName, phone, sector, signupSource, createdAt, lastLoginAt, isActive, modules, account, users, paymentStatus: "pending" \| "paid" \| "none", totalPaid }] }` |
| GET | `/admin/accounts/:id` | fiche : `{ …, account, company, team: [], payments: [], activity: [], usage: { products, clients, suppliers, documents, sales, purchases, employees }, modules, twoFactorEnabled, googleLinked }` |
| POST | `/admin/accounts/:id/activate` | `{ months }` ou `{ until }` ou `{ noExpiry: true }`, `planCode?`, `billingCycle?` |
| POST | `/admin/accounts/:id/suspend` | `{ reason? }` |
| POST | `/admin/accounts/:id/reactivate` | — |
| POST | `/admin/accounts/:id/cancel` | `{ reason? }` |
| POST | `/admin/accounts/:id/extend-trial` | `{ hours }` |
| POST | `/admin/accounts/:id/verify-email` | — : confirme l'adresse à la place du client (journalisé : `email_verified_by_admin`) |
| POST | `/admin/accounts/:id/reset-2fa` | — : réinitialise la double authentification d'un client qui a perdu son téléphone (200 `{ success, alreadyDisabled }`) ; 403 pour un compte administrateur ; 404 si le compte n'existe pas. Sessions fermées, client prévenu, journal `two_factor_reset_by_admin` |
| POST | `/admin/accounts/:id/resend-verification` | `{ language? }` : renvoie un code à l'adresse du compte, sans le délai d'attente du client (`email_code_sent_by_admin`) ; 503 si l'envoi d'emails n'est pas configuré |
| PATCH | `/admin/accounts/:id/subscription` | `planCode?` (`null` = aucune), `billingCycle?`, `subscriptionEnd?`, `userLimit?`, `expiryEnforced?`, `sector?`, `applySectorModules?` |
| PATCH | `/admin/clients/:id/modules` | `{ modules: { [clé]: boolean } }` |

Toutes ces actions renvoient l'objet `account` mis à jour.

> **Qui décide quoi.** Le client choisit seul son secteur, ses modules et sa formule, et paie en ligne (`/billing/*`). L'interface
> d'administration ne propose donc que la modération d'un compte : prolonger un essai, suspendre, réactiver, résilier. Les routes
> `activate`, `subscription` et `/admin/clients/:id/modules` ci-dessus restent disponibles côté serveur pour un cas exceptionnel
> (reprise d'un ancien compte, correction), mais aucun écran ne les appelle.

Routes d'origine conservées : `GET/POST /admin/clients`,
`PATCH /admin/clients/:id`, `/extend`, `/toggle`, `DELETE /admin/clients/:id`, `POST /admin/clients/:id/reset-demo-data`,
`DELETE /admin/clients/:id/demo-data`, `GET /admin/stats` (`{ totalClients, activeClients, expiredClients, totalRevenue }`).

### Formules, réglages, paiements
| Méthode | Route | Corps |
| --- | --- | --- |
| GET/POST | `/admin/plans` | création : `code`, `name`, `description?`, `priceMonthly?`, `priceAnnual?`, `maxUsers?`, `modules?` (`null` = tous), `features?: string[]`, `isPublic?`, `isActive?`, `highlight?`, `sortOrder?` |
| PATCH/DELETE | `/admin/plans/:id` | suppression refusée (409) si la formule est utilisée |
| GET | `/admin/settings` | réglages (dont `manualPayments`, `catalogVersion`) + `googleConfigured`, `appleConfigured`, `mailConfigured`, `paymentMethodOptions`, `moduleKeys`, `onlinePayment: { enabled, provider, mode, methods, reason }` (`reason` : `NOT_CONFIGURED` ou `CURRENCY_UNSUPPORTED`), `emailVerificationActive` |
| PUT | `/admin/settings` | `trialHours`, `trialReminderHours`, `renewalReminderDays`, `requireEmailVerification`, `manualPayments` (ouvre les paiements hors ligne, fermés par défaut), `currency` (3 lettres : `USD` par défaut), `vatRate`, `paymentInstructions`, `paymentMethods: string[]` (moyens hors ligne proposés), `paymentLink` (adresse https d'une page de paiement externe, proposée avec les paiements hors ligne), `supportEmail`, `supportPhone`, `supportWhatsapp`. **La clé Konnect n'est jamais saisie ici** : elle vient des variables d'environnement du serveur |
| GET | `/admin/payments` | `status`, `userId`, `limit`, `offset` → `{ total, limit, offset, items: [paiement + account: { id, email, name, companyName }] }`. Sans `status`, les pages de paiement non abouties (`initiated`, `expired`) ne sont pas listées |
| POST | `/admin/payments` | **Cas exceptionnel** : enregistrer un paiement reçu hors ligne (toujours permis) — `userId`, `planCode`, `billingCycle`, `method`, `reference?`, `note?`, `validate?` (validé tout de suite sauf `false`) |
| POST | `/admin/payments/:id/validate` | valide une déclaration hors ligne |
| POST | `/admin/payments/:id/reject` | `{ reason? }` |
| GET | `/admin/payments/:id/receipt` | `Receipt` |
| POST | `/admin/payments/:id/recheck` | — : « j'ai payé mais rien ne s'ouvre » — relit le paiement par carte chez Konnect et, s'il est encaissé, ouvre l'abonnement (même une page expirée). 200 `{ status: "paid" \| "pending" \| "expired" \| "unknown", payment }` ; 404 si ce n'est pas un paiement en ligne, 409 s'il n'a jamais été ouvert chez Konnect. Journal : `payment_rechecked` |
| POST | `/admin/payments/:id/refund` | `{ reason? }` : voir « Remboursement » ci-dessus. 200 `{ payment, account }` ; 409 si le paiement n'est pas validé, déjà remboursé, ou si un paiement plus récent est encore validé. Journal : `payment_refunded` |
| GET | `/admin/online-payment` | liste de contrôle « mise en production » du paiement par carte, **sans appeler Konnect** : `{ enabled, mode, provider, webhookUrl, siteUrls, ready, live, checks: [{ key, ok, level: "error" \| "warn", message }] }`. Contrôles : `credentials`, `currency`, `plans`, `mode`, `apiUrl` (https public, appelée par Konnect), `siteUrl`, `mail`, `issuer`. `ready` : un client peut payer ; `live` : paiements réels et rien à corriger. Ni la clé ni le portefeuille n'y figurent |
| POST | `/admin/online-payment/test` | `{ wallet?: boolean }` : teste la connexion à Konnect. Sans `wallet`, relit un paiement inexistant (404 ou 400 = clé acceptée, 401/403 = clé refusée, 5xx ou réseau = non vérifié) : **aucun paiement n'est ouvert**. Avec `wallet: true`, ouvre un paiement de test de 1 TND qui expire au bout de 5 minutes (jamais encaissé) pour vérifier le portefeuille. 200 `{ provider, mode, configured, reachable, keyAccepted, walletAccepted, message }` (`null` = non vérifié). 6 appels par minute au plus. Journal : `konnect_test` |
| PUT | `/admin/settings` (identité de l'éditeur) | `issuerName` (160), `issuerTaxId` (matricule fiscal tunisien, validé et normalisé : `1234567X/A/M/000`), `issuerAddress`, `issuerRegistry` : imprimés en tête des reçus. Chaîne vide = effacer |

### Secteurs, suggestions, prestations
| Méthode | Route | Corps |
| --- | --- | --- |
| GET | `/admin/sectors` | `Sector[]` (tous, actifs ou non) |
| GET | `/admin/sectors/:code/detail` | `{ sector, categories, items, serviceOffers, disclaimer }` (tout, actif ou non) |
| POST | `/admin/sectors` | `code`, `name`, `nameEn?`, `description?`, `modules?: string[]`, `recommendations?: string[]`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id` | suppression refusée (409) si des comptes y sont rattachés |
| POST | `/admin/sectors/:id/categories` | `name`, `description?`, `parentId?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id/categories/:catId` | la suppression emporte ses sous-catégories et leurs suggestions |
| POST | `/admin/sectors/:id/items` | `name`, `kind` (`product` \| `service`), `categoryId?`, `unit?`, `purchasePrice?`, `sellingPrice?`, `marginPct?`, `vatRate?` (0, 7, 13, 19), `trackLots?`, `basis?`, `description?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id/items/:itemId` | coût + marge donnés sans prix : le prix de vente est calculé ; coût + prix : la marge est recalculée |
| GET/POST | `/admin/service-offers` | `name`, `sectorCode?` (`null` = toutes activités), `category` (`setup`, `training`, `migration`, `support`, `module`), `price?`, `priceUnit` (`one_time`, `per_month`, `per_day`, `per_hour`, `per_user`), `description?`, `basis?`, `isPublic?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/service-offers/:id` | |

### Journal et maintenance
| Méthode | Route | Notes |
| --- | --- | --- |
| GET | `/admin/audit` | `action`, `userId`, `from`, `to`, `limit`, `offset` → `{ total, limit, offset, items: [{ id, userId, actorId, actorEmail, action, entity, entityId, method, path, status, ip, createdAt, details }] }`. Actions de compte et de paiement : `account_registered`, `account_expired`, `checkout_started`, `payment_received` (carte, sans administrateur), `payment_mismatch` (Konnect annonce autre chose que ce qui a été demandé), `payment_validated`, `payment_rejected`, `payment_rechecked`, `payment_refunded`, `konnect_test`, `mail_test_sent`, `mail_test_failed`, `email_verified`, `email_verified_by_admin`, `email_code_sent_by_admin`, `email_changed`, `email_change_failed`, `email_code_failed`, `modules_changed`, `sector_changed`… |
| GET | `/admin/security` | contrôles de sécurité de la configuration du serveur (voir « Sécurité ») |
| GET | `/admin/maintenance/mail` | état de l'envoi d'emails : configuration (jamais le mot de passe) et réponse du serveur SMTP, avec délais maximum |
| POST | `/admin/maintenance/test-email` | `{ to? }` (l'administrateur par défaut) : envoie un email de test ; 502 avec le motif si le serveur refuse. 5 par minute au plus. Journal : `mail_test_sent` / `mail_test_failed` |
| POST | `/admin/maintenance/sweep` | lance tout de suite le balayage : relecture des paiements par carte ouverts, puis expirations et rappels → `{ checked, expired, reminders, checkouts: { checked, paid } }` |
| POST | `/admin/maintenance/upgrade-catalog` | reporte les nouveautés du contenu de départ (nouveaux secteurs, modules ajoutés aux secteurs restés d'origine, prix des formules de départ, moyens de paiement) sans toucher à ce que l'administrateur a modifié → `{ upgraded, from?, to? }`. Fait aussi tout seul au démarrage, une fois par version (version 3 : prix en dollars, Rendez-vous et Projets, code de vérification). Passage en dollars : si la devise est encore le dinar et qu'aucune formule n'était publiée, ou que les formules publiées sont toutes restées celles de départ sans aucun paiement enregistré, les prix de départ deviennent 15 / 29 / 79 $ par mois (150 / 290 / 790 $ par an) ; sinon la devise et les prix ne bougent pas (le journal d'activité l'indique) |

## Essai gratuit, paiement et écrans (résumé)

- **Inscription en libre-service** : `/auth/register` (email + mot de passe), `/auth/google`, `/auth/apple`. L'adresse est confirmée par un code à
  6 chiffres (voir plus haut), puis l'essai tourne pour `trialHours` heures (72 par défaut = 3 jours). À son terme, sans paiement,
  toute route hors `/auth/*`, `/billing/*` et `/public/*` répond **402** : le site emmène la personne sur `/subscription`.
- **Paiement 100 % en ligne** : sur `/subscription` (ou `/dashboard/billing`), le client choisit sa formule et son cycle, clique « Payer par carte »
  et règle sur la page Konnect. À son retour, l'abonnement est déjà ouvert. L'administrateur n'a rien à valider ; les paiements hors ligne
  (virement, D17, Flouci, chèque, espèces) n'existent que s'il les a activés dans Réglages. **Un paiement fait pendant l'essai fait commencer la période
  payée à la fin de l'essai** : aucun jour gratuit n'est perdu.
- **Écrans** : `/auth/login`, `/auth/register`, `/auth/verify-email` (saisie du code), `/auth/forgot-password`, `/reset-password`, `/subscription`
  (accès fermé), `/dashboard/billing` (dans l'ERP : formule, paiement, modules et secteur), `/dashboard/appointments`, `/dashboard/projects`, et côté
  administrateur `/admin` (vue d'ensemble), `/admin/accounts` (+ fiche), `/admin/payments`, `/admin/plans`, `/admin/sectors`, `/admin/settings`, `/admin/audit`.
- **Variables d'environnement de l'API** (voir `.env.example`) :
  - `KONNECT_API_KEY`, `KONNECT_WALLET_ID` : paiement par carte (sans elles, le bouton « Payer par carte » n'est pas proposé) ;
    `KONNECT_ENV` (`production` par défaut, `sandbox` pour les essais), `KONNECT_PAYMENT_METHODS` (`bank_card,e-DINAR` par défaut),
    `KONNECT_API_URL` (tests automatisés seulement) ;
  - `API_PUBLIC_URL` : adresse publique de l'API, appelée par Konnect (à défaut `RENDER_EXTERNAL_URL`, puis l'adresse de la requête) ;
  - `FRONTEND_URL`, `FRONTEND_URLS` : adresses du site autorisées (CORS) et vers lesquelles le client est ramené après le paiement ;
  - `SMTP_*` : emails — **indispensable au code de vérification** (sans lui, le code n'est pas exigé) et aux reçus ;
  - `GOOGLE_CLIENT_ID` (bouton Google), `APPLE_CLIENT_ID` (identifiant de service Apple ; plusieurs valeurs séparées par des virgules sont acceptées).
  Sans ces variables, les boutons et les envois correspondants sont simplement absents.

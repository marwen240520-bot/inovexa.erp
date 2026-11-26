# API de la couche SaaS

Référence des routes ajoutées par `backend/src/modules/saas` et `backend/src/modules/auth`. Toutes les réponses sont en JSON.
Les erreurs suivent le format NestJS : `{ "statusCode": 400, "message": "…" | ["…"], "error": "Bad Request" }`.

- **Montants** : nombres, hors taxes sauf mention contraire, en dinars (3 décimales). `null` = « sur devis ».
- **Dates** : chaînes ISO 8601 (UTC). L'interface les affiche à l'heure de Tunis.
- **Jeton** : `Authorization: Bearer <access_token>` sur toutes les routes marquées 🔒.

## Codes de réponse à connaître

| Code | Signification | Que fait l'interface |
| --- | --- | --- |
| 401 | Pas de session, ou session fermée | Retour à `/auth/login` |
| 402 | Compte bloqué : `{ code: "SUBSCRIPTION_REQUIRED", status, reason, message }` | Redirection vers `/subscription` (faite une fois pour toutes dans `frontend/lib/apiCache.ts`) |
| 403 | Droit insuffisant, ou `{ code: "MODULE_DISABLED", module }` | Affiche le message du serveur |
| 409 | Conflit (email déjà utilisé, paiement déjà traité…) | Affiche le message du serveur |

`reason` vaut `TRIAL_EXPIRED`, `SUBSCRIPTION_EXPIRED`, `SUSPENDED`, `CANCELLED` ou `EMAIL_NOT_VERIFIED`.
Un compte bloqué garde l'accès à `/auth/*`, `/billing/*`, `/public/*`, `GET /users/profile` et `GET /users/:id/modules`.

## Objet `account` (état du compte)

Renvoyé par `/auth/login`, `/auth/register`, `/auth/google`, `/auth/me` et `/billing/subscription`. `null` pour un administrateur
ou un transporteur.

```json
{
  "status": "TRIAL", "blocked": false, "reason": null, "message": null,
  "trialStartedAt": "2026-11-25T10:00:00.000Z", "trialEndsAt": "2026-11-28T10:00:00.000Z",
  "subscriptionStart": null, "subscriptionEnd": null,
  "endsAt": "2026-11-28T10:00:00.000Z", "remainingSeconds": 259180, "serverTime": "2026-11-25T10:00:20.000Z",
  "planCode": null, "billingCycle": null, "sector": "restaurant", "userLimit": null,
  "emailVerified": false, "expiryEnforced": true
}
```

`remainingSeconds` est calculé par le serveur : le décompte affiché part de cette valeur, jamais de l'horloge du poste.

## Authentification (sans jeton, sauf mention)

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| POST | `/auth/register` | `name`, `companyName`, `email`, `phone`, `password`, `sector`, `acceptTerms: true` ; facultatifs : `city`, `address`, `legalForm`, `taxId` | 201 `{ access_token, user, account, emailSent }`. Tout autre champ (`role`, `modules`…) → 400 |
| POST | `/auth/login` | `email`, `password`, `otp?` | 200 `{ access_token, user, account }`. Double authentification active et pas de code : 401 `{ requires2fa: true }` |
| POST | `/auth/google` | `credential` (jeton d'identité Google), `intent?: "login" \| "register"`, et pour une inscription `companyName`, `sector`, `phone?`, `acceptTerms: true`, `otp?` | 200 `{ access_token, user, account, created }`. Aucun compte et `intent` ≠ `register` : 404 `{ code: "ACCOUNT_NOT_FOUND", email, name }`. Google non configuré : 503 |
| POST | `/auth/apple` | `identityToken` (jeton d'identité « Sign in with Apple »), `intent?: "login" \| "register"`, `name?` (Apple ne le donne qu'à la première autorisation) et, pour une inscription, `companyName`, `sector`, `phone?`, `acceptTerms: true`, `otp?` | Mêmes réponses que `/auth/google`. 503 si `APPLE_CLIENT_ID` n'est pas défini. Le jeton est vérifié avec les clés publiques d'Apple (signature RS256, `iss`, `aud`, expiration) ; une adresse non vérifiée ne sert jamais à retrouver un compte |
| POST | `/auth/verify-email` | `email`, `token` | 200 `{ success, message, alreadyVerified? }` |
| POST 🔒 | `/auth/resend-verification` | — | 200 `{ success, emailSent, message }` |
| POST | `/auth/forgot-password` | `email` | 200 (même réponse que le compte existe ou non) |
| POST | `/auth/reset-password` | `email`, `token`, `newPassword` | 200 `{ success, message }` |
| GET 🔒 | `/auth/me` | — | profil + `account`, `sector`, `emailVerified`, `googleLinked`, `appleLinked`, `permissions` |
| POST 🔒 | `/auth/logout-all` | — | ferme toutes les sessions |
| PATCH 🔒 | `/users/change-password` | `oldPassword`, `newPassword` | `{ success, message, access_token }` — **remplacer le jeton enregistré** par `access_token` |

`user` : `{ id, email, name, role, companyName, modules, isTeamMember, ownerId, twoFactorEnabled, permissions, sector }`.
Mot de passe : 8 caractères au moins, avec une lettre et un chiffre.

## Site public (sans jeton)

| Route | Réponse |
| --- | --- |
| `GET /public/config` | `{ trialHours, currency, vatRate, requireEmailVerification, supportEmail, supportPhone, supportWhatsapp, googleClientId, appleClientId, paymentMethods, modules }` — `googleClientId: null` / `appleClientId: null` = ne pas afficher le bouton ; `paymentMethods` = moyens de paiement proposés (les coordonnées de paiement ne sont pas publiques) |
| `GET /public/plans` | `{ currency, vatRate, trialHours, plans: Plan[] }` — seulement les formules publiées |
| `GET /public/sectors` | `Sector[]` (avec `itemCount`) |
| `GET /public/sectors/:code` | `{ sector, categories, items, serviceOffers, disclaimer }` |
| `GET /public/service-offers?sector=` | `ServiceOffer[]` publiées |

Types : voir `frontend/lib/saas.ts` (`Plan`, `Sector`, `SectorCategory`, `SectorItem`, `ServiceOffer`).
Une sous-catégorie est une `SectorCategory` dont `parentId` désigne sa catégorie (deux niveaux au maximum).

## Abonnement de la société 🔒 (`/billing`)

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| GET | `/billing/subscription` | — | `SubscriptionView` : `{ account, company, plan, users: { used, limit }, modules, pendingPayment, payment: { currency, vatRate, instructions, methods, onlinePayment }, support: { email, phone, whatsapp }, canManage }` |
| GET | `/billing/plans` | — | `{ currency, vatRate, plans }` |
| GET | `/billing/payments` | — | `SubscriptionPayment[]` |
| POST | `/billing/payments` | `planCode`, `billingCycle: "monthly" \| "annual"`, `method`, `reference?`, `note?` | 201 paiement `pending`. Le montant vient de la formule. Déjà un paiement en attente : 409 |
| DELETE | `/billing/payments/:id` | — | annule sa déclaration en attente |
| GET | `/billing/payments/:id/receipt` | — | `Receipt` (paiement validé seulement) |
| POST | `/billing/contact` | `subject`, `message` | 200 `{ id, received, emailed }` |
| POST | `/billing/cancel` | `password`, `reason?` | résilie (propriétaire seulement) |
| GET | `/billing/suggestions?sector=` | — | `{ sectors: [{ code, name, nameEn, nameAr, itemCount }], current, sector, categories, items, serviceOffers, disclaimer }` |
| POST | `/products/suggestions/import` | `itemIds: number[]`, `overrides?: { [itemId]: { price } }` | `{ created, skipped, products: [{ id, name }], details: [{ name, reason }], disclaimer }` |

Moyens de paiement : `bank_transfer`, `cash`, `cheque`, `d17`, `card`, `other` (ceux proposés au client sont dans `payment.methods`).
Aucun prestataire de paiement en ligne n'est branché : `onlinePayment` vaut toujours `false`, la validation est faite par l'administrateur.

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

### Tableau de bord
`GET /admin/overview?from=AAAA-MM-JJ&to=AAAA-MM-JJ` (30 derniers jours par défaut) :

```json
{
  "range": { "from": "…", "to": "…" }, "currency": "TND",
  "customers": { "total": 5, "trial": 2, "active": 2, "expired": 0, "expiredTrials": 0, "suspended": 0, "cancelled": 1, "paying": 2 },
  "newRegistrations": 5, "mrr": 131.5, "revenue": { "ht": 1039, "ttc": 1236.41 },
  "revenueByMonth": [{ "month": "2026-11", "ht": 1039, "ttc": 1236.41, "payments": 2 }],
  "registrationsByMonth": [{ "month": "2026-11", "count": 5 }],
  "conversion": { "signups": 5, "signupsPaid": 2, "subscriptionRate": 40, "trialsEnded": 2, "trialsConverted": 2, "trialToPaidRate": 100 },
  "cancellations": 1,
  "plans": [{ "code": "starter", "name": "Starter", "count": 1 }],
  "modules": [{ "key": "sales", "count": 4 }],
  "sectors": [{ "code": "restaurant", "name": "Restaurants et cafés", "count": 1 }],
  "pendingPayments": 0, "unreadMessages": 0, "note": "…"
}
```

Tous les chiffres viennent des comptes et des paiements **validés**. Un taux vaut `null` quand il n'y a pas de base de calcul.

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
| PATCH | `/admin/accounts/:id/subscription` | `planCode?` (`null` = aucune), `billingCycle?`, `subscriptionEnd?`, `userLimit?`, `expiryEnforced?`, `sector?`, `applySectorModules?` |
| PATCH | `/admin/clients/:id/modules` | `{ modules: { [clé]: boolean } }` |

Toutes ces actions renvoient l'objet `account` mis à jour. Routes d'origine conservées : `GET/POST /admin/clients`,
`PATCH /admin/clients/:id`, `/extend`, `/toggle`, `DELETE /admin/clients/:id`, `POST /admin/clients/:id/reset-demo-data`,
`DELETE /admin/clients/:id/demo-data`, `GET /admin/stats` (`{ totalClients, activeClients, expiredClients, totalRevenue }`).

### Formules, réglages, paiements, messages
| Méthode | Route | Corps |
| --- | --- | --- |
| GET/POST | `/admin/plans` | création : `code`, `name`, `description?`, `priceMonthly?`, `priceAnnual?`, `maxUsers?`, `modules?` (`null` = tous), `features?: string[]`, `isPublic?`, `isActive?`, `highlight?`, `sortOrder?` |
| PATCH/DELETE | `/admin/plans/:id` | suppression refusée (409) si la formule est utilisée |
| GET | `/admin/settings` | réglages (dont `paymentLink`, `catalogVersion`) + `googleConfigured`, `appleConfigured`, `mailConfigured`, `paymentMethodOptions`, `moduleKeys` |
| PUT | `/admin/settings` | `trialHours`, `trialReminderHours`, `renewalReminderDays`, `requireEmailVerification`, `currency`, `vatRate`, `paymentInstructions`, `paymentMethods: string[]` (`bank_transfer`, `d17`, `flouci`, `edinar`, `postal`, `cheque`, `cash`, `card`, `other`), `paymentLink` (adresse https de la page de paiement par carte, proposée quand `card` est activé), `supportEmail`, `supportPhone`, `supportWhatsapp` |
| GET | `/admin/payments` | `status`, `userId`, `limit`, `offset` → `{ total, limit, offset, items: [paiement + account: { id, email, name, companyName }] }` |
| POST | `/admin/payments` | `userId`, `planCode`, `billingCycle`, `method`, `reference?`, `note?`, `validate?` (validé tout de suite sauf `false`) |
| POST | `/admin/payments/:id/validate` | — |
| POST | `/admin/payments/:id/reject` | `{ reason? }` |
| GET | `/admin/payments/:id/receipt` | `Receipt` |
| GET | `/admin/messages?unread=1` | `[{ id, userId, subject, message, readAt, createdAt, account: { id, email, name, companyName, phone } }]` |
| POST | `/admin/messages/:id/read` | — |

### Secteurs, suggestions, prestations
| Méthode | Route | Corps |
| --- | --- | --- |
| GET | `/admin/sectors` | `Sector[]` (tous, actifs ou non) |
| GET | `/admin/sectors/:code/detail` | `{ sector, categories, items, serviceOffers, disclaimer }` (tout, actif ou non) |
| POST | `/admin/sectors` | `code`, `name`, `nameEn?`, `nameAr?`, `description?`, `modules?: string[]`, `recommendations?: string[]`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id` | suppression refusée (409) si des comptes y sont rattachés |
| POST | `/admin/sectors/:id/apply-modules` | applique les modules du secteur à tous ses comptes → `{ updated, modules }` |
| POST | `/admin/sectors/:id/categories` | `name`, `description?`, `parentId?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id/categories/:catId` | la suppression emporte ses sous-catégories et leurs suggestions |
| POST | `/admin/sectors/:id/items` | `name`, `kind` (`product` \| `service`), `categoryId?`, `unit?`, `purchasePrice?`, `sellingPrice?`, `marginPct?`, `vatRate?` (0, 7, 13, 19), `trackLots?`, `basis?`, `description?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/sectors/:id/items/:itemId` | coût + marge donnés sans prix : le prix de vente est calculé ; coût + prix : la marge est recalculée |
| GET/POST | `/admin/service-offers` | `name`, `sectorCode?` (`null` = toutes activités), `category` (`setup`, `training`, `migration`, `support`, `module`), `price?`, `priceUnit` (`one_time`, `per_month`, `per_day`, `per_hour`, `per_user`), `description?`, `basis?`, `isPublic?`, `isActive?`, `sortOrder?` |
| PATCH/DELETE | `/admin/service-offers/:id` | |

### Journal et maintenance
| Méthode | Route | Notes |
| --- | --- | --- |
| GET | `/admin/audit` | `action`, `userId`, `from`, `to`, `limit`, `offset` → `{ total, limit, offset, items: [{ id, userId, actorId, actorEmail, action, entity, entityId, method, path, status, ip, createdAt, details }] }` |
| POST | `/admin/maintenance/sweep` | lance tout de suite le balayage des expirations et des rappels → `{ checked, expired, reminders }` |
| POST | `/admin/maintenance/upgrade-catalog` | reporte les nouveautés du contenu de départ (nouveaux secteurs, modules ajoutés aux secteurs restés d'origine, prix proposés des formules encore en brouillon, moyens de paiement) sans toucher à ce que l'administrateur a modifié → `{ upgraded, from?, to? }`. Fait aussi tout seul au démarrage, une fois par version |


## Essai gratuit, paiement et écrans (résumé)

- **Inscription en libre-service** : `/auth/register` (email + mot de passe), `/auth/google`, `/auth/apple`. L'essai démarre tout de suite
  pour `trialHours` heures (72 par défaut = 3 jours). À son terme, sans paiement validé, toute route hors `/auth/*`, `/billing/*` et
  `/public/*` répond **402** : le site emmène la personne sur `/subscription`.
- **Paiement pendant ou après l'essai** : le client choisit sa formule et son moyen (`GET /billing/subscription` → `payment.methods`,
  `payment.instructions`, `payment.link`), puis déclare son paiement (`POST /billing/payments`). L'administrateur le valide
  (`POST /admin/payments/:id/validate`) : l'accès est ouvert et le reçu est créé. **Un paiement validé pendant l'essai fait commencer
  la période payée à la fin de l'essai** : aucun jour gratuit n'est perdu.
- **Écrans** : `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/reset-password`, `/auth/verify-email`, `/subscription`
  (accès fermé), `/dashboard/billing` (dans l'ERP), et côté administrateur `/admin` (vue d'ensemble), `/admin/accounts` (+ fiche),
  `/admin/payments`, `/admin/messages`, `/admin/plans`, `/admin/sectors`, `/admin/settings`, `/admin/audit`.
- **Variables d'environnement de l'API** : `GOOGLE_CLIENT_ID` (bouton Google), `APPLE_CLIENT_ID` (identifiant de service Apple ; plusieurs
  valeurs séparées par des virgules sont acceptées), `SMTP_*` (emails). Sans elles, les boutons et les envois correspondants sont simplement absents.

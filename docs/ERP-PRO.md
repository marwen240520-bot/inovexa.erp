# Inovexa ERP — fonctionnalités « ERP professionnel »

Ce document décrit ce qui a été ajouté pour passer d'un outil de saisie à un ERP exploitable en entreprise, les règles métier
appliquées et — surtout — **ce qui doit être validé par votre expert-comptable avant usage réel**.

## 1. Cycle de vente et d'achat (`/documents`)

Un moteur unique pour 8 types de pièces : devis, bon de livraison, facture, avoir (ventes) et bon de commande, bon de réception,
facture fournisseur, avoir fournisseur (achats).

**Ancien module « Factures » fusionné.** La table `invoices` n'est plus qu'un reflet en lecture seule des factures validées
(elle continue d'alimenter le tableau de bord, les analyses et l'assistant). Les factures saisies dans l'ancien écran sont reprises
automatiquement dans Documents à la première consultation (`POST /documents/import-legacy` pour forcer) : numéro d'origine conservé
(suffixé seulement en cas de doublon), montants repris tels quels, règlement « repris » pour les factures payées, sans écriture
comptable ni mouvement de stock (historique déjà traité). `POST /invoices`, `PUT` et `DELETE` répondent 410 ; `PATCH /invoices/:id/pay`
règle le document correspondant ; `POST /invoices/import` (historique Excel, colonne `date` = date de la facture) reprend aussitôt
les lignes dans Documents. L'adresse `/dashboard/invoices` redirige vers `/dashboard/documents`.

- **Brouillon modifiable → validation → pièce figée.** À la validation la pièce reçoit son numéro légal (`FA-2026-00001`, par type et par année,
  **sans trou** : le numéro est attribué dans la même transaction que la validation, une erreur n'en consomme aucun). Une pièce validée ne peut
  plus être modifiée ni supprimée (HTTP 409) ; une erreur se corrige par un **avoir**.
- **Chronologie** : une facture ne peut pas être datée avant la dernière facture validée, ni dans le futur.
- **Conversions** : devis → BL → facture, BC → réception → facture fournisseur. Seules les quantités restantes sont reprises ; le statut de la pièce
  d'origine suit (converti, facturé, partiellement reçu…).
- **Montants** : en millimes entiers (TND à 3 décimales), TVA par taux (0, 7, 13, 19 %), remise ligne + remise globale, **timbre fiscal**
  (réglage société), **retenue à la source** (taux par client, appliquée au-dessus du seuil de 1 000 DT TTC), net à payer.
- **Avoirs** partiels (par ligne et quantité), retour en stock optionnel, retenue reprise.
- **Règlements** : partiels, trop-perçu refusé, annulation (avec contre-passation comptable), imputation d'un avoir sur une facture, échéanciers.
- **Suivi des impayés** : balance âgée clients/fournisseurs, relevé de compte d'un tiers, relances par niveau (email + trace CRM).
- **PDF** (facture, devis, BL…) avec logo (celui de la société ou le logo par défaut), mentions légales, montant en lettres, RIB, mention de certification El Fatoora quand la référence TTN est saisie ; **fichier TEIF** et données de facture électronique (JSON).
- Plafond d'encours client : dépassement signalé en avertissement (non bloquant).

## 2. Stock

Mouvements journalisés (`stock_movements`), niveaux par dépôt, **coût moyen pondéré (CMUP)**, lots avec péremption (FEFO), seuils d'alerte,
valorisation, rotation. `GET /stock/reconcile` contrôle que le stock affiché égale la somme du journal.

## 3. Comptabilité (`/accounting`)

Écritures **équilibrées** générées automatiquement (ventes, achats, règlements, paie, caisse) dans les journaux VT/AC/BQ/CA/OD, numérotées par année.
États : journal, grand livre, balance, compte de résultat, déclaration de TVA, **export Excel**. Saisie manuelle et extourne. Rapprochement bancaire :
import de relevé (CSV/JSON), dédoublonnage, suggestions et rapprochement automatique.

## 4. RH et paie (`/hr`)

Congés : demande, contrôle du solde et des chevauchements, validation, jours ouvrés décomptés. Paie mensuelle paramétrable : CNSS salarié/patronale,
frais professionnels, déductions familiales, barème IRPP par tranches, contribution de solidarité ; bulletin PDF ; écriture comptable à la validation
et au paiement ; absences non rémunérées déduites.

## 5. CRM (`/crm`)

Listes de prix (appliquées automatiquement aux pièces d'un client), conditions par client/fournisseur (délai, plafond, remise, retenue),
fiche 360° (encours, retards, délai moyen de règlement, produits les plus achetés), interactions et relances à venir.

## 6. Caisse (`/pos`)

Sessions de caisse (fond initial, rapport en direct, **clôture avec rapport Z numéroté sans trou**, écart de caisse), tickets numérotés rattachés
à la session. `POS_REQUIRE_SESSION=true` interdit les ventes hors session.

## 7. Pilotage

`/notifications` (stock bas, factures en retard, devis qui expirent, péremption, échéances fournisseurs ; dédoublonnées, récapitulatif par email),
`/reports/business` (CA net, marges par produit/client, exports Excel ventes, marges, balance âgée, valorisation du stock).

## 8. Écrans (interface)

| Écran | Adresse | Contenu |
| ----- | ------- | ------- |
| Factures & devis (documents commerciaux) | `/dashboard/documents` (+ `/new`, `/[id]`, `/[id]/edit`) — `/dashboard/invoices` y redirige | Liste par type et statut, import d’un historique Excel, éditeur de brouillon, fiche (validation, encaissement, conversion, avoir, envoi, PDF) |
| Règlements et créances | `/dashboard/documents/payments` | Journal des règlements, balance âgée clients / fournisseurs |
| Paramètres › Société & fiscalité | `/dashboard/company` (sous-onglet de Paramètres) | Identité, fiscalité (TVA, timbre, retenue), conditions par défaut, numérotation |
| Comptabilité | `/dashboard/accounting` | Journal, balance, résultat, TVA, rapprochement bancaire, écritures manuelles, export |
| Ressources humaines | `/dashboard/hr` (employés) et `/dashboard/hr/payroll?tab=payroll|leaves|settings` | Un seul module avec sous-onglets : employés, bulletins (génération, validation, paiement, PDF), congés et soldes, paramètres de paie |
| Clients › Fiche 360° / À relancer / Listes de prix | `/dashboard/crm?tab=overview|followups|prices` (sous-onglets de Clients) | Fiche 360°, conditions, échanges, relances, listes de prix |
| Rapports de gestion | `/dashboard/reports/business` | Ventes, marges, valorisation du stock, exports Excel |
| Sessions de caisse | `/dashboard/pos/sessions` | Ouverture / clôture, rapport Z, recherche de ticket |
| Alertes | cloche dans l’en-tête du tableau de bord | Stock bas, retards, devis qui expirent ; « tout lire », récapitulatif par email |

Ces écrans suivent les modules activés du compte (entrées du menu rattachées à `invoices`, `finance`, `hr`, `reports`, `clients`, `pos`, `settings`) et partagent
un petit kit de composants (`frontend/components/erp/kit.tsx`). La barre de recherche du tableau de bord accepte la **voix** (bouton micro, navigateurs Chrome / Edge / Safari).

## 9. Liens entre modules

| Flux | Ce qui se passe |
| ---- | --------------- |
| Caisse → stock | chaque ticket sort (vente) ou entre (achat, coût ramené hors taxe) du stock ; les services ne se stockent pas |
| Caisse → comptabilité | à la clôture Z : écriture au journal de caisse (ventes HT et TVA par taux, encaissements espèces / banque par moyen de paiement, achats réglés en caisse, sortie de stock au coût moyen). **Les prix de caisse sont des montants TTC encaissés.** Le numéro d'écriture figure sur le rapport Z |
| Ventes / Achats (anciens écrans) → stock | mouvements de stock, mais pas d'écriture comptable : préférer Documents ou Caisse |
| Finances (dépenses) → comptabilité | chaque dépense génère son écriture (charge HT, TVA déductible, règlement caisse ou banque) ; sa suppression la contre-passe. Compte par catégorie : clé `expense:<catégorie>` dans la correspondance des comptes |
| Finances ← documents et caisse | synthèse réelle : CA facturé, achats fournisseurs, encours clients, dettes fournisseurs, ventes caisse clôturées |
| Commandes → documents | « Créer… » sur une commande : devis, bon de livraison ou facture (brouillon) avec la ligne de la commande ; une commande ne donne qu'un document, qui suit ensuite le circuit normal |
| Production → stock | ordre de production avec produit fini et nomenclature (composants par unité) : à chaque avancement, le produit fini entre en stock et les composants sortent (refus si composants insuffisants). Pas d'écran web dédié : API `/production/orders` |
| Documents → anciennes tables | les factures validées se reflètent dans `invoices`, `sales` et `purchases` (tableau de bord, analyses, assistant) |
| Déclaration de TVA | factures et avoirs (documents) + caisse (sessions clôturées) + dépenses Finances ; l'origine des montants est détaillée dans Comptabilité › TVA |
| Rapports de gestion › Ventes | factures (HT net) et caisse (HT extrait des encaissements) : total, détail par mois |

Limites connues : l'ancien écran Ventes / Achats crée des mouvements de stock sans écriture comptable ; le tableau de bord
d'accueil additionne tickets de caisse (TTC encaissé) et lignes de factures (HT) — les chiffres de référence sont ceux de
Rapports de gestion, Comptabilité et Finances › Chiffres réels.

## 10. Sécurité et traçabilité

Droits par ressource et par action (propriétaire / équipe), journal d'audit des opérations, limitation de débit, en-têtes de sécurité (helmet),
double authentification, validation stricte des entrées.

---

## À faire valider avant usage réel

| Sujet | Situation |
| ----- | --------- |
| **Plan comptable** | Les codes de comptes par défaut sont **indicatifs** (`company.accountMap`, modifiable). L'expert-comptable doit valider/adapter le plan et les comptes d'imputation. |
| **Paie** | Taux CNSS (9,18 % / 16,57 %), barème IRPP de la LF 2025, CSS 0,5 % (LF 2026, exonération ≤ 5 000 DT), déductions familiales : valeurs **alignées sur les textes 2026** mais à faire valider (dossier `docs/VALIDATION-PAIE-COMPTA.md`, case « validés » dans Paramètres de paie). Les primes sont annualisées dans le calcul mensuel ; la régularisation annuelle de l'IRPP n'est pas calculée. |
| **Facture électronique** | L'ERP produit le fichier **TEIF 1.8.8** attendu par El Fatoora (validé contre le schéma XSD de TTN). La signature et la transmission se font sur la plateforme avec le certificat de la société : voir `docs/EL-FATOORA.md`. |
| **Retenue à la source / timbre** | Taux et seuil paramétrables ; vérifier qu'ils correspondent à la loi de finances en vigueur et à vos clients. |
| **TVA** | La déclaration est calculée sur la **date de facture** (régime des débits), pas sur l'encaissement. |
| **PDF** | Texte latin uniquement (polices standard) : pas d'arabe dans les documents imprimés. |
| **Clôture d'exercice** | Pas de verrouillage de période comptable ni de report à nouveau automatique. |
| **Multi-société** | Une société par compte ; les membres d'équipe partagent les données du propriétaire. |
| **Caisse** | Pas de mode hors ligne ; pas d'intégration d'imprimante fiscale. |

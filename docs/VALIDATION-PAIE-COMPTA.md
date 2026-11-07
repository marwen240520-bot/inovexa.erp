# Dossier de validation — paie et comptabilité

À remettre à l'expert-comptable de la société. Chaque ligne indique la valeur utilisée par l'ERP, sa source,
et une case à cocher. Une fois le dossier validé, cochez **« Paramètres validés par mon expert-comptable »**
dans *Ressources humaines › Paramètres de paie* : l'avertissement disparaît des bulletins. Les valeurs se
modifient à tout moment dans le même écran (elles sont conservées sur chaque bulletin déjà établi).

Valeurs de référence : textes en vigueur au **1er janvier 2026**. Elles changent avec chaque loi de finances :
à revoir chaque début d'année.

## 1. Cotisations sociales (CNSS, régime général des salariés)

| Paramètre | Valeur ERP | Source | Validé |
| --------- | ---------- | ------ | :----: |
| CNSS part salariale | **9,18 %** du brut | Cotisations au 1/1/2025 : vieillesse 4,74 + maladie 3,17 + prestations familiales 0,89 + prévoyance 0,38 ([CLEISS](https://www.cleiss.fr/docs/cotisations/tunisie.html)) | ☐ |
| CNSS part patronale | **16,57 %** du brut | 7,76 + 5,08 + 2,21 + 1,52 (même source) | ☐ |
| Accidents du travail et maladies professionnelles | **0,5 %** (employeur) | Taux **par secteur, de 0,4 % à 4 %** : à remplacer par le taux notifié par la CNSS à la société | ☐ |
| Assiette | totalité du salaire brut (salaire + primes) | pas de plafond pour les cotisations de base | ☐ |
| Retraite complémentaire | non gérée | 6 % / 3 % sur la part au-delà de 6 SMIG, établissements adhérents seulement | ☐ |

Certaines sources mentionnent une part salariale de 9,68 % (régimes particuliers) : confirmer le régime
de la société.

## 2. Impôt sur le revenu (IRPP) retenu à la source

| Paramètre | Valeur ERP | Source | Validé |
| --------- | ---------- | ------ | :----: |
| Frais professionnels | **10 %** du net de cotisations, **plafond 2 000 DT/an** | [PwC — Income determination](https://taxsummaries.pwc.com/tunisia/individual/income-determination) | ☐ |
| Déduction chef de famille | **300 DT/an** | [PwC — Deductions](https://taxsummaries.pwc.com/tunisia/individual/deductions) | ☐ |
| Déduction par enfant à charge | **100 DT/an**, **4 enfants** maximum (moins de 20 ans) | même source | ☐ |
| Enfant étudiant non boursier (< 25 ans) | **non géré** (1 000 DT/an) | même source — à ajouter si des salariés sont concernés | ☐ |
| Enfant handicapé | **non géré** (2 000 DT/an) | même source | ☐ |
| Parents à charge | **non géré** (5 % du revenu, plafond 450 DT par parent) | même source | ☐ |

Barème annuel (loi de finances 2025, JORT du 10 décembre 2024 ; inchangé par la loi de finances 2026) :

| Tranche de revenu net imposable (DT/an) | Taux |
| --------------------------------------- | ---: |
| 0 à 5 000 | 0 % |
| 5 000 à 10 000 | 15 % |
| 10 000 à 20 000 | 25 % |
| 20 000 à 30 000 | 30 % |
| 30 000 à 40 000 | 33 % |
| 40 000 à 50 000 | 36 % |
| 50 000 à 70 000 | 38 % |
| au-delà de 70 000 | 40 % |

Sources : [L'Économiste Maghrébin — nouveau barème LF 2025](https://www.leconomistemaghrebin.com/2024/12/11/loi-de-finances-2025-voici-le-nouveau-bareme-de-lirpp/),
[Deloitte — mesures de la LF 2026](https://blog.avocats.deloitte.fr/tunisie-les-principales-mesures-de-la-loi-de-finances-pour-2026/). ☐ Validé

Méthode de calcul mensuel de l'ERP (à confirmer) : base annuelle = (brut − CNSS salariale) × 12 ; − frais
professionnels ; − déductions familiales ; impôt annuel par tranches ; retenue du mois = impôt annuel / 12.
Les primes du mois sont annualisées (×12) : **la régularisation annuelle n'est pas calculée** par l'ERP. ☐

## 3. Contribution sociale de solidarité (CSS)

| Paramètre | Valeur ERP | Source | Validé |
| --------- | ---------- | ------ | :----: |
| Taux personnes physiques | **0,5 %** du revenu imposable (1 % − réduction temporaire de 0,5 point) | LF 2026, art. 87 ([La Presse, 14/1/2026](https://www.lapresse.tn/2026/01/14/contribution-sociale-de-solidarite-nouvelles-modalites-confirmees-pour-lannee-2026/), [Deloitte](https://blog.avocats.deloitte.fr/tunisie-les-principales-mesures-de-la-loi-de-finances-pour-2026/)) | ☐ |
| Exonération | revenu net imposable annuel **≤ 5 000 DT** | mêmes sources | ☐ |
| Période | salaires payés du 1/1 au 31/12/2026 ; **revoir pour 2027** | | ☐ |

## 4. Congés

| Paramètre | Valeur ERP | À confirmer avec la convention collective | Validé |
| --------- | ---------- | ---------------------------------------- | :----: |
| Jours de congé payé acquis par mois | **1** (12 jours/an, minimum du Code du travail ; 2 jours/mois pour les moins de 18 ans) | ancienneté, convention sectorielle (souvent 1,5 à 2,5 j/mois) | ☐ |
| Semaine de travail | lundi → vendredi | 5 ou 6 jours selon la société | ☐ |

## 5. Plan comptable (écritures automatiques)

Comptes proposés par défaut (modifiables dans *Paramètres › Société & fiscalité*, champ « correspondance des
comptes », et dans *Comptabilité*). Numérotation inspirée du **Système comptable des entreprises** (SCE) ;
l'expert-comptable adapte au plan de la société.

| Fonction | Compte proposé | Validé / compte retenu |
| -------- | -------------- | ---------------------- |
| Clients | 411 | ☐ |
| Clients créditeurs (avances, avoirs) | 419 | ☐ |
| Fournisseurs | 401 | ☐ |
| Fournisseurs débiteurs | 409 | ☐ |
| Ventes de marchandises | 701 | ☐ |
| Prestations de services | 706 | ☐ |
| Stocks de marchandises | 370 | ☐ |
| Coût d'achat des marchandises vendues | 607 | ☐ |
| Achats non stockés / services extérieurs | 616 | ☐ |
| TVA collectée | 4367 | ☐ |
| TVA déductible | 4366 | ☐ |
| Retenues à la source subies (à imputer) | 4364 | ☐ |
| Retenues à la source opérées (à reverser) | 4363 | ☐ |
| Droit de timbre à reverser / charge | 4368 / 647 | ☐ |
| Banque / Caisse | 512 / 531 | ☐ |
| Personnel — rémunérations dues | 421 | ☐ |
| CNSS — cotisations à payer | 431 | ☐ |
| État — IRPP et CSS retenus | 4369 | ☐ |
| Rémunérations du personnel | 641 | ☐ |
| Charges sociales (part patronale) | 645 | ☐ |

Points à trancher avec l'expert-comptable :

- Journaux utilisés : VT (ventes), AC (achats), BQ (banque), CA (caisse), OD (opérations diverses). ☐
- TVA déclarée **sur la date de facture** (régime des débits) ; pas de TVA sur encaissements. ☐
- Timbre fiscal : 1 DT par facture (paramétrable), pas de timbre sur les avoirs. ☐
- Retenue à la source : seuil et taux paramétrables par client (fiche client) ; comptabilisée à la validation
  de la pièce. ☐
- Pas de clôture d'exercice automatique ni de report à nouveau : à faire par l'expert-comptable. ☐

## 6. Signature

| | |
| --- | --- |
| Société | |
| Expert-comptable (nom, cabinet, n° d'inscription OECT) | |
| Date de validation | |
| Prochaine revue (début d'année) | |

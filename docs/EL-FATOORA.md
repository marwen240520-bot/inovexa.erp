# Facture électronique — El Fatoora (Tunisie TradeNet)

## Où en est l'ERP

| Étape | État | Qui |
| ----- | ---- | --- |
| 1. Générer la facture au format officiel **TEIF 1.8.8** (XML) | **Fait** — bouton *El Fatoora (XML)* sur toute facture ou avoir validé ; `GET /documents/:id/teif` (`?check=1` liste les manques sans générer) | ERP |
| 2. Contrôler le fichier contre le **schéma XSD publié par TTN** | **Fait** — à chaque test automatique (`backend/resources/teif/`) ; contrôles du guide (format du matricule fiscal, codes) dans `teif.service.ts` | ERP |
| 3. Adhérer à El Fatoora et obtenir le **certificat de signature** | À faire par la société | Société + TTN + TunTrust |
| 4. **Signer** le fichier (XAdES) | Sur la plateforme El Fatoora, ou avec l'outil de signature TTN : la clé privée reste chez la société | Société |
| 5. **Transmettre** à TTN et recevoir la référence TTN | Dépôt du fichier sur la plateforme (ou connecteur EDI, voir plus bas) | Société |
| 6. Archiver la facture validée (référence TTN, cachet) | À faire : rattacher la référence au document | ERP (évolution) |

Tant que les étapes 3 à 5 ne sont pas faites, **l'ERP ne produit pas de facture électronique certifiée** : il
produit le fichier que la plateforme attend. C'est l'adhésion et la signature qui donnent la valeur légale.

## Qui est concerné

- Depuis plusieurs années : les entreprises relevant de la Direction des grandes entreprises pour leurs
  opérations avec l'État, les collectivités et les entreprises publiques, et les ventes de médicaments et
  d'hydrocarbures entre professionnels.
- **Loi de finances 2026** : extension explicite de l'obligation aux **prestations de services** ; les modalités
  (calendrier, format, plateforme) sont précisées par voie réglementaire. Une facture papier ou un PDF ne
  suffit alors plus. Source : [Deloitte — mesures de la LF 2026](https://blog.avocats.deloitte.fr/tunisie-les-principales-mesures-de-la-loi-de-finances-pour-2026/).

Vérifiez avec votre expert-comptable si votre activité est déjà soumise à l'obligation.

## Adhésion (étape 3) — démarches de la société

1. **Adhésion à El Fatoora** auprès de Tunisie TradeNet : formulaire d'adhésion, extrait du registre de
   commerce, matricule fiscal, convention d'abonnement. Procédure décrite sur
   [idaraty.tn](https://idaraty.tn/fr/procedures/adhesion-au-systeme-de-facturation-electronique) et sur le
   portail TTN.
2. **Certificat électronique** de signature au nom de la société (ou de son représentant) délivré par
   **TunTrust** (Agence nationale de certification électronique) : fichier `.p12` et code PIN, ou carte à puce.
3. Choix du mode d'utilisation : **portail web** (dépôt et signature des fichiers en ligne — suffisant pour un
   volume modéré) ou **mode EDI / connecteur** (envoi automatisé depuis l'ERP ; identifiants techniques
   fournis par TTN après tests sur leur environnement de recette).

## Utilisation avec l'ERP (mode portail)

1. Renseigner dans *Paramètres › Société & fiscalité* : raison sociale, **matricule fiscal complet**
   (`1234567X/A/M/000`), adresse, registre de commerce, téléphone, email, RIB.
2. Sur chaque **fiche client**, saisir le matricule fiscal complet (ou la CIN à 8 chiffres pour un particulier).
   Sans cet identifiant, TTN refuse la facture ; l'ERP le signale avant l'export.
3. Valider la facture dans l'ERP, puis cliquer sur **El Fatoora (XML)** : le fichier `TEIF-FA-AAAA-NNNNN.xml`
   est téléchargé.
4. Sur la plateforme El Fatoora : déposer le fichier, le signer avec le certificat, l'envoyer. TTN renvoie la
   **référence TTN** et le cachet électronique visible (code) : les reporter dans le champ *Notes* de la
   facture en attendant le rattachement automatique.
5. Un avoir est exporté de la même façon (type « Facture d'avoir », référence I-89 vers la facture d'origine).

## Ce que contient le fichier (correspondance TEIF ↔ ERP)

| Élément TEIF | Donnée ERP |
| ------------ | ---------- |
| `MessageSenderIdentifier` / `PartnerDetails I-62` (fournisseur) | Matricule fiscal, raison sociale, adresse, registre de commerce (I-815), téléphone (I-101), email (I-103) de la société |
| `MessageRecieverIdentifier` / `PartnerDetails I-64` (client) | Matricule fiscal (I-01) ou CIN (I-02), nom, adresse du client ; n° de bon de commande client (I-83) |
| `Bgm` | Numéro légal ; type I-11 (facture) ou I-12 (avoir) ; facture d'origine d'un avoir (I-89) |
| `Dtm` | Date d'émission (I-31), échéance (I-32) |
| `PytSection` | Conditions de paiement ; RIB de la société (I-142) |
| `Ftx` (I-48, observation) | Retenue à la source et net à payer ; notes de la facture |
| `LinSection` | Lignes : référence (SKU), désignation, quantité, TVA (I-1602), remise de ligne (I-151), prix unitaire HT (I-183), montant HT (I-171, I-188). La remise globale est ventilée sur les lignes. |
| `InvoiceMoa` | Total HT (I-176), base taxable (I-182), total taxes (I-181), **total TTC = HT + TVA + timbre** (I-180) avec montant en lettres ; capital social (I-179) |
| `InvoiceTax` | TVA par taux : base (I-177) et montant (I-178) ; droit de timbre (I-1601) |

Limites connues :

- Devises autres que le dinar : non exportées (TTN attend des montants en TND).
- Retenue à la source : pas de code admis par le schéma 1.8.8 ; elle figure en observation, le TTC exporté est
  le montant avant retenue.
- Numéro CNSS (I-818) : prévu par le guide mais refusé par le schéma, donc non émis.
- Le schéma utilisé pour les tests est la version XSD 1.0 du schéma TTN (les contrôles supplémentaires du
  schéma 1.1 sont faits dans le code) ; le contrôle final reste celui de la plateforme TTN.

## Mode EDI (évolution possible)

TTN propose aux adhérents un connecteur (envoi automatisé, suivi des statuts, récupération de la référence).
Les spécifications techniques et les identifiants sont remis par TTN à l'adhésion ; l'ERP pourra alors
signer avec le certificat de la société et transmettre directement, puis rattacher la référence TTN à la
facture. Ne pas se fier aux adresses d'API publiées par des tiers : seules celles fournies par TTN font foi.

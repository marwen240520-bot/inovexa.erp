# Schémas TEIF 1.8.8 (facture électronique tunisienne, plateforme El Fatoora / TTN)

| Fichier | Origine | Usage |
| ------- | ------- | ----- |
| `teif-1.8.8-withoutSig.xsd11.xsd` | Schéma publié par Tunisie TradeNet (XSD 1.1, inchangé) | référence |
| `teif-1.8.8-withoutSig.xsd` | Même schéma converti en XSD 1.0 (les `xs:assert` / `xs:alternative` sont retirés) | validation `xmllint` des fichiers générés (tests) |
| `teif-1.8.8-withSig.xsd` | Variante avec signature `ds:Signature` obligatoire | validation d'un fichier signé |
| `xmldsig-core-schema.xsd` | W3C XML Signature (DOCTYPE retiré) | importé par la variante signée |

Les fichiers XSD 1.0 et `xmldsig-core-schema.xsd` proviennent du paquet MIT
[ayoubgaouet/tn-einvoice-validator](https://github.com/ayoubgaouet/tn-einvoice-validator)
(© 2026 Ayoub Gaouet, licence MIT). Les contrôles retirés lors de la conversion (format du matricule fiscal
selon le type d'identifiant) sont faits par `src/modules/documents/teif.service.ts` avant la génération.

Validation manuelle d'un fichier produit par l'ERP :

```bash
xmllint --noout --schema backend/resources/teif/teif-1.8.8-withoutSig.xsd TEIF-FA-2026-00001.xml
```

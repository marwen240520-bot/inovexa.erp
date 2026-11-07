# Module « Assistant IA » — Inovexa ERP (v4)

Assistant d'analyse en langage naturel, branché sur **toutes** les données de l'utilisateur.
Il répond comme un contrôleur de gestion : chiffres exacts, période précisée, recommandation concrète.

## Ce qu'il comprend (FR / EN / ES / arabe / derja)

| Domaine | Exemples |
|---|---|
| Ventes | « CA de mai vs avril », « ventes par moyen de paiement ce trimestre », « heure de pointe », « pourquoi le CA baisse ? » |
| Clients | « infos sur Ahmed Ouni » (nom, email ou téléphone, fautes tolérées), « clients sans achat depuis 90 jours », « top 5 clients » |
| Produits & stock | « stock de NER-10 », « que dois-je réapprovisionner ? », « stock dormant », « meilleures marges » |
| Finance | « résultat net du mois », « dépenses par catégorie », « TVA collectée au T3 », « factures en retard de plus de 30 jours » |
| Achats | « fiche fournisseur Distillerie Nabeul », « achats par fournisseur cette année » |
| RH | « masse salariale par département », « salaire moyen des commerciaux » |
| Prévisions | « prévisions des 3 prochains mois » (fourchette + niveau de confiance) |
| Rédaction | « rédige un email de relance pour les impayés de Carthage Beauté » |

Toute question non prévue passe par `query_data` : filtres, regroupements (champ ou jour / semaine / mois /
trimestre / année / jour de la semaine / heure) et agrégats (somme, moyenne, min, max, médiane, distincts)
sur n'importe quel module.

## Fichiers

| Fichier | Rôle |
|---|---|
| `lib/assistant/erpQuery.ts` | Moteur de calcul exact (12 modules) + moteur de requêtes générique |
| `lib/assistant/period.ts` | Compréhension des périodes (« mai », « T1 2026 », « 30 derniers jours »…) |
| `lib/assistant/localAssistant.ts` | Réponses hors-ligne (sans IA) sur les questions courantes |
| `app/api/ai/chat/route.ts` | Agent Claude à outils, streaming NDJSON, sécurité |
| `components/assistant/AssistantChat.tsx` | Interface du chat (réutilisable ailleurs) |
| `components/assistant/ChatMarkdown.tsx` | Rendu Markdown sûr (tableaux, listes, liens internes) |
| `app/dashboard/ai/page.tsx` | Onglet « Chat IA » branché sur le module |

## Configuration (Vercel → Settings → Environment Variables)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | oui | Clé API (jamais exposée au navigateur) |
| `ANTHROPIC_MODEL` | non | Défaut `claude-sonnet-5-5` ; `claude-haiku-5-5` = plus rapide et moins cher |
| `API_URL` | non | URL du backend vue par le serveur (sinon `NEXT_PUBLIC_API_URL`) |
| `AI_REQUIRE_AUTH` | non | `0` désactive la vérification de session (déconseillé) |
| `AI_RATE_LIMIT` | non | Questions max par utilisateur et par 10 min (défaut 40) |

Sans clé, le chat fonctionne en **mode hors-ligne** (réponses calculées localement, badge orange).

## Fonctionnement

1. Le navigateur envoie la question + les données déjà chargées (compactées, compressées en gzip au-delà de 150 Ko).
   Si le volume dépasse la limite d'une requête, seul un profil est envoyé et le serveur lit les données
   directement sur l'API avec le jeton de l'utilisateur.
2. Le serveur vérifie la session (`GET /users/profile`, mis en cache 10 min) et le quota.
3. Claude choisit les outils, souvent en parallèle ; chaque outil calcule en code sur toutes les lignes.
4. Le flux renvoie le texte en temps réel, les étapes d'analyse, un mini-graphique et 3 questions de suivi.

## Liens directs

- `/dashboard/ai?tab=chat` ouvre le chat.
- `/dashboard/ai?q=Factures%20impayées` ouvre le chat et pose la question.

## Ajouter un outil

1. Écrire la fonction de calcul dans `erpQuery.ts`.
2. Déclarer l'outil dans `TOOLS` (`route.ts`), les modules nécessaires dans `TOOL_MODULES`,
   l'appel dans `runTool()` et son libellé dans `TOOL_LABELS`.

# Correctif CSP — « blocks the use of 'eval' »

## Diagnostic
Tes 20 pages `dashboard/*.tsx` ont été scannées : **0 occurrence** de `eval()`,
`new Function()`, `setTimeout("…")` ou `setInterval("…")`. Le code applicatif est
conforme à la CSP — il n'y a rien à corriger dedans.

L'erreur a une seule origine réaliste :

1. **Mode développement Next.js (cas le plus fréquent).**
   En `npm run dev`, Webpack produit des source-maps via `eval()`. Une CSP
   `script-src` sans `'unsafe-eval'` bloque ces appels.
   👉 Cette erreur **disparaît d'elle-même** en production : `next build && next start`.

2. **Ta CSP est définie hors de ce dossier** (dans `next.config.js`, un
   `middleware.ts`, ou une balise `<meta http-equiv>`). Ces fichiers n'étaient pas
   dans le zip. C'est là qu'est le correctif, jamais dans `dashboard/`.

## Ce qui a été livré
- `dashboard/` — **inchangé** (rien à corriger).
- `next.config.js` — pose une CSP propre qui autorise `'unsafe-eval'`
  **uniquement en développement** ; la prod reste stricte.

## Comment l'appliquer
1. Place `next.config.js` à la **racine** de ton projet (à côté de `package.json`,
   pas dans `app/` ni `dashboard/`).
2. **Si tu as déjà un `next.config.js`** : ne le remplace pas en aveugle — recopie
   le bloc `headers()` / la valeur `csp` dans le tien.
3. **Si ta CSP vient d'un `middleware.ts`** : ajoute `'unsafe-eval'` à `script-src`
   dans ta chaîne CSP existante (sous condition `process.env.NODE_ENV !== "production"`).
4. **Si ta CSP est une balise `<meta http-equiv="Content-Security-Policy">`** dans
   le layout racine : ajoute `'unsafe-eval'` à la directive `script-src` de cette balise.
5. Redémarre le serveur (`npm run dev`).

## Vérification rapide
- Console DevTools → onglet **Issues** : plus d'alerte eval.
- En prod (`next build && next start`), la CSP n'autorise pas `'unsafe-eval'` et
  aucune erreur n'apparaît, car Webpack n'émet pas d'`eval` en build de production.

## Recommandation sécurité
Garde `'unsafe-eval'` **strictement en dev**. Ne l'ajoute jamais à la CSP de
production : ça rouvrirait la porte à l'injection de scripts que la CSP est censée
fermer.

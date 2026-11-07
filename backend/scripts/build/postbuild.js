/**
 * Après `nest build`, la sortie est `dist/main.js`. Certains hébergeurs (ex. Render) ont encore
 * l'ancienne commande `node dist/src/main.js` : on laisse un relais pour que les deux fonctionnent.
 */
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', '..', 'dist');
if (!fs.existsSync(path.join(dist, 'main.js'))) {
  console.error('postbuild : dist/main.js introuvable, le build a échoué.');
  process.exit(1);
}
fs.mkdirSync(path.join(dist, 'src'), { recursive: true });
fs.writeFileSync(path.join(dist, 'src', 'main.js'), "require('../main.js');\n");
console.log('postbuild : relais dist/src/main.js → dist/main.js créé.');

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Next.js 16 : `next lint` n'existe plus, le lint se lance avec `npm run lint` (eslint .).
// Même base que l'ancien .eslintrc.json (next/core-web-vitals) et mêmes règles personnalisées.
const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",
      // Règles apparues avec Next.js 16 (eslint-plugin-react-hooks 7, pensées pour le React Compiler,
      // non activé ici) : signalées en avertissement pour les corriger au fil de l'eau.
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/static-components": "warn",
      "@next/next/no-location-assign-relative-destination": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

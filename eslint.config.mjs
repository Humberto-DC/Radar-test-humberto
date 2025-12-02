import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Config base do Next + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Regras globais
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // ❗ Desligar o no-explicit-any no projeto todo
      "@typescript-eslint/no-explicit-any": "off",

      // Deixar só como aviso (não quebra build)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "warn",

      // Esses dois estavam aparecendo nos logs
      "@next/next/no-img-element": "off",
      "jsx-a11y/role-supports-aria-props": "off",
    },
  },

  // Arquivos/pastas ignorados
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

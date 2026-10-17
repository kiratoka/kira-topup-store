import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message: "Please import from '@/lib/db/prisma' instead.",
            },
            {
              name: "@/lib/redis",
              message: "Please import from '@/lib/cache/redis' instead.",
            },
            {
              name: "@/lib/rate-limit",
              message: "Please import from '@/lib/cache/rate-limit' instead.",
            },
            {
              name: "@/lib/midtrans",
              message: "Please import from '@/lib/payment/midtrans' instead.",
            },
            {
              name: "@/lib/errors",
              message: "Please import from '@/lib/security/errors' instead.",
            },
            {
              name: "@/lib/masking",
              message: "Please import from '@/lib/security/masking' instead.",
            },
            {
              name: "@/lib/mdx",
              message: "Please import from '@/lib/content/mdx' instead.",
            },
            {
              name: "@/lib/utils",
              message: "Please import from '@/lib/utils/utils' instead.",
            },
            {
              name: "@/lib/types",
              message: "Please import domain types from '@/lib/types/{game,payment,blog,ui}' instead.",
            },
            {
              name: "@/lib/validations/payment",
              message: "Please import from '@/lib/payment/validations/payment' instead.",
            },
            {
              name: "@/lib/datas/gameData",
              message: "Please import from '@/lib/content/datas/gameData' instead.",
            },
            {
              name: "@/lib/datas/productData",
              message: "Please import from '@/lib/content/datas/productData' instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/api/**/*.{js,ts}", "lib/**/*.{js,ts}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["components/**/*.{js,ts,jsx,tsx}"],
    rules: {
      "no-console": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

/**
 * ESLint Flat Config
 * @see https://eslint.org/docs/latest/use/configure/
 * @type {import('eslint').FlatConfig[]}
 */
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettier from "eslint-plugin-prettier";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').FlatConfig[]} */
export default [
  // 기본 설정
  js.configs.recommended,
  ...compat.config({
    extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  }),
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  // Node.js 환경 설정
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: (await import("@typescript-eslint/parser")).default,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  // TypeScript 설정
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // 테스트 파일 설정
  {
    files: ["**/*.test.{ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
];

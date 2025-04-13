import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
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
    extends: ["plugin:@typescript-eslint/recommended"],
  }),
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "script/**"],
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
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      // 클래스의 접근 제어자 강제
      "@typescript-eslint/explicit-member-accessibility": "error",
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

import { defineConfig } from "tsup";

/**
 * tsup 설정
 * GitHub Actions 환경에서는 CJS 형식으로만 빌드합니다.
 * @see https://tsup.egoist.dev/
 */
export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "script",
  format: ["esm"],
  platform: "node",
  target: "node20",
  sourcemap: true,
  splitting: false,
  clean: true,
  outExtension({ format }) {
    return {
      js: `.${format === "esm" ? "mjs" : "cjs"}`,
    };
  },
});

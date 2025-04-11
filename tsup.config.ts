import { defineConfig } from "tsup";

/**
 * tsup 설정
 * GitHub Actions 환경에서는 CJS 형식으로만 빌드합니다.
 * @see https://tsup.egoist.dev/
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"], // GitHub Actions에서는 CJS만 사용
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: "node16",
  outDir: "dist",
});

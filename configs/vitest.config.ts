import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      provider: "v8",
    },
    setupFiles: ["./vitest.setup.ts"],
  },
});

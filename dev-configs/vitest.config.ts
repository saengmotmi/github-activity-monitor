import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    reporters: ["verbose"],
    coverage: {
      reporter: ["text", "json", "html"],
      provider: "v8",
    },
  },
});

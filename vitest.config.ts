import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    globals: true,
    coverage: {
      provider: "v8",
    },
    exclude: ["tests/e2e/**"],
  },
});

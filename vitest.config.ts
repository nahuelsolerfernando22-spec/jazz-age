import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

// Configuración de vitest para unit tests. Los E2E (Playwright) viven en e2e/
// y no deben correr con vitest.
export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "e2e/**", ".cache/**"],
    environment: "node",
  },
});

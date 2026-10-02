import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

export default defineConfig({
  ...base,
  webServer: undefined,
  testMatch: ["tests/algebra-convergence.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/algebra-convergence-review"
});

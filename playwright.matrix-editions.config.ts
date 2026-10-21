import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined, timeout: 120000,
  testDir: "./tests", testMatch: "matrix-editions.browser.spec.ts",
  outputDir: "tmp/codex/matrix-editions-review" });

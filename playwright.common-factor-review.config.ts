import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
// Verify the actual shared review server; never start another server here.
export default defineConfig({ ...base, webServer: undefined, testMatch: "tests/common-factor.browser.spec.ts",
  use: { ...base.use, baseURL: "http://localhost:8000" }, outputDir: "tmp/codex/common-factor-review" });

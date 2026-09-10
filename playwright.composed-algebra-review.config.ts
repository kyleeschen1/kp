import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
// Use the one shared review server, never a competing dev process.
export default defineConfig({ ...base, webServer: undefined, testMatch: "tests/composed-algebra.browser.spec.ts",
  use: { ...base.use, baseURL: "http://localhost:8000" }, outputDir: "tmp/codex/composed-algebra-review" });

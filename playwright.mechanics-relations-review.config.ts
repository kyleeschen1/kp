import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/mechanics-relations.browser.spec.ts", "tests/mechanics-connected-argument.browser.spec.ts"], use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/mechanics-relations-review" });

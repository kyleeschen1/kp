import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
// Shared-card preservation runs against the same server as exemplar review.
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/log-exponent-focus-card.browser.spec.ts", "tests/economics-supply-tax.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/focus-deck-review" });

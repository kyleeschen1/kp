import { defineConfig } from "@playwright/test";
import base from "./playwright.focus-deck-review.config.ts";

export default defineConfig({ ...base, testMatch: "tests/canonical-tax.production.spec.ts",
  outputDir: "tmp/codex/canonical-tax-production" });

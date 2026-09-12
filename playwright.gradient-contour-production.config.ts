import { defineConfig } from "@playwright/test";
import base from "./playwright.gradient-contour-review.config.ts";
export default defineConfig({ ...base,
  testMatch: ["tests/gradient-contour-production.browser.spec.ts"],
  outputDir: "tmp/codex/gradient-contour-production" });

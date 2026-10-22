import { defineConfig } from "@playwright/test";
import base from "./playwright.matrix-interpretations.config.ts";
export default defineConfig({ ...base, testMatch: "matrix-authoring.browser.spec.ts",
  outputDir: "tmp/codex/matrix-authoring-review" });

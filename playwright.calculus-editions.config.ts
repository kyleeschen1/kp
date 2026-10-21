import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/calculus-editions.browser.spec.ts"],
  outputDir: "tmp/codex/calculus-editions-review" });

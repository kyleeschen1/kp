import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/algebra-whole-and-parts.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/algebra-whole-and-parts-review" });

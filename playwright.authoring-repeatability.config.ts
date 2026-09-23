import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/authoring-repeatability.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/authoring-repeatability-review" });

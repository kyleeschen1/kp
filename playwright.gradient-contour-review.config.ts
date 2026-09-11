import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
// Review is hosted by the existing shared server, never a second dev process.
export default defineConfig({ ...base, webServer: undefined,
  testMatch: "tests/gradient-contour.browser.spec.ts", use: { ...base.use, baseURL: "http://localhost:8000" },
  outputDir: "tmp/codex/gradient-contour-review" });

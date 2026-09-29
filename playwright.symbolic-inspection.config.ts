import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/symbolic-inspection.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:8000" },
  outputDir: "tmp/codex/symbolic-inspection-review"
});

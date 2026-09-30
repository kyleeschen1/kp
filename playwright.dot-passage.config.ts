import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/dot-product-passage.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:8000" },
  outputDir: "tmp/codex/dot-passage-review"
});

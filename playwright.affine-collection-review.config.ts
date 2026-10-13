import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
// The canonical reader and its source-authored variation share one review server.
export default defineConfig({ ...base, webServer: undefined, testMatch: "tests/affine-collection.browser.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:8000" }, outputDir: "tmp/codex/affine-collection-review" });

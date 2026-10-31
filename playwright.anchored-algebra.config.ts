import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

export default defineConfig({ ...base, testDir: "./tests", testMatch: "anchored-algebra.browser.spec.ts", testIgnore: [],
  use: { ...base.use, baseURL: "http://127.0.0.1:8012", viewport: { width: 1100, height: 1100 } },
  outputDir: "tmp/codex/anchored-algebra",
  webServer: { command: "npm run dev:client -- --host 127.0.0.1 --port 8012 --strictPort", url: "http://127.0.0.1:8012", reuseExistingServer: false, timeout: 120_000 }
});

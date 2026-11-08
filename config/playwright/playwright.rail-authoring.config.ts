import { defineConfig } from "@playwright/test";
import base from "../../playwright.config.ts";
export default defineConfig({ ...base,
  testMatch: ["tests/authored-rail-publication.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:8014" },
  webServer: { cwd: "../..", command: "npm run dev:client -- --host 127.0.0.1 --port 8014 --strictPort",
    url: "http://127.0.0.1:8014", reuseExistingServer: false, timeout: 120_000 },
  outputDir: "../../tmp/codex/rail-authoring-review" });

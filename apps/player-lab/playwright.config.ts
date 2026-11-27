import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../../tests",
  testMatch: "player-lane.browser.spec.ts",
  outputDir: "../../tmp/codex/player-lane-browser",
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:8013", viewport: { width: 1280, height: 900 } },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: { command: "npm run dev", url: "http://127.0.0.1:8013", reuseExistingServer: true, timeout: 30000 }
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/kp-dev-toolbar-*.browser.spec.ts",
  outputDir: "tmp/codex/playwright-economics-dev-toolbar",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    // This scope is explicitly for inspecting the long-lived review server.
    reuseExistingServer: true
  }
});

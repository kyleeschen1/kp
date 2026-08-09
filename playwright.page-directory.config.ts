import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/kp-dev-toolbar-page-directory.browser.spec.ts",
  outputDir: "tmp/codex/playwright-page-directory",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true
  }
});

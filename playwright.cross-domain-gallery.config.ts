import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/cross-domain-gallery.browser.spec.ts",
  outputDir: "tmp/codex/cross-domain-gallery-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4188",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:cross-domain-gallery-visual",
    url: "http://127.0.0.1:4188",
    reuseExistingServer: false
  }
});

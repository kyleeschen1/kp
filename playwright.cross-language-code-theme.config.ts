import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/cross-language-code-theme.browser.spec.ts",
  outputDir: "tmp/codex/cross-language-code-theme-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4185",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:cross-language-code-theme-visual",
    url: "http://127.0.0.1:4185",
    reuseExistingServer: false
  }
});

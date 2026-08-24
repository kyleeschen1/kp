import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/typescript-refactor-code-theme.browser.spec.ts",
  outputDir: "tmp/codex/code-theme-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4183",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:typescript-refactor-visual",
    url: "http://127.0.0.1:4183",
    reuseExistingServer: false
  }
});

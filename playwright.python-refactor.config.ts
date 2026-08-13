import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/python-refactor.browser.spec.ts",
  outputDir: "tmp/codex/python-refactor-results",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4184",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:python-refactor-visual",
    url: "http://127.0.0.1:4184",
    reuseExistingServer: false
  }
});

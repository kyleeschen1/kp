import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/internal-studio-entry.browser.spec.ts",
  outputDir: "tmp/codex/internal-studio-test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4191",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:internal-studio",
    url: "http://127.0.0.1:4191/studio/",
    reuseExistingServer: false
  }
});

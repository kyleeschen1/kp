import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/place-value-addition-*.browser.spec.ts",
  testIgnore: "**/.worktrees/**",
  outputDir: "tmp/codex/place-value-addition-test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  webServer: {
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

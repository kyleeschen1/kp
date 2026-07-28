import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.browser.spec.ts",
  // Local linked worktrees can contain their own Playwright install and specs.
  testIgnore: "**/.worktrees/**",
  outputDir: "tmp/codex/playwright-test-results",
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
    }
  ],
  webServer: {
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.browser.spec.ts",
  testIgnore: "**/.worktrees/**",
  outputDir: "tmp/codex/radical-reader-test-results",
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
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  webServer: {
    // Reader DEV pages mount the real review client, so this matrix must use
    // the paired browser-test API instead of a Vite-only server returning 404.
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

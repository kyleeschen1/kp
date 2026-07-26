import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.browser.spec.ts",
  testIgnore: "**/.worktrees/**",
  outputDir: "tmp/codex/radical-reader-test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:client -- --host 127.0.0.1 --port 4176",
    url: "http://127.0.0.1:4176",
    reuseExistingServer: false
  }
});

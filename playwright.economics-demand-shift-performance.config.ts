import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/economics-demand-shift-tutorial-performance.browser.spec.ts",
  outputDir: "tmp/codex/economics-demand-shift-performance-results",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run preview:economics-demand-shift-performance",
    url: "http://127.0.0.1:4176",
    reuseExistingServer: false
  }
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/graph-3d-saddle-parameter.browser.spec.ts",
  outputDir: "tmp/codex/graph-3d-saddle-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4187",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:graph-3d-saddle-visual",
    url: "http://127.0.0.1:4187",
    reuseExistingServer: false
  }
});

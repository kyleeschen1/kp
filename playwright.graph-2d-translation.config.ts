import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/graph-2d-quadratic-translation.browser.spec.ts",
  outputDir: "tmp/codex/graph-2d-translation-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4186",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:graph-2d-translation-visual",
    url: "http://127.0.0.1:4186",
    reuseExistingServer: false
  }
});

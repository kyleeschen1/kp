import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/canonical-animation-export-packaged.browser.spec.ts",
  outputDir: "tmp/codex/canonical-animation-export-packaged-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run preview:canonical-animation-review",
    url: "http://127.0.0.1:4175/canonical-animation-review.html",
    reuseExistingServer: false
  }
});

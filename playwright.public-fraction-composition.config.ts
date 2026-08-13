import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/fraction-composition-public.browser.spec.ts",
  outputDir: "tmp/codex/public-fraction-composition-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4193",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:public-fraction-composition",
    url: "http://127.0.0.1:4193/learn/math/fraction-composition/",
    reuseExistingServer: false
  }
});

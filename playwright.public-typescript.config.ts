import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/typescript-free-shipping-public.browser.spec.ts",
  outputDir: "tmp/codex/public-typescript-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4192",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run dev:public-typescript",
    url: "http://127.0.0.1:4192/learn/code/free-shipping/",
    reuseExistingServer: false
  }
});

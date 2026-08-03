import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/kp-lisp-tutorial-performance.browser.spec.ts",
  outputDir: "tmp/codex/botanical-lisp-performance-results",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4177",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  webServer: {
    command: "npm run preview:botanical-lisp-performance",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: false
  }
});

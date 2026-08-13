import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/typescript-refactor.browser.spec.ts",
  outputDir: "tmp/codex/typescript-refactor-results",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4183",
    trace: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }],
  // The focused visual checkpoint needs development review capture but not
  // the full API/watch supervisor, keeping file handles bounded in CI.
  webServer: {
    command: "npm run dev:typescript-refactor-visual",
    url: "http://127.0.0.1:4183",
    reuseExistingServer: false
  }
});

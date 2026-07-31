import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/canonical-animation-library-liveness.browser.spec.ts",
  outputDir: "tmp/codex/playwright-animation-library-live-results",
  timeout: 30_000,
  use: {
    // The ordinary browser config starts a clean Vite process. This config
    // deliberately probes the long-lived server used by the shared webview so
    // stale module-graph or host-lifecycle failures cannot hide behind it.
    baseURL: "http://127.0.0.1:8000",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});

import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Inherited configs may live below config/; paths keep their repository owner.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  testDir: projectRoot,
  testMatch: "**/*.browser.spec.ts",
  // Local linked worktrees can contain their own Playwright install and specs.
  testIgnore: "**/.worktrees/**",
  outputDir: fileURLToPath(new URL("tmp/codex/playwright-test-results", import.meta.url)),
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  webServer: {
    cwd: projectRoot,
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

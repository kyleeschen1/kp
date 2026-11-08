import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/typescript-refactor-code-theme.browser.spec.ts",
  outputDir: "../../tmp/codex/code-theme-results",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4183",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:typescript-refactor-visual",
    url: "http://127.0.0.1:4183",
    reuseExistingServer: false
  }
});

import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/python-refactor.browser.spec.ts",
  outputDir: "../../tmp/codex/python-refactor-results",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4184",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:python-refactor-visual",
    url: "http://127.0.0.1:4184",
    reuseExistingServer: false
  }
});

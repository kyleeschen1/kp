import { defineConfig } from "@playwright/test";
import { desktopProjects, nestedWorktreeIgnore, projectRoot } from "./config/playwright/shared.ts";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: projectRoot,
  testMatch: "**/*.browser.spec.ts",
  // Local linked worktrees can contain their own Playwright install and specs.
  testIgnore: nestedWorktreeIgnore,
  outputDir: fileURLToPath(new URL("tmp/codex/playwright-test-results", import.meta.url)),
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium", "firefox", "webkit"),
  webServer: {
    cwd: projectRoot,
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

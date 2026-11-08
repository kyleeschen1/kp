import { defineConfig } from "@playwright/test";
import { desktopProjects, nestedWorktreeIgnore } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/place-value-addition-*.browser.spec.ts",
  testIgnore: nestedWorktreeIgnore,
  outputDir: "../../tmp/codex/place-value-addition-test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium", "firefox", "webkit"),
  webServer: { cwd: "../..",
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

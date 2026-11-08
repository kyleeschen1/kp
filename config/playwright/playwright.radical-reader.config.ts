import { defineConfig } from "@playwright/test";
import { desktopProjects, nestedWorktreeIgnore } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "**/*.browser.spec.ts",
  testIgnore: nestedWorktreeIgnore,
  outputDir: "../../tmp/codex/radical-reader-test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium", "webkit"),
  webServer: { cwd: "../..",
    // Reader DEV pages mount the real review client, so this matrix must use
    // the paired browser-test API instead of a Vite-only server returning 404.
    command: "npm run dev:browser-test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

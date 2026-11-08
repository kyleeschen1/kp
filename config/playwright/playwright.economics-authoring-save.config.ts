import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/economics-authoring-save.browser.spec.ts",
  outputDir: "../../tmp/codex/playwright-economics-authoring-save",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4273",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:authoring-save-test",
    url: "http://127.0.0.1:4273",
    reuseExistingServer: false
  }
});

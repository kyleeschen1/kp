import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/canonical-animation-export-packaged.browser.spec.ts",
  outputDir: "../../tmp/codex/canonical-animation-export-packaged-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run preview:canonical-animation-review",
    url: "http://127.0.0.1:4175/canonical-animation-review.html",
    reuseExistingServer: false
  }
});

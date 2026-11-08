import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/normal-matrix-proof-public.browser.spec.ts",
  outputDir: "../../tmp/codex/public-normal-matrices-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4194",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:public-normal-matrices",
    url: "http://127.0.0.1:4194/learn/math/normal-matrices/",
    reuseExistingServer: false
  }
});

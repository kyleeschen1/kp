import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/eigenvector-attentional-surface-public.browser.spec.ts",
  outputDir: "../../tmp/codex/public-eigenvectors-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4195",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:public-eigenvectors",
    url: "http://127.0.0.1:4195/learn/math/eigenvectors/",
    reuseExistingServer: true
  }
});

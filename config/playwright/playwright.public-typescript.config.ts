import { defineConfig } from "@playwright/test";
import { desktopProjects } from "./shared.ts";

export default defineConfig({
  testDir: "../..",
  testMatch: "tests/typescript-free-shipping-public.browser.spec.ts",
  outputDir: "../../tmp/codex/public-typescript-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4192",
    trace: "retain-on-failure"
  },
  projects: desktopProjects("chromium"),
  webServer: { cwd: "../..",
    command: "npm run dev:public-typescript",
    url: "http://127.0.0.1:4192/learn/code/free-shipping/",
    reuseExistingServer: false
  }
});

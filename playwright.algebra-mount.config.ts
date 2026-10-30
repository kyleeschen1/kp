import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

// Isolate engine preservation from the workbench and shared review server.
export default defineConfig({
  ...base,
  testDir: "./tests",
  testMatch: "composed-algebra.browser.spec.ts",
  // The worktree itself has a .worktrees ancestor; discovery is already scoped.
  testIgnore: [],
  grep: /distribute-collect .*native stops|complete algebra native handoff|interrupted motion yields|composed authoring applies|composed remount|temporarily collapsed|both retained sources round-trip/,
  use: { ...base.use, baseURL: "http://127.0.0.1:8011" },
  outputDir: "tmp/codex/algebra-mount",
  webServer: {
    command: "npm run dev:client -- --host 127.0.0.1 --port 8011 --strictPort",
    url: "http://127.0.0.1:8011",
    reuseExistingServer: false,
    timeout: 120_000
  }
});

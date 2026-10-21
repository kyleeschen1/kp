import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({ ...base, webServer: undefined,
  // A scoped command must never discover duplicate specs in scratch worktrees.
  testDir: "./tests", testMatch: ["matrix-interpretations.browser.spec.ts", "matrix-player-lifecycle.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:8000" },
  outputDir: "tmp/codex/matrix-interpretations-review"
});

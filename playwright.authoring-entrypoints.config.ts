import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

// Exercise the real shared authoring hosts; never start a parallel test server.
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/authoring-market.browser.spec.ts", "tests/authoring-entrypoints.browser.spec.ts", "tests/reusable-reasoning.browser.spec.ts"],
  grep: /equation authoring|R4A|reasoning exemplar mounts canonical native ink|source edit reaches native ink/,
  outputDir: "tmp/codex/authoring-entrypoints-review",
  use: { ...base.use, baseURL: "http://localhost:8000" } });

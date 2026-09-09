import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

// Exercise the real shared authoring hosts; never start a parallel test server.
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ["tests/authoring-market.browser.spec.ts", "tests/authoring-entrypoints.browser.spec.ts", "tests/reusable-reasoning.browser.spec.ts", "tests/bayesian-reasoning.browser.spec.ts"],
  // Release coverage reuses owner regressions; no new choreography is approved here.
  grep: /equation authoring|R4A|reasoning exemplar mounts canonical native ink|source edit reaches native ink|code reasoning reuses visible motion|Bayes release: responsive preferences|Bayes author apply|Bayes quotient traverses|state-driven SVG preserves canonical|native KaTeX uses exact live values|combined checkpoint preserves keyboard|buttons visibly sample forward/,
  outputDir: "tmp/codex/authoring-entrypoints-review",
  use: { ...base.use, baseURL: "http://localhost:8000" } });

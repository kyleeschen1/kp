import { defineConfig } from "@playwright/test";
import base from "./playwright.algebra-mount.config.ts";

// Explicit before/after maintenance capture; regular preservation needs no
// disposable baseline and remains on the independent algebra-mount command.
export default defineConfig({ ...base, testMatch: "algebra-styles.maintenance.spec.ts",
  grep: /algebra stylesheet/, outputDir: "../../tmp/codex/algebra-style-captures" });

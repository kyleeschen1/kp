import { defineConfig } from "@playwright/test";
import base from "../../playwright.config.ts";
import isolated from "./playwright.algebra-mount.config.ts";
// Edition HTTP closure tests own ephemeral servers; the preview-route check
// uses the same isolated Vite owner as the algebra preservation suite.
export default defineConfig({ ...base, webServer: isolated.webServer, use: isolated.use, timeout: 120000,
  testMatch: ["tests/algebra-editions.browser.spec.ts"],
  outputDir: "../../tmp/codex/algebra-editions-review" });

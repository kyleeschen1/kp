import { defineConfig } from "@playwright/test";
import base from "../../playwright.config.ts";

// Keep the review tied to this checkout, independent of another agent's server.
export default defineConfig({
  ...base,
  testMatch: ["tests/project-vision.browser.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:8015" },
  webServer: {
    cwd: "../..",
    command: "npm run dev:client -- --host 127.0.0.1 --port 8015 --strictPort",
    url: "http://127.0.0.1:8015", reuseExistingServer: false, timeout: 120_000
  },
  outputDir: "../../tmp/codex/project-vision-review"
});

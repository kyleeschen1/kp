import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

export default defineConfig({
  ...base,
  // Keep built-delivery checks out of the development-server default suite.
  testMatch: "tests/semantic-reader.production.spec.ts",
  webServer: {
    command: "npm run preview:reader-production",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

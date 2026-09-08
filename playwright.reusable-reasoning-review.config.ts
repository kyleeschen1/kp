import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

// The checkpoint must verify the URL we give the human, not just an isolated
// test server. This opt-in command never starts a second persistent server.
export default defineConfig({ ...base, webServer: undefined,
  testMatch: "tests/reusable-reasoning.browser.spec.ts",
  use: { ...base.use, baseURL: "http://localhost:8000" } });

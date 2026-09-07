import { defineConfig } from "@playwright/test";
import base from "./playwright.reader-production.config.ts";

export default defineConfig({ ...base, testMatch: "tests/canonical-tax.production.spec.ts" });

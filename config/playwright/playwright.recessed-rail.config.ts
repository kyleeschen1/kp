import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
// Retain the scoped command as the regression entrypoint for the reset.
export default defineConfig({ ...base, testMatch: ['fraction-ridge.browser.spec.ts'], timeout: 90000,
  outputDir: '../../tmp/codex/fraction-ridge' });

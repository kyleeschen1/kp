import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['matrix-reference.browser.spec.ts'], timeout: 60000,
  outputDir: '../../tmp/codex/matrix-reference-review' });

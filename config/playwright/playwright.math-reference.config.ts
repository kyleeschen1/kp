import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['math-reference.browser.spec.ts'], timeout: 90000,
  outputDir: '../../tmp/codex/math-reference-review' });

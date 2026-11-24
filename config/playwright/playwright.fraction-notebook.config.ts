import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['fraction-notebook.browser.spec.ts'], timeout: 60000,
  outputDir: '../../tmp/codex/fraction-notebook-review' });

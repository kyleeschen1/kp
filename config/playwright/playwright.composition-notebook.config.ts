import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['composition-notebook.browser.spec.ts', 'composition-area.browser.spec.ts'], timeout: 60000,
  outputDir: '../../tmp/codex/composition-notebook-review' });

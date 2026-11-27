import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['projection-notebook.browser.spec.ts', 'inner-product-projection.browser.spec.ts'], timeout: 60000,
  outputDir: '../../tmp/codex/projection-notebook-review' });

import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['inner-product-projection.browser.spec.ts'], timeout: 45000,
  outputDir: '../../tmp/codex/inner-product-projection-review' });

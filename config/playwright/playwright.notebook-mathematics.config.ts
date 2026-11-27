import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['notebook-mathematics.browser.spec.ts', 'notebook-mathematics-matrix.browser.spec.ts', 'matrix-reuse.browser.spec.ts'], timeout: 60000,
  outputDir: '../../tmp/codex/notebook-mathematics-review' });

import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['fraction-notebook-object.browser.spec.ts'], timeout: 90000,
  use: { ...base.use, baseURL: 'http://127.0.0.1:1426', viewport: { width: 1600, height: 1000 } },
  outputDir: '../../tmp/codex/workbench-object-review' });

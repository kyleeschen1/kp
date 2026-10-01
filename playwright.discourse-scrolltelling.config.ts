import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';
export default defineConfig({ ...base, webServer: undefined,
  testMatch: ['tests/discourse-scrolltelling.browser.spec.ts'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:8000' },
  outputDir: 'tmp/codex/discourse-scrolltelling-review',
});

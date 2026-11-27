import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['circle-trig.browser.spec.ts'], timeout: 45000,
  outputDir: '../../tmp/codex/circle-trig-review' });

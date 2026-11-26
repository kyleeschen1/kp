import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['fraction-flow.browser.spec.ts'], timeout: 90000,
  outputDir: '../../tmp/codex/fraction-flow' });

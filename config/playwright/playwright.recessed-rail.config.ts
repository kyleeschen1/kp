import { defineConfig } from '@playwright/test';
import base from './playwright.matrix-interpretations.config.ts';
export default defineConfig({ ...base, testMatch: ['recessed-rail.browser.spec.ts', 'frame-exchange.browser.spec.ts'], timeout: 90000,
  outputDir: '../../tmp/codex/recessed-rail' });

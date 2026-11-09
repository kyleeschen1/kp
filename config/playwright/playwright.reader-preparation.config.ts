import { defineConfig } from '@playwright/test';
import base from './playwright.anchored-algebra.config.ts';

export default defineConfig({ ...base, testMatch: 'reader-preparation.browser.spec.ts',
  outputDir: '../../tmp/codex/reader-preparation' });

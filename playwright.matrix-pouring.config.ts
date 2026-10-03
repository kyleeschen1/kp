import { defineConfig } from '@playwright/test';
import base from './playwright.rectangular-product.config.ts';
export default defineConfig({ ...base, testMatch: ['tests/matrix-pouring.browser.spec.ts'], outputDir: 'tmp/codex/matrix-pouring-review' });

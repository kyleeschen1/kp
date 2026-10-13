import { defineConfig } from '@playwright/test';
import base from './playwright.rectangular-product.config.ts';
export default defineConfig({ ...base, testMatch: ['tests/row-operation.browser.spec.ts', 'tests/row-workbench.browser.spec.ts'], outputDir: 'tmp/codex/row-operation-review' });

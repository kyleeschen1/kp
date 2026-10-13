import { defineConfig } from '@playwright/test';
import base from './playwright.rectangular-product.config.ts';
export default defineConfig({ ...base, testMatch: ['tests/row-operation.browser.spec.ts', 'tests/row-workbench.browser.spec.ts', 'tests/row-authored.browser.spec.ts', 'tests/row-equations.browser.spec.ts', 'tests/row-composition.browser.spec.ts', 'tests/systems-explorer.browser.spec.ts'], outputDir: 'tmp/codex/row-operation-review' });

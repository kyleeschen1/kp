import { defineConfig } from '@playwright/test';
import base from '../../playwright.config.ts';

export default defineConfig({ ...base, webServer: undefined,
  testDir: '../../tests', testMatch: ['interaction-lane.browser.spec.ts', 'mathematics-lane.browser.spec.ts', 'player-lane.browser.spec.ts'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:8011' },
  outputDir: '../../tmp/codex/library-lanes-review'
});

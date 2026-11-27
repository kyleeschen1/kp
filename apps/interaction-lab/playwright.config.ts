import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: '../../tests', testMatch: 'interaction-lane.browser.spec.ts',
  outputDir: '../../tmp/codex/interaction-lane-browser', reporter: 'list', workers: 1,
  use: { browserName: 'chromium', headless: true, viewport: { width: 1100, height: 800 } },
  webServer: {
    command: 'npm run dev', cwd: fileURLToPath(new URL('.', import.meta.url)),
    url: 'http://127.0.0.1:8011/', reuseExistingServer: false, timeout: 30000
  }
});

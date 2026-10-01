import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: ['semantic-cost.browser.spec.ts'], timeout: 120000,
  workers: 1, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4196', viewport: { width: 1200, height: 950 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  outputDir: 'tmp/codex/semantic-cost/browser',
  webServer: { command: 'npm run serve:semantic-cost', url: 'http://127.0.0.1:4196/experiments/dot-product-passage/', reuseExistingServer: false },
});

import { defineConfig } from '@playwright/test';
import base from './playwright.editor-chat.config.ts';
export default defineConfig({ ...base, grep: /Vim coverage/, outputDir: '../../tmp/codex/vim-coverage-review' });

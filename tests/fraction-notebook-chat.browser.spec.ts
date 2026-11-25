import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { basename } from 'node:path';
import { ChatService } from '../server/chat/service.ts';
import { chatHttp } from '../server/chat/http.ts';
import { ChatPeer, MemoryChatStore } from './fixtures/editor-chat.ts';
import { readChatSnapshot } from '../src/editor-chat/protocol.ts';

const url = '/experiments/fraction-notebook/';
async function fixture(context: BrowserContext) {
  const peer = new ChatPeer(), store = new MemoryChatStore();
  let service = new ChatService(store, peer.factory, process.cwd());
  // Exercise real HTTP/validation/recovery, replacing only the native RPC peer.
  const server = createServer((req, res) => { void chatHttp(service)(req, res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Fixture address missing');
  const backend = `http://127.0.0.1:${address.port}`;
  await context.route('**/api/dev/chat', async route => {
    const headers = { ...route.request().headers(), host: `127.0.0.1:${address.port}`, origin: backend };
    const response = await route.fetch({ url: backend, headers, timeout: 15000 }); await route.fulfill({ response });
  });
  return { peer, store,
    async restart() { await service.close(); service = new ChatService(store, peer.factory, process.cwd()); },
    async close() { await context.unrouteAll({ behavior: 'wait' }); await service.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
  };
}
async function open(page: Page) {
  await page.goto(url); await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const toggle = page.getByRole('button', { name: 'Chat', exact: true });
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await expect(page.getByRole('textbox', { name: 'Your message' })).toBeEnabled();
}
async function connect(page: Page) { await page.getByRole('button', { name: 'Connect', exact: true }).click(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready'); }
const input = (page: Page) => page.getByRole('textbox', { name: 'Your message' });
const send = (page: Page) => page.getByRole('button', { name: 'Send', exact: true });

test('conversation streams, survives panel close/reload/server restart, and preserves the native reader', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 960 }); await open(page);
    const frame = page.frameLocator('iframe'); await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
    const stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
    await connect(page); await input(page).fill('Help me keep our broader plan in view.'); await send(page).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    f.peer.delta('We are working on persistent conversation.'); await expect(page.locator('.kp-chat-history')).toContainText('persistent conversation');
    await page.getByRole('button', { name: 'Close chat' }).click(); expect(await stage?.evaluate(node => node.isConnected)).toBe(true);
    f.peer.finish('We are working on persistent conversation. The notebook and animation remain separate.');
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await input(page).fill('A saved follow-up'); await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.reload(); await expect(input(page)).toHaveValue('A saved follow-up');
    await expect(page.locator('.kp-chat-history')).toContainText('The notebook and animation remain separate.');
    await f.restart(); await page.reload(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'disconnected');
    await page.getByRole('button', { name: 'Resume conversation' }).click(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    expect(f.peer.sends()).toHaveLength(1); await expect(input(page)).toHaveValue('A saved follow-up');
    await page.screenshot({ path: info.outputPath('chat-desktop.png') });
    await page.getByRole('button', { name: 'Styles', exact: true }).click();
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
    await page.getByRole('button', { name: 'Close styles' }).click();
    await expect(page.locator('.kp-chat')).toHaveCSS('background-color', await page.locator('.ProseMirror').evaluate(node => getComputedStyle(node.closest('.fn-left')!).backgroundColor));
    await expect(page.locator('.kp-chat')).toHaveCSS('font-family', await page.locator('.ProseMirror').evaluate(node => getComputedStyle(node).fontFamily));
    await page.screenshot({ path: info.outputPath('chat-light.png') }); expect(errors).toEqual([]);
  } finally { await f.close(); }
});
test('typing while Send waits preserves the next draft and interrupt ends the current turn', async ({ page, context }) => {
  const f = await fixture(context); let release!: () => void;
  try {
    await open(page); await connect(page); f.peer.nextSend = () => new Promise<void>(resolve => { release = resolve; });
    await input(page).pressSequentially('First message'); await input(page).press('ControlOrMeta+Enter');
    await expect.poll(() => f.peer.sends().length).toBe(1);
    await input(page).fill('Next draft, typed before acknowledgement'); release();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    await expect(input(page)).toHaveValue('Next draft, typed before acknowledgement');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.getByRole('button', { name: 'Interrupt', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await page.reload(); await expect(input(page)).toHaveValue('Next draft, typed before acknowledgement');
    expect(f.peer.sends()).toHaveLength(1);
  } finally { release?.(); await f.close(); }
});
test('uncertain delivery stays unsent across reconnect until the author explicitly reviews it', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await open(page); await connect(page);
    f.peer.nextSend = async () => { throw new Error('Fixture connection dropped before acknowledgement'); };
    await input(page).fill('Keep this message'); await send(page).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'uncertain');
    await expect(input(page)).toHaveValue('Keep this message'); await expect(send(page)).toBeDisabled();
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await page.getByRole('button', { name: 'Resume conversation' }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'uncertain'); expect(f.peer.sends()).toHaveLength(1);
    await page.screenshot({ path: info.outputPath('chat-uncertain.png') });
    await page.getByRole('button', { name: 'I checked; keep draft unsent' }).click(); await expect(send(page)).toBeEnabled();
    expect(f.peer.sends()).toHaveLength(1);
  } finally { await f.close(); }
});
test('two tabs retain competing drafts instead of overwriting; the author can load the saved copy', async ({ page, context }) => {
  const f = await fixture(context), second = await context.newPage();
  try {
    await open(page); await open(second);
    // Queue both edits inside the autosave window, before either tab sees a new revision.
    await Promise.all([input(page).fill('Draft from one tab'), input(second).fill('Draft from another tab')]);
    await expect.poll(async () => (await page.locator('.kp-chat-save').textContent())?.includes('conflict') || (await second.locator('.kp-chat-save').textContent())?.includes('conflict')).toBe(true);
    const conflicted = (await page.locator('.kp-chat-save').textContent())?.includes('conflict') ? page : second;
    const retained = await input(conflicted).inputValue(); await conflicted.waitForTimeout(800);
    await expect(input(conflicted)).toHaveValue(retained); expect(f.store.data.draft).not.toBe(retained);
    conflicted.once('dialog', dialog => dialog.accept()); await conflicted.getByRole('button', { name: 'Load saved draft' }).click();
    await expect(input(conflicted)).toHaveValue(f.store.data.draft);
  } finally { await second.close(); await f.close(); }
});
test('phone keeps chat controls usable and saved draft recovery never auto-sends', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => sessionStorage.setItem('kp.editor-chat.unsaved.v1', JSON.stringify({ text: 'Recovered local thought', revision: 0, threadId: null })));
    await open(page); await expect(input(page)).toHaveValue('Recovered local thought');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project'); expect(f.peer.sends()).toHaveLength(0);
    const bounds = await input(page).boundingBox(); expect(bounds).not.toBeNull(); expect(bounds!.y + bounds!.height).toBeLessThan(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('chat-phone.png') });
  } finally { await f.close(); }
});
test('live dev server keeps chat recovery files private', async ({ request }) => {
  const live = await request.get('/api/dev/chat'); expect(live.status()).toBe(200);
  expect(readChatSnapshot(await live.json()).project).toBe(basename(process.cwd()));
  for (const path of ['/.kp/chat/conversation.json', '/.kp/chat/owner.json', '/%2Ekp/chat/conversation.json', `/@fs${process.cwd()}/.kp/chat/conversation.json`]) {
    expect((await request.get(path)).status(), path).toBe(403);
  }
});

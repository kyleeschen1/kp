import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { basename } from 'node:path';
import { ChatService } from '../server/chat/service.ts';
import { chatHttp } from '../server/chat/http.ts';
import { ChatPeer, MemoryChatStore } from './fixtures/editor-chat.ts';
import { readChatSnapshot } from '../src/editor-chat/protocol.ts';
import { passageTarget } from '../src/editor-chat/annotation-target.ts';

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
async function write(page: Page, text: string) {
  const editor = input(page); await editor.focus();
  if (await editor.getAttribute('data-vim-mode') !== 'insert') await editor.press('i');
  await editor.fill(text);
}
const send = (page: Page) => page.getByRole('button', { name: 'Send', exact: true });
async function selectPassage(page: Page, text: string) {
  await page.locator('.kp-chat-message .kp-chat-text').last().evaluate((root, phrase) => {
    root.closest<HTMLElement>('[role=textbox]')!.focus();
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let current: Node | null;
    while ((current = walk.nextNode())) {
      const offset = current.textContent?.indexOf(phrase) ?? -1;
      if (offset < 0) continue;
      const range = document.createRange(); range.setStart(current, offset); range.setEnd(current, offset + phrase.length);
      const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange')); return;
    }
    throw new Error(`Passage not found: ${phrase}`);
  }, text);
  await expect(page.getByRole('button', { name: 'Comment selection', exact: true })).toBeEnabled();
}

test('rich composer and transcript support passage comments, tags and notes across reload without changing model history', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 }); await open(page); await connect(page);
    await expect(input(page)).toHaveAttribute('data-vim-mode', 'normal');
    await page.locator('.kp-rich-composer').getByRole('button', { name: 'Markdown', exact: true }).click();
    const source = page.getByRole('textbox', { name: 'Your message Markdown' });
    await source.press('i'); await source.fill('Please keep the **broader plan** visible.\n\n- Preserve context\n- Let me take notes');
    await page.locator('.kp-rich-composer').getByRole('button', { name: 'Rich text', exact: true }).click();
    await expect(input(page).locator('strong')).toHaveText('broader plan'); await expect(input(page).locator('li')).toHaveCount(2);
    expect(errors).toEqual([]);
    await expect.poll(() => f.store.data.draft).toContain('broader plan');
    await send(page).click(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    f.peer.finish('## Where we are\n\nKeep the **broader plan** visible while exploring.\n\n```js\nconst next = "notes";\n```\n\n[Reference](https://example.com)\n\nAn inline $x^2$ and a fraction:\n\n$$\\frac{1}{2}$$');
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await expect(page.locator('.kp-chat-message').last().locator('h2')).toHaveText('Where we are');
    await expect(page.locator('.kp-chat-message').last().locator('pre')).toContainText('const next');
    await expect(page.locator('.kp-chat-message').last().locator('.katex')).toHaveCount(2);
    const history = JSON.stringify(f.store.data.messages);
    await selectPassage(page, 'broader plan');
    const transcript = page.getByRole('textbox', { name: 'Conversation transcript' });
    await transcript.press('ControlOrMeta+b'); await transcript.press('x');
    await expect(page.locator('.kp-chat-message').last().locator('strong')).toHaveText('broader plan');
    await page.getByRole('button', { name: 'Comment selection', exact: true }).click();
    const note = page.getByRole('textbox', { name: 'Note text', exact: true });
    await note.press('i'); await note.fill('Return here after the detour.');
    await page.getByRole('textbox', { name: 'Note tags' }).fill('orientation, return-path');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(page.locator('.kp-note-card')).toHaveCount(1); await expect(page.locator('.kp-note-card')).toContainText('#orientation');
    await page.getByRole('button', { name: 'Show passage', exact: true }).click();
    await expect(page.locator('.kp-chat-highlight')).toContainText('broader plan');
    await page.screenshot({ path: info.outputPath('rich-chat-annotated.png') });
    await selectPassage(page, 'visible while exploring.'); await page.getByRole('button', { name: 'Tag selection', exact: true }).click();
    await page.getByRole('textbox', { name: 'Note tags' }).fill('exploration'); await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await page.getByRole('button', { name: 'Add note', exact: true }).click();
    await note.press('i'); await note.fill('A small independent conversation note.'); await note.press('ControlOrMeta+Enter');
    await expect(page.locator('.kp-note-card')).toHaveCount(3);
    await page.screenshot({ path: info.outputPath('rich-chat-notes.png') });
    expect(JSON.stringify(f.store.data.messages)).toBe(history); expect(f.peer.sends()).toHaveLength(1);
    await page.reload(); await page.getByRole('button', { name: 'Notes (3)', exact: true }).click();
    await expect(page.locator('.kp-note-card')).toHaveCount(3);
    await page.getByRole('searchbox', { name: 'Find notes and tags' }).fill('#orientation'); await expect(page.locator('.kp-note-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Show passage', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Comment selection', exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
  } finally { await f.close(); }
});
test('note and composer Vim state stay independent and unsaved notes recover without sending', async ({ page, context }) => {
  const f = await fixture(context);
  try {
    await open(page); await write(page, 'Composer stays here');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.getByRole('button', { name: 'Add note', exact: true }).click();
    const note = page.getByRole('textbox', { name: 'Note text', exact: true });
    await expect(note).toHaveAttribute('data-vim-mode', 'normal'); await note.press('i'); await note.fill('Unfinished observation'); await note.press('Escape');
    await expect(note).toHaveAttribute('data-vim-mode', 'normal'); await expect(page.locator('.kp-rich-composer .ProseMirror')).toHaveAttribute('data-vim-mode', 'insert');
    await note.press(':'); await page.getByRole('textbox', { name: 'Note text command' }).fill('h'); await page.getByRole('textbox', { name: 'Note text command' }).press('Enter');
    await expect(page.locator('.kp-rich-comment .kp-rich-help')).toBeVisible(); await expect(page.locator('.fn-help')).toBeHidden();
    await page.reload(); await page.getByRole('button', { name: /Notes \(0\)/ }).click();
    await expect(note).toHaveText('Unfinished observation'); await expect(page.locator('.kp-rich-composer .ProseMirror')).toHaveText('Composer stays here');
    await page.getByRole('button', { name: 'Save note', exact: true }).click(); await expect(page.locator('.kp-note-card')).toHaveCount(1);
    expect(f.peer.sends()).toHaveLength(0);
  } finally { await f.close(); }
});
test('changed and unavailable comment targets retain their quotation; note conflicts retain the losing local edit', async ({ page, context }) => {
  const f = await fixture(context), second = await context.newPage();
  const message = { id: 'answer-1', role: 'assistant' as const, complete: true, clipped: false, text: 'Original target phrase.' };
  f.store.data = { ...f.store.data, threadId: 'thread-1', messages: [{ ...message, text: 'A completely changed response.' }],
    annotations: [{ id: 'comment-1', revision: 1, archived: false, target: passageTarget('thread-1', message, 1, 9), body: 'Keep this comment.', tags: ['review'] }] };
  try {
    await open(page); await open(second);
    for (const tab of [page, second]) {
      await tab.getByRole('button', { name: 'Notes (1)', exact: true }).click();
      await expect(tab.locator('.kp-note-card')).toContainText('Passage changed');
      await expect(tab.locator('.kp-note-card .kp-note-quote')).toHaveText('Original');
      await tab.getByRole('button', { name: 'Edit note', exact: true }).click();
      const note = tab.getByRole('textbox', { name: 'Note text', exact: true }); await note.press('i'); await note.fill(tab === page ? 'First tab revision' : 'Keep second tab revision');
    }
    await page.getByRole('button', { name: 'Save note', exact: true }).click(); await expect(page.locator('.kp-note-form')).toBeHidden();
    await expect(second.locator('.kp-note-form')).toContainText('Note conflict');
    await expect(second.getByRole('textbox', { name: 'Note text', exact: true })).toHaveText('Keep second tab revision');
    expect(f.store.data.annotations[0]?.body).toBe('First tab revision'); expect(f.peer.sends()).toHaveLength(0);
  } finally { await second.close(); await f.close(); }
});

test('conversation streams, survives panel close/reload/server restart, and preserves the native reader', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 960 }); await open(page);
    const frame = page.frameLocator('iframe'); await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
    const stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
    await connect(page); await write(page, 'Help me keep our broader plan in view.'); await send(page).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    f.peer.delta('We are working on persistent conversation.'); await expect(page.locator('.kp-chat-history')).toContainText('persistent conversation');
    await page.getByRole('button', { name: 'Close chat' }).click(); expect(await stage?.evaluate(node => node.isConnected)).toBe(true);
    f.peer.finish('We are working on persistent conversation. The notebook and animation remain separate.');
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await write(page, 'A saved follow-up'); await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.reload(); await expect(input(page)).toHaveText('A saved follow-up');
    await expect(page.locator('.kp-chat-history')).toContainText('The notebook and animation remain separate.');
    await f.restart(); await page.reload(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'disconnected');
    await page.getByRole('button', { name: 'Resume conversation' }).click(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    expect(f.peer.sends()).toHaveLength(1); await expect(input(page)).toHaveText('A saved follow-up');
    await page.screenshot({ path: info.outputPath('chat-desktop.png') });
    await page.getByRole('button', { name: 'Styles', exact: true }).click();
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
    await page.getByRole('button', { name: 'Close styles' }).click();
    await expect(page.locator('.kp-chat')).toHaveCSS('background-color', await page.locator('.fn-editor .ProseMirror').evaluate(node => getComputedStyle(node.closest('.fn-left')!).backgroundColor));
    await expect(page.locator('.kp-chat')).toHaveCSS('font-family', await page.locator('.fn-editor .ProseMirror').evaluate(node => getComputedStyle(node).fontFamily));
    await page.screenshot({ path: info.outputPath('chat-light.png') }); expect(errors).toEqual([]);
  } finally { await f.close(); }
});
test('typing while Send waits preserves the next draft and interrupt ends the current turn', async ({ page, context }) => {
  const f = await fixture(context); let release!: () => void;
  try {
    await open(page); await connect(page); f.peer.nextSend = () => new Promise<void>(resolve => { release = resolve; });
    await input(page).press('i'); await input(page).pressSequentially('First message'); await input(page).press('ControlOrMeta+Enter');
    await expect.poll(() => f.peer.sends().length).toBe(1);
    await write(page, 'Next draft, typed before acknowledgement'); release();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    await expect(input(page)).toHaveText('Next draft, typed before acknowledgement');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.getByRole('button', { name: 'Interrupt', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await page.reload(); await expect(input(page)).toHaveText('Next draft, typed before acknowledgement');
    expect(f.peer.sends()).toHaveLength(1);
  } finally { release?.(); await f.close(); }
});
test('uncertain delivery stays unsent across reconnect until the author explicitly reviews it', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await open(page); await connect(page);
    f.peer.nextSend = async () => { throw new Error('Fixture connection dropped before acknowledgement'); };
    await write(page, 'Keep this message'); await send(page).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'uncertain');
    await expect(input(page)).toHaveText('Keep this message'); await expect(send(page)).toBeDisabled();
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
    await Promise.all([write(page, 'Draft from one tab'), write(second, 'Draft from another tab')]);
    await expect.poll(async () => (await page.locator('.kp-chat-save').textContent())?.includes('conflict') || (await second.locator('.kp-chat-save').textContent())?.includes('conflict')).toBe(true);
    const conflicted = (await page.locator('.kp-chat-save').textContent())?.includes('conflict') ? page : second;
    const retained = await input(conflicted).textContent(); await conflicted.waitForTimeout(800);
    await expect(input(conflicted)).toHaveText(retained!); expect(f.store.data.draft).not.toBe(retained);
    conflicted.once('dialog', dialog => dialog.accept()); await conflicted.getByRole('button', { name: 'Load saved draft' }).click();
    await expect(input(conflicted)).toHaveText(f.store.data.draft);
  } finally { await second.close(); await f.close(); }
});
test('phone keeps chat controls usable and saved draft recovery never auto-sends', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => sessionStorage.setItem('kp.editor-chat.unsaved.v1', JSON.stringify({ text: 'Recovered local thought', revision: 0, threadId: null })));
    await open(page); await expect(input(page)).toHaveText('Recovered local thought');
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

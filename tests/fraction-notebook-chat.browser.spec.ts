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
  await expect(page.locator('.kp-chat')).not.toHaveAttribute('data-phase', 'loading');
  await page.getByRole('textbox', { name: 'Conversation transcript' }).focus();
}
async function command(page: Page, label: string) {
  const menu = page.getByRole('dialog', { name: 'Chat commands' });
  if (await menu.isVisible()) await page.keyboard.press('Escape');
  if (!await page.locator('.kp-chat').evaluate(panel => panel.contains(document.activeElement))) await page.locator('.kp-chat input:visible, .kp-chat [role=textbox]:visible').first().focus();
  await page.keyboard.press('Control+c');
  await expect(menu).toBeVisible();
  await menu.getByRole('button', { name: label, exact: true }).click();
  // A form acknowledgement may close the dialog between these observations.
  // Its DOM persists, so inspecting the title must not wait for visible role.
  if (await menu.isVisible() && await page.locator('.kp-chat-transient .kp-transient-heading strong').textContent() === 'Commands') await page.keyboard.press('Escape');
}
async function connect(page: Page) { await command(page, 'Connect'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready'); }
const input = (page: Page) => page.locator('.kp-rich-composer .ProseMirror');
async function write(page: Page, text: string) {
  const editor = input(page);
  if (!await editor.isVisible()) await page.getByRole('textbox', { name: 'Conversation transcript' }).press('i');
  await editor.focus();
  if (await editor.getAttribute('data-vim-mode') !== 'insert') await editor.press('i');
  await editor.fill(text);
}
async function send(page: Page) { await input(page).press('ControlOrMeta+Enter'); }
async function selectPassage(page: Page, text: string, message?: string) {
  await (message ? page.locator(`[data-message-id="${message}"] .kp-chat-text`) : page.locator('.kp-chat-message .kp-chat-text').last()).evaluate((root, phrase) => {
    root.closest<HTMLElement>('[role=textbox]')!.focus();
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let current: Node | null;
    while ((current = walk.nextNode())) {
      const offset = current.textContent?.indexOf(phrase) ?? -1;
      if (offset < 0) continue;
      current.parentElement?.scrollIntoView({ block: 'center' });
      const range = document.createRange(); range.setStart(current, offset); range.setEnd(current, offset + phrase.length);
      const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange')); return;
    }
    throw new Error(`Passage not found: ${phrase}`);
  }, text);
  await page.keyboard.press('Control+c');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Comment selection', exact: true })).toBeEnabled();
  await page.keyboard.press('Escape');
}

test('rich composer and transcript support passage comments, tags and notes across reload without changing model history', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 }); await open(page); await connect(page);
    await expect(page.getByRole('textbox', { name: 'Conversation transcript' })).toHaveAttribute('data-vim-mode', 'normal');
    await command(page, 'Markdown source');
    const source = page.getByRole('textbox', { name: 'Your message Markdown' });
    await source.press('i'); await source.fill('Please keep the **broader plan** visible.\n\n- Preserve context\n- Let me take notes');
    await command(page, 'Rich text');
    await expect(input(page).locator('strong')).toHaveText('broader plan'); await expect(input(page).locator('li')).toHaveCount(2);
    expect(errors).toEqual([]);
    await expect.poll(() => f.store.data.draft).toContain('broader plan');
    await send(page); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.kp-chat-draft')).toBeVisible();
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
    await command(page, 'Comment selection');
    const note = page.getByRole('textbox', { name: 'Note text', exact: true });
    await note.press('i'); await note.fill('Return here after the detour.');
    await page.getByRole('textbox', { name: 'Note tags' }).fill('orientation, return-path');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(page.locator('.kp-note-card')).toHaveCount(1); await expect(page.locator('.kp-note-card')).toContainText('#orientation');
    await page.getByRole('button', { name: 'Show passage', exact: true }).click();
    await expect(page.locator('.kp-chat-highlight')).toContainText('broader plan');
    await page.screenshot({ path: info.outputPath('rich-chat-annotated.png') });
    await selectPassage(page, 'visible while exploring.'); await command(page, 'Tag selection');
    await page.getByRole('textbox', { name: 'Note tags' }).fill('exploration'); await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await command(page, 'New note');
    await note.press('i'); await note.fill('A small independent conversation note.'); await note.press('ControlOrMeta+Enter');
    await expect(page.locator('.kp-note-card')).toHaveCount(3);
    await expect(page.locator('.kp-chat-draft')).toBeVisible();
    await page.screenshot({ path: info.outputPath('rich-chat-notes.png') });
    expect(JSON.stringify(f.store.data.messages)).toBe(history); expect(f.peer.sends()).toHaveLength(1);
    await page.reload(); await command(page, 'Open notes');
    await expect(page.locator('.kp-note-card')).toHaveCount(3);
    await expect(page.locator('.kp-chat-draft')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Find notes and tags' }).fill('#orientation'); await expect(page.locator('.kp-note-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Show passage', exact: true }).click();
    await page.keyboard.press('Control+c'); await expect(page.getByRole('dialog').getByRole('button', { name: 'Comment selection', exact: true })).toBeEnabled(); await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  } finally { await f.close(); }
});

test('quiet reading retains the passage and independent draft caret through Insert, Escape and a sticky transient', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  f.peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: '# An explanation\n\nThe original passage stays here.\n\n' + Array.from({ length: 20 }, (_, i) => `Paragraph ${i}: keep a place while reading.`).join('\n\n') }] }];
  try {
    await page.setViewportSize({ width: 1440, height: 960 }); await open(page); await connect(page);
    const transcript = page.getByRole('textbox', { name: 'Conversation transcript' });
    await expect(page.locator('.kp-chat-draft')).toBeVisible(); await expect(page.locator('.kp-chat-heading')).toHaveCount(0);
    await expect(page.locator('.kp-chat button:visible')).toHaveCount(0);
    await selectPassage(page, 'original passage', 'reply-1');
    const before = await page.locator('.kp-chat-history').evaluate(node => node.scrollTop);
    const geometry = () => page.locator('.kp-chat-history').evaluate(node => ({ top: node.scrollTop, height: node.scrollHeight, viewport: node.clientHeight,
      rectTop: node.getBoundingClientRect().top, firstTop: node.querySelector('[data-message-id]')?.getBoundingClientRect().top,
      status: node.parentElement?.querySelector('.kp-chat-status')?.textContent,
      view: localStorage.getItem('kp.chat-view.v1:kp-product:main') }));
    const beforeGeometry = await geometry();
    await transcript.press('i'); const insertGeometry = await geometry();
    await input(page).pressSequentially('before after'); await input(page).press('ArrowLeft'); await input(page).press('ArrowLeft');
    await input(page).press('Escape'); await expect(page.locator('.kp-chat-draft')).toBeVisible();
    await expect(transcript).toBeFocused(); expect(await page.evaluate(() => getSelection()?.toString())).toBe('original passage');
    expect(Math.abs(await page.locator('.kp-chat-history').evaluate(node => node.scrollTop) - before), JSON.stringify({ beforeGeometry, insertGeometry, afterGeometry: await geometry() })).toBeLessThan(3);
    expect((await geometry()).viewport).toBe(beforeGeometry.viewport);
    await transcript.press('i'); await input(page).pressSequentially('X'); await expect(input(page)).toHaveText('before aftXer');
    await page.keyboard.press('Control+c'); const menu = page.getByRole('dialog', { name: 'Chat commands' });
    await expect(menu).toBeVisible(); await page.keyboard.press('h'); await expect(menu).toContainText('Keybindings');
    await page.keyboard.press('Backspace'); await expect(menu.locator('.kp-transient-heading strong')).toHaveText('Commands');
    await page.keyboard.press('Escape'); await expect(input(page)).toBeFocused();
    await input(page).press('Escape'); await page.screenshot({ path: info.outputPath('keyboard-chat-reading.png') });
    await transcript.press('i'); await page.screenshot({ path: info.outputPath('keyboard-chat-draft.png') });
    await page.keyboard.press('Control+c'); await page.screenshot({ path: info.outputPath('keyboard-chat-commands.png') });
    expect(f.peer.sends()).toHaveLength(0); expect(errors).toEqual([]);
  } finally { await f.close(); }
});

test('streaming preserves an older reading position and search dismissal restores context', async ({ page, context }) => {
  const f = await fixture(context);
  f.peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: Array.from({ length: 36 }, (_, i) => `Paragraph ${i}. An older mathematical observation.`).join('\n\n') }] }];
  try {
    await open(page); await connect(page); await write(page, 'Continue'); await send(page);
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    const transcript = page.getByRole('textbox', { name: 'Conversation transcript' });
    await transcript.press('g'); await transcript.press('g'); await transcript.press('Control+d');
    const history = page.locator('.kp-chat-history'), before = await history.evaluate(node => node.scrollTop);
    const geometry = () => history.evaluate(node => ({ top: node.scrollTop, height: node.scrollHeight, viewport: node.clientHeight,
      firstTop: node.querySelector('[data-message-id]')?.getBoundingClientRect().top, focused: document.activeElement?.getAttribute('aria-label'),
      caret: getSelection()?.rangeCount ? getSelection()!.getRangeAt(0).getBoundingClientRect().toJSON() : null }));
    const beforeGeometry = await geometry();
    f.peer.delta('New output below the older passage.'); await expect(history).toContainText('New output below');
    expect(Math.abs(await history.evaluate(node => node.scrollTop) - before), JSON.stringify({ beforeGeometry, afterGeometry: await geometry() })).toBeLessThan(3); await expect(page.locator('.kp-chat-unread')).toBeVisible();
    await transcript.press('/'); const search = page.getByRole('searchbox', { name: 'Search loaded conversation' }); await search.fill('Paragraph 30');
    await expect(page.getByRole('dialog')).toContainText('1 matches'); await search.press('Escape');
    expect(Math.abs(await history.evaluate(node => node.scrollTop) - before)).toBeLessThan(3);
    await transcript.press('/'); await search.fill('Paragraph 30'); await search.press('Enter');
    await expect(transcript).toBeFocused(); expect(await page.evaluate(() => getSelection()?.toString())).toBe('Paragraph 30');
    f.peer.finish('New output below the older passage.'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await transcript.press('G'); await expect(page.locator('.kp-chat-unread')).toBeHidden(); expect(f.peer.sends()).toHaveLength(1);
  } finally { await f.close(); }
});

test('layered windows reorder below a global masthead and preserve columns, draft, scroll and native player', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await page.setViewportSize({ width: 1440, height: 960 }); await open(page);
    const pageWindow = page.locator('[data-kp-window=page]'), chatWindow = page.locator('[data-kp-window=chat]');
    const column = page.locator('.kp-chat-column'), draft = page.locator('.kp-chat-draft');
    await expect(page.locator('#app > .fn-header')).toHaveCount(1);
    await expect(pageWindow.locator('.fn-header')).toHaveCount(0);
    const headerBox = await page.locator('.fn-header').boundingBox();
    const front = async (id: 'page' | 'chat', step = 24) => {
      const active = id === 'page' ? pageWindow : chatWindow, back = id === 'page' ? chatWindow : pageWindow;
      await expect(active).toHaveAttribute('data-window-active', 'true');
      await expect.poll(async () => Math.round((await active.boundingBox())!.x)).toBe(0);
      await expect.poll(async () => Math.round((await back.boundingBox())!.y - (await active.boundingBox())!.y)).toBe(step);
      const a = (await active.boundingBox())!, b = (await back.boundingBox())!;
      expect(b.x).toBeGreaterThan(a.x); expect(a.y).toBeGreaterThanOrEqual(headerBox!.height);
      expect(b.x + b.width).toBeCloseTo(page.viewportSize()!.width, 0);
      expect(await page.locator('.fn-header').boundingBox()).toEqual(headerBox);
    };
    await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    await front('chat');
    const chatBox = await chatWindow.boundingBox(), pageBox = await pageWindow.boundingBox(), columnBox = await column.boundingBox();
    expect(chatBox!.width).toBeCloseTo(1440 * .55, 0); expect(pageBox!.width).toBeCloseTo(1440 * .55, 0);
    expect(Math.abs(columnBox!.x + columnBox!.width / 2 - chatBox!.x - chatBox!.width / 2)).toBeLessThan(1);
    expect((await draft.boundingBox())!.height / columnBox!.height).toBeCloseTo(1 / 3, 2);
    await page.getByRole('textbox', { name: 'Conversation transcript' }).press('i'); await input(page).pressSequentially('A continued thought');
    await input(page).press('ArrowLeft'); await input(page).press('ArrowLeft');
    const editor = page.locator('.fn-editor .ProseMirror'), editorNode = await editor.elementHandle();
    const frame = page.frameLocator('iframe'), stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
    await page.keyboard.press('Control+Backquote'); await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
    await front('page');
    await expect(editor).toBeFocused();
    const editorWidth = (await editor.boundingBox())!.width;
    expect(editorWidth).toBe(440); expect(columnBox!.width).toBe(491);
    await page.keyboard.press('Control+Backquote'); await expect(input(page)).toBeFocused();
    await front('chat');
    await input(page).pressSequentially('X'); await expect(input(page)).toHaveText('A continued thougXht');
    await input(page).press('Escape'); await expect(draft).toBeVisible();
    // Click a visible page gutter, then exercise switching from inside the
    // existing iframe: neither operation may replace its DOM or clock owner.
    await pageWindow.click({ position: { x: pageBox!.width - 4, y: 200 } }); await front('page');
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await frame.locator('body').click({ position: { x: 30, y: 140 } });
    await page.keyboard.press('Control+Backquote'); await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    await front('chat');
    expect(await editorNode!.evaluate(node => node.isConnected)).toBe(true); expect(await stage!.evaluate(node => node.isConnected)).toBe(true);
    expect((await column.boundingBox())!.width).toBe(columnBox!.width);
    await expect(draft).toBeVisible(); await page.screenshot({ path: info.outputPath('layered-chat-desktop.png') });
    // Interrupt and reverse before the first transition reaches its endpoint.
    await page.keyboard.press('Control+Backquote'); await page.keyboard.press('Control+Backquote'); await page.keyboard.press('Control+Backquote');
    await front('page');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(chatWindow).toHaveCSS('transition-duration', '0s');
    await page.keyboard.press('Control+Backquote'); await front('chat');
    await page.setViewportSize({ width: 390, height: 844 });
    await pageWindow.click({ position: { x: 370, y: 250 } });
    await chatWindow.click({ position: { x: 370, y: 250 } });
    await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(Math.round((await pageWindow.boundingBox())!.y - (await chatWindow.boundingBox())!.y)).toBe(8);
    await expect(draft).toBeVisible(); await page.screenshot({ path: info.outputPath('layered-chat-phone.png') });
    await pageWindow.click({ position: { x: 370, y: 250 } }); await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
    await expect.poll(() => f.store.data.draft).toBe('A continued thougXht');
    let release!: () => void; const previewReady = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/src/reader/app/exemplar-entry.ts*', async route => { await previewReady; await route.continue(); });
    try {
      await page.reload({ waitUntil: 'commit' }); await expect(chatWindow).toHaveAttribute('data-phase', 'disconnected');
      await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
      await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeFocused();
      await page.keyboard.press('Control+Backquote'); await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
    await expect(input(page)).toHaveText('A continued thougXht');
    await page.reload(); await expect(chatWindow).toHaveAttribute('data-phase', 'disconnected');
    await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    await page.keyboard.press('Control+c'); await page.keyboard.press('W');
    await expect(page.getByRole('dialog', { name: 'Chat commands' })).toBeHidden();
    await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
    expect(f.peer.sends()).toHaveLength(0);
  } finally { await f.close(); }
});

test('window promotion completes pointer gestures and keeps moving chat commands, scroll and close/reopen reachable', async ({ page, context }, info) => {
  const f = await fixture(context);
  f.peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: Array.from({ length: 60 }, (_, i) => `Paragraph ${i}: keep a stable reading place while changing windows.`).join('\n\n') }] }];
  try {
    await page.addInitScript(() => localStorage.setItem('kp.notebook.styles.v1', JSON.stringify({ theme: 'light', values: {} })));
    await page.setViewportSize({ width: 1440, height: 960 }); await open(page); await connect(page);
    const pageWindow = page.locator('[data-kp-window=page]'), chatWindow = page.locator('[data-kp-window=chat]');
    const history = page.locator('.kp-chat-history'), column = page.locator('.kp-chat-column');
    await write(page, 'Keep this continued thought and its selection.'); await input(page).press('Escape');
    const editorNode = await input(page).elementHandle();
    const headerBox = await page.locator('.fn-header').boundingBox();
    await page.keyboard.press('Control+Backquote');
    await expect.poll(async () => Math.round((await chatWindow.boundingBox())!.x)).toBe(648);
    await history.evaluate(node => { node.scrollTop = 500; });
    const scroll = await history.evaluate(node => node.scrollTop);
    // Drag a selection on the exposed rear window. Geometry must remain fixed
    // until release, including the focusin generated by the native pointerdown.
    const line = (await input(page).locator('p').first().boundingBox())!;
    await page.mouse.move(line.x + 20, line.y + 10); await page.mouse.down();
    await page.mouse.move(line.x + 100, line.y + 10, { steps: 6 });
    await page.waitForTimeout(100);
    expect(Math.round((await chatWindow.boundingBox())!.x)).toBe(648);
    await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
    const selection = await page.evaluate(() => getSelection()?.toString()); expect(selection?.length).toBeGreaterThan(0);
    await page.mouse.up();
    await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    await expect.poll(async () => Math.round((await chatWindow.boundingBox())!.x)).toBe(0);
    expect(await page.evaluate(() => getSelection()?.toString())).toBe(selection);
    expect(await history.evaluate(node => node.scrollTop)).toBe(scroll);
    // A cancelled touch/pointer gesture must not promote its original owner.
    const back = (await pageWindow.boundingBox())!;
    await page.mouse.move(back.x + back.width - 4, back.y + 200); await page.mouse.down();
    await pageWindow.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true }); await page.mouse.up();
    await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    // Header tools select their page even though the header lives outside it.
    await page.getByRole('button', { name: 'Styles', exact: true }).click();
    await expect(pageWindow).toHaveAttribute('data-window-active', 'true');
    await page.getByRole('button', { name: 'Close styles', exact: true }).click();
    await expect.poll(async () => Math.round((await chatWindow.boundingBox())!.x)).toBe(648);
    await page.screenshot({ path: info.outputPath('recency-stack-page-light.png') });
    // Open the transient while its window is still crossing the workspace.
    await page.getByRole('textbox', { name: 'Conversation transcript' }).focus();
    await page.keyboard.press('Control+c');
    const menu = page.getByRole('dialog', { name: 'Chat commands' }); await expect(menu).toBeVisible();
    await expect.poll(() => chatWindow.evaluate(node => node.getAnimations().length)).toBe(0);
    await expect.poll(async () => Math.round((await menu.boundingBox())!.x - (await column.boundingBox())!.x)).toBe(12);
    const menuBox = (await menu.boundingBox())!;
    expect(menuBox.x).toBeGreaterThanOrEqual(8); expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(1432);
    await menu.getByRole('button', { name: 'Branches', exact: true }).click(); await expect(menu).toContainText('Main');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: info.outputPath('recency-stack-chat-light.png') });
    const toggle = page.getByRole('button', { name: 'Chat', exact: true });
    await toggle.click(); await expect(chatWindow).toBeHidden();
    await expect.poll(async () => Math.round((await pageWindow.boundingBox())!.x)).toBe(324);
    await toggle.click(); await expect(chatWindow).toHaveAttribute('data-window-active', 'true');
    await expect(input(page)).toHaveText('Keep this continued thought and its selection.');
    expect(await editorNode!.evaluate(node => node.isConnected)).toBe(true);
    expect(await history.evaluate(node => node.scrollTop)).toBe(scroll);
    expect(await page.locator('.fn-header').boundingBox()).toEqual(headerBox);
    expect(f.peer.sends()).toHaveLength(0);
  } finally { await f.close(); }
});

test('topics, explicit orientation and branches retain drafts and return paths through reload', async ({ page, context }, info) => {
  const f = await fixture(context), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  f.peer.turns = [1, 2].map(n => ({ id: 'turn-' + n, status: 'completed', items: [{ type: 'agentMessage', id: 'reply-' + n, text: `Response ${n}: a stable passage.` }] }));
  try {
    await open(page); await connect(page); await write(page, 'Main unfinished question'); await input(page).press('Escape');
    await selectPassage(page, 'stable passage', 'reply-1');
    await command(page, 'Where am I?'); await page.getByRole('button', { name: 'Edit objective', exact: true }).click();
    await page.getByRole('textbox', { name: 'What are we working toward?' }).fill('Understand how the parts support the whole.');
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => f.store.data.context.objective).toContain('parts support');
    await command(page, 'Topics'); await page.getByRole('button', { name: 'Name this topic', exact: true }).click();
    await page.getByRole('textbox', { name: 'Topic name' }).fill('Explore the first step');
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click(); await expect.poll(() => f.store.data.context.topics.length).toBe(1);
    await command(page, 'Save return point');
    await command(page, 'Branch here'); await page.getByRole('textbox', { name: 'Branch name' }).fill('A bounded detour');
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('.kp-chat')).not.toHaveAttribute('data-branch-id', 'main');
    await expect(page.locator('.kp-chat-message')).toHaveCount(1); expect(f.peer.calls.find(call => call.method === 'thread/fork')?.params['lastTurnId']).toBe('turn-1');
    await write(page, 'Detour unfinished question'); await input(page).press('Escape');
    await command(page, 'Where am I?'); await expect(page.getByRole('dialog')).toContainText('Understand how the parts support the whole.');
    await page.screenshot({ path: info.outputPath('keyboard-chat-orientation.png') }); await page.keyboard.press('Escape');
    await command(page, 'Return to passage'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-branch-id', 'main');
    await expect(input(page)).toHaveText('Main unfinished question'); await expect(page.locator('.kp-chat-message')).toHaveCount(2);
    await page.reload(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-branch-id', 'main');
    await command(page, 'Branches'); await page.getByRole('button', { name: 'A bounded detour', exact: true }).click();
    await expect(page.locator('.kp-chat')).not.toHaveAttribute('data-branch-id', 'main'); await expect(input(page)).toHaveText('Detour unfinished question');
    expect(f.peer.sends()).toHaveLength(0); expect(errors).toEqual([]);
  } finally { await f.close(); }
});

test('a late form acknowledgement cannot dismiss a newer transient or steal its focus', async ({ page, context }) => {
  const f = await fixture(context); let release: (() => void) | undefined, waiting = false;
  const save = f.store.save.bind(f.store);
  f.store.save = async value => {
    if (value.context.revision === 1 && !waiting) { waiting = true; await new Promise<void>(resolve => { release = resolve; }); }
    await save(value);
  };
  try {
    await open(page); await command(page, 'Where am I?');
    await page.getByRole('button', { name: 'Edit objective', exact: true }).click();
    await page.getByRole('textbox', { name: 'What are we working toward?' }).fill('Keep the larger plan visible.');
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await page.keyboard.press('Escape'); await command(page, 'Keybindings'); release?.();
    await expect.poll(() => f.store.data.context.objective).toContain('larger plan');
    await expect(page.locator('.kp-chat-transient .kp-transient-heading strong')).toHaveText('Keybindings');
    await expect.poll(() => page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape'); await expect(page.getByRole('textbox', { name: 'Conversation transcript' })).toBeFocused();
    expect(f.peer.sends()).toHaveLength(0);
  } finally { release?.(); await f.close(); }
});
test('another tab changing branches cannot redirect a local draft or steal the reading surface', async ({ page, context }) => {
  const f = await fixture(context), second = await context.newPage();
  f.peer.turns = [{ id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'reply-1', text: 'A shared starting passage.' }] }];
  try {
    await open(page); await connect(page); await open(second); await write(page, 'Belongs to main'); await input(page).press('Escape');
    await expect.poll(() => f.store.data.draft).toBe('Belongs to main');
    await selectPassage(second, 'starting passage'); await command(second, 'Branch here');
    await second.getByRole('textbox', { name: 'Branch name' }).fill('Other tab detour');
    await second.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
    await expect(second.locator('.kp-chat')).not.toHaveAttribute('data-branch-id', 'main');
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'branch-changed');
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-branch-id', 'main'); await expect(input(page)).toHaveText('Belongs to main');
    await write(page, 'Keep the main edit'); await input(page).press('ControlOrMeta+Enter'); expect(f.peer.sends()).toHaveLength(0);
    await command(page, 'Branches'); await page.getByRole('button', { name: '• Main conversation', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready'); await expect(input(page)).toHaveText('Keep the main edit');
    expect(f.store.data.branchId).toBe('main'); expect(f.store.data.parked[0]?.draft).toBe('');
  } finally { await second.close(); await f.close(); }
});
test('note and composer Vim state stay independent and unsaved notes recover without sending', async ({ page, context }) => {
  const f = await fixture(context);
  try {
    await open(page); await write(page, 'Composer stays here');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await command(page, 'New note');
    const note = page.getByRole('textbox', { name: 'Note text', exact: true });
    await expect(note).toHaveAttribute('data-vim-mode', 'normal'); await note.press('i'); await note.fill('Unfinished observation'); await note.press('Escape');
    await expect(note).toHaveAttribute('data-vim-mode', 'normal'); await expect(page.locator('.kp-rich-composer .ProseMirror')).toHaveAttribute('data-vim-mode', 'insert');
    await note.press(':'); await page.getByRole('textbox', { name: 'Note text command' }).fill('h'); await page.getByRole('textbox', { name: 'Note text command' }).press('Enter');
    await expect(page.getByRole('dialog')).toContainText('Keybindings'); await expect(page.locator('.fn-help')).toBeHidden();
    await page.reload(); await command(page, 'Open notes');
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
      await command(tab, 'Open notes');
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
    await connect(page); await write(page, 'Help me keep our broader plan in view.'); await send(page);
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    f.peer.delta('We are working on persistent conversation.'); await expect(page.locator('.kp-chat-history')).toContainText('persistent conversation');
    await command(page, 'Close chat'); expect(await stage?.evaluate(node => node.isConnected)).toBe(true);
    f.peer.finish('We are working on persistent conversation. The notebook and animation remain separate.');
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await write(page, 'A saved follow-up'); await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await page.reload(); await expect(input(page)).toHaveText('A saved follow-up');
    await expect(page.locator('.kp-chat-history')).toContainText('The notebook and animation remain separate.');
    await f.restart(); await page.reload(); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'disconnected');
    await command(page, 'Resume conversation'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    expect(f.peer.sends()).toHaveLength(1); await expect(input(page)).toHaveText('A saved follow-up');
    await page.screenshot({ path: info.outputPath('chat-desktop.png') });
    await page.keyboard.press('Control+Backquote');
    await page.getByRole('button', { name: 'Styles', exact: true }).click();
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
    await page.getByRole('button', { name: 'Close styles' }).click();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(238, 239, 233)');
    await expect(page.locator('.kp-chat')).toHaveCSS('background-color', await page.locator('.kp-page-window').evaluate(node => getComputedStyle(node).backgroundColor));
    expect(await page.locator('.kp-chat').evaluate(node => getComputedStyle(node, '::before').backgroundColor)).toBe('rgb(238, 239, 233)');
    await expect(page.locator('.kp-chat')).toHaveCSS('opacity', '1');
    await expect(page.locator('.kp-chat')).toHaveCSS('font-family', await page.locator('.fn-editor .ProseMirror').evaluate(node => getComputedStyle(node).fontFamily));
    await page.keyboard.press('Control+Backquote');
    await page.screenshot({ path: info.outputPath('chat-light.png') }); expect(errors).toEqual([]);
  } finally { await f.close(); }
});
test('typing while Send waits preserves the next draft and interrupt ends the current turn', async ({ page, context }) => {
  const f = await fixture(context); let release!: () => void;
  try {
    await open(page); await connect(page); f.peer.nextSend = () => new Promise<void>(resolve => { release = resolve; });
    await page.getByRole('textbox', { name: 'Conversation transcript' }).press('i'); await input(page).pressSequentially('First message'); await input(page).press('ControlOrMeta+Enter');
    await expect.poll(() => f.peer.sends().length).toBe(1);
    await write(page, 'Next draft, typed before acknowledgement'); release();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    await expect(input(page)).toHaveText('Next draft, typed before acknowledgement');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project');
    await command(page, 'Interrupt response');
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
    await write(page, 'Keep this message'); await send(page);
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'uncertain');
    await expect(input(page)).toHaveText('Keep this message'); await input(page).press('ControlOrMeta+Enter'); expect(f.peer.sends()).toHaveLength(1);
    await command(page, 'Disconnect');
    await command(page, 'Resume conversation');
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'uncertain'); expect(f.peer.sends()).toHaveLength(1);
    await page.screenshot({ path: info.outputPath('chat-uncertain.png') });
    await command(page, 'I checked; keep draft unsent'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
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
    conflicted.once('dialog', dialog => dialog.accept()); await command(conflicted, 'Load saved draft');
    await expect(input(conflicted)).toHaveText(f.store.data.draft);
  } finally { await second.close(); await f.close(); }
});
test('phone keeps chat controls usable and saved draft recovery never auto-sends', async ({ page, context }, info) => {
  const f = await fixture(context);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => sessionStorage.setItem('kp.editor-chat.unsaved.v1', JSON.stringify({ text: 'Recovered local thought', revision: 0, threadId: null })));
    await open(page); await expect(input(page)).toHaveText('Recovered local thought');
    await command(page, 'Save draft');
    await expect(page.locator('.kp-chat-save')).toHaveText('Saved to this project'); expect(f.peer.sends()).toHaveLength(0);
    await page.getByRole('textbox', { name: 'Conversation transcript' }).press('i');
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

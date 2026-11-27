import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium, expect, type Page, type Browser, type BrowserContext } from '@playwright/test';
import { ChatService } from '../server/chat/service.ts';
import { chatHttp } from '../server/chat/http.ts';
import { CodexTransport } from '../server/chat/transport.ts';
import type { ChatStore } from '../server/chat/store.ts';
import { emptyChat, readChatSnapshot } from '../src/editor-chat/protocol.ts';

const mode = process.argv[2];
if (process.argv.length !== 3 || !['--prepare', '--live', '--resume'].includes(mode ?? '')) throw new Error('Choose --prepare (no inference), --live (one authorized turn), or --resume (saved artifact only).');
const evidence = 'docs/project/reviews/matrix-studio-trial', captures = 'tmp/codex/matrix-studio-trial', origin = 'http://127.0.0.1:8000';
await mkdir(evidence, { recursive: true }); await mkdir(captures, { recursive: true });
try { if (mode !== '--resume') { await access(`${evidence}/attempt.json`); throw new Error('This single turn is already reserved. Preserve the journal; do not send again.'); } }
catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
const instruction = 'Lead with a short question about why this matrix-vector result points straight up. Explain that the weighted columns cancel horizontally and add to five vertically. Use at most two short sentences and no new equations. Keep the current matrix, vector, result target and animation unchanged; return only the requested proposal JSON.';
const save = (name: string, value: unknown) => writeFile(`${evidence}/${name}.json`, JSON.stringify(value, null, 2) + '\n');
async function sharedFingerprint() {
  const response = await fetch(`${origin}/api/dev/chat`); if (!response.ok) throw new Error(`Shared chat readiness: ${response.status}`);
  const { token: _token, phase: _phase, notice: _notice, model: _model, project: _project, canAcknowledge: _ack, ...saved } = readChatSnapshot(await response.json());
  return createHash('sha256').update(JSON.stringify(saved)).digest('hex');
}
const sharedBefore = await sharedFingerprint();
let data = emptyChat(), sends = 0, sentAt = 0;
const store: ChatStore = { async load() { return structuredClone(data); }, async save(value) { data = structuredClone(value); }, async close() {} };
const service = new ChatService(store, callbacks => {
  const native = new CodexTransport(process.env['KP_CODEX_EXECUTABLE'] ?? '/opt/homebrew/bin/codex', process.cwd(), callbacks);
  return { async request(method, params) {
    if (method === 'turn/start') {
      if (mode !== '--live' || sends) throw new Error('No additional inference is authorized by this invocation.');
      await writeFile(`${evidence}/attempt.json`, JSON.stringify({ reservedAt: new Date().toISOString(), instruction,
        delivery: 'Reserved before native send; this record alone does not prove delivery.', params }, null, 2) + '\n', { flag: 'wx' });
      sends++; sentAt = performance.now(); console.log('Sending the one authorized matrix-note turn.');
    }
    return native.request(method, params);
  }, notify: (method, params) => native.notify(method, params), close: () => native.close() };
}, process.cwd());
const server = createServer((req, res) => { void chatHttp(service)(req, res); });
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing isolated listener.');
const backend = `http://127.0.0.1:${address.port}`;
const equation = (page: Page) => page.locator('.fn-editor .fn-matrix-object[data-math-view=equation]').first();
async function ready(page: Page, id = randomUUID()) {
  await page.goto(`${origin}/experiments/fraction-notebook/?notebook=matrix&document=${id}`);
  await expect(page.locator('[data-matrix-studio=ready]')).toHaveCount(1, { timeout: 45000 });
  await expect(equation(page)).toBeVisible();
}
async function command(page: Page, id: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true }); await picker.getByRole('combobox').fill(id);
  await expect(picker.getByRole('option', { selected: true })).toHaveAttribute('aria-disabled', 'false');
  await page.keyboard.press('Enter'); await expect(picker).toBeHidden();
}
async function importSaved(page: Page) {
  const files = page.waitForEvent('filechooser'); await command(page, 'notebook.import-matrix');
  await (await files).setFiles({ name: 'matrix-notebook.json', mimeType: 'application/json', buffer: await readFile(`${evidence}/notebook.json`) });
  await expect(equation(page).locator('.fn-matrix-note')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('[data-matrix-studio=ready]')).toHaveCount(1, { timeout: 45000 });
}
async function verifyReuse(page: Page, context: BrowserContext, browser: Browser, content: string) {
  const source = equation(page);
  await source.locator('.fn-math-heading').click(); await command(page, 'matrix.publish');
  const resource = await source.getAttribute('data-matrix-resource');
  // Command dismissal precedes the asynchronous IndexedDB commit. Observe
  // the durable publication before asking another notebook to consume it.
  await expect.poll(() => page.evaluate(id => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open('kp-matrix-publications-v1'); open.onerror = () => reject(open.error);
    open.onsuccess = () => { const db = open.result, tx = db.transaction('workspace', 'readonly');
      const read = tx.objectStore('workspace').get('documents');
      read.onsuccess = () => resolve((read.result as { document: { id: string } }[]).some(p => p.document.id === id));
      read.onerror = () => reject(read.error); tx.oncomplete = () => db.close(); };
  }), resource)).toBe(true);
  const other = await context.newPage(); await ready(other); await command(other, 'matrix.reuse');
  const picker = other.getByRole('dialog', { name: 'Reuse a published matrix' });
  await picker.getByLabel('Reuse relationship').selectOption('transclude'); await picker.getByRole('button', { name: 'Insert selected source' }).click();
  const linked = other.locator('.fn-editor .fn-matrix-object[data-math-view=equation]').nth(1);
  await expect(linked.locator('.fn-matrix-note')).toContainText(content);
  const linkedCell = await linked.getAttribute('data-cell-id');
  await linked.locator('.fn-math-heading').click(); await command(other, 'matrix.open-source');
  await expect(other.locator('[data-matrix-studio=ready]')).toHaveCount(1, { timeout: 45000 });
  await command(other, 'matrix.return-to-notebook');
  await expect(other.locator('.fn-editor .ProseMirror-selectednode')).toHaveAttribute('data-cell-id', linkedCell!, { timeout: 45000 });
  await other.reload(); await expect(linked.locator('.fn-matrix-note')).toContainText(content, { timeout: 45000 });
  await linked.scrollIntoViewIfNeeded(); await other.screenshot({ path: `${captures}/reused.png` });
  const restoredContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const restored = await restoredContext.newPage(); await ready(restored); await importSaved(restored);
    await expect(equation(restored).locator('.fn-matrix-note')).toContainText(content);
    await expect(equation(restored).getByLabel('A11', { exact: true })).toHaveValue('2');
    await equation(restored).scrollIntoViewIfNeeded(); await restored.screenshot({ path: `${captures}/reopened.png` });
  } finally { await restoredContext.close(); }
}
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined, failure: unknown;
let result: Record<string, unknown> = { mode, inferenceAttempts: 0, humanAccepted: false };
try {
  browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(15000);
  // Playwright also injects into opaque/blank child frames. Only the product
  // host owns this preference; touching their storage creates a false error.
  await context.addInitScript(() => {
    if (window === window.top && location.origin === 'http://127.0.0.1:8000') sessionStorage.setItem('kp.workspace.header', 'true');
  });
  await context.route('**/api/dev/chat', async route => {
    const response = await route.fetch({ url: backend, timeout: 45000, headers: { ...route.request().headers(), host: `127.0.0.1:${address.port}`, origin: backend } });
    await route.fulfill({ response });
  });
  const page = await context.newPage(); const errors: string[] = []; context.pages().forEach(p => p.on('pageerror', e => errors.push(e.message)));
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  const start = performance.now(); await ready(page); const source = equation(page);
  if (mode === '--resume') {
    const original: unknown = JSON.parse(await readFile(`${evidence}/result.json`, 'utf8'));
    if (!original || typeof original !== 'object' || !('content' in original) || typeof original.content !== 'string') throw new Error('No saved accepted response to resume.');
    await importSaved(page); await expect(source.locator('.fn-matrix-note')).toContainText(original.content);
    await verifyReuse(page, context, browser, original.content); expect(errors).toEqual([]);
    result = { ...result, originalEvidence: `${evidence}/result.json`, content: original.content, integratedJourney: true, browserErrors: errors, totalMs: Math.round(performance.now() - start) };
  } else {
  for (const [name, value] of [['A11', '2'], ['A12', '-1'], ['A21', '1'], ['A22', '2'], ['v1', '1'], ['v2', '2']]) await source.getByLabel(name!, { exact: true }).fill(value!);
  await source.locator('.fn-math-heading').click(); await command(page, 'math.discover');
  const capabilities = page.getByRole('dialog', { name: 'Mathematical capabilities', exact: true });
  await capabilities.getByRole('combobox').fill('Explain'); await page.keyboard.press('Enter');
  await expect(page.locator('.fn-editor .comb-stage')).toHaveCount(1);
  await page.getByRole('button', { name: 'Chat', exact: true }).click();
  await page.getByRole('textbox', { name: 'Conversation transcript' }).focus(); await page.keyboard.press('Control+c');
  await page.getByRole('dialog', { name: 'Chat commands' }).getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready', { timeout: 60000 }); await page.keyboard.press('Escape');
  await source.locator('.fn-math-heading').click(); await command(page, 'matrix.revise-note');
  const panel = page.getByRole('complementary', { name: 'Revise matrix explanation' });
  await panel.getByLabel('Requested matrix note change').fill(instruction); await panel.getByRole('button', { name: 'Prepare request in chat' }).click();
  const composer = page.locator('.kp-rich-composer .ProseMirror'); await expect(composer).toContainText('Response shape');
  await writeFile(`${evidence}/request.txt`, await composer.innerText());
  await page.screenshot({ path: `${captures}/prepared.png` });
  result['preparedMs'] = Math.round(performance.now() - start);
  result['model'] = (await service.snapshot()).model;
  if (mode === '--prepare') console.log('Actual product request prepared; no inference sent.');
  else {
    await composer.press('ControlOrMeta+Enter');
    const deadline = performance.now() + 300000;
    while (true) {
      const snapshot = await service.snapshot();
      if (snapshot.phase === 'ready' && snapshot.messages.some(m => m.role === 'assistant' && m.complete)) {
        const responses = snapshot.messages.filter(m => m.role === 'assistant' && m.complete);
        await save('responses', responses); result = { ...result, responseMs: Math.round(performance.now() - sentAt), threadId: snapshot.threadId,
          responseCount: responses.length, toolMessages: snapshot.messages.filter(m => m.role === 'tool').length };
        await save('result', result); break;
      }
      if (['error', 'uncertain', 'disconnected'].includes(snapshot.phase)) throw new Error(`Native turn stopped: ${snapshot.phase}: ${snapshot.notice}`);
      if (performance.now() > deadline) throw new Error('Five-minute response deadline; no retry authorized.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    const messages = panel.getByLabel('Completed model response'); await expect(messages.locator('option')).toHaveCount(Number(result['responseCount']) + 1);
    await messages.selectOption({ index: Number(result['responseCount']) }); await panel.getByRole('button', { name: 'Preview proposal' }).click();
    await expect(panel.getByRole('button', { name: 'Accept note' })).toBeEnabled();
    result['comparison'] = await panel.getByRole('region', { name: 'Matrix note comparison' }).innerText();
    await page.screenshot({ path: `${captures}/comparison.png` });
    // Test-owned acceptance proves the full product journey; human acceptance
    // of the generated explanation is a separate, still-required judgment.
    await panel.getByRole('button', { name: 'Accept note' }).click();
    const content = await source.locator('.fn-matrix-note p').innerText(); result['content'] = content;
    await source.locator('.fn-math-heading').click();
    const downloading = page.waitForEvent('download'); await command(page, 'notebook.export-json');
    await (await downloading).saveAs(`${evidence}/notebook.json`);
    await verifyReuse(page, context, browser, content);
    expect(errors).toEqual([]);
    result = { ...result, integratedJourney: true, browserErrors: errors, totalMs: Math.round(performance.now() - start) };
  }
  }
} catch (error) { failure = error; result['error'] = error instanceof Error ? error.message : String(error); }
finally {
  try { if ((await service.snapshot()).phase === 'running') await service.action({ kind: 'interrupt' }); } catch (error) { result['cleanupNotice'] = String(error); }
  await browser?.close(); await service.close(); await new Promise<void>(resolve => server.close(() => resolve()));
  result['inferenceAttempts'] = sends; result['sharedConversationUnchanged'] = sharedBefore === await sharedFingerprint(); await save(mode === '--prepare' ? 'preparation' : mode === '--resume' ? 'recovery' : 'result', result);
}
console.log(JSON.stringify(result, null, 2));
if (failure) throw failure;
if (!result['sharedConversationUnchanged']) throw new Error('Shared conversation changed during the trial; inspect concurrent activity.');

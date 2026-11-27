import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium, expect, type Page } from '@playwright/test';
import { ChatService } from '../server/chat/service.ts';
import { chatHttp } from '../server/chat/http.ts';
import { CodexTransport } from '../server/chat/transport.ts';
import type { ChatStore } from '../server/chat/store.ts';
import { emptyChat, readChatSnapshot } from '../src/editor-chat/protocol.ts';

// Deliberately outside the test runner: retries/projects must never multiply a
// human-authorized inference. The exclusive journal survives process failure.
const evidence = 'docs/project/reviews/contextual-revision-trial';
const captures = 'tmp/codex/contextual-revision-trial';
const origin = 'http://127.0.0.1:8000';
const instruction = 'Revise “Keep the condition true” to explain why we subtract three from both sides. Lead with a brief question about what would happen if only one side changed, then explain how doing the same subtraction preserves equality. Use at most two short sentences. Do not solve the equation or introduce the next step early. Keep the existing mathematical target and return only the proposal JSON requested by the panel.';
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== '--live') throw new Error('Requires --live and explicit authorization for the single recorded trial. Never delete its attempt journal to retry.');
await mkdir(evidence, { recursive: true });
await mkdir(captures, { recursive: true });
try {
  await readFile(`${evidence}/attempt.json`);
  throw new Error('This authorized attempt was already reserved. Inspect its evidence; do not send again.');
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
const save = (name: string, value: unknown) => writeFile(`${evidence}/${name}.json`, JSON.stringify(value, null, 2) + '\n');
async function sharedFingerprint() {
  const response = await fetch(`${origin}/api/dev/chat`);
  if (!response.ok) throw new Error(`Shared chat readiness failed: ${response.status}`);
  const snapshot = readChatSnapshot(await response.json());
  // Keep the shared conversation and capability token out of all artifacts.
  const { token: _token, phase: _phase, notice: _notice, model: _model, project: _project, canAcknowledge: _ack, ...saved } = snapshot;
  return createHash('sha256').update(JSON.stringify(saved)).digest('hex');
}
const sharedBefore = await sharedFingerprint();
let data = emptyChat(), sends = 0, started = 0;
const store: ChatStore = { async load() { return structuredClone(data); },
  async save(value) { data = structuredClone(value); }, async close() {} };
const service = new ChatService(store, callbacks => {
  const native = new CodexTransport(process.env['KP_CODEX_EXECUTABLE'] ?? '/opt/homebrew/bin/codex', process.cwd(), callbacks);
  return {
    async request(method, params) {
      if (method === 'turn/start') {
        if (sends !== 0) throw new Error('The single authorized turn has already been attempted.');
        await writeFile(`${evidence}/attempt.json`, JSON.stringify({ reservedAt: new Date().toISOString(),
          authority: 'User go after explicit single-turn request, 2026-11-27', instruction,
          delivery: 'Reserved before send; this journal alone does not prove delivery.', params }, null, 2) + '\n', { flag: 'wx' });
        sends++; started = performance.now();
        console.log('Reserved the single turn; sending through the installed Codex transport.');
      }
      return native.request(method, params);
    },
    notify: (method, params) => native.notify(method, params), close: () => native.close()
  };
}, process.cwd());
const server = createServer((request, response) => { void chatHttp(service)(request, response); });
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Isolated HTTP listener missing.');
const backend = `http://127.0.0.1:${address.port}`;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let failure: unknown;
let result: Record<string, unknown> = { inferenceAttempts: 0, previewValidated: false, accepted: false };
async function workspaceCommand(page: Page, title: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  await page.getByRole('combobox', { name: 'Search commands' }).fill(title);
  await page.getByRole('dialog', { name: 'Commands', exact: true }).getByRole('option', { name: title, exact: true })
    .and(page.locator('[aria-disabled=false]')).click();
}
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(15000);
  await context.addInitScript(() => sessionStorage.setItem('kp.workspace.header', 'true'));
  await context.route('**/api/dev/chat', async route => {
    const response = await route.fetch({ url: backend, timeout: 45000,
      headers: { ...route.request().headers(), host: `127.0.0.1:${address.port}`, origin: backend } });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/experiments/fraction-notebook/?revision=1`);
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  await page.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(page.locator('.kp-chat')).not.toHaveAttribute('data-phase', 'loading');
  await page.getByRole('textbox', { name: 'Conversation transcript' }).focus();
  await page.keyboard.press('Control+c');
  await page.getByRole('dialog', { name: 'Chat commands' }).getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready', { timeout: 60000 });
  await page.keyboard.press('Escape');
  await page.locator('.fn-editor .ProseMirror').focus();
  await workspaceCommand(page, 'Revise fraction annotation in chat');
  const panel = page.getByRole('complementary', { name: 'Revise annotation' });
  await panel.getByLabel('Annotation moment').selectOption({ label: 'Keep the condition true' });
  await panel.getByLabel('Requested annotation change').fill(instruction);
  await panel.getByRole('button', { name: 'Prepare request in chat' }).click();
  const composer = page.locator('.kp-rich-composer .ProseMirror');
  await expect(composer).toContainText('Response shape');
  const prompt = await composer.innerText();
  await writeFile(`${evidence}/request.txt`, prompt + '\n');
  const original = await page.locator('.fn-editor .ProseMirror').innerHTML();
  expect(sends).toBe(0);
  console.log('Request prepared by the actual revision panel; original notebook retained.');
  await composer.press('ControlOrMeta+Enter');
  // Wait on authoritative service state, not a possibly missed transient UI phase.
  const deadline = performance.now() + 300000;
  while (true) {
    const snapshot = await service.snapshot();
    if (snapshot.phase === 'ready' && snapshot.messages.some(message => message.role === 'assistant' && message.complete)) {
      const responses = snapshot.messages.filter(message => message.role === 'assistant' && message.complete);
      await save('responses', responses);
      result = { ...result, model: snapshot.model, threadId: snapshot.threadId, elapsedMs: Math.round(performance.now() - started),
        inferenceAttempts: sends, responseCount: responses.length, toolMessageCount: snapshot.messages.filter(message => message.role === 'tool').length };
      await save('result', result);
      break;
    }
    if (['error', 'uncertain', 'disconnected'].includes(snapshot.phase)) throw new Error(`Native turn stopped: ${snapshot.phase}: ${snapshot.notice}`);
    if (performance.now() > deadline) throw new Error('Five-minute response deadline reached; no retry authorized.');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const responses = panel.getByLabel('Completed model response');
  await expect(responses.locator('option')).toHaveCount(Number(result['responseCount']) + 1);
  await responses.selectOption({ index: Number(result['responseCount']) });
  await panel.getByRole('button', { name: 'Preview proposal' }).click();
  await expect(panel.getByRole('button', { name: 'Accept annotation' })).toBeEnabled({ timeout: 45000 });
  expect(await page.locator('.fn-editor .ProseMirror').innerHTML()).toBe(original);
  const comparison = await panel.getByRole('region', { name: 'Annotation comparison' }).innerText();
  await writeFile(`${evidence}/comparison.txt`, comparison + '\n');
  await page.screenshot({ path: `${captures}/comparison.png` });
  await panel.getByRole('button', { name: 'Inspect animation' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('iframe.fn-preview')).toBeInViewport();
  await page.screenshot({ path: `${captures}/preview.png` });
  await page.getByRole('button', { name: 'Return to proposal' }).click();
  await expect(panel).toBeVisible();
  expect(errors).toEqual([]);
  result = { ...result, previewValidated: true, sourceDocumentUnchanged: true, browserErrors: errors, comparison };
  console.log('Actual response passed proposal validation and preview; no acceptance applied.');
} catch (error) {
  failure = error; result = { ...result, error: error instanceof Error ? error.message : String(error) };
} finally {
  // A timeout disposes the native process even if interruption acknowledgement fails.
  try {
    const snapshot = await service.snapshot();
    if (snapshot.phase === 'running') await service.action({ kind: 'interrupt' });
  } catch (error) { result['cleanupNotice'] = String(error); }
  await browser?.close(); await service.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
  result['inferenceAttempts'] = sends;
  result['sharedConversationUnchanged'] = await sharedFingerprint() === sharedBefore;
  await save('result', result);
}
console.log(JSON.stringify(result, null, 2));
if (failure) throw failure;
if (result['sharedConversationUnchanged'] !== true) throw new Error('Shared conversation changed during the trial; inspect concurrent activity.');

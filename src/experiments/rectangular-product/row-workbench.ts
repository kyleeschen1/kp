import { parseRowFactor, type RowOperation } from '../../math/linear-system-row-operation.ts';
import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { applyMatrixConfig, observeMatrixConfig, readMatrixConfig } from '../matrix-examples/config.ts';
import { createRowSession, type RowTransaction } from './row-session.ts';
import { initialRowSystem, rowDemo, rowOperationLatex, rowSystemLatex } from './row-workbench-model.ts';
import { mountRowWorkbenchView, rowWorkbenchStageHtml } from './row-workbench-view.ts';

const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false, output: 'htmlAndMathml' });
export async function mountRowWorkbench(root: HTMLElement) {
  document.title = 'One system, three row operations';
  document.querySelector('h1')!.textContent = document.title;
  document.querySelector('#matrix-story > p')!.textContent = 'Change one equation at a time. Keep the solutions, inspect the arithmetic, and undo any step.';
  root.classList.add('dot-player', 'matrix-player', 'row-workbench');
  const rows = '<option value="0">Row 1</option><option value="1">Row 2</option>';
  root.innerHTML = `<section class="matrix-card kp-focus-deck" aria-label="Row operation workbench">
    <div class="matrix-cue" data-cue></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="System animation; scroll horizontally on narrow screens">${rowWorkbenchStageHtml}</div>
    <form class="matrix-controls" data-form>
      <label>Operation <select data-operation><option value="add">Add multiple</option><option value="scale">Scale</option><option value="swap">Swap</option></select></label>
      <label>Target <select data-target>${rows}</select></label>
      <label data-source-label>Source <select data-source>${rows}</select></label>
      <label data-factor-label>Factor <input data-factor value="1" aria-label="Factor" autocomplete="off"></label>
      <button type="submit" data-apply>Apply</button>
    </form>
    <div class="matrix-controls"><button data-undo>Undo</button><button data-redo>Redo</button><button data-reset>Reset</button><button data-demo>Next example step</button><button data-theme>Light mode</button></div>
    <div class="matrix-controls" data-playback hidden><button data-pause>Pause</button><input data-scrub type="range" min="0" max="1" step=".001" value="0" aria-label="Operation preview"><button data-finish>Finish</button><button data-cancel>Cancel</button></div>
    <p class="row-wb-status" data-status role="status"></p>
    <details class="row-wb-history"><summary>Current system and operation history</summary><div data-current></div><ol data-history></ol></details>
  </section><p class="matrix-help"><a href="?view=pouring">Numbers</a> · <a href="?view=structure">Structure</a> · <a href="?view=polynomials">Polynomials</a> · <a href="?view=system">Linear system</a> · <a href="?view=row-operation&guided=1">Guided row addition</a></p>`;
  const get = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-${name}]`)!;
  const view = mountRowWorkbenchView(root), session = createRowSession(initialRowSystem);
  const clock = createKpReaderTimelinePlaybackClock({ id: `${root.id}.row-workbench`, durationMs: 4200 });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let config = readMatrixConfig(document), disposed = false, renderFrame: ((p: number) => void) | undefined;
  let armed = false, demoIndex = 0;
  const cue = (text: string) => { get('cue').innerHTML = renderKpFocusDeckAnnotation({ entityId: 'row-workbench', text }); };
  const status = (text: string) => { get('status').textContent = text; };
  const controls = () => {
    const state = session.snapshot(), busy = !!state.pending;
    root.dataset['busy'] = String(busy); root.dataset['cursor'] = String(state.cursor);
    for (const input of get('form').querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button,input,select')) input.disabled = busy;
    get<HTMLButtonElement>('undo').disabled = busy || state.cursor === 0;
    get<HTMLButtonElement>('redo').disabled = busy || state.cursor === state.history.length;
    get<HTMLButtonElement>('demo').disabled = busy || demoIndex >= rowDemo.length;
    get('playback').hidden = !busy;
    get<HTMLButtonElement>('pause').disabled = !renderFrame;
    get<HTMLButtonElement>('finish').disabled = !renderFrame;
    get<HTMLButtonElement>('pause').textContent = clock.getStatus() === 'playing' ? 'Pause' : 'Resume';
    get<HTMLButtonElement>('theme').setAttribute('aria-pressed', String(config.theme === 'light'));
  };
  const history = () => {
    const snapshot = session.snapshot();
    get('current').innerHTML = math(rowSystemLatex(session.current()));
    get('history').innerHTML = snapshot.history.map((step, i) => `<li ${i >= snapshot.cursor ? 'data-undone' : ''}>${math(rowOperationLatex(step.operation))}${i >= snapshot.cursor ? ' (undone)' : ''}<details><summary>Why this preserves the solutions</summary><p>${step.witness.residualIdentity}</p><p>Inverse: ${math(rowOperationLatex(step.inverse))}</p>${math(rowSystemLatex(step.before))}<p>becomes</p>${math(rowSystemLatex(step.after))}</details></li>`).join('');
  };
  const restore = () => { armed = false; renderFrame = undefined; clock.pause(); view.show(session.current()); history(); controls(); };
  const complete = (transaction: RowTransaction) => {
    if (!session.commit(transaction)) return;
    restore(); cue('The operation is complete. Choose another, or undo this step.'); status(`Step ${session.snapshot().cursor} complete. Same solutions.`);
  };
  const render = () => {
    if (disposed || !renderFrame) return;
    const p = clock.getSnapshot().progress; renderFrame(p); get<HTMLInputElement>('scrub').value = String(p);
    const pending = session.snapshot().pending;
    if (armed && pending && p === (pending.direction === 'forward' ? 1 : 0)) complete(pending);
    else controls();
  };
  const unsubscribe = clock.subscribe(render);
  const run = async (action: RowTransaction['action'], operation?: RowOperation) => {
    const result = session.begin(action, operation);
    if (result.status !== 'pending') { status(`${result.path}: ${result.message}`); return; }
    const transaction = result.transaction; armed = false; renderFrame = undefined; controls();
    if (action === 'apply') {
      const op = transaction.step.operation;
      get<HTMLSelectElement>('operation').value = op.kind;
      get<HTMLSelectElement>('target').value = String(op.kind === 'swap' ? op.first : op.kind === 'scale' ? op.row : op.targetRow);
      if (op.kind !== 'scale') get<HTMLSelectElement>('source').value = String(op.kind === 'swap' ? op.second : op.sourceRow);
      if (op.kind !== 'swap') get<HTMLInputElement>('factor').value = op.factor.denominator === 1n ? String(op.factor.numerator) : `${op.factor.numerator}/${op.factor.denominator}`;
      get('source-label').hidden = op.kind === 'scale'; get('factor-label').hidden = op.kind === 'swap';
    }
    cue(action === 'undo' ? 'Undo: follow the same operation backward.' : transaction.step.operation.kind === 'swap' ? 'Exchange both complete equations.' : transaction.step.operation.kind === 'scale' ? 'Multiply the whole row, including its right-hand side.' : 'Combine corresponding entries in the receiving row.');
    get('cue').insertAdjacentHTML('beforeend', math(rowOperationLatex(transaction.step.operation)));
    status('Preparing operation…');
    try {
      // New fractions can request additional font faces; measure only after the
      // inserted native content has initiated those loads, and reject stale awaits.
      renderFrame = view.prepare(transaction.step); renderFrame(transaction.direction === 'forward' ? 0 : 1);
      root.getBoundingClientRect(); await document.fonts.ready;
      if (disposed || session.snapshot().pending !== transaction) return;
      renderFrame = view.prepare(transaction.step);
      clock.seek(transaction.direction === 'forward' ? 0 : 1); armed = true;
      status('Previewing. Finish applies the complete change; Cancel keeps the previous system.');
      if (reduced.matches || config.motion === 'steps') clock.seek(transaction.direction === 'forward' ? 1 : 0);
      else clock.play({ direction: transaction.direction, stopAt: transaction.direction === 'forward' ? 1 : 0,
        settlement: { durationMs: transaction.step.operation.kind === 'swap' ? 1400
          : transaction.step.operation.kind === 'add' && transaction.step.operation.factor.numerator === transaction.step.operation.factor.denominator ? 2800 : 4200 } });
      render();
    } catch (error) { if (!disposed && session.snapshot().pending === transaction) { session.cancel(); restore(); status(`Could not prepare operation: ${error instanceof Error ? error.message : String(error)}`); } }
  };
  get<HTMLSelectElement>('source').value = '1';
  get<HTMLSelectElement>('operation').onchange = () => {
    const kind = get<HTMLSelectElement>('operation').value;
    get('source-label').hidden = kind === 'scale'; get('factor-label').hidden = kind === 'swap';
  };
  get<HTMLFormElement>('form').onsubmit = event => {
    event.preventDefault(); const kind = get<HTMLSelectElement>('operation').value;
    const target = Number(get<HTMLSelectElement>('target').value), source = Number(get<HTMLSelectElement>('source').value);
    if (kind === 'swap') { demoIndex = rowDemo.length; void run('apply', { kind: 'swap', first: target, second: source }); return; }
    const factor = parseRowFactor(get<HTMLInputElement>('factor').value);
    if (factor.status !== 'parsed') { status(factor.message); return; }
    demoIndex = rowDemo.length;
    void run('apply', kind === 'scale' ? { kind: 'scale', row: target, factor: factor.value } : { kind: 'add', targetRow: target, sourceRow: source, factor: factor.value });
  };
  get('undo').onclick = () => { demoIndex = rowDemo.length; void run('undo'); };
  get('redo').onclick = () => { void run('redo'); };
  get('reset').onclick = () => { session.reset(); demoIndex = 0; restore(); cue('Try the example sequence, or choose an operation below.'); status('Original system restored.'); };
  get('demo').onclick = () => { const operation = rowDemo[demoIndex++]; if (operation) void run('apply', operation); };
  get('cancel').onclick = () => { session.cancel(); demoIndex = rowDemo.length; restore(); cue('Cancelled. The last completed system is unchanged.'); status('Operation cancelled.'); };
  get('finish').onclick = () => { const transaction = session.snapshot().pending; if (transaction && renderFrame) clock.seek(transaction.direction === 'forward' ? 1 : 0); };
  get('pause').onclick = () => { const transaction = session.snapshot().pending; if (!transaction) return;
    if (clock.getStatus() === 'playing') clock.pause(); else clock.play({ direction: transaction.direction, stopAt: transaction.direction === 'forward' ? 1 : 0 }); controls(); };
  get<HTMLInputElement>('scrub').oninput = () => { clock.pause(); clock.seek(Number(get<HTMLInputElement>('scrub').value)); };
  get('theme').onclick = () => applyMatrixConfig(document, { ...config, theme: config.theme === 'light' ? 'dark' : 'light' });
  const refresh = () => { clock.pause(); const transaction = session.snapshot().pending; if (transaction && renderFrame) { renderFrame = view.prepare(transaction.step); render(); } else controls(); };
  const stopConfig = observeMatrixConfig(document, next => { config = next; refresh(); });
  const visibility = () => { if (document.hidden) { clock.pause(); controls(); } };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) refresh(); else dispose(); };
  const dispose = () => { if (disposed) return; disposed = true; session.cancel(); unsubscribe(); stopConfig(); clock.dispose(); view.dispose();
    document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide); reduced.removeEventListener('change', refresh);
    for (const node of root.querySelectorAll<HTMLElement>('button,select,input,form')) { node.onclick = node.onchange = node.oninput = node.onsubmit = null; }
    delete root.dataset['ready']; };
  document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pagehide); reduced.addEventListener('change', refresh);
  restore(); cue('Try the example sequence, or choose an operation below.');
  root.dataset['ready'] = 'true'; root.setAttribute('aria-busy', 'false');
  return dispose;
}

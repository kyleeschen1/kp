import { parseRowFactor, type RowOperation } from '../../math/linear-system-row-operation.ts';
import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { applyMatrixConfig, observeMatrixConfig, readMatrixConfig } from '../matrix-examples/config.ts';
import { createRowSession, type RowTransaction } from './row-session.ts';
import { rowOperationLatex, rowSystemLatex } from './row-workbench-model.ts';
import { rowWorkbenchExamples } from './row-workbench-examples.ts';
import { rowWorkbenchReading } from './row-workbench-reading.ts';
import { createRowAuthoredStory } from './row-authored-story.ts';
import { mountRowEquationPanel } from './row-equation-panel.ts';
import type { CompiledRowStep, CompiledRowWorkbench } from './row-workbench-source.ts';
import { mountRowWorkbenchView, rowWorkbenchStageHtml } from './row-workbench-view.ts';

const math = (latex: string) => renderLatexToHtml(latex, { displayMode: false, output: 'htmlAndMathml' });
export async function mountRowWorkbench(root: HTMLElement, authoredModel?: CompiledRowWorkbench) {
  const exampleKey = new URLSearchParams(location.search).get('example') ?? 'original';
  const example = rowWorkbenchExamples.find(e => e.key === exampleKey);
  if (!authoredModel && !example) throw new Error('example: Choose an available row-operation example.');
  const model = authoredModel ?? example!.model;
  document.title = model.title;
  document.querySelector('h1')!.textContent = document.title;
  document.querySelector('#matrix-story > p')!.textContent = model.introduction;
  root.classList.add('dot-player', 'matrix-player', 'row-workbench');
  const rows = '<option value="0">Row 1</option><option value="1">Row 2</option>';
  root.innerHTML = `<section class="matrix-card kp-focus-deck" aria-label="Row operation workbench">
    <div class="matrix-controls"><label>Example <select data-example aria-label="Example; changing it resets history">${rowWorkbenchExamples.map(e => `<option value="${e.key}">${e.label}</option>`).join('')}</select></label></div>
    <div class="matrix-cue" data-cue></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="System animation; scroll horizontally on narrow screens">${rowWorkbenchStageHtml(model.unknowns)}</div>
    <section class="row-wb-equations" aria-label="Linked equations"><p data-equation-status></p><div data-equations></div></section>
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
  </section><details class="row-wb-reading"><summary>Read the authored walkthrough from its starting system</summary>${rowWorkbenchReading(model)}</details><p class="matrix-help"><a href="?view=pouring">Numbers</a> · <a href="?view=structure">Structure</a> · <a href="?view=polynomials">Polynomials</a> · <a href="?view=system">Linear system</a> · <a href="?view=row-operation&guided=1">Guided row addition</a></p>`;
  const get = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-${name}]`)!;
  const view = mountRowWorkbenchView(root), session = createRowSession(model.initial), story = createRowAuthoredStory(model, session);
  const equations = mountRowEquationPanel(root, model);
  const clock = createKpReaderTimelinePlaybackClock({ id: `${root.id}.row-workbench`, durationMs: 4200 });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let config = readMatrixConfig(document), disposed = false, renderFrame: ((p: number) => void) | undefined;
  let armed = false;
  const cue = (text: string, entityId = model.id) => { root.dataset['authoredStep'] = entityId; get('cue').innerHTML = renderKpFocusDeckAnnotation({ entityId, text }); };
  const status = (text: string) => { get('status').textContent = text; };
  const reserveCueSpace = () => {
    const node = get('cue'), previous = node.innerHTML;
    node.style.minHeight = '';
    let height = node.getBoundingClientRect().height;
    // Authored prose may wrap differently at each step. Reserve the largest
    // caption once per width so words cannot displace the persistent matrix.
    const candidates = [renderKpFocusDeckAnnotation({ entityId: model.id, text: model.introduction }),
      ...model.steps.flatMap(step => [renderKpFocusDeckAnnotation({ entityId: step.id, text: step.during }) + math(rowOperationLatex(step.operation)),
        renderKpFocusDeckAnnotation({ entityId: step.id, text: step.after })]),
      renderKpFocusDeckAnnotation({ entityId: model.id, text: 'The operation is complete. Explore freely, or reset to follow the authored example.' })];
    for (const html of candidates) { node.innerHTML = html; height = Math.max(height, node.getBoundingClientRect().height); }
    node.style.minHeight = `${height}px`; node.innerHTML = previous;
  };
  const controls = () => {
    const state = session.snapshot(), busy = !!state.pending;
    root.dataset['busy'] = String(busy); root.dataset['cursor'] = String(state.cursor);
    for (const input of get('form').querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button,input,select')) input.disabled = busy;
    get<HTMLButtonElement>('undo').disabled = busy || state.cursor === 0;
    get<HTMLButtonElement>('redo').disabled = busy || state.cursor === state.history.length;
    get<HTMLButtonElement>('demo').disabled = busy || !story.next();
    get('playback').hidden = !busy;
    get<HTMLButtonElement>('pause').disabled = !armed || !renderFrame;
    get<HTMLButtonElement>('finish').disabled = !armed || !renderFrame;
    get<HTMLInputElement>('scrub').disabled = !armed || !renderFrame;
    get<HTMLButtonElement>('pause').textContent = clock.getStatus() === 'playing' ? 'Pause' : 'Resume';
    get<HTMLButtonElement>('theme').setAttribute('aria-pressed', String(config.theme === 'light'));
  };
  const history = () => {
    const snapshot = session.snapshot();
    get('current').innerHTML = math(rowSystemLatex(session.current(), model.unknowns));
    get('history').innerHTML = snapshot.history.map((step, i) => {
      const annotation = story.annotation(step);
      return `<li ${i >= snapshot.cursor ? 'data-undone' : ''}>${math(rowOperationLatex(step.operation))}${i >= snapshot.cursor ? ' (undone)' : ''}${annotation ? renderKpFocusDeckAnnotation({ entityId: annotation.id, text: annotation.after, role: 'support' }) : ''}<details><summary>Why this preserves the solutions</summary><p>${step.witness.residualIdentity}</p><p>Inverse: ${math(rowOperationLatex(step.inverse))}</p>${math(rowSystemLatex(step.before, model.unknowns))}<p>becomes</p>${math(rowSystemLatex(step.after, model.unknowns))}</details></li>`;
    }).join('');
  };
  const restore = () => { armed = false; renderFrame = undefined; clock.pause(); view.show(session.current()); equations.update(session.current()); equations.preview(false); history(); controls(); };
  const complete = (transaction: RowTransaction) => {
    if (!session.commit(transaction)) return;
    restore(); settledCue(); status(`Step ${session.snapshot().cursor} complete. Same solutions.`);
  };
  const settledCue = () => {
    const annotation = story.current();
    cue(annotation?.after ?? (session.snapshot().cursor ? 'The operation is complete. Explore freely, or reset to follow the authored example.' : model.introduction), annotation?.id);
  };
  const render = () => {
    if (disposed || !renderFrame) return;
    const p = clock.getSnapshot().progress; renderFrame(p); get<HTMLInputElement>('scrub').value = String(p);
    const pending = session.snapshot().pending;
    if (armed && pending && p === (pending.direction === 'forward' ? 1 : 0)) complete(pending);
    else controls();
  };
  const unsubscribe = clock.subscribe(render);
  const run = async (action: RowTransaction['action'], operation?: RowOperation, authoredStep?: CompiledRowStep) => {
    const result = session.begin(action, operation);
    if (result.status !== 'pending') { status(`${result.path}: ${result.message}`); return; }
    const transaction = result.transaction;
    equations.preview(true);
    if (authoredStep) story.attach(transaction, authoredStep);
    const annotation = story.annotation(transaction.step);
    armed = false; renderFrame = undefined; controls();
    if (action === 'apply') {
      const op = transaction.step.operation;
      get<HTMLSelectElement>('operation').value = op.kind;
      get<HTMLSelectElement>('target').value = String(op.kind === 'swap' ? op.first : op.kind === 'scale' ? op.row : op.targetRow);
      if (op.kind !== 'scale') get<HTMLSelectElement>('source').value = String(op.kind === 'swap' ? op.second : op.sourceRow);
      if (op.kind !== 'swap') get<HTMLInputElement>('factor').value = op.factor.denominator === 1n ? String(op.factor.numerator) : `${op.factor.numerator}/${op.factor.denominator}`;
      get('source-label').hidden = op.kind === 'scale'; get('factor-label').hidden = op.kind === 'swap';
    }
    cue(action === 'undo' ? 'Undo: follow the same operation backward.' : annotation?.during ?? (transaction.step.operation.kind === 'swap' ? 'Exchange both complete equations.' : transaction.step.operation.kind === 'scale' ? 'Multiply the whole row, including its right-hand side.' : 'Combine corresponding entries in the receiving row.'), annotation?.id);
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
    } catch (error) { if (!disposed && session.snapshot().pending === transaction) { session.cancel(); restore(); settledCue(); status(`Could not prepare operation: ${error instanceof Error ? error.message : String(error)}`); } }
  };
  get<HTMLSelectElement>('example').value = exampleKey;
  get<HTMLSelectElement>('example').onchange = () => { const url = new URL(location.href); url.searchParams.set('example', get<HTMLSelectElement>('example').value); url.hash = ''; location.assign(url); };
  get<HTMLSelectElement>('source').value = '1';
  get<HTMLSelectElement>('operation').onchange = () => {
    const kind = get<HTMLSelectElement>('operation').value;
    get('source-label').hidden = kind === 'scale'; get('factor-label').hidden = kind === 'swap';
  };
  get<HTMLFormElement>('form').onsubmit = event => {
    event.preventDefault(); const kind = get<HTMLSelectElement>('operation').value;
    const target = Number(get<HTMLSelectElement>('target').value), source = Number(get<HTMLSelectElement>('source').value);
    if (kind === 'swap') { void run('apply', { kind: 'swap', first: target, second: source }); return; }
    const factor = parseRowFactor(get<HTMLInputElement>('factor').value);
    if (factor.status !== 'parsed') { status(factor.message); return; }
    void run('apply', kind === 'scale' ? { kind: 'scale', row: target, factor: factor.value } : { kind: 'add', targetRow: target, sourceRow: source, factor: factor.value });
  };
  get('undo').onclick = () => { void run('undo'); };
  get('redo').onclick = () => { void run('redo'); };
  get('reset').onclick = () => { session.reset(); equations.reset(); restore(); settledCue(); status('Original system restored.'); };
  get('demo').onclick = () => { const step = story.next(); if (step) void run('apply', step.operation, step); };
  get('cancel').onclick = () => { session.cancel(); restore(); settledCue(); status('Operation cancelled. The last completed system is unchanged.'); };
  get('finish').onclick = () => { const transaction = session.snapshot().pending; if (transaction && renderFrame) clock.seek(transaction.direction === 'forward' ? 1 : 0); };
  get('pause').onclick = () => { const transaction = session.snapshot().pending; if (!transaction) return;
    if (clock.getStatus() === 'playing') clock.pause(); else clock.play({ direction: transaction.direction, stopAt: transaction.direction === 'forward' ? 1 : 0 }); controls(); };
  get<HTMLInputElement>('scrub').oninput = () => { clock.pause(); clock.seek(Number(get<HTMLInputElement>('scrub').value)); };
  get('theme').onclick = () => applyMatrixConfig(document, { ...config, theme: config.theme === 'light' ? 'dark' : 'light' });
  const refresh = () => { clock.pause(); reserveCueSpace(); const transaction = session.snapshot().pending; if (transaction && renderFrame) { renderFrame = view.prepare(transaction.step); render(); } else controls(); };
  const stopConfig = observeMatrixConfig(document, next => { config = next; refresh(); });
  const visibility = () => { if (document.hidden) { clock.pause(); controls(); } };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) refresh(); else dispose(); };
  let width = root.clientWidth;
  const observer = new ResizeObserver(() => { if (root.clientWidth !== width) { width = root.clientWidth; refresh(); } }); observer.observe(root);
  const dispose = () => { if (disposed) return; disposed = true; session.cancel(); unsubscribe(); stopConfig(); observer.disconnect(); clock.dispose(); equations.dispose(); view.dispose();
    document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide); reduced.removeEventListener('change', refresh);
    for (const node of root.querySelectorAll<HTMLElement>('button,select,input,form')) { node.onclick = node.onchange = node.oninput = node.onsubmit = null; }
    delete root.dataset['ready']; };
  document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pagehide); reduced.addEventListener('change', refresh);
  restore(); settledCue();
  root.getBoundingClientRect(); await document.fonts.ready;
  if (disposed) return dispose;
  reserveCueSpace();
  root.dataset['ready'] = 'true'; root.setAttribute('aria-busy', 'false');
  return dispose;
}

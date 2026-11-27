import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { sampleDotProjectionModel } from '../../animation/dot-projection-model-frame.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { mountRowPicker } from '../../interaction/row-picker.ts';
import { available, unavailable } from '../../editor-commands/registry.ts';
import { CommandShortcut } from '../../editor-commands/shortcut.ts';
import { beatIds, cues, examples, prepareProjection, readProjectionUrl, type ProjectionDraft } from './model.ts';
import { interpretation, mathHtml, notation } from './notation.ts';
import { mountProjectionGraph } from './graph.ts';
import './style.css';

const root = document.querySelector<HTMLElement>('#projection')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const inputs = [...root.querySelectorAll<HTMLInputElement>('.vectors input')];
const draft = (): ProjectionDraft => [inputs[0]!.value, inputs[1]!.value, inputs[2]!.value, inputs[3]!.value];
const diagnostic = find<HTMLParagraphElement>('[data-diagnostic]'), view = find<HTMLElement>('[data-view]');
const graphHost = find<HTMLElement>('[data-graph]'), math = find<HTMLElement>('[data-notation]');
const cue = find<HTMLElement>('[data-cue]'), summary = find<HTMLElement>('[data-interpretation]');
const slider = find<HTMLInputElement>('[type=range]'), steps = find<HTMLSelectElement>('[aria-label="Explanation step"]');
const play = find<HTMLButtonElement>('[data-play]'), back = find<HTMLButtonElement>('[data-back]'), next = find<HTMLButtonElement>('[data-next]');
const preset = find<HTMLSelectElement>('[aria-label=Example]'), discover = find<HTMLButtonElement>('[data-discover]');
const theme = find<HTMLButtonElement>('[data-theme]');
for (const example of examples) preset.add(new Option(example.title, example.id));
preset.add(new Option('Custom', 'custom'));
for (const id of beatIds) steps.add(new Option(cues[id], id));
const loaded = readProjectionUrl(new URLSearchParams(location.search));
if (loaded.status === 'ready') inputs.forEach((input, index) => { input.value = loaded.draft[index]!; });
let source = prepareProjection(draft()), revision = 0, painted = '', disposed = false;
let graph: ReturnType<typeof mountProjectionGraph> | undefined;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clock = createKpReaderTimelinePlaybackClock({ id: 'projection.editable', durationMs: 10000,
  initialProgress: loaded.status === 'ready' ? loaded.progress : 0 });

const saveLocation = () => {
  if (source.status === 'invalid') return;
  const params = new URLSearchParams({ a: source.a.join(','), b: source.b.join(','), beat: steps.value });
  history.replaceState(null, '', `${location.pathname}?${params}`);
};
const paint = () => {
  if (disposed || source.status !== 'ready') return;
  const progress = clock.getSnapshot().progress, frame = sampleDotProjectionModel(source.model, progress);
  graph?.render(frame); root.dataset['beat'] = frame.semanticBeatId;
  slider.value = String(progress); slider.setAttribute('aria-valuetext', cues[beatIds.find(id => id === frame.semanticBeatId)!]);
  steps.value = frame.semanticBeatId;
  back.disabled = progress === 0; next.disabled = progress === 1;
  play.textContent = clock.getStatus() === 'playing' ? 'Pause' : reduced.matches ? 'Next step' : progress === 1 ? 'Replay' : 'Play';
  if (painted !== frame.semanticBeatId) {
    const beat = beatIds.find(id => id === frame.semanticBeatId)!;
    cue.innerHTML = renderKpFocusDeckAnnotation({ entityId: `projection.${beat}`, text: cues[beat] });
    math.replaceChildren(...notation(source.model, beat).map(latex => {
      const line = document.createElement('div'); line.innerHTML = mathHtml(latex); return line;
    }));
    painted = frame.semanticBeatId;
  }
  if (clock.getStatus() !== 'playing') saveLocation();
};
const go = (progress: number) => { clock.pause(); clock.seek(Math.max(0, Math.min(1, progress))); };
const move = (direction: 1 | -1) => {
  const progress = clock.getSnapshot().progress;
  const step = direction === 1 ? Math.floor(progress * 8 + 1e-8) + 1 : Math.ceil(progress * 8 - 1e-8) - 1;
  const target = Math.max(0, Math.min(1, step / 8));
  clock.pause();
  if (reduced.matches) clock.seek(target);
  else clock.play({ direction: direction === 1 ? 'forward' : 'rewind', stopAt: target });
  paint();
};
const operations = [
  { id: 'dot', title: 'Inspect dot product', detail: 'Scalar · sum of component products', progress: 3 / 8 },
  { id: 'projection', title: 'Inspect projection', detail: 'Vector · signed multiple along b', progress: 6 / 8 },
  { id: 'residual', title: 'Inspect perpendicular remainder', detail: 'Residual · orthogonal decomposition', progress: 7 / 8 }
] as const;
const picker = mountRowPicker(document.body, {
  id: 'projection-capabilities', label: 'Vector relationships', maxVisible: 5,
  rows: () => operations.map(operation => ({ id: operation.id, resource: { operation, revision },
    fields: { title: { text: operation.title, display: 'primary', search: 'fuzzy' }, detail: { text: operation.detail, display: 'secondary', search: 'fuzzy' } },
    facets: {}, actions: ['inspect'] })),
  state: row => source.status !== 'ready' ? unavailable('Enter valid vectors with a nonzero b.')
    : row.resource.revision !== revision ? unavailable('The inputs changed. Reopen relationships.') : available(),
  execute: row => {
    if (disposed || row.resource.revision !== revision || source.status !== 'ready') return { ok: false, reason: 'The inputs changed. Reopen relationships.' };
    go(row.resource.operation.progress); return { ok: true };
  }
});
const apply = () => {
  // Pause before replacing source or graph; a published pause frame still owns
  // the old admitted model. Draft errors retain that view with an explicit cue.
  clock.pause(); revision++;
  source = prepareProjection(draft());
  inputs.forEach((input, index) => input.setAttribute('aria-invalid', String(source.status === 'invalid' && source.index === index)));
  diagnostic.textContent = source.status === 'ready' ? '' : source.message;
  const disabled = source.status !== 'ready';
  for (const control of [play, back, next, slider, steps]) control.disabled = disabled;
  if (source.status !== 'invalid') {
    graph?.dispose(); graph = undefined;
    view.hidden = source.status === 'undefined'; find<HTMLElement>('[data-undefined]').hidden = source.status !== 'undefined';
    if (source.status === 'ready') {
      graph = mountProjectionGraph(graphHost, source.model); summary.textContent = interpretation(source.model);
      painted = ''; paint();
    } else saveLocation();
  }
  preset.value = examples.find(example => [...example.a, ...example.b].join(',') === draft().map(Number).join(','))?.id ?? 'custom';
  picker.refresh();
};
inputs.forEach(input => { input.oninput = apply; });
find<HTMLFormElement>('form').onsubmit = event => event.preventDefault();
preset.onchange = () => {
  const example = examples.find(item => item.id === preset.value); if (!example) return;
  inputs.forEach((input, index) => { input.value = String([...example.a, ...example.b][index]); }); apply();
};
steps.onchange = () => { const target = beatIds.findIndex(id => id === steps.value) / 8; go(target); };
slider.oninput = () => { const target = Number(slider.value); go(target); };
back.onclick = () => move(-1); next.onclick = () => move(1);
play.onclick = () => {
  if (clock.getStatus() === 'playing') clock.pause();
  else if (reduced.matches) { if (clock.getSnapshot().progress === 1) go(0); else move(1); }
  else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: 'forward', stopAt: 1 }); }
  paint();
};
discover.onclick = () => { clock.pause(); paint(); picker.open(); };
theme.onclick = () => {
  const dark = document.documentElement.dataset['kpTheme'] !== 'dark';
  document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme';
};
const shortcut = new CommandShortcut();
const keydown = (event: KeyboardEvent) => {
  const action = shortcut.next(event, performance.now());
  if (action !== 'pass') event.preventDefault();
  if (action === 'open') discover.click();
};
const resetShortcut = () => shortcut.reset();
// The shared clock pauses without publishing a new progress sample. Hosts must
// refresh controls and the return URL when visibility interrupts playback.
const pause = () => { shortcut.reset(); clock.pause(); paint(); };
const hidden = () => { if (document.hidden) pause(); };
const pagehide = (event: PageTransitionEvent) => { if (event.persisted) pause(); else dispose(); };
const unsubscribe = clock.subscribe(paint);
const intersection = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); }); intersection.observe(view);
document.addEventListener('keydown', keydown); document.addEventListener('visibilitychange', hidden);
document.addEventListener('pointerdown', resetShortcut); document.addEventListener('focusin', resetShortcut);
window.addEventListener('blur', pause); window.addEventListener('pagehide', pagehide); reduced.addEventListener('change', pause);
function dispose() {
  if (disposed) return; disposed = true;
  unsubscribe(); clock.dispose(); graph?.dispose(); picker.dispose(); intersection.disconnect();
  document.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', hidden);
  document.removeEventListener('pointerdown', resetShortcut); document.removeEventListener('focusin', resetShortcut);
  window.removeEventListener('blur', pause); window.removeEventListener('pagehide', pagehide); reduced.removeEventListener('change', pause);
  inputs.forEach(input => { input.oninput = null; });
  for (const button of [play, back, next, discover, theme]) button.onclick = null;
  preset.onchange = null; steps.onchange = null; slider.oninput = null; find<HTMLFormElement>('form').onsubmit = null;
}
apply(); if (loaded.status === 'invalid') diagnostic.textContent = loaded.message;
root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);

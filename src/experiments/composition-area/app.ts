import katex from 'katex';
import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { matrixObjectToLatex, createMatrixObject } from '../../semantic/matrix.ts';
import { checkpoints, presets, prepareComposition, sampleComposition, readCompositionUrl, CompositionGap, type Pose } from './model.ts';
import { mountCompositionGraph } from './graph.ts';
import './style.css';

const root = document.querySelector<HTMLElement>('#composition')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
for (const name of ['A', 'B']) {
  const host = find(`[data-inputs=${name}]`);
  for (let i = 0; i < 4; i++) {
    const input = document.createElement('input'); input.inputMode = 'numeric'; input.maxLength = 12;
    input.setAttribute('aria-label', `${name} row ${Math.floor(i / 2) + 1} column ${i % 2 + 1}`); host.append(input);
  }
}
const inputs = [...root.querySelectorAll<HTMLInputElement>('form input')];
const draft = () => inputs.map(input => input.value);
const preset = find<HTMLSelectElement>('[aria-label=Example]'), steps = find<HTMLSelectElement>('[aria-label="Explanation step"]');
const slider = find<HTMLInputElement>('[type=range]'), play = find<HTMLButtonElement>('[data-play]');
const back = find<HTMLButtonElement>('[data-back]'), next = find<HTMLButtonElement>('[data-next]');
const diagnostic = find('[data-diagnostic]'), theme = find<HTMLButtonElement>('[data-theme]');
for (const value of presets) preset.add(new Option(value.title, value.id)); preset.add(new Option('Custom', 'custom'));
for (const value of checkpoints) steps.add(new Option(value.title, value.id));
let loaded: ReturnType<typeof readCompositionUrl> = { draft: presets[0].values, progress: 0 }, linkError = '';
try { loaded = readCompositionUrl(new URLSearchParams(location.search)); }
catch (error) { if (!(error instanceof CompositionGap)) throw error; linkError = `${error.message} Showing the default example.`; }
inputs.forEach((input, i) => { input.value = loaded.draft[i]!; });
let model = prepareComposition(draft()), enabled = true, disposed = false, visible = true, painted = '';
let graphs = [mountCompositionGraph(find('[data-graph=left]'), model, 'composition.left'), mountCompositionGraph(find('[data-graph=right]'), model, 'composition.right')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clock = createKpReaderTimelinePlaybackClock({ id: 'composition.reference', durationMs: 8000, initialProgress: loaded.progress });
const area = (pose: Pose) => `Signed area ${pose.signedArea}; area ${Math.abs(pose.signedArea)}. ${pose.signedArea === 0 ? 'Collapsed.' : pose.signedArea < 0 ? 'Orientation reversed.' : 'Orientation preserved.'}`;
const save = () => {
  if (!enabled || disposed) return;
  const p = clock.getSnapshot().progress;
  const beat = p === 0 ? 'unit' : p <= .5 ? 'first' : 'composed';
  history.replaceState(null, '', `${location.pathname}?${new URLSearchParams({ m: draft().join(','), beat, p: String(p) })}`);
};
const paint = () => {
  if (disposed) return;
  const frame = sampleComposition(model, clock.getSnapshot().progress);
  root.dataset['beat'] = frame.beat; root.dataset['playing'] = String(clock.getStatus() === 'playing');
  slider.value = String(frame.progress); steps.value = frame.beat;
  slider.disabled = play.disabled = steps.disabled = !enabled; back.disabled = !enabled || frame.progress === 0; next.disabled = !enabled || frame.progress === 1;
  play.textContent = clock.getStatus() === 'playing' ? 'Pause' : reduced.matches || !visible ? 'Next step' : frame.progress === 1 ? 'Replay' : 'Play';
  const label = frame.moving ? 'Moving toward: ' : '';
  graphs[0]!.render(frame.left, `A then B. ${label}${area(frame.leftPose)}`);
  graphs[1]!.render(frame.right, `B then A. ${label}${area(frame.rightPose)}`);
  const key = `${frame.beat}:${frame.moving}`;
  if (key !== painted) {
    const cue = frame.beat === 'unit' ? 'Both orders begin with the same square and the same ordered basis.' : frame.beat === 'first'
      ? 'On the left, apply A. On the right, apply B. The second map will act on this whole image.'
      : model.commutes ? 'For this pair, both orders reach the same map. Is that true for the other examples?'
      : 'The orders reach different maps. Their signed-area factors still agree.';
    find('[data-cue]').innerHTML = renderKpFocusDeckAnnotation({ entityId: `composition.${frame.beat}`, text: cue });
    slider.setAttribute('aria-valuetext', `${label}${cue}`);
    for (const [side, pose, name] of [['left', frame.leftPose, frame.beat === 'unit' ? 'I' : frame.beat === 'first' ? 'A' : 'BA'], ['right', frame.rightPose, frame.beat === 'unit' ? 'I' : frame.beat === 'first' ? 'B' : 'AB']] as const) {
      const latex = matrixObjectToLatex(createMatrixObject({ id: pose.id, label: name, rows: pose.matrix }));
      find(`[data-notation=${side}]`).innerHTML = katex.renderToString(latex, { throwOnError: true, output: 'htmlAndMathml' });
      find(`[data-area=${side}]`).textContent = label + area(pose);
    }
    painted = key;
  }
  if (clock.getStatus() !== 'playing') save();
};
const pause = () => { clock.pause(); paint(); };
const seek = (p: number) => { if (!enabled || disposed) return; clock.pause(); clock.seek(p); paint(); };
const move = (direction: 1 | -1) => {
  if (!enabled || disposed) return;
  const p = clock.getSnapshot().progress;
  const target = direction === 1 ? (p < .5 ? .5 : 1) : (p > .5 ? .5 : 0);
  clock.pause();
  if (reduced.matches || !visible) clock.seek(target); else clock.play({ direction: direction === 1 ? 'forward' : 'rewind', stopAt: target });
  paint();
};
const apply = () => {
  // Disable first: pausing emits a frame and must not save an unadmitted draft.
  enabled = false; clock.pause();
  try {
    model = prepareComposition(draft()); enabled = true; diagnostic.textContent = '';
    graphs.forEach(graph => graph.dispose());
    graphs = [mountCompositionGraph(find('[data-graph=left]'), model, 'composition.left'), mountCompositionGraph(find('[data-graph=right]'), model, 'composition.right')];
    find('[data-conclusion]').textContent = `det(A) = ${model.a.signedArea}; det(B) = ${model.b.signedArea}. Both products have signed-area factor ${model.ba.signedArea}. ${model.commutes ? 'These matrices commute.' : 'These matrices do not commute.'}`;
    painted = '';
  } catch (error) { if (!(error instanceof CompositionGap)) throw error; diagnostic.textContent = error.message; }
  inputs.forEach(input => input.setAttribute('aria-invalid', String(!enabled)));
  preset.value = presets.find(item => item.values.join(',') === draft().map(Number).join(','))?.id ?? 'custom';
  paint();
};
inputs.forEach(input => { input.oninput = apply; }); find<HTMLFormElement>('form').onsubmit = event => event.preventDefault();
preset.onchange = () => { const value = presets.find(item => item.id === preset.value); if (!value) return; inputs.forEach((input, i) => { input.value = value.values[i]!; }); apply(); };
steps.onchange = () => seek(checkpoints.find(value => value.id === steps.value)!.progress);
slider.oninput = () => seek(Number(slider.value)); back.onclick = () => move(-1); next.onclick = () => move(1);
play.onclick = () => {
  if (!enabled || disposed) return;
  if (clock.getStatus() === 'playing') pause();
  else if (reduced.matches || !visible) { if (clock.getSnapshot().progress === 1) seek(0); else move(1); }
  else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: 'forward', stopAt: 1 }); paint(); }
};
theme.onclick = () => { const dark = document.documentElement.dataset['kpTheme'] !== 'dark'; document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme'; };
const hidden = () => { if (document.hidden) pause(); };
const leaving = (event: PageTransitionEvent) => { if (event.persisted) pause(); else dispose(); };
const observer = new IntersectionObserver(entries => {
  visible = entries[0]?.isIntersecting ?? false;
  if (!visible) pause(); else paint();
}); observer.observe(find('.comparison'));
const unsubscribe = clock.subscribe(paint);
document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', pause); window.addEventListener('pagehide', leaving); reduced.addEventListener('change', pause);
function dispose() {
  if (disposed) return; pause(); disposed = true; unsubscribe(); clock.dispose(); observer.disconnect(); graphs.forEach(graph => graph.dispose());
  document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', pause); window.removeEventListener('pagehide', leaving); reduced.removeEventListener('change', pause);
  inputs.forEach(input => { input.oninput = null; });
  preset.onchange = steps.onchange = slider.oninput = null; back.onclick = next.onclick = play.onclick = theme.onclick = null;
  find<HTMLFormElement>('form').onsubmit = null;
}
apply(); if (linkError) diagnostic.textContent = linkError; root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);

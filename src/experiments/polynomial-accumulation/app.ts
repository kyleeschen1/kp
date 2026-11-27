import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { readAccumulationUrl, readBound, getPolynomial, sampleAccumulation, formatReadout, exactText } from '../../math/authoring/polynomial-accumulation.ts';
import { renderAccumulationGraphs, bindAccumulationGraphs } from './graph.ts';

const root = document.querySelector<HTMLElement>('#polynomial-accumulation')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const aInput = find<HTMLInputElement>('[data-a]'), bInput = find<HTMLInputElement>('[data-b]'), select = find<HTMLSelectElement>('[data-case]');
const slider = find<HTMLInputElement>('[data-progress]'), play = find<HTMLButtonElement>('[data-play]');
const swap = find<HTMLButtonElement>('[data-swap]'), start = find<HTMLButtonElement>('[data-start]'), end = find<HTMLButtonElement>('[data-end]');
const theme = find<HTMLButtonElement>('[data-theme]'), diagnostic = find('[data-diagnostic]');
let initial = readAccumulationUrl(new URLSearchParams()), error = '';
try { initial = readAccumulationUrl(new URLSearchParams(location.search)); } catch (reason) { error = String(reason) + ' Showing the default interval.'; }
let { model, a, b } = initial;
let valid = true, visible = true, disposed = false;
const clock = createKpReaderTimelinePlaybackClock({ id: 'polynomial-accumulation.reference', durationMs: 12000, initialProgress: initial.progress });
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let draw: ReturnType<typeof bindAccumulationGraphs>;
const values = (['x', 'value', 'total', 'area'] as const).map(id => ({ id, node: find(`[data-number="${id}"]`) }));
function mountSource() {
  const frame = sampleAccumulation(model, a, b, clock.getSnapshot().progress), graphs = renderAccumulationGraphs(model, frame);
  find('[data-function]').innerHTML = graphs.f; find('[data-total]').innerHTML = graphs.A;
  find('[data-definition]').replaceChildren(find<HTMLTemplateElement>(`[data-definition-case="${model.id}"]`).content.cloneNode(true));
  draw = bindAccumulationGraphs(root, model, a);
  select.value = model.id;
}
function paint() {
  if (disposed) return;
  const progress = clock.getSnapshot().progress, frame = sampleAccumulation(model, a, b, progress), playing = clock.getStatus() === 'playing';
  draw(frame);
  for (const { id, node } of values) node.textContent = formatReadout(id, id === 'x' ? frame.x / 100 : frame[id]);
  find('[data-exact="signed"]').textContent = exactText(frame.signed); find('[data-exact="geometric"]').textContent = exactText(frame.geometric);
  slider.value = String(progress); slider.setAttribute('aria-valuetext', `Endpoint ${frame.x / 100}; signed total ${frame.total.toFixed(3)}.`);
  find('[data-direction]').textContent = a === b ? 'Equal bounds: both totals are zero.' : a < b ? 'Moving right: above adds; below subtracts.' : 'Moving left: above subtracts; below adds.';
  for (const control of [slider, play, swap, start, end]) control.disabled = !valid;
  play.disabled = !valid || a === b;
  play.textContent = playing ? 'Pause' : reduced.matches || !visible ? 'Next step' : progress === 1 ? 'Replay' : 'Play';
  root.dataset['playing'] = String(playing); root.dataset['progress'] = String(progress);
  if (valid && !playing) history.replaceState(null, '', `${location.pathname}?${new URLSearchParams({ case: model.id, a: String(a / 100), b: String(b / 100), p: String(progress) })}`);
}
const pause = () => { clock.pause(); paint(); };
const seek = (progress: number) => { clock.pause(); clock.seek(progress); paint(); };
const edit = () => {
  valid = false; clock.pause();
  try {
    const nextA = readBound(aInput.value), nextB = readBound(bInput.value), nextModel = getPolynomial(select.value);
    a = nextA; b = nextB; model = nextModel; valid = true; diagnostic.textContent = '';
    mountSource(); clock.seek(1);
  } catch (reason) { diagnostic.textContent = String(reason); }
  for (const input of [aInput, bInput]) input.setAttribute('aria-invalid', String(!valid));
  paint();
};
mountSource(); aInput.value = String(a / 100); bInput.value = String(b / 100);
for (const control of [aInput, bInput, select]) control.disabled = false;
aInput.onfocus = bInput.onfocus = pause; aInput.oninput = bInput.oninput = edit; select.onchange = edit;
slider.oninput = () => { if (valid) seek(Number(slider.value)); };
swap.onclick = () => { if (!valid) return; [aInput.value, bInput.value] = [bInput.value, aInput.value]; edit(); };
start.onclick = () => { if (valid) seek(0); }; end.onclick = () => { if (valid) seek(1); };
play.onclick = () => {
  if (!valid || a === b) return;
  if (clock.getStatus() === 'playing') pause();
  else if (reduced.matches || !visible) seek(clock.getSnapshot().progress >= 1 ? 0 : Math.min(1, clock.getSnapshot().progress + .25));
  else { if (clock.getSnapshot().progress >= 1) seek(0); clock.play({ direction: 'forward', stopAt: 1 }); paint(); }
};
theme.onclick = () => { const dark = document.documentElement.dataset['kpTheme'] !== 'dark'; document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme'; };
const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; if (!visible) pause(); else paint(); }); observer.observe(find('.figures'));
const unsubscribe = clock.subscribe(paint), hidden = () => { if (document.hidden) pause(); };
const leaving = (event: PageTransitionEvent) => { if (event.persisted) pause(); else dispose(); };
document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', pause); window.addEventListener('pagehide', leaving); reduced.addEventListener('change', pause);
function dispose() {
  if (disposed) return; pause(); disposed = true; unsubscribe(); clock.dispose(); observer.disconnect();
  document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', pause); window.removeEventListener('pagehide', leaving); reduced.removeEventListener('change', pause);
  aInput.oninput = bInput.oninput = aInput.onfocus = bInput.onfocus = slider.oninput = select.onchange = null;
  play.onclick = start.onclick = end.onclick = swap.onclick = theme.onclick = null;
}
paint(); diagnostic.textContent = error; root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);

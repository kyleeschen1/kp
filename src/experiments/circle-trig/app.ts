import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { readCircleUrl, readAngle, sampleCircle, toProgress, fromProgress, nextQuarter, bounds, formatReadout, type Readout } from './model.ts';
import { bindCircleGraphs } from './graph.ts';

const root = document.querySelector<HTMLElement>('#circle-trig')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const input = find<HTMLInputElement>('[data-angle]'), slider = find<HTMLInputElement>('[data-slider]');
const play = find<HTMLButtonElement>('[data-play]'), back = find<HTMLButtonElement>('[data-back]'), next = find<HTMLButtonElement>('[data-next]');
const diagnostic = find('[data-diagnostic]'), theme = find<HTMLButtonElement>('[data-theme]');
let angle = 45, valid = true, disposed = false, visible = true, error = '';
try { angle = readCircleUrl(new URLSearchParams(location.search)); } catch (reason) { error = String(reason) + ' Showing 45°.'; }
const clock = createKpReaderTimelinePlaybackClock({ id: 'circle-trig.reference', durationMs: 24000, initialProgress: toProgress(angle) });
// The normalized clock cannot encode every very small input without rounding.
// Retain the exact source at direct seeks; advancing playback still uses time.
let pinned = { angle, progress: toProgress(angle) };
const draw = bindCircleGraphs(root), reduced = matchMedia('(prefers-reduced-motion: reduce)');
const readouts = (['angle', 'wrapped', 'x', 'y'] as const).map((id: Readout) => ({ id, node: find(`[data-number="${id}"]`) }));
function paint() {
  if (disposed) return;
  const progress = clock.getSnapshot().progress;
  angle = progress === pinned.progress ? pinned.angle : fromProgress(progress);
  const frame = sampleCircle(angle), playing = clock.getStatus() === 'playing';
  draw(frame);
  for (const { id, node } of readouts) node.textContent = formatReadout(id, frame[id]);
  find('[data-region]').textContent = frame.region;
  slider.value = String(angle); slider.setAttribute('aria-valuetext', `${frame.angle.toFixed(1)} degrees. ${frame.region}.`);
  if (valid && document.activeElement !== input) input.value = String(angle);
  input.disabled = false; input.setAttribute('aria-invalid', String(!valid));
  slider.disabled = play.disabled = !valid; back.disabled = !valid || angle <= bounds[0]; next.disabled = !valid || angle >= bounds[1];
  play.textContent = playing ? 'Pause' : reduced.matches || !visible ? 'Next quarter' : angle >= bounds[1] ? 'Replay' : 'Play';
  root.dataset['playing'] = String(playing); root.dataset['angle'] = String(angle);
  if (valid && !playing) history.replaceState(null, '', `${location.pathname}?${new URLSearchParams({ angle: String(angle) })}`);
}
const pause = () => { clock.pause(); paint(); };
function seek(value: number) { clock.pause(); pinned = { angle: value, progress: toProgress(value) }; clock.seek(pinned.progress); paint(); }
const move = (direction: 1 | -1) => { if (valid) seek(nextQuarter(angle, direction)); };
input.onfocus = pause;
input.oninput = () => {
  valid = false; clock.pause();
  try { const value = readAngle(input.value); valid = true; diagnostic.textContent = ''; seek(value); }
  catch (reason) { diagnostic.textContent = String(reason); paint(); }
};
slider.oninput = () => { if (valid) seek(Number(slider.value)); };
back.onclick = () => move(-1); next.onclick = () => move(1);
play.onclick = () => {
  if (!valid) return;
  if (clock.getStatus() === 'playing') pause();
  else if (reduced.matches || !visible) { if (angle >= bounds[1]) seek(0); else move(1); }
  else { if (angle >= bounds[1]) seek(0); clock.play({ direction: 'forward', stopAt: toProgress(Math.min(bounds[1], (Math.floor(angle / 360) + 1) * 360)) }); paint(); }
};
theme.onclick = () => { const dark = document.documentElement.dataset['kpTheme'] !== 'dark'; document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme'; };
const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; if (!visible) pause(); else paint(); }); observer.observe(find('.figures'));
const unsubscribe = clock.subscribe(paint);
const hidden = () => { if (document.hidden) pause(); };
const leaving = (event: PageTransitionEvent) => { if (event.persisted) pause(); else dispose(); };
document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', pause); window.addEventListener('pagehide', leaving); reduced.addEventListener('change', pause);
function dispose() {
  if (disposed) return; pause(); disposed = true; unsubscribe(); clock.dispose(); observer.disconnect();
  document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', pause); window.removeEventListener('pagehide', leaving); reduced.removeEventListener('change', pause);
  input.oninput = input.onfocus = slider.oninput = null; back.onclick = next.onclick = play.onclick = theme.onclick = null;
}
paint(); diagnostic.textContent = error; root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);

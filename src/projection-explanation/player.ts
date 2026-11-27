import { createKpReaderTimelinePlaybackClock } from '../reader/runtime/timeline-playback-clock.ts';
import { sampleDotProjectionModel } from '../animation/dot-projection-model-frame.ts';
import { renderKpFocusDeckAnnotation } from '../tutorial/focus-deck-annotation.ts';
import { beatIds, cues, type prepareProjection } from './model.ts';
import { interpretation, mathHtml, notation } from './notation.ts';
import { mountProjectionGraph } from './graph.ts';
import './style.css';

type Source = ReturnType<typeof prepareProjection>;
const mounts = new WeakSet<HTMLElement>();
/** The accepted renderer has one clock per occurrence. Source admission and
 * persistence stay with the host; animation never dispatches document edits. */
export function mountProjectionPlayer(host: HTMLElement, id: string, initialProgress = 0,
  settled: (progress: number, beat: string) => void = () => {}) {
  if (mounts.has(host)) throw new Error('Dispose the existing projection player before replacing it.');
  if (!Number.isFinite(initialProgress) || initialProgress < 0 || initialProgress > 1) throw new Error('Projection progress must be between zero and one.');
  const root = document.createElement('div'); root.className = 'kp-projection';
  root.innerHTML = `<p data-diagnostic role="status"></p>
    <section data-undefined hidden><h2>No direction to project onto</h2><p>When b is zero, b · b is zero. The formula divides by zero, so this projection is undefined. Choose a nonzero b to continue.</p></section>
    <section data-view aria-label="Linked projection explanation">
      <p data-cue aria-live="polite"></p>
      <div class="comparison"><div class="evidence"><div data-notation></div><p data-interpretation></p>
        <p class="key"><span data-role="source">a · solid</span><span data-role="target">b · dashed</span><span data-role="parallel">p · parallel part</span><span data-role="residual">r · dotted remainder</span></p>
      </div><figure data-graph></figure></div>
      <div class="playback"><button data-back aria-label="Previous step">←</button><button data-play>Play</button><button data-next aria-label="Next step">→</button>
        <label>Step <select aria-label="Explanation step"></select></label>
        <input type="range" min="0" max="1" step="0.0001" value="0" aria-label="Explanation progress" />
      </div><p class="input-help">Projection coordinates are rounded for display. The diagram uses unrounded values.</p>
    </section>`;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const view = find<HTMLElement>('[data-view]'), diagnostic = find<HTMLElement>('[data-diagnostic]');
  const math = find<HTMLElement>('[data-notation]'), cue = find<HTMLElement>('[data-cue]');
  const slider = find<HTMLInputElement>('[type=range]'), steps = find<HTMLSelectElement>('select');
  const play = find<HTMLButtonElement>('[data-play]'), back = find<HTMLButtonElement>('[data-back]'), next = find<HTMLButtonElement>('[data-next]');
  for (const beat of beatIds) steps.add(new Option(cues[beat], beat));
  let source: Source | undefined, lastReady: Extract<Source, { status: 'ready' }> | undefined;
  let painted = '', disposed = false, enabled = false;
  let graph: ReturnType<typeof mountProjectionGraph> | undefined;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clock = createKpReaderTimelinePlaybackClock({ id, durationMs: 10000, initialProgress });
  const paint = () => {
    if (disposed || !lastReady) return;
    const progress = clock.getSnapshot().progress, frame = sampleDotProjectionModel(lastReady.model, progress);
    graph?.render(frame); root.dataset['beat'] = frame.semanticBeatId;
    slider.value = String(progress); steps.value = frame.semanticBeatId;
    const beat = beatIds.find(value => value === frame.semanticBeatId)!;
    slider.setAttribute('aria-valuetext', cues[beat]);
    back.disabled = !enabled || progress === 0; next.disabled = !enabled || progress === 1;
    play.disabled = slider.disabled = steps.disabled = !enabled;
    play.textContent = clock.getStatus() === 'playing' ? 'Pause' : reduced.matches ? 'Next step' : progress === 1 ? 'Replay' : 'Play';
    if (painted !== beat) {
      cue.innerHTML = renderKpFocusDeckAnnotation({ entityId: `${id}.${beat}`, text: cues[beat] });
      math.replaceChildren(...notation(lastReady.model, beat).map(latex => {
        const line = document.createElement('div'); line.innerHTML = mathHtml(latex); return line;
      }));
      painted = beat;
    }
    if (enabled && clock.getStatus() !== 'playing') settled(progress, beat);
  };
  const pause = () => { clock.pause(); paint(); };
  const seek = (value: number) => {
    if (disposed || !enabled) return;
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Projection progress must be between zero and one.');
    clock.pause(); clock.seek(value); paint();
  };
  const move = (direction: 1 | -1) => {
    if (!enabled || disposed) return;
    const progress = clock.getSnapshot().progress;
    const step = direction === 1 ? Math.floor(progress * 8 + 1e-8) + 1 : Math.ceil(progress * 8 - 1e-8) - 1;
    const target = Math.max(0, Math.min(1, step / 8)); clock.pause();
    if (reduced.matches) clock.seek(target);
    else clock.play({ direction: direction === 1 ? 'forward' : 'rewind', stopAt: target });
    paint();
  };
  steps.onchange = () => seek(beatIds.findIndex(beat => beat === steps.value) / 8);
  slider.oninput = () => seek(Number(slider.value));
  back.onclick = () => move(-1); next.onclick = () => move(1);
  play.onclick = () => {
    if (!enabled || disposed) return;
    if (clock.getStatus() === 'playing') clock.pause();
    else if (reduced.matches) { if (clock.getSnapshot().progress === 1) seek(0); else move(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: 'forward', stopAt: 1 }); }
    paint();
  };
  const hidden = () => { if (document.hidden) pause(); };
  const leaving = (event: PageTransitionEvent) => { if (event.persisted) pause(); else dispose(); };
  const unsubscribe = clock.subscribe(paint);
  const intersection = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', pause);
  window.addEventListener('pagehide', leaving); reduced.addEventListener('change', pause);
  host.append(root); mounts.add(host); intersection.observe(root);
  function dispose() {
    if (disposed) return; pause(); disposed = true;
    unsubscribe(); clock.dispose(); graph?.dispose(); intersection.disconnect();
    document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', pause);
    window.removeEventListener('pagehide', leaving); reduced.removeEventListener('change', pause);
    root.remove(); mounts.delete(host);
  }
  return { seek, pause, progress: () => clock.getSnapshot().progress, dispose,
    update(candidate: Source, valid = true) {
      if (disposed) return;
      clock.pause(); enabled = valid && candidate.status === 'ready';
      diagnostic.textContent = !valid ? 'Incomplete coordinate draft. Showing the last valid vector pair.' : candidate.status === 'ready' ? '' : candidate.message;
      if (candidate !== source && candidate.status !== 'invalid') {
        graph?.dispose(); graph = undefined; lastReady = undefined; painted = '';
        view.hidden = candidate.status === 'undefined'; find<HTMLElement>('[data-undefined]').hidden = candidate.status !== 'undefined';
        if (candidate.status === 'ready') {
          lastReady = candidate; graph = mountProjectionGraph(find('[data-graph]'), candidate.model);
          find<HTMLElement>('[data-interpretation]').textContent = interpretation(candidate.model);
        }
      }
      source = candidate;
      for (const control of [play, back, next, slider, steps]) control.disabled = !enabled;
      paint();
    }
  };
}

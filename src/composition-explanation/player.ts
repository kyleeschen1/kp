import katex from 'katex';
import { createKpReaderTimelinePlaybackClock } from '../reader/runtime/timeline-playback-clock.ts';
import { renderKpFocusDeckAnnotation } from '../tutorial/focus-deck-annotation.ts';
import { matrixObjectToLatex, createMatrixObject } from '../semantic/matrix.ts';
import { checkpoints, sampleComposition, type CompositionModel, type Pose } from './model.ts';
import { mountCompositionGraph } from './graph.ts';
import './style.css';

const mounts = new WeakSet<HTMLElement>();
/** One occurrence owns its clock; hosts own drafts, persistence and navigation. */
export function mountCompositionPlayer(host: HTMLElement, id: string, initialProgress = 0,
  changed: (progress: number, beat: string, playing: boolean) => void = () => {}) {
  if (mounts.has(host)) throw new Error('Dispose the composition player before remounting.');
  if (!Number.isFinite(initialProgress) || initialProgress < 0 || initialProgress > 1) throw new Error('Invalid initial composition progress.');
  const root = document.createElement('div'); root.className = 'kp-composition';
  root.innerHTML = `<p data-diagnostic role="status"></p>    <div class="playback"><button data-back aria-label="Previous step">←</button><button data-play>Play</button><button data-next aria-label="Next step">→</button>
      <label>Step <select aria-label="Explanation step"></select></label>
      <input type="range" min="0" max="1" step="0.001" value="0" aria-label="Explanation progress" /></div>
    <p data-cue class="kp-annotation-plane" aria-live="polite"></p>
    <div class="comparison">
      <section aria-label="A then B"><h2>A then B · BA</h2><div data-notation="left"></div><figure data-graph="left"></figure><p data-area="left"></p></section>
      <section aria-label="B then A"><h2>B then A · AB</h2><div data-notation="right"></div><figure data-graph="right"></figure><p data-area="right"></p></section>
    </div>
    <p class="key"><span data-role="basis-1">e₁ · solid</span><span data-role="basis-2">e₂ · dashed</span><span>● image of (1, 1)</span><span>Dashed outline · original square</span></p>
    <p data-conclusion></p>
    <details><summary>Why can the shapes differ but the areas agree?</summary>
      <p>A linear map scales every signed area by its determinant. Applying A then B multiplies the scale factors: det(BA) = det(B) det(A).
        The scalar factors commute, even when the matrices do not. Equal determinants therefore do not imply equal transformations.</p>
      <p>A negative determinant reverses orientation. Geometric area is the absolute value of signed area.
        A zero determinant collapses the square to a line or point; a later linear map cannot restore the lost area.</p>
      <p>The animation interpolates corresponding corners between the exact endpoint maps. It is not physical motion or a promise of invertibility in between.
        Use the three named steps to inspect the actual maps. During motion, area readouts describe the destination.</p>
      <p>Try the reflection: can you predict the final orientation in both orders? Then try collapse: can changing the second map restore area?</p>
    </details>
`;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const steps = find<HTMLSelectElement>('[aria-label="Explanation step"]');
  const slider = find<HTMLInputElement>('[type=range]'), play = find<HTMLButtonElement>('[data-play]');
  const back = find<HTMLButtonElement>('[data-back]'), next = find<HTMLButtonElement>('[data-next]');
  const diagnostic = find('[data-diagnostic]');
  for (const value of checkpoints) steps.add(new Option(value.title, value.id));
  let model: CompositionModel | undefined, enabled = false, disposed = false, visible = true, painted = '';
  let graphs: ReturnType<typeof mountCompositionGraph>[] = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clock = createKpReaderTimelinePlaybackClock({ id, durationMs: 8000, initialProgress });
  host.append(root); mounts.add(host);
  const area = (pose: Pose) => `Signed area ${pose.signedArea}; area ${Math.abs(pose.signedArea)}. ${pose.signedArea === 0 ? 'Collapsed.' : pose.signedArea < 0 ? 'Orientation reversed.' : 'Orientation preserved.'}`;
  const paint = () => {
    if (disposed || !model) return;
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
      find('[data-cue]').innerHTML = renderKpFocusDeckAnnotation({ entityId: `${id}.${frame.beat}`, text: cue });
      slider.setAttribute('aria-valuetext', `${label}${cue}`);
      for (const [side, pose, name] of [['left', frame.leftPose, frame.beat === 'unit' ? 'I' : frame.beat === 'first' ? 'A' : 'BA'], ['right', frame.rightPose, frame.beat === 'unit' ? 'I' : frame.beat === 'first' ? 'B' : 'AB']] as const) {
        const latex = matrixObjectToLatex(createMatrixObject({ id: pose.id, label: name, rows: pose.matrix }));
        find(`[data-notation=${side}]`).innerHTML = katex.renderToString(latex, { throwOnError: true, output: 'htmlAndMathml' });
        find(`[data-area=${side}]`).textContent = label + area(pose);
      }
      painted = key;
    }
    if (enabled) changed(frame.progress, frame.beat, clock.getStatus() === 'playing');
  };
  const pause = () => { clock.pause(); paint(); };
  const seek = (p: number) => { if (!enabled || disposed) return; if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error('Invalid composition progress.'); clock.pause(); clock.seek(p); paint(); };
  const move = (direction: 1 | -1) => {
    if (!enabled || disposed) return;
    const p = clock.getSnapshot().progress;
    const target = direction === 1 ? (p < .5 ? .5 : 1) : (p > .5 ? .5 : 0);
    clock.pause();
    if (reduced.matches || !visible) clock.seek(target); else clock.play({ direction: direction === 1 ? 'forward' : 'rewind', stopAt: target });
    paint();
  };

  steps.onchange = () => seek(checkpoints.find(value => value.id === steps.value)!.progress);
  slider.oninput = () => seek(Number(slider.value)); back.onclick = () => move(-1); next.onclick = () => move(1);
  play.onclick = () => {
    if (!enabled || disposed) return;
    if (clock.getStatus() === 'playing') pause();
    else if (reduced.matches || !visible) { if (clock.getSnapshot().progress === 1) seek(0); else move(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: 'forward', stopAt: 1 }); paint(); }
  };


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
    steps.onchange = slider.oninput = null; back.onclick = next.onclick = play.onclick = null;
    root.remove(); mounts.delete(host);
  }

  return { seek, pause, progress: () => clock.getSnapshot().progress, dispose,
    update(candidate: CompositionModel, valid = true) {
      if (disposed) return;
      enabled = false; clock.pause();
      diagnostic.textContent = valid ? '' : 'Incomplete matrix draft. Showing the last valid pair.';
      if (candidate !== model) {
        model = candidate; graphs.forEach(graph => graph.dispose());
        graphs = [mountCompositionGraph(find('[data-graph=left]'), model, id + '.left'),
          mountCompositionGraph(find('[data-graph=right]'), model, id + '.right')];
        find('[data-conclusion]').textContent = `det(A) = ${model.a.signedArea}; det(B) = ${model.b.signedArea}. Both products have signed-area factor ${model.ba.signedArea}. ${model.commutes ? 'These matrices commute.' : 'These matrices do not commute.'}`;
        painted = '';
      }
      enabled = valid; paint();
    }
  };
}

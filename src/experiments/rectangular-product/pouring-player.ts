import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import { readKpFocusDeckScrubberKeyTarget } from '../../tutorial/focus-deck-scaffold.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import { applyMatrixConfig, observeMatrixConfig, readMatrixConfig } from '../matrix-examples/config.ts';
import { pouringModel, pouringBeats, samplePouring } from './pouring-model.ts';
import { pouringHtml, mountPouringView, matrixLatex } from './pouring-view.ts';

export async function mountPouringPlayer(root: HTMLElement) {
  const model = pouringModel();
  document.title = 'One column in, one column out';
  document.querySelector('h1')!.textContent = 'One column in, one column out';
  document.querySelector('#matrix-story > p')!.textContent = 'C = BA. Each three-component column of A passes through both rows of B to become a two-component column of C.';
  root.classList.add('dot-player', 'matrix-player');
  const equation = `${matrixLatex(model.product.result)}=${matrixLatex(model.product.left)}${matrixLatex(model.product.right)}`;
  root.innerHTML = `<section class="matrix-card kp-focus-deck" aria-label="Columns of A passing through the rows of B">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Pouring matrix multiplication; scroll horizontally on narrow screens">${pouringHtml(model)}</div>
    <div class="matrix-controls"><button data-back>Previous</button><button data-play>Play</button><button data-next>Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select aria-label="Milestone">${pouringBeats.map((beat, i) => `<option value="${i}">${beat.id}</option>`).join('')}</select>
    <button data-theme aria-pressed="false">Light mode</button></div></section>
    <p class="matrix-help">One input column, two receiving rows, one output column. Scrub or use Next to inspect each stage. <a href="?">Compare the accepted first-cell view</a>.</p>
    <details><summary>Read the calculation</summary><div class="pour-static">${renderLatexToHtml(equation, { trust: true, output: 'htmlAndMathml' })}</div>
    <p>C = BA. Each column of A is paired with both rows of B. Working copies keep the original values; a tilted arrangement is not a transpose operation.</p></details>`;
  await document.fonts.ready;
  const view = mountPouringView(root, model);
  const clock = createKpReaderTimelinePlaybackClock({ id: `${root.id}.pouring`, durationMs: 34000 });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let config = readMatrixConfig(document), disposed = false, lastCue = '';
  const slider = root.querySelector<HTMLInputElement>('[data-scrub]')!;
  const chooser = root.querySelector<HTMLSelectElement>('select')!;
  const play = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const back = root.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const theme = root.querySelector<HTMLButtonElement>('[data-theme]')!;
  const stepsOnly = () => reduced.matches || config.motion === 'steps';
  const render = () => {
    if (disposed) return;
    const frame = samplePouring(clock.getSnapshot().progress); view.render(frame.progress);
    slider.value = String(frame.progress); slider.setAttribute('aria-valuetext', frame.beat.cue);
    chooser.value = String(frame.index); root.dataset['milestone'] = frame.beat.id;
    back.disabled = frame.progress === 0; next.disabled = frame.progress === 1;
    play.textContent = clock.getStatus() === 'playing' ? 'Pause' : stepsOnly() ? 'Next step' : frame.progress === 1 ? 'Replay' : 'Play';
    theme.setAttribute('aria-pressed', String(config.theme === 'light'));
    if (frame.beat.id !== lastCue) {
      root.querySelector('[data-cue]')!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.beat.id, text: frame.beat.cue }); lastCue = frame.beat.id;
    }
  };
  const go = (index: number, animate = false) => {
    const i = Math.max(0, Math.min(pouringBeats.length - 1, index)), target = i / (pouringBeats.length - 1);
    clock.pause(); history.replaceState(null, '', `${location.pathname}${location.search}#${pouringBeats[i]!.id}`);
    if (animate && !stepsOnly()) clock.play({ direction: target < clock.getSnapshot().progress ? 'rewind' : 'forward', stopAt: target });
    else clock.seek(target);
    render();
  };
  const navigate = (offset: number) => {
    const phase = clock.getSnapshot().progress * (pouringBeats.length - 1);
    go(offset > 0 ? Math.floor(phase + 1e-8) + 1 : Math.ceil(phase - 1e-8) - 1, true);
  };
  const unsubscribe = clock.subscribe(render);
  slider.oninput = () => clock.seek(Number(slider.value));
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, clock.getSnapshot().progress * (pouringBeats.length - 1), pouringBeats.length);
    if (target !== undefined) { event.preventDefault(); go(target); }
  };
  chooser.onchange = () => go(Number(chooser.value));
  back.onclick = () => navigate(-1); next.onclick = () => navigate(1);
  play.onclick = () => {
    if (clock.getStatus() === 'playing') clock.pause();
    else if (stepsOnly()) { if (clock.getSnapshot().progress === 1) go(0); else navigate(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: 'forward', stopAt: 1 }); }
    render();
  };
  theme.onclick = () => applyMatrixConfig(document, { ...config, theme: config.theme === 'light' ? 'dark' : 'light' });
  const resize = () => { if (disposed) return; clock.pause(); view.prepare(); render(); };
  const stopConfig = observeMatrixConfig(document, nextConfig => { config = nextConfig; resize(); });
  const restore = () => { const index = pouringBeats.findIndex(beat => beat.id === location.hash.slice(1)); go(Math.max(0, index)); };
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (stepsOnly()) go(samplePouring(clock.getSnapshot().progress).index); render(); };
  const stage = root.querySelector<HTMLElement>('.pour-stage')!;
  let width = stage.clientWidth;
  const observer = new ResizeObserver(() => { if (width !== stage.clientWidth) { width = stage.clientWidth; resize(); } }); observer.observe(stage);
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { clock.pause(); render(); } else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  window.addEventListener('hashchange', restore); window.addEventListener('pagehide', pagehide); window.addEventListener('pageshow', pageshow);
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', motion);
  const dispose = () => {
    if (disposed) return; disposed = true;
    unsubscribe(); stopConfig(); observer.disconnect(); clock.dispose(); view.dispose();
    window.removeEventListener('hashchange', restore); window.removeEventListener('pagehide', pagehide); window.removeEventListener('pageshow', pageshow);
    document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion);
    slider.oninput = slider.onkeydown = chooser.onchange = null;
    back.onclick = next.onclick = play.onclick = theme.onclick = null;
    delete root.dataset['ready'];
  };
  restore(); root.dataset['ready'] = 'true'; root.setAttribute('aria-busy', 'false');
  return dispose;
}

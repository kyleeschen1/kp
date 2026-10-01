import './style.css';
import { passage } from '../dot-product-passage/source.ts';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { explanation } from './source.ts';
import { KpTutorialPageScrollCoordinator } from '../../tutorial/kp-tutorial-page-scroll-coordinator.ts';
import { projectKpTutorialRebasedCorridor } from '../../tutorial/kp-tutorial-motion.ts';
import { discourseCorridor, discourseProgress } from './scroll.ts';

const root = document.querySelector<HTMLElement>('#discourse-player')!;
const stage = document.querySelector<HTMLElement>('.discourse-stage')!;
const sections = explanation.children.map(step => {
  const node = document.getElementById(step.id);
  if (!node) throw new Error(`Missing discourse occurrence: ${step.id}`);
  node.dataset['sourceIds'] = step.refs.map(ref => ref.id).join(' ');
  return node;
});
const detour = document.querySelector<HTMLDetailsElement>('#why-pair')!;
const returnButton = document.querySelector<HTMLButtonElement>('[data-return]')!;
let disposed = false;
let cleanup = () => {};
if (new URLSearchParams(location.search).get('view') === 'attention-card') {
  void import('./attention-card.ts').then(module => module.mountUnifiedAttention(root)).then(dispose => {
    if (disposed) dispose(); else cleanup = dispose;
  }).catch(error => { root.textContent = `Attention card unavailable: ${String(error)}`; });
} else void mountDotPlayer(root, passage).then(player => {
  if (disposed) { player(); return; }
  let active = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const anchors = sections.map(section => section.querySelector<HTMLElement>('h2')!);
  const readingLine = () => matchMedia('(max-width: 850px)').matches
    ? stage.getBoundingClientRect().height + 35 : innerHeight * .36;
  let manual: { y: number; progress: number; rebased: boolean } | undefined;
  let bookmark: { y: number; progress: number; active: number } | undefined;
  const mark = (index: number) => {
    active = index;
    sections.forEach((node, i) => i === index ? node.setAttribute('aria-current', 'step') : node.removeAttribute('aria-current'));
    root.dataset['readingStep'] = explanation.children[index]!.id;
  };
  const coordinator = new KpTutorialPageScrollCoordinator(window,
    () => anchors.map((anchor, i) => ({
      id: explanation.children[i]!.id, passageId: explanation.children[i]!.id,
      blockId: `dot.${explanation.children[i]!.id}`, anchor,
      corridor: { startViewportRatio: 1, endViewportRatio: 0, keyframes: [{ travel: 0, progress: 0 }, { travel: 1, progress: 1 }] },
    })),
    projection => {
      if (bookmark || detour.open) return;
      const line = readingLine();
      root.dataset['readingLine'] = String(line);
      // The shared coordinator caches document geometry and owns the sole
      // scroll sampler. Like Glance, landings define the edges between nodes.
      const landings = explanation.children.map(step => {
        const block = projection.blocks.find(block => block.id === step.id);
        if (!block) throw new Error(`Missing scroll registration: ${step.id}`);
        return block.anchorTop + projection.scrollY - line;
      });
      let progress = discourseProgress(landings, projection.scrollY, reduced.matches);
      if (manual) {
        if (!manual.rebased && Math.abs(projection.scrollY - manual.y) < .5) return;
        if (!manual.rebased) { manual.progress = player.progress(); manual.rebased = true; player.pause(); }
        const geometry = discourseCorridor(landings);
        const rebased = projectKpTutorialRebasedCorridor({
          corridor: geometry.corridor, rawTravelAtTakeover: (manual.y - geometry.start) / geometry.span,
          manualProgress: manual.progress, rawTravel: (projection.scrollY - geometry.start) / geometry.span,
        });
        progress = reduced.matches ? Math.round(rebased.progress * 4) / 4 : rebased.progress;
        if (rebased.travel <= 0 || rebased.travel >= 1) manual = undefined;
      }
      player.seek(progress);
      const index = Math.round(progress * 4);
      mark(index);
      root.dataset['scrollPhase'] = Math.abs(progress * 4 - index) < 1e-7 ? 'reading' : 'transition';
      if (projection.scrollChanged) history.replaceState(null, '', `#${explanation.children[index]!.id}`);
    }, { projectionNeighborhoodRadius: 5 });
  const claimManual = () => { manual = { y: window.scrollY, progress: player.progress(), rebased: false }; };
  const restore = () => {
    const index = explanation.children.findIndex(step => step.id === location.hash.slice(1));
    if (index < 0) return;
    // A direct link exits any local excursion and addresses a settled state.
    bookmark = undefined; detour.open = false;
    player.go(explanation.children[index]!.milestone, false); mark(index);
    window.scrollTo({ top: window.scrollY + anchors[index]!.getBoundingClientRect().top - readingLine(), behavior: 'instant' });
    claimManual(); coordinator.invalidateGeometry();
  };
  const toggle = () => {
    if (detour.open) {
      bookmark = { y: window.scrollY, progress: player.progress(), active };
      player.pause(); root.inert = true;
    } else if (bookmark) {
      const saved = bookmark; bookmark = undefined;
      player.seek(saved.progress); mark(saved.active);
      window.scrollTo({ top: saved.y, behavior: 'instant' });
      claimManual(); coordinator.invalidateGeometry();
      detour.querySelector('summary')!.focus({ preventScroll: true });
    }
    root.inert = detour.open;
  };
  const inspect = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    // A repeated link has no hashchange event, but still requests its milestone.
    if (link && link.hash === location.hash) { event.preventDefault(); restore(); }
  };
  returnButton.onclick = () => { detour.open = false; };
  detour.addEventListener('toggle', toggle);
  root.addEventListener('input', claimManual);
  root.addEventListener('change', claimManual);
  root.addEventListener('click', claimManual);
  window.addEventListener('hashchange', restore);
  document.addEventListener('click', inspect);
  const geometry = new ResizeObserver(() => coordinator.invalidateGeometry());
  geometry.observe(document.querySelector('.discourse-prose')!); geometry.observe(stage);
  const motion = () => { manual = undefined; player.pause(); coordinator.scheduleProjection(); };
  reduced.addEventListener('change', motion);
  mark(0); coordinator.connect(); restore();
  root.dataset['scrollReady'] = 'true';
  cleanup = () => {
    coordinator.disconnect(); geometry.disconnect(); player(); root.inert = false;
    root.removeEventListener('input', claimManual); root.removeEventListener('change', claimManual); root.removeEventListener('click', claimManual);
    reduced.removeEventListener('change', motion);
    window.removeEventListener('hashchange', restore);
    document.removeEventListener('click', inspect);
    detour.removeEventListener('toggle', toggle); returnButton.onclick = null;
    delete root.dataset['scrollReady'];
  };
}).catch(error => {
  root.setAttribute('aria-busy', 'false');
  root.textContent = `Animation unavailable: ${error instanceof Error ? error.message : String(error)}. The explanation remains readable below.`;
});
const dispose = () => { if (disposed) return; disposed = true; cleanup(); };
const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
window.addEventListener('pagehide', pagehide);
import.meta.hot?.dispose(() => { dispose(); window.removeEventListener('pagehide', pagehide); });

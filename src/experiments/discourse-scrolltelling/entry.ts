import './style.css';
import { passage } from '../dot-product-passage/source.ts';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { explanation } from './source.ts';

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
void mountDotPlayer(root, passage).then(player => {
  if (disposed) { player(); return; }
  let active = 0, frame = 0, lastY = window.scrollY;
  let bookmark: { y: number; progress: number; active: number } | undefined;
  const mark = (index: number) => {
    active = index;
    sections.forEach((node, i) => i === index ? node.setAttribute('aria-current', 'step') : node.removeAttribute('aria-current'));
    root.dataset['readingStep'] = explanation.children[index]!.id;
  };
  const choose = (index: number, animate: boolean) => {
    // Jumps skip intermediate stories. Only adjacent beats play the existing
    // bounded transition; new scroll targets replace, rather than queue, it.
    player.go(explanation.children[index]!.milestone, animate && Math.abs(index - active) === 1);
    mark(index);
    history.replaceState(null, '', `#${explanation.children[index]!.id}`);
  };
  const readScroll = () => {
    frame = 0;
    if (bookmark || window.scrollY === lastY) return;
    lastY = window.scrollY;
    const line = matchMedia('(max-width: 850px)').matches
      ? stage.getBoundingClientRect().bottom + 35 : innerHeight * .3;
    let index = 0;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= line) index = i; });
    if (index !== active) choose(index, true);
  };
  const scroll = () => { if (!frame) frame = requestAnimationFrame(readScroll); };
  const restore = () => {
    const index = explanation.children.findIndex(step => step.id === location.hash.slice(1));
    if (index < 0) return;
    // A direct link exits any local excursion and addresses a settled state.
    bookmark = undefined; detour.open = false;
    choose(index, false);
    sections[index]!.scrollIntoView({ block: 'start', behavior: 'instant' });
    lastY = window.scrollY;
  };
  const toggle = () => {
    if (detour.open) {
      bookmark = { y: window.scrollY, progress: player.progress(), active };
      player.pause(); root.inert = true;
    } else if (bookmark) {
      const saved = bookmark; bookmark = undefined;
      player.seek(saved.progress); mark(saved.active);
      lastY = saved.y; window.scrollTo({ top: saved.y, behavior: 'instant' });
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
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('hashchange', restore);
  document.addEventListener('click', inspect);
  mark(0); restore();
  root.dataset['scrollReady'] = 'true';
  cleanup = () => {
    cancelAnimationFrame(frame); player(); root.inert = false;
    window.removeEventListener('scroll', scroll); window.removeEventListener('hashchange', restore);
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

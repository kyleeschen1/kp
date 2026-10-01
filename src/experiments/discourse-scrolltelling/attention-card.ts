import './attention-card.css';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { passage } from '../dot-product-passage/source.ts';
import { KpTutorialPageScrollCoordinator } from '../../tutorial/kp-tutorial-page-scroll-coordinator.ts';
import { pairingAttentionCorridor, pairingAttentionFrame } from './attention-card-model.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';

/** One reversible presentation experiment; the retained dot stage still owns
 * every glyph, semantic occurrence and mathematical transition. */
export async function mountPairingAttentionCard(root: HTMLElement) {
  const layout = document.querySelector<HTMLElement>('.discourse-layout')!;
  const prose = document.querySelector<HTMLElement>('.discourse-prose')!;
  const originalHeader = document.querySelector<HTMLElement>('#discourse-story header')!;
  const reading = document.createElement('details');
  reading.className = 'attention-reading';
  reading.innerHTML = '<summary>Read the complete explanation</summary>';
  layout.after(reading); reading.append(prose);
  const proseLinks = [...prose.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map(link => ({ link, href: link.getAttribute('href')! }));
  for (const { link } of proseLinks) link.href = `./${link.hash}`;
  const reason = prose.querySelector<HTMLDetailsElement>('#why-pair')!;
  const returnButton = prose.querySelector<HTMLButtonElement>('[data-return]')!;
  returnButton.onclick = () => { reason.open = false; reason.querySelector('summary')!.focus({ preventScroll: true }); };
  document.documentElement.dataset['discourseView'] = 'attention-card';
  originalHeader.hidden = true;
  const player = await mountDotPlayer(root, passage);
  const card = root.querySelector<HTMLElement>('.matrix-card')!;
  const annotation = document.createElement('div');
  annotation.className = 'attention-annotation';
  const title = (entityId: string, text: string) => renderKpFocusDeckAnnotation({ entityId, text });
  annotation.innerHTML = `
    <div data-attention-panel="read"><p class="attention-eyebrow">One entry / match its inputs</p>${title('pairing.read', 'Each position has a partner.')}<p>First with first. Second with second. Third with third.</p><p class="attention-hint">Scroll to follow the pairing.</p></div>
    <div data-attention-panel="watch" hidden><p class="attention-eyebrow">Look to the equation</p>${title('pairing.watch', 'Watch the column turn.')}<p>The same entries will meet their partners.</p></div>
    <div data-attention-panel="move" hidden><label for="pairing-progress">Pair the entries</label><input id="pairing-progress" aria-label="Pairing progress" type="range" min="0" max="1" step="0.001" value="0"><p class="attention-hint">Scroll or drag. Reverse to retrace the motion.</p></div>
    <div data-attention-panel="inspect" hidden><p class="attention-eyebrow">Pairing complete</p>${title('pairing.inspect', 'Same entries. Three pairs.')}<p>2 with 4, −1 with 5, and 3 with −2.</p><p>Multiplication comes next.</p><a href="./#pair">Continue the full explanation →</a></div>`;
  card.append(annotation);
  const back = document.createElement('a');
  back.className = 'attention-back'; back.href = './'; back.textContent = '← Split-view comparison'; card.append(back);
  const slider = annotation.querySelector<HTMLInputElement>('input')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const anchors = { read: 0, watch: .25, move: .55, inspect: .9 } as const;
  let disposed = false;
  const top = () => layout.getBoundingClientRect().top + scrollY;
  const seekTravel = (travel: number) => window.scrollTo({ top: top() + travel * innerHeight * 3, behavior: 'instant' });
  const render = (travel: number) => {
    const frame = pairingAttentionFrame(travel, reduced.matches);
    player.seek(frame.progress / 4);
    root.dataset['attentionPhase'] = frame.phase;
    slider.value = String(frame.progress);
    slider.setAttribute('aria-valuetext', `${Math.round(frame.progress * 100)}% paired`);
    for (const panel of annotation.querySelectorAll<HTMLElement>('[data-attention-panel]')) {
      panel.hidden = panel.dataset['attentionPanel'] !== frame.phase;
    }
  };
  const coordinator = new KpTutorialPageScrollCoordinator(window, () => [{
    id: 'pairing-attention', passageId: 'pair', blockId: 'dot.pairs', anchor: layout, corridor: pairingAttentionCorridor,
  }], projection => {
    if (disposed) return;
    const block = projection.blocks[0];
    if (block) render(block.travel);
  });
  slider.oninput = () => {
    // Move the document to the same corridor position, so scroll and dragging
    // have one geometric authority and cannot hand back at different progress.
    const travel = .3 + Number(slider.value) * .5;
    render(travel); seekTravel(travel);
  };
  const restore = () => {
    const phase = location.hash.replace('#attention-', '');
    if (phase === 'read' || phase === 'watch' || phase === 'move' || phase === 'inspect') seekTravel(anchors[phase]);
  };
  const motion = () => coordinator.scheduleProjection();
  window.addEventListener('hashchange', restore); reduced.addEventListener('change', motion);
  const resize = new ResizeObserver(() => coordinator.invalidateGeometry()); resize.observe(layout);
  render(0); coordinator.connect(); restore();
  root.dataset['attentionReady'] = 'true';
  return () => {
    if (disposed) return; disposed = true;
    coordinator.disconnect(); resize.disconnect(); player(); slider.oninput = null;
    window.removeEventListener('hashchange', restore); reduced.removeEventListener('change', motion);
    returnButton.onclick = null;
    for (const { link, href } of proseLinks) link.setAttribute('href', href);
    annotation.remove(); back.remove(); layout.append(prose); reading.remove(); originalHeader.hidden = false;
    delete document.documentElement.dataset['discourseView']; delete root.dataset['attentionReady']; delete root.dataset['attentionPhase'];
  };
}

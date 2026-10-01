import './attention-card.css';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { passage } from '../dot-product-passage/source.ts';
import { KpTutorialPageScrollCoordinator } from '../../tutorial/kp-tutorial-page-scroll-coordinator.ts';
import { attentionComments, attentionCorridor, attentionFrame, attentionTravel } from './attention-card-model.ts';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';

/** Local presentation experiment: the retained dot renderer owns all math. */
export async function mountUnifiedAttention(root: HTMLElement) {
  const layout = document.querySelector<HTMLElement>('.discourse-layout')!;
  const prose = document.querySelector<HTMLElement>('.discourse-prose')!;
  const header = document.querySelector<HTMLElement>('#discourse-story header')!;
  const reading = document.createElement('details');
  reading.className = 'attention-reading';
  reading.innerHTML = '<summary>Read the complete explanation</summary>';
  layout.after(reading); reading.append(prose);
  const links = [...prose.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map(link => ({ link, href: link.getAttribute('href')! }));
  for (const { link } of links) link.href = `./${link.hash}`;
  const reason = prose.querySelector<HTMLDetailsElement>('#why-pair')!;
  const returnButton = prose.querySelector<HTMLButtonElement>('[data-return]')!;
  returnButton.onclick = () => { reason.open = false; reason.querySelector('summary')!.focus({ preventScroll: true }); };
  document.documentElement.dataset['discourseView'] = 'attention-card'; header.hidden = true;
  const player = await mountDotPlayer(root, passage);
  const card = root.querySelector<HTMLElement>('.matrix-card')!;
  const track = document.createElement('nav');
  track.className = 'attention-track'; track.setAttribute('aria-label', 'Calculation commentary');
  track.innerHTML = attentionComments.map((comment, index) => `<div class="attention-comment" data-comment="${comment.id}">
    <button type="button" data-select="${index}">${renderKpFocusDeckAnnotation({ entityId: comment.id, text: comment.text })}</button>
    ${comment.kind === 'transform' ? `<input data-motion="${index}" aria-label="${comment.id === 'multiply' ? 'Multiplication' : 'Addition'} progress" type="range" min="0" max="1" step="0.001" value="0" hidden>` : ''}</div>`).join('');
  card.append(track);
  const back = document.createElement('a');
  back.className = 'attention-back'; back.href = './'; back.textContent = '← Full explanation'; card.append(back);
  const hint = document.createElement('p'); hint.className = 'attention-hint';
  hint.textContent = 'Scroll to read and inspect. The divider marks the active comment.'; card.append(hint);
  const rows = [...track.querySelectorAll<HTMLElement>('.attention-comment')];
  rows.forEach((row, index) => { row.dataset['sourceIds'] = attentionComments[index]!.refs.map(ref => ref.id).join(' '); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  const seekTravel = (travel: number) => window.scrollTo({ top: layout.getBoundingClientRect().top + scrollY + travel * innerHeight * 3, behavior: 'instant' });
  const clearFocus = () => root.querySelectorAll('[data-attention-sign]').forEach(node => node.removeAttribute('data-attention-sign'));
  const render = (travel: number) => {
    const frame = attentionFrame(travel, reduced.matches);
    player.seek(frame.progress);
    root.dataset['attentionPhase'] = frame.phase; root.dataset['attentionComment'] = frame.comment.id;
    clearFocus();
    // The focus beat addresses existing products and their native sign role;
    // it does not introduce another mathematical state or replacement glyph.
    if (frame.comment.kind === 'focus') for (const ref of frame.comment.refs) {
      root.querySelectorAll(`[data-source-id="${CSS.escape(ref.id)}"] .dot-negative-sign`).forEach(node => node.setAttribute('data-attention-sign', ''));
    }
    rows.forEach((row, index) => {
      const active = frame.index === index;
      row.toggleAttribute('data-active', active);
      const button = row.querySelector('button')!;
      if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      const slider = row.querySelector('input');
      if (slider) { slider.hidden = !active; slider.value = String(frame.motion); slider.setAttribute('aria-valuetext', `${Math.round(frame.motion * 100)}% complete`); }
    });
  };
  const coordinator = new KpTutorialPageScrollCoordinator(window, () => [{
    id: 'unified-attention', passageId: 'dot', blockId: 'dot.commentary', anchor: layout, corridor: attentionCorridor,
  }], projection => { if (!disposed && projection.blocks[0]) render(projection.blocks[0].travel); });
  rows.forEach((row, index) => {
    row.querySelector('button')!.onclick = () => {
      history.replaceState(null, '', `#attention-${attentionComments[index]!.id}`);
      const travel = attentionTravel(index); render(travel); seekTravel(travel);
    };
    const slider = row.querySelector('input');
    if (slider) slider.oninput = () => {
      // Drag and scroll share the same physical corridor authority.
      const travel = attentionTravel(index, Number(slider.value)); render(travel); seekTravel(travel);
    };
  });
  const restore = () => { const index = attentionComments.findIndex(comment => location.hash === `#attention-${comment.id}`); if (index >= 0) seekTravel(attentionTravel(index)); };
  const motion = () => coordinator.scheduleProjection();
  window.addEventListener('hashchange', restore); reduced.addEventListener('change', motion);
  const resize = new ResizeObserver(() => coordinator.invalidateGeometry()); resize.observe(layout);
  render(0); coordinator.connect(); restore(); root.dataset['attentionReady'] = 'true';
  return () => {
    if (disposed) return; disposed = true;
    coordinator.disconnect(); resize.disconnect(); clearFocus(); player();
    window.removeEventListener('hashchange', restore); reduced.removeEventListener('change', motion);
    returnButton.onclick = null;
    for (const { link, href } of links) link.setAttribute('href', href);
    track.remove(); back.remove(); hint.remove(); layout.append(prose); reading.remove(); header.hidden = false;
    delete document.documentElement.dataset['discourseView'];
    delete root.dataset['attentionReady']; delete root.dataset['attentionPhase']; delete root.dataset['attentionComment'];
  };
}

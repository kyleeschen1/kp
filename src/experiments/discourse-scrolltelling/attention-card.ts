import './attention-card.css';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { passage } from '../dot-product-passage/source.ts';
import { KpTutorialPageScrollCoordinator } from '../../tutorial/kp-tutorial-page-scroll-coordinator.ts';
import { attentionComments, attentionCorridor, revealFrame, type RevealBoundary } from './attention-card-model.ts';
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
  const track = document.createElement('article');
  track.className = 'attention-track kp-focus-deck'; track.setAttribute('aria-label', 'Calculation commentary');
  track.innerHTML = attentionComments.map((comment, index) => `<section class="attention-comment" data-comment="${comment.id}"><div class="attention-copy">
    <button type="button" data-select="${index}">${renderKpFocusDeckAnnotation({ entityId: comment.id, text: comment.text })}</button>
    ${comment.kind === 'transform' ? `<input data-motion="${index}" aria-label="${comment.id === 'pair' ? 'Pairing' : comment.id === 'multiply' ? 'Multiplication' : 'Addition'} progress" type="range" min="0" max="1" step="0.001" value="0" hidden>` : ''}</div></section>`).join('');
  layout.append(track);
  const end = document.createElement('div'); end.className = 'attention-end'; track.append(end);
  const back = document.createElement('a');
  back.className = 'attention-back'; back.href = './'; back.textContent = '← Full explanation'; card.append(back);
  const hint = document.createElement('p'); hint.className = 'attention-hint';
  hint.textContent = 'Scroll to read, uncover the calculation, and watch it change.'; card.append(hint);
  const rows = [...track.querySelectorAll<HTMLElement>('.attention-comment')];
  rows.forEach((row, index) => {
    const comment = attentionComments[index]!;
    row.dataset['sourceIds'] = comment.refs.map(ref => ref.id).join(' ');
    row.dataset['form'] = comment.paragraphs ? 'prose' : 'brief';
    const copy = row.querySelector<HTMLElement>('.attention-copy')!;
    for (const text of comment.paragraphs ?? []) { const p = document.createElement('p'); p.dataset['kpFocusDeckType'] = 'support'; p.textContent = text; copy.insertBefore(p, copy.querySelector('input')); }
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let boundaries: RevealBoundary[] = [];
  const geometry = (tops: readonly number[]) => {
    const stageHeight = root.querySelector<HTMLElement>('.dot-stage')!.getBoundingClientRect().height;
    const stageTop = (innerHeight - stageHeight) / 2;
    return rows.map((row, index) => {
      const copy = row.querySelector<HTMLElement>('.attention-copy')!;
      const height = copy.getBoundingClientRect().height;
      const top = stageTop - height - 24;
      copy.style.setProperty('--attention-copy-top', `${top}px`);
      const clear = tops[index]! - top;
      return { start: tops[index]! - innerHeight / 2, clear, end: clear + innerHeight * .35 };
    });
  };
  const seek = (index: number, motion?: number) => {
    boundaries = geometry(rows.map(row => row.getBoundingClientRect().top + scrollY));
    const b = boundaries[index]!;
    // Native scroll positions round to pixels; land inside the addressed span.
    const y = motion === undefined ? Math.ceil(b.start) : Math.ceil(b.clear + (b.end - b.clear) * motion);
    render(y); window.scrollTo({ top: y, behavior: 'instant' });
  };
  const clearFocus = () => root.querySelectorAll('[data-attention-sign]').forEach(node => node.removeAttribute('data-attention-sign'));
  const render = (y: number) => {
    const frame = revealFrame(boundaries, y, reduced.matches);
    player.seek(frame.progress);
    root.dataset['attentionPhase'] = frame.phase; root.dataset['attentionComment'] = frame.comment.id;
    clearFocus();
    // The focus beat addresses existing products and their native sign role;
    // it does not introduce another mathematical state or replacement glyph.
    if (frame.cleared && frame.comment.kind === 'focus') for (const ref of frame.comment.refs) {
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
  const coordinator = new KpTutorialPageScrollCoordinator(window, () => [...rows, end].map((anchor, index) => ({
    id: String(index), passageId: 'dot', blockId: `dot.commentary.${index}`, anchor, corridor: attentionCorridor,
  })), projection => {
    if (disposed) return;
    const positions = rows.map((_, index) => {
      const block = projection.blocks.find(block => block.id === String(index));
      if (!block) throw new Error('Missing commentary scroll boundary.');
      return block.anchorTop + projection.scrollY;
    });
    boundaries = geometry(positions); render(projection.scrollY);
  }, { projectionNeighborhoodRadius: attentionComments.length + 1 });
  rows.forEach((row, index) => {
    row.querySelector('button')!.onclick = () => {
      history.replaceState(null, '', `#attention-${attentionComments[index]!.id}`);
      seek(index);
    };
    const slider = row.querySelector('input');
    if (slider) slider.oninput = () => {
      // Drag and scroll share the same physical corridor authority.
      seek(index, Number(slider.value));
    };
  });
  const restore = () => { const index = attentionComments.findIndex(comment => location.hash === `#attention-${comment.id}`); if (index >= 0) seek(index); };
  const motion = () => coordinator.scheduleProjection();
  window.addEventListener('hashchange', restore); reduced.addEventListener('change', motion);
  const resize = new ResizeObserver(() => coordinator.invalidateGeometry()); resize.observe(track); rows.forEach(row => resize.observe(row.querySelector('.attention-copy')!));
  boundaries = geometry(rows.map(row => row.getBoundingClientRect().top + scrollY));
  render(scrollY); coordinator.connect(); restore(); root.dataset['attentionReady'] = 'true';
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

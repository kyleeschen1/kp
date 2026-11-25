import type { EditorView } from 'prosemirror-view';
export type LineMode = 'off' | 'absolute' | 'relative';
/** The gutter measures wrapped prose lines; it never inserts numbering into
 * document content or assigns persistent identity to layout coordinates. */
export function mountLineNumbers(host: HTMLElement, view: EditorView) {
  let mode: LineMode = 'off', pending = 0;
  const gutter = document.createElement('div'); gutter.className = 'fn-line-gutter'; gutter.setAttribute('aria-hidden', 'true'); host.append(gutter);
  const draw = () => {
    pending = 0; gutter.replaceChildren(); if (mode === 'off' || !view.dom.isConnected) return;
    const container = host.getBoundingClientRect(), prose = view.dom.getBoundingClientRect();
    const lines: { top: number; height: number }[] = [];
    for (const block of view.dom.querySelectorAll<HTMLElement>('.fn-block-content > p, .fn-block-title, .fn-article-header h1, .fn-author, .fn-caption > p')) {
      if (!block.getClientRects().length) continue;
      const tops: { top: number; height: number }[] = [];
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent || node.parentElement?.closest('.fn-inline-object')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) if (rect.width && !tops.some(line => Math.abs(line.top - rect.top) < 4)) tops.push({ top: rect.top, height: rect.height });
      }
      if (!tops.length) { const rect = block.getBoundingClientRect(); tops.push({ top: rect.top, height: Math.min(rect.height, parseFloat(getComputedStyle(block).lineHeight) || 24) }); }
      lines.push(...tops.sort((a, b) => a.top - b.top));
    }
    const caret = view.coordsAtPos(view.state.selection.head);
    let active = lines.findIndex(line => caret.top >= line.top - 4 && caret.top <= line.top + line.height);
    if (active < 0) active = 0;
    lines.forEach((line, index) => {
      if (line.top + line.height < container.top || line.top > container.bottom) return;
      const number = document.createElement('span'); number.textContent = String(mode === 'relative' && index !== active ? Math.abs(index - active) : index + 1);
      number.dataset['current'] = String(index === active);
      Object.assign(number.style, { top: `${line.top - container.top + host.scrollTop}px`, left: `${prose.left - container.left - 36}px`, height: `${line.height}px` }); gutter.append(number);
    });
  };
  const schedule = () => { if (!pending) pending = requestAnimationFrame(draw); };
  const resize = new ResizeObserver(schedule); resize.observe(view.dom);
  const mutation = new MutationObserver(schedule); mutation.observe(view.dom, { childList: true, characterData: true, attributes: true, subtree: true });
  document.addEventListener('selectionchange', schedule); host.addEventListener('scroll', schedule, { passive: true }); schedule();
  return { set(value: LineMode) { mode = value; schedule(); }, dispose() { cancelAnimationFrame(pending); resize.disconnect(); mutation.disconnect(); document.removeEventListener('selectionchange', schedule); host.removeEventListener('scroll', schedule); gutter.remove(); } };
}

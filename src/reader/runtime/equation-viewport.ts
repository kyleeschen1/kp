/** Native math can extend beyond its fixed line box (fractions, scripts and
 * delimiters). Measure that extent at the current font size, not a CSS height. */
export function equationViewportBounds(element: HTMLElement) {
  const boxes = [element, ...element.querySelectorAll<HTMLElement>('.katex-html .base, .katex-html .vlist, [data-kp-equation-material-owner-id]')]
    .map(node => node.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0);
  if (!boxes.length) return element.getBoundingClientRect();
  return { top: Math.min(...boxes.map(box => box.top)), bottom: Math.max(...boxes.map(box => box.bottom)) };
}

export function revealEquationInViewport(element: HTMLElement) {
  const win = element.ownerDocument.defaultView!;
  const box = equationViewportBounds(element);
  const margin = Math.min(48, win.innerHeight / 4);
  // An expression taller than the available viewport cannot fit at both ends.
  // Align its start once; never oscillate between incompatible constraints.
  const delta = box.top < margin || box.bottom - box.top > win.innerHeight - 2 * margin
    ? box.top - margin : box.bottom > win.innerHeight - margin ? box.bottom - win.innerHeight + margin : 0;
  if (Math.abs(delta) > .5) win.scrollBy({ top: delta, behavior: 'instant' });
}

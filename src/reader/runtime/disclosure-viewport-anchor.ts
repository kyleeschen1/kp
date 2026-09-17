const activeAnchors = new WeakMap<Document, () => void>();

/** One temporary scroll owner per document. Layout may settle over several
 * tasks, but the next reader/navigation action always takes ownership back. */
export function holdDisclosureViewportAnchor(initial: HTMLElement, signal?: AbortSignal) {
  const doc = initial.ownerDocument, win = doc.defaultView!;
  activeAnchors.get(doc)?.();
  const abort = new AbortController(), options = { capture: true, signal: abort.signal };
  let element = initial, top = initial.getBoundingClientRect().top;
  let live = true, expectedScroll = win.scrollY;
  const style = doc.documentElement.style;
  const previous = style.getPropertyValue('overflow-anchor'), priority = style.getPropertyPriority('overflow-anchor');
  // Browser anchoring must not independently compensate the same reflow.
  style.setProperty('overflow-anchor', 'none');
  const correct = () => {
    if (!live || !element.isConnected) return;
    const delta = element.getBoundingClientRect().top - top;
    if (Math.abs(delta) > .5) win.scrollBy({ top: delta, behavior: 'instant' });
    expectedScroll = win.scrollY;
  };
  // ResizeObserver runs before paint. Deferring to another frame would expose
  // one displaced frame every time renderer preparation changes the layout.
  const resize = new ResizeObserver(correct);
  const observe = () => {
    resize.disconnect();
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) resize.observe(ancestor);
  };
  const release = () => {
    if (!live) return;
    live = false; resize.disconnect(); abort.abort();
    if (style.getPropertyValue('overflow-anchor') === 'none') {
      if (previous) style.setProperty('overflow-anchor', previous, priority);
      else style.removeProperty('overflow-anchor');
    }
    if (activeAnchors.get(doc) === release) activeAnchors.delete(doc);
  };
  activeAnchors.set(doc, release);
  for (const event of ['pointerdown', 'wheel', 'touchstart', 'keydown']) doc.addEventListener(event, release, options);
  // Capture-phase blur also sees focus moving between controls. Only leaving
  // the window should cancel an otherwise valid focus/anchor transfer.
  for (const event of ['blur', 'pagehide', 'hashchange', 'popstate']) win.addEventListener(event, release, { signal: abort.signal });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) release(); }, options);
  // AT or programmatic scrolling may not have a preceding input event.
  win.addEventListener('scroll', () => {
    // Replacing the old view may clamp document scroll before its successor
    // is ready. User input still cancels during that transfer.
    if (!element.isConnected) { expectedScroll = win.scrollY; return; }
    if (Math.abs(win.scrollY - expectedScroll) > 1) release();
  }, { signal: abort.signal });
  if (signal?.aborted) release();
  else {
    signal?.addEventListener('abort', release, { once: true, signal: abort.signal });
    observe();
  }
  return {
    release,
    refresh: correct,
    retarget(next: HTMLElement, offset: number) {
      if (!live) return false;
      if (next.ownerDocument !== doc || !Number.isFinite(offset)) throw new Error('Invalid disclosure viewport anchor');
      element = next; top = offset; observe(); correct(); return true;
    }
  };
}

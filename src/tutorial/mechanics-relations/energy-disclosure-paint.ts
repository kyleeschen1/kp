export interface RetainedDerivationPaint {
  readonly element: HTMLElement;
  dispose(): void;
}

export function visibleDerivationHandle(root: HTMLElement) {
  const handle = root.querySelector<HTMLElement>('[data-derivation-handle]');
  const box = handle?.getBoundingClientRect();
  return handle && box && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight ? handle : undefined;
}

/** The retired clock cannot write again, but its real compositor paint lives
 * until the successor is ready. No screenshot or duplicate glyph owner is made. */
export function holdEnergyDisclosurePaint(root: HTMLElement, handle: HTMLElement, paint: RetainedDerivationPaint) {
  const box = paint.element.getBoundingClientRect(), grip = handle.getBoundingClientRect();
  const oldHandleStyle = handle.getAttribute('style');
  const abort = new AbortController();
  let live = true;
  Object.assign(paint.element.style, { position: 'fixed', top: `${box.top}px`, left: `${box.left}px`,
    width: `${box.width}px`, height: `${box.height}px`, transform: 'none', zIndex: '1' });
  Object.assign(handle.style, { position: 'fixed', top: `${grip.top}px`, left: `${grip.left}px`, transform: 'none' });
  paint.element.dataset['disclosurePaint'] = '';
  root.dataset['disclosureHandoff'] = '';
  const release = () => {
    if (!live) return;
    live = false; abort.abort();
    if (oldHandleStyle === null) handle.removeAttribute('style');
    else handle.setAttribute('style', oldHandleStyle);
    delete root.dataset['disclosureHandoff'];
    paint.dispose();
  };
  // A held preparation frame must never float above a subsequent reader action.
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart'])
    document.addEventListener(event, release, { capture: true, signal: abort.signal });
  for (const event of ['pagehide', 'blur', 'resize']) window.addEventListener(event, release, { signal: abort.signal });
  return { release, attach() {
    if (live) { root.dataset['disclosureHandoff'] = ''; root.append(paint.element); }
  } };
}

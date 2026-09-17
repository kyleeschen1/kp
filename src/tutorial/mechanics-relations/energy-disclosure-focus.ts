/** Disclosure changes detail, not the reader's rail selection. Retain its
 * visible cue without redirecting keyboard focus away from the disclosure. */
export function preserveEnergyDisclosureFocus(root: HTMLElement) {
  const handle = root.querySelector<HTMLElement>('[data-derivation-handle]')!;
  const abort = new AbortController();
  const disclosure = (target: EventTarget | null) => target instanceof Element &&
    root.contains(target) && !!target.closest('[data-refinement-expand], [data-refinement-collapse], [data-refinement-parent-return], [data-refinement-local-return]');
  const clear = () => handle.removeAttribute('data-disclosure-focus-visible');
  const retain = (event: Event) => {
    if (disclosure(event.target)) {
      if (handle.matches(':focus-visible')) handle.setAttribute('data-disclosure-focus-visible', '');
    } else clear();
  };
  // Pointerdown precedes the browser's focus transfer. Click also covers
  // keyboard/programmatic activation, and the retained handle survives remount.
  document.addEventListener('pointerdown', retain, { capture: true, signal: abort.signal });
  document.addEventListener('click', retain, { capture: true, signal: abort.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key === 'Escape' || !disclosure(event.target)) clear();
  }, { capture: true, signal: abort.signal });
  document.addEventListener('focusin', event => {
    if (event.target !== handle && !disclosure(event.target)) clear();
  }, { signal: abort.signal });
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { clear(); abort.abort(); }
  }, { signal: abort.signal });
}

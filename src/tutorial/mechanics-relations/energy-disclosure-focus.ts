/** Disclosure and continued rail inspection share one selection cue, without
 * redirecting keyboard focus away from the control the reader is using. */
export function preserveEnergyDisclosureFocus(root: HTMLElement) {
  const handle = root.querySelector<HTMLElement>('[data-derivation-handle]')!;
  const abort = new AbortController();
  const continuesInspection = (target: EventTarget | null) => target instanceof Element &&
    root.contains(target) && !!target.closest('[data-derivation-handle], [data-derivation-rail], [data-refinement-expand], [data-refinement-collapse], [data-refinement-parent-return], [data-refinement-local-return]');
  const clear = () => handle.removeAttribute('data-disclosure-focus-visible');
  const retain = (event: Event) => {
    if (continuesInspection(event.target)) {
      if (handle.matches(':focus-visible')) handle.setAttribute('data-disclosure-focus-visible', '');
    } else clear();
  };
  // Pointerdown precedes the browser's focus transfer. Click also covers
  // keyboard/programmatic activation, and the retained handle survives remount.
  document.addEventListener('pointerdown', retain, { capture: true, signal: abort.signal });
  document.addEventListener('click', retain, { capture: true, signal: abort.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key === 'Escape' || !continuesInspection(event.target)) clear();
  }, { capture: true, signal: abort.signal });
  document.addEventListener('focusin', event => {
    if (!continuesInspection(event.target)) clear();
  }, { signal: abort.signal });
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { clear(); abort.abort(); }
  }, { signal: abort.signal });
}

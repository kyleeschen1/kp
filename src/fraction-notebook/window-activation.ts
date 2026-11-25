/** A moving surface must not escape its native click/selection gesture. Share
 * this boundary with the preview iframe, whose events cannot reach the host. */
export function mountWindowActivation(scope: HTMLElement, activate: (target: EventTarget | null, focus: boolean) => void) {
  const doc = scope.ownerDocument;
  let pointer: { id: number; target: EventTarget | null; focus: boolean } | undefined;
  let release: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(release); release = undefined; pointer = undefined; };
  const commit = () => { const pending = pointer; cancel(); if (pending) activate(pending.target, pending.focus); };
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    cancel();
    const interactive = event.target instanceof Element && event.target.closest('button,a,input,textarea,select,summary,[contenteditable],[tabindex]');
    pointer = { id: event.pointerId, target: event.target, focus: !interactive };
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== pointer?.id) return;
    // Native click handlers run first. Selection drags may not emit a click,
    // so the timer also completes those gestures after pointer release.
    release = setTimeout(commit, 0);
  };
  const interrupted = (event: PointerEvent) => { if (event.pointerId === pointer?.id) cancel(); };
  const focus = (event: FocusEvent) => { if (!pointer) activate(event.target, false); };
  scope.addEventListener('pointerdown', down, true); scope.addEventListener('focusin', focus);
  doc.addEventListener('pointerup', up, true); doc.addEventListener('pointercancel', interrupted, true);
  doc.defaultView?.addEventListener('blur', cancel);
  return { cancel, dispose() {
    cancel(); scope.removeEventListener('pointerdown', down, true); scope.removeEventListener('focusin', focus);
    doc.removeEventListener('pointerup', up, true); doc.removeEventListener('pointercancel', interrupted, true);
    doc.defaultView?.removeEventListener('blur', cancel);
  } };
}

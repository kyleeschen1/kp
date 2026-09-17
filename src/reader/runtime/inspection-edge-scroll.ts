/** Edge scrolling extends an already-owned drag. It never owns inspection
 * progress: the caller resamples its existing pointer-to-document mapping. */
export function inspectionEdgeVelocity(pointerY: number, viewportHeight: number): number {
  if (!Number.isFinite(pointerY) || !Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  const band = Math.min(72, viewportHeight / 4);
  const strength = pointerY < band ? -(band - pointerY) / band
    : pointerY > viewportHeight - band ? (pointerY - viewportHeight + band) / band : 0;
  return Math.sign(strength) * Math.min(1, Math.abs(strength)) ** 2 * 540;
}

export function createInspectionEdgeScroll(input: {
  readonly bounds: () => { readonly top: number; readonly bottom: number };
  readonly sample: (clientY: number) => void;
  readonly signal: AbortSignal;
  readonly ownerWindow?: Window;
}) {
  const win = input.ownerWindow ?? window;
  let pointerY: number | undefined, frame: number | undefined, previous = 0, remainder = 0;
  const cancel = () => { if (frame !== undefined) win.cancelAnimationFrame(frame); frame = undefined; };
  const stop = () => { pointerY = undefined; remainder = 0; cancel(); };
  const schedule = () => {
    if (pointerY === undefined || frame !== undefined || !inspectionEdgeVelocity(pointerY, win.innerHeight)) return;
    previous = win.performance.now(); frame = win.requestAnimationFrame(tick);
  };
  const tick = (now: number) => {
    frame = undefined;
    if (pointerY === undefined || input.signal.aborted) return;
    const bounds = input.bounds();
    const velocity = inspectionEdgeVelocity(pointerY, win.innerHeight);
    // The move's first/last handle positions bound travel, even when the page
    // continues. Cap elapsed time so a suspended tab cannot cause a jump.
    const desired = velocity * Math.max(0, Math.min(50, now - previous)) / 1000 + remainder;
    const amount = Math.max(Math.min(0, bounds.top - pointerY), Math.min(Math.max(0, bounds.bottom - pointerY), desired));
    if (!Number.isFinite(amount) || !velocity) return;
    if (velocity > 0 ? bounds.bottom <= pointerY : bounds.top >= pointerY) return;
    const remaining = velocity > 0 ? bounds.bottom - pointerY : pointerY - bounds.top;
    if (remaining < 1) { input.sample(velocity > 0 ? bounds.bottom : bounds.top); return; }
    // The first RAF timestamp may predate pointerdown's performance.now().
    // Keep the gesture alive until time advances; retain fractional pixels at
    // the gentle edge of the speed ramp instead of stalling on rounding.
    if (Math.abs(amount) < 1) { remainder = amount; schedule(); return; }
    const before = win.scrollY;
    win.scrollBy({ top: amount, behavior: "instant" });
    remainder = amount - (win.scrollY - before);
    input.sample(pointerY);
    if (win.scrollY !== before) schedule();
  };
  const options = { signal: input.signal };
  win.addEventListener("scroll", () => {
    if (pointerY !== undefined) { input.sample(pointerY); schedule(); }
  }, options);
  win.addEventListener("blur", stop, options);
  win.addEventListener("pagehide", stop, options);
  win.document.addEventListener("visibilitychange", () => { if (win.document.hidden) stop(); }, options);
  input.signal.addEventListener("abort", stop, { once: true });
  return { update(clientY: number) {
    if (input.signal.aborted || !Number.isFinite(clientY)) return;
    if (pointerY !== undefined && Math.sign(inspectionEdgeVelocity(pointerY, win.innerHeight)) !== Math.sign(inspectionEdgeVelocity(clientY, win.innerHeight))) remainder = 0;
    pointerY = clientY; input.sample(clientY);
    if (!inspectionEdgeVelocity(clientY, win.innerHeight)) cancel(); else schedule();
  }, stop };
}

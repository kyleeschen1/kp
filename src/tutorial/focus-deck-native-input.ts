interface FocusDeckTravelSession {
  update(position: number, now: number): void;
  finish(now: number, animate: boolean): void;
  cancel(): void;
}

/** Native passage travel with explicit ownership. Derived scroll writes and
 * late scrollend cannot acquire navigation rights. The stage proxy is needed
 * because an equation is not itself an overflow lane. */
export function mountKpFocusDeckNativeInput(input: {
  viewport: HTMLElement; region: HTMLElement;
  enabled(): boolean; position(): number;
  begin(now: number): FocusDeckTravelSession;
  reduced(): boolean; interrupt(): void;
}) {
  const { viewport, region } = input;
  const owner = viewport.ownerDocument.defaultView!;
  type Contact = { id: number; x: number; y: number; origin: number; width: number };
  type Active = { session: FocusDeckTravelSession; lastInput: number };
  let state: { kind: "idle" } | ({ kind: "native"; held?: number } & Active)
    | ({ kind: "pending" | "pointer" } & Active & Contact) = { kind: "idle" };
  let frame: number | undefined, quiet: number | undefined;
  const now = () => owner.performance.now();
  const width = () => Math.max(1, viewport.clientWidth);
  const blocked = (event: Event) => event.target instanceof Element &&
    Boolean(event.target.closest("a,button,input,textarea,select,[contenteditable]"));
  const clear = () => {
    if (frame !== undefined) owner.cancelAnimationFrame(frame);
    frame = undefined;
    owner.clearTimeout(quiet); quiet = undefined;
  };
  const cancel = () => {
    clear();
    const previous = state; state = { kind: "idle" };
    if ("session" in previous) previous.session.cancel();
    if ("id" in previous && region.hasPointerCapture(previous.id)) region.releasePointerCapture(previous.id);
    delete viewport.dataset["kpFocusDeckMouseDragging"];
  };
  const sample = () => {
    frame = undefined;
    if (state.kind !== "native") return;
    state.session.update(viewport.scrollLeft / width(), now());
  };
  const finish = () => {
    if (state.kind !== "native" || state.held !== undefined) return;
    // scrollend may precede the end of a wheel stream in some engines.
    if (now() - state.lastInput < 140) { scheduleFinish(); return; }
    if (frame !== undefined) owner.cancelAnimationFrame(frame);
    frame = undefined;
    sample();
    const previous = state; state = { kind: "idle" };
    clear();
    previous.session.finish(now(), !input.reduced());
  };
  const scheduleFinish = () => {
    owner.clearTimeout(quiet);
    quiet = owner.setTimeout(finish, 220);
  };
  const beginNative = () => {
    if (state.kind !== "idle") return;
    input.interrupt();
    state = { kind: "native", session: input.begin(now()), lastInput: now() };
  };
  const scroll = () => {
    if (state.kind !== "native") return;
    if (frame === undefined) frame = owner.requestAnimationFrame(sample);
    scheduleFinish();
  };
  const wheel = (event: WheelEvent) => {
    if (event.defaultPrevented || !input.enabled() || blocked(event) || event.ctrlKey || state.kind === "pointer" || state.kind === "pending") return;
    const dx = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
    if (dx === 0 || (!event.shiftKey && state.kind !== "native" && Math.abs(dx) < Math.abs(event.deltaY) * .65)) return;
    beginNative();
    if (state.kind !== "native") return;
    state.lastInput = now();
    scheduleFinish();
    // Own the entire horizontal stream, including endpoint momentum, before
    // clamping travel. Native overflow alone can hand its boundary to browser
    // history. One non-passive region listener covers passage and stage alike;
    // vertical scrolling, zoom and controls retain their browser defaults.
    event.preventDefault();
    viewport.scrollLeft += dx * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width() : 1);
    if (frame !== undefined) owner.cancelAnimationFrame(frame);
    sample();
  };
  const down = (event: PointerEvent) => {
    if (!input.enabled() || blocked(event) || !event.isPrimary || event.button !== 0) return;
    const nativeTouch = event.pointerType !== "mouse" && event.target instanceof Node && viewport.contains(event.target);
    if (nativeTouch) {
      beginNative();
      if (state.kind === "native") state.held = event.pointerId;
      return;
    }
    if (event.pointerType === "mouse" && event.target instanceof Element && event.target.closest("p,.katex")) return;
    input.interrupt(); cancel();
    state = { kind: "pending", session: input.begin(now()), lastInput: now(), id: event.pointerId,
      x: event.clientX, y: event.clientY, origin: input.position(), width: width() };
  };
  const move = (event: PointerEvent) => {
    if (!("id" in state) || state.id !== event.pointerId) return;
    const dx = state.x - event.clientX, dy = state.y - event.clientY;
    if (state.kind === "pending") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) { cancel(); return; }
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
      state = { ...state, kind: "pointer" };
      region.setPointerCapture(event.pointerId);
      viewport.dataset["kpFocusDeckMouseDragging"] = "true";
    }
    event.preventDefault();
    viewport.scrollLeft = (state.origin + dx / state.width) * width();
    state.session.update(viewport.scrollLeft / width(), now());
  };
  const up = (event: PointerEvent) => {
    if (state.kind === "native" && state.held === event.pointerId) {
      delete state.held; scheduleFinish(); return;
    }
    if (!("id" in state) || state.id !== event.pointerId) return;
    const previous = state; state = { kind: "idle" }; clear();
    if (region.hasPointerCapture(event.pointerId)) region.releasePointerCapture(event.pointerId);
    delete viewport.dataset["kpFocusDeckMouseDragging"];
    previous.session.finish(now(), !input.reduced());
  };
  viewport.addEventListener("scroll", scroll, { passive: true });
  viewport.addEventListener("scrollend", finish);
  region.addEventListener("wheel", wheel, { passive: false });
  region.addEventListener("pointerdown", down, { passive: true });
  region.addEventListener("pointermove", move, { passive: false });
  region.addEventListener("lostpointercapture", up);
  owner.addEventListener("pointerup", up); owner.addEventListener("pointercancel", up);
  return { cancel, ownsTravel: () => state.kind !== "idle", dispose() {
    cancel();
    viewport.removeEventListener("scroll", scroll);
    viewport.removeEventListener("scrollend", finish); region.removeEventListener("wheel", wheel);
    region.removeEventListener("pointerdown", down); region.removeEventListener("pointermove", move);
    region.removeEventListener("lostpointercapture", up);
    owner.removeEventListener("pointerup", up); owner.removeEventListener("pointercancel", up);
  } };
}

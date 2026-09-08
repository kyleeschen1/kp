import type { KpReasoningPassageGesture } from "./navigation.ts";

/** Browser scrolling is an output only. This avoids engine-specific snap,
 * rubber-band offsets and late scrollend events becoming semantic input. */
export function mountReasoningPassageInput(input: {
  viewport: HTMLElement;
  enabled(): boolean;
  position(): number;
  begin(nowMs: number): KpReasoningPassageGesture;
  reduced(): boolean;
  interrupt(): void;
}) {
  const { viewport } = input;
  const owner = viewport.ownerDocument.defaultView!;
  const wheelQuietMs = 90, wheelTailMs = 180;
  type Contact = { id: number; x: number; y: number; origin: number; width: number; session: KpReasoningPassageGesture };
  let state: { kind: "idle" } | ({ kind: "pending" | "pointer" } & Contact)
    | { kind: "wheel"; width: number; session: KpReasoningPassageGesture }
    | { kind: "wheel-tail" } = { kind: "idle" };
  let quiet: number | undefined, tail: number | undefined;
  const now = () => owner.performance.now();
  const clearTimers = () => { owner.clearTimeout(quiet); owner.clearTimeout(tail); quiet = tail = undefined; };
  const cancel = () => {
    clearTimers();
    if ("session" in state) state.session.cancel();
    const previous = state; state = { kind: "idle" };
    if ("id" in previous && viewport.hasPointerCapture(previous.id)) viewport.releasePointerCapture(previous.id);
    delete viewport.dataset["kpFocusDeckMouseDragging"];
    delete viewport.dataset["reasoningGesture"];
    if (previous.kind === "wheel" || previous.kind === "wheel-tail") {
      state = { kind: "wheel-tail" };
      tail = owner.setTimeout(() => { if (state.kind === "wheel-tail") state = { kind: "idle" }; }, wheelTailMs);
    }
  };
  const down = (event: PointerEvent) => {
    if (!input.enabled() || !event.isPrimary || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    // Keep links, form controls and mouse text selection native.
    if (target?.closest("a,button,input,textarea,select") ||
        (event.pointerType === "mouse" && target?.closest("p"))) return;
    input.interrupt(); cancel(); clearTimers();
    state = { kind: "pending", id: event.pointerId, x: event.clientX, y: event.clientY,
      origin: input.position(), width: Math.max(1, viewport.clientWidth), session: input.begin(now()) };
  };
  const move = (event: PointerEvent) => {
    if (!("id" in state) || state.id !== event.pointerId) return;
    const dx = state.x - event.clientX, dy = state.y - event.clientY;
    if (state.kind === "pending") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { cancel(); return; }
      state = { ...state, kind: "pointer" };
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset["kpFocusDeckMouseDragging"] = "true";
      viewport.dataset["reasoningGesture"] = "dragging";
    }
    event.preventDefault();
    state.session.update(state.origin + dx / state.width, now());
  };
  const up = (event: PointerEvent) => {
    if (!("id" in state) || state.id !== event.pointerId) return;
    const previous = state;
    state = { kind: "idle" };
    delete viewport.dataset["kpFocusDeckMouseDragging"];
    delete viewport.dataset["reasoningGesture"];
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    // A tap can catch an in-flight settlement; releasing without a drag still
    // lands at a checkpoint instead of stranding the card between beats.
    previous.session.finish(now(), !input.reduced());
  };
  const lost = (event: PointerEvent) => {
    if ("id" in state && state.id === event.pointerId) up(event);
  };
  const wheel = (event: WheelEvent) => {
    if (!input.enabled() || event.ctrlKey ||
        (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))) return;
    event.preventDefault();
    if ("id" in state) return;
    owner.clearTimeout(tail);
    // Wheel events expose no portable finger-up signal. Keep a bounded burst
    // fence after settlement so the remaining inertial tail cannot advance again.
    if (state.kind === "wheel-tail") {
      tail = owner.setTimeout(() => { if (state.kind === "wheel-tail") state = { kind: "idle" }; }, wheelTailMs);
      return;
    }
    if (state.kind === "idle") {
      input.interrupt();
      state = { kind: "wheel", width: Math.max(1, viewport.clientWidth), session: input.begin(now()) };
      viewport.dataset["reasoningGesture"] = "dragging";
    }
    const delta = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
    const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.width : 1);
    state.session.update(input.position() + pixels / state.width, now());
    owner.clearTimeout(quiet);
    const session = state.session;
    quiet = owner.setTimeout(() => {
      if (state.kind !== "wheel" || state.session !== session) return;
      state = { kind: "wheel-tail" };
      delete viewport.dataset["reasoningGesture"];
      session.finish(now(), !input.reduced());
      tail = owner.setTimeout(() => { if (state.kind === "wheel-tail") state = { kind: "idle" }; }, wheelTailMs);
    }, wheelQuietMs);
  };
  viewport.addEventListener("pointerdown", down);
  viewport.addEventListener("pointermove", move, { passive: false });
  owner.addEventListener("pointerup", up);
  owner.addEventListener("pointercancel", lost);
  viewport.addEventListener("lostpointercapture", lost);
  viewport.addEventListener("wheel", wheel, { passive: false });
  return { cancel, dispose() {
    cancel(); clearTimers(); state = { kind: "idle" };
    viewport.removeEventListener("pointerdown", down); viewport.removeEventListener("pointermove", move);
    owner.removeEventListener("pointerup", up); owner.removeEventListener("pointercancel", lost);
    viewport.removeEventListener("lostpointercapture", lost); viewport.removeEventListener("wheel", wheel);
  } };
}

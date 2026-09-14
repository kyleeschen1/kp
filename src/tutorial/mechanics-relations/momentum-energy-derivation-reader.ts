import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";
import { sampleEnergyDerivationPresentation } from "./energy-derivation-presentation.ts";

/** Page scroll never owns derivation progress. One shared-clock instance owns
 * the active move; completed lines are static historical records, not copies
 * participating in that move's semantic fan-out. */
export function enhanceEnergyDerivation(root: HTMLElement) {
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  let stage = get<HTMLElement>("[data-derivation-stage]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  const clock = createKpReaderTimelinePlaybackClock({ id: "energy.derivation.clock", durationMs: 4400 });
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
  let selected = 0, tracing = false, loading = false, generation = 0;
  let sourceTop = 0, rowDistance = 0;
  const cue = get<HTMLElement>("[data-derivation-cue]");
  const cueBody = get<HTMLElement>("[data-derivation-cue-body]");
  const scope = get<HTMLElement>("[data-derivation-scope]");
  const handle = get<HTMLButtonElement>("[data-derivation-handle]");
  const local = get<HTMLInputElement>("[data-derivation-local]");
  const inspect = get<HTMLDetailsElement>("[data-derivation-scrub]");
  const playback = get<HTMLButtonElement>("[data-derivation-play]");
  const hint = get<HTMLElement>("[data-derivation-hint]");
  const selectors = [...root.querySelectorAll<HTMLButtonElement>("[data-derivation-select]")];
  // Dragging previews a destination; it never owns mathematical progress or
  // mounts every intermediate scene. Only release commits the selection.
  let drag: { pointer: number; move: number } | undefined;
  let selectionRequest = 0;
  const status = get<HTMLElement>("[data-derivation-status]");
  const positionScope = (index: number) => {
    const source = rows[index]!, target = rows[index + 1]!;
    scope.style.top = `${source.offsetTop + source.offsetHeight / 2}px`;
    scope.style.height = `${target.offsetTop - source.offsetTop}px`;
    handle.setAttribute("aria-valuenow", String(index + 1));
    handle.setAttribute("aria-valuetext", `Explain equation ${index + 1} to ${index + 2}, transition ${index + 1} of ${selectors.length}`);
    selectors.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  };
  const project = () => {
    const p = clock.getSnapshot().progress;
    if (!tracing || !session) return;
    const frame = sampleEnergyDerivationPresentation(p);
    // The host relocates one intact scene. Internal native/material ownership
    // remains exclusively compositor-owned, with co-located algebra endpoints.
    stage.style.transform = `translateY(${sourceTop + rowDistance * frame.carry}px)`;
    session.apply(frame.algebra);
    root.dataset["phase"] = frame.phase;
    root.dataset["algebraProgress"] = String(frame.algebra);
    // The explanation refers to the relation, not the currently moving ink.
    // Keep its two-row bracket stable throughout carry, algebra and inspection.
    cue.style.visibility = "visible";
    if (!drag) positionScope(selected);
    root.dataset["move"] = String(selected); root.dataset["progress"] = String(p);
    root.dataset["playing"] = String(clock.getStatus() === "playing");
    rows.forEach((row, i) => {
      const past = i < selected || (i === selected && frame.carry > .8);
      row.dataset["traceRole"] = past ? "historical" : i > selected + 1 || (i === selected + 1 && p === 0) ? "prospective" : "live";
      // A preview yields before the live expression enters its slot. It is a
      // prospective record, not another mathematical or material paint owner.
      row.dataset["visibleEquation"] = String(past || i > selected + 1 || (i === selected + 1 && p === 0));
    });
    const position = selected + p;
    root.dataset["derivationProgress"] = String(position);
    local.value = String(p);
    local.setAttribute("aria-valuetext", `Transition ${selected + 1}, ${Math.round(p * 100)} percent`);
    playback.textContent = clock.getStatus() === "playing" ? "Pause" : p === 1 ? "Replay" : "Play";
  };
  clock.subscribe(project);
  const retire = () => { generation++; session?.dispose(); session = undefined; };
  const read = () => {
    selectionRequest++; drag = undefined;
    clock.pause(); retire(); tracing = false; loading = false;
    delete root.dataset["derivationDragging"];
    root.dataset["tracing"] = "false"; stage.hidden = true;
    rows.forEach(row => { row.hidden = false; delete row.dataset["traceRole"]; delete row.dataset["visibleEquation"]; });
    get("[data-derivation-cue]").hidden = true;
    inspect.hidden = true; inspect.open = false; status.hidden = true;
    selectors.forEach(button => button.setAttribute("aria-pressed", "false"));
    scope.hidden = true;
  };
  async function mount(index: number, progress: number) {
    clock.pause(); const token = ++generation; loading = true;
    // Keep the current paint and layout while fonts/measurement prepare the
    // successor. A visible stage reset to row zero is not an animation phase.
    status.hidden = tracing; status.textContent = "Preparing this move…";
    let candidate: HTMLElement | undefined;
    let created: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
    try {
      const [{ mountMomentumEnergyDerivationSession }, { createEnergyDerivationPlan }, domain] = await Promise.all([
        import("../../rendering/momentum-energy-derivation-session.ts"),
        import("../../semantic/momentum-energy-derivation-plan.ts"),
        import("../../../domains/public-api.ts")
      ]);
      if (token !== generation) return;
      const checked = domain.checkMomentumEnergyDerivation(domain.momentumEnergyDerivationSource);
      if (checked.status !== "checked") throw new Error(checked.code);
      tracing = true;
      root.dataset["tracing"] = "true";
      rows.forEach(row => { row.hidden = false; });
      hint.hidden = true;
      cue.hidden = false;
      const template = get<HTMLTemplateElement>(`[data-derivation-template="${index}"]`);
      candidate = stage.cloneNode(false) as HTMLElement;
      candidate.removeAttribute("data-derivation-stage");
      candidate.setAttribute("data-derivation-preparing", "");
      candidate.setAttribute("aria-hidden", "true");
      candidate.replaceChildren(template.content.cloneNode(true)); candidate.hidden = false;
      candidate.style.opacity = "0"; candidate.style.top = "0px"; candidate.style.transform = "none";
      stage.parentElement!.append(candidate);
      const nextSourceTop = rows[index]!.offsetTop;
      const nextRowDistance = rows[index + 1]!.offsetTop - nextSourceTop;
      const target = candidate.querySelector<HTMLElement>("[data-derivation-target]")!;
      target.style.top = "0px";
      await document.fonts.ready;
      if (token !== generation) return;
      // Center the invariant semantic prefix, not each expression's changing
      // fraction/strut envelope. History and both endpoints use the same native
      // markup and measured anchor; no glyph-specific pixel correction.
      const equations = [...rows.map(row => row.querySelector<HTMLElement>(".energy-derivation-equation")!),
        ...candidate.querySelectorAll<HTMLElement>(".energy-derivation-endpoint")];
      for (const equation of equations) {
        const paint = equation.querySelector<HTMLElement>(".katex-display")!;
        paint.style.transform = "none";
        const prefix = equation.querySelector<HTMLElement>('[data-kp-semantic-entity-id$=".prefix"]');
        if (!prefix) throw new Error("Derivation baseline requires its invariant semantic prefix");
        const frame = equation.getBoundingClientRect(), ink = prefix.getBoundingClientRect();
        paint.style.transform = `translateY(${frame.top + frame.height / 2 - ink.top - ink.height / 2}px)`;
      }
      created = await mountMomentumEnergyDerivationSession(candidate, createEnergyDerivationPlan(checked.model), index);
      if (token !== generation) return;
      // Commit one ready native scene atomically; no intermediate unmeasured
      // source, duplicate endpoints, or origin-position paint reaches a frame.
      session?.dispose(); stage.remove();
      stage = candidate; candidate = undefined;
      stage.removeAttribute("data-derivation-preparing"); stage.removeAttribute("aria-hidden");
      stage.setAttribute("data-derivation-stage", "");
      session = created; created = undefined;
      selected = index; sourceTop = nextSourceTop; rowDistance = nextRowDistance;
      cueBody.replaceChildren(...[...get<HTMLElement>(`[data-derivation-reason="${index}"]`).childNodes].map(node => node.cloneNode(true)));
      cue.setAttribute("aria-label", `Transition from equation ${index + 1} to ${index + 2}`);
      const upper = sourceTop + rows[index]!.offsetHeight / 2;
      const lower = upper + rowDistance, midpoint = (upper + lower) / 2;
      const proofHeight = get<HTMLElement>(".energy-derivation-history").offsetHeight;
      cue.style.setProperty("--derivation-cue-top", `${Math.max(0, Math.min(midpoint - cue.offsetHeight / 2, proofHeight - cue.offsetHeight))}px`);
      loading = false; status.hidden = true;
      inspect.hidden = false;
      scope.hidden = false; selectors.forEach(button => { button.hidden = false; });
      clock.seek(progress); project();
      stage.style.opacity = "";
    } catch (error) {
      if (token !== generation) return;
      read(); root.dataset["repair"] = "true"; status.hidden = false;
      get("[data-derivation-notes]").hidden = false;
      status.textContent = "This animation needs repair. The complete derivation is still available below.";
      console.error("Energy derivation repair", error);
    } finally {
      created?.dispose(); candidate?.remove();
    }
  }
  const play = (direction: "forward" | "rewind") => {
    if (reduced.matches) clock.seek(direction === "forward" ? 1 : 0);
    else clock.play({ direction, stopAt: direction === "forward" ? 1 : 0 });
    project();
  };
  async function selectTransition(index: number) {
    const request = ++selectionRequest;
    await mount(index, 0);
    if (request === selectionRequest && session && selected === index && !loading) play("forward");
  }
  selectors.forEach((button, index) => button.addEventListener("click", () => { void selectTransition(index); }, opts));
  handle.addEventListener("keydown", event => {
    const index = ({ ArrowUp: selected - 1, ArrowDown: selected + 1, Home: 0, End: selectors.length - 1 } as Record<string, number>)[event.key];
    if (index === undefined) return;
    event.preventDefault();
    void selectTransition(Math.max(0, Math.min(selectors.length - 1, index)));
  }, opts);
  handle.addEventListener("click", event => {
    // Keyboard activation has no preceding pointer gesture.
    if (event.detail === 0) void selectTransition(selected);
  }, opts);
  handle.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || loading) return;
    clock.pause(); project();
    drag = { pointer: event.pointerId, move: selected };
    handle.setPointerCapture(event.pointerId);
    root.dataset["derivationDragging"] = "true";
  }, opts);
  handle.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const centers = selectors.map((_, i) => {
      const source = rows[i]!.getBoundingClientRect(), target = rows[i + 1]!.getBoundingClientRect();
      return (source.top + source.height / 2 + target.top + target.height / 2) / 2;
    });
    drag.move = centers.reduce((best, center, i) => Math.abs(center - event.clientY) < Math.abs(centers[best]! - event.clientY) ? i : best, 0);
    positionScope(drag.move);
    cue.style.visibility = "hidden";
  }, opts);
  const endDrag = (event: PointerEvent, commit: boolean) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const index = drag.move; drag = undefined;
    delete root.dataset["derivationDragging"];
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    project();
    if (commit) void selectTransition(index);
  };
  handle.addEventListener("pointerup", event => endDrag(event, true), opts);
  handle.addEventListener("pointercancel", event => endDrag(event, false), opts);
  handle.addEventListener("lostpointercapture", event => endDrag(event, false), opts);
  local.addEventListener("input", () => {
    selectionRequest++;
    if (session && !loading) { clock.pause(); clock.seek(Number(local.value)); project(); }
  }, opts);
  playback.addEventListener("click", () => {
    if (loading || !session) return;
    if (clock.getStatus() === "playing") { clock.pause(); project(); return; }
    if (clock.getSnapshot().progress === 1) clock.seek(0);
    play("forward");
  }, opts);
  const close = () => { const button = selectors[selected]; read(); button?.focus({ preventScroll: true }); };
  get("[data-derivation-close]").addEventListener("click", close, opts);
  get("[data-derivation-dismiss]").addEventListener("click", () => { hint.hidden = true; selectors[0]?.focus({ preventScroll: true }); }, opts);
  root.addEventListener("keydown", event => { if (event.key === "Escape" && tracing) { event.preventDefault(); close(); } }, opts);
  const pause = () => { clock.pause(); project(); };
  // Expanding the justification is a request to read, not a race against the
  // automatic act phase. Continue with the single playback control afterward.
  cue.addEventListener("toggle", event => { if (event.target instanceof HTMLDetailsElement && event.target.open) pause(); }, { ...opts, capture: true });
  inspect.addEventListener("toggle", () => { if (inspect.open) pause(); }, opts);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, opts);
  reduced.addEventListener("change", pause, opts);
  const visibility = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); }); visibility.observe(root);
  // Our own cue/control disclosure changes height. Only available width
  // invalidates equation geometry; rebuilding on height could interrupt Next.
  let width = root.getBoundingClientRect().width;
  const resize = new ResizeObserver(entries => {
    const nextWidth = entries[0]?.contentRect.width;
    if (nextWidth === undefined || Math.abs(nextWidth - width) < .5) return;
    width = nextWidth;
    if (tracing && session && !loading) void mount(selected, clock.getSnapshot().progress);
  }); resize.observe(root);
  window.addEventListener("pagehide", event => { pause(); if (!event.persisted) { retire(); visibility.disconnect(); resize.disconnect(); abort.abort(); clock.dispose(); } }, opts);
  hint.hidden = false;
  get("[data-derivation-notes]").hidden = true;
  selectors.forEach(button => { button.hidden = false; });
}

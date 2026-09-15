import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";
import { energyDerivationInspection, sampleSubstitutionEmphasis, sampleDerivationRecordInspection, sampleEnergyDerivationLens, resolveEnergyDerivationMeasuredPosition, resolveEnergyDerivationPosition, energyDerivationNavigationTarget } from "./energy-derivation-presentation.ts";

/** Page scroll never owns derivation progress. One shared-clock instance owns
 * the active move; completed lines are static historical records, not copies
 * participating in that move's semantic fan-out. */
export function enhanceEnergyDerivation(root: HTMLElement) {
  // Internal exemplar comparison, not an additional learner control or policy.
  const accented = new URL(location.href).searchParams.get("derivation-emphasis") !== "contrast";
  const participantOnly = new URL(location.href).searchParams.get("derivation-motion") !== "equation";
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  let stage = get<HTMLElement>("[data-derivation-stage]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  const equationSlots = rows.map(row => row.querySelector<HTMLElement>(".energy-derivation-equation")!);
  const interleaves = [...root.querySelectorAll<HTMLElement>("[data-derivation-interleave]")];
  const rail = get<HTMLElement>("[data-derivation-rail]");
  let centers: number[] = [];
  let equationHeights: number[] = [];
  const clock = createKpReaderTimelinePlaybackClock({ id: "energy.derivation.clock", durationMs: 4400 });
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
  let selected = 0, tracing = false, loading = false, generation = 0;
  let sourceTop = 0, rowDistance = 0;
  const scope = get<HTMLElement>("[data-derivation-scope]");
  const handle = get<HTMLButtonElement>("[data-derivation-handle]");
  const transport = get<HTMLElement>("[data-derivation-transport]");
  const previous = get<HTMLButtonElement>("[data-derivation-previous]");
  const next = get<HTMLButtonElement>("[data-derivation-next]");
  const hint = get<HTMLElement>("[data-derivation-hint]");
  const total = rows.length - 1;
  type Direction = "forward" | "rewind";
  let direction: Direction = "forward";
  let journey: { direction: Direction; target: number } | undefined;
  let drag: { pointer: number; offset: number } | undefined;
  let pendingSeek: number | undefined;
  let seeking = false;
  let selectionRequest = 0;
  const status = get<HTMLElement>("[data-derivation-status]");
  const measureRows = () => {
    equationHeights = equationSlots.map(slot => slot.offsetHeight);
    centers = rows.map((row, i) => row.offsetTop + equationHeights[i]! / 2);
    sourceTop = rows[selected]!.offsetTop;
    rowDistance = rows[selected + 1]!.offsetTop - sourceTop;
    rail.style.top = `${centers[0]}px`;
    rail.style.height = `${centers[total]! - centers[0]!}px`;
    [...rail.children].forEach((tick, i) => { (tick as HTMLElement).style.top = `${centers[i]! - centers[0]!}px`; });
  };
  const positionScope = (position: number) => {
    const { move, progress } = resolveEnergyDerivationPosition(position);
    scope.style.top = `${centers[move]! + (centers[move + 1]! - centers[move]!) * progress}px`;
    handle.setAttribute("aria-valuenow", String(position));
    handle.setAttribute("aria-valuetext", Number.isInteger(position)
      ? `Equation ${position + 1} of ${rows.length}`
      : `Between equations ${move + 1} and ${move + 2}, ${Math.round(progress * 100)} percent`);
  };
  const project = () => {
    const p = clock.getSnapshot().progress;
    if (!tracing || !session) return;
    const frame = sampleEnergyDerivationLens(p);
    // The host relocates one intact scene. Internal native/material ownership
    // remains exclusively compositor-owned, with co-located algebra endpoints.
    stage.style.transform = `translateY(${sourceTop + rowDistance * frame.carry}px)`;
    session.apply(frame.algebra, accented ? sampleSubstitutionEmphasis(p).strength : 0);
    root.dataset["phase"] = frame.phase;
    root.dataset["algebraProgress"] = String(frame.algebra);
    // All three inspections share reversible departure/docking. The permanent
    // record remains independent of the compositor's internal paint ownership.
    const record = sampleDerivationRecordInspection(p, rowDistance, equationHeights[selected]!);
    root.dataset["inspectionExtent"] = participantOnly ? "participants" : "equation";
    root.style.setProperty("--derivation-record-participant-opacity", String(1 - .78 * record.inspectionOpacity));
    stage.style.opacity = String(participantOnly || selected === 0 ? record.inspectionOpacity : record.kind === "docked" ? 0 : 1);
    root.dataset["inspectionOwner"] = record.kind;
    positionScope(selected + p);
    root.dataset["move"] = String(selected); root.dataset["progress"] = String(p);
    root.dataset["playing"] = String(clock.getStatus() === "playing");
    rows.forEach((row, i) => {
      const past = i <= selected && (i < selected || p > 0);
      row.dataset["traceRole"] = past ? "historical" : i > selected + 1 || (i === selected + 1 && p < 1) ? "prospective" : "live";
      const emphasis = i === selected ? record.sourceEmphasis : i === selected + 1 ? record.targetEmphasis : 0;
      row.style.setProperty("--derivation-record-emphasis", String(emphasis));
    });
    const position = selected + p;
    root.dataset["derivationProgress"] = String(position);
    root.dataset["direction"] = direction;
    previous.disabled = loading || (selected === 0 && p === 0);
    next.disabled = loading || (selected === total - 1 && p === 1);
  };
  clock.subscribe(project);
  const retire = () => { generation++; session?.dispose(); session = undefined; };
  const read = () => {
    selectionRequest++; drag = undefined; journey = undefined; pendingSeek = undefined;
    clock.pause(); retire(); tracing = false; loading = false;
    delete root.dataset["derivationDragging"];
    root.dataset["tracing"] = "false"; stage.hidden = true;
    rows.forEach(row => { row.hidden = false; delete row.dataset["traceRole"]; row.style.removeProperty("--derivation-record-emphasis"); });
    transport.hidden = true; status.hidden = true;
    scope.hidden = true;
  };
  async function mount(index: number, progress: number) {
    clock.pause(); const token = ++generation; loading = true; project();
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
      const focus = energyDerivationInspection[index]!;
      created = await mountMomentumEnergyDerivationSession(candidate, createEnergyDerivationPlan(checked.model), index,
        accented || participantOnly ? { ...focus, extent: participantOnly ? "participants" : "equation",
          records: participantOnly ? [{ root: equationSlots[index]!, entityIds: focus.recordSource },
            { root: equationSlots[index + 1]!, entityIds: focus.recordTarget }] : [] } : undefined);
      if (token !== generation) return;
      // Commit one ready native scene atomically; no intermediate unmeasured
      // source, duplicate endpoints, or origin-position paint reaches a frame.
      session?.dispose(); stage.remove();
      root.querySelectorAll<HTMLElement>("[data-derivation-record-participant]").forEach(element => { delete element.dataset["derivationRecordParticipant"]; });
      created.activateRecords();
      stage = candidate; candidate = undefined;
      stage.removeAttribute("data-derivation-preparing");
      stage.setAttribute("data-derivation-stage", "");
      session = created; created = undefined;
      selected = index; sourceTop = nextSourceTop; rowDistance = nextRowDistance;
      measureRows();
      loading = false; status.hidden = true;
      transport.hidden = false;
      scope.hidden = false;
      clock.seek(progress); project();
    } catch (error) {
      if (token !== generation) return;
      read(); root.dataset["repair"] = "true"; status.hidden = false;
      status.textContent = "This animation needs repair. The complete derivation is still available below.";
      console.error("Energy derivation repair", error);
    } finally {
      created?.dispose(); candidate?.remove();
    }
  }
  const play = (requested: Direction) => {
    direction = requested;
    if (reduced.matches) { clock.seek(direction === "forward" ? 1 : 0); void continueJourney(); }
    else clock.play({ direction, stopAt: direction === "forward" ? 1 : 0 });
    project();
  };
  // One clock traverses adjacent native scenes. Direct selection, scrub, pause
  // or close cancels the journey, so a queued handoff cannot restart playback.
  async function continueJourney() {
    const active = journey;
    if (!active || loading || !session) return;
    if (selected === active.target) { journey = undefined; return; }
    await mount(selected + (active.direction === "forward" ? 1 : -1), active.direction === "forward" ? 0 : 1);
    if (journey === active && session && !loading) play(active.direction);
  }
  clock.subscribe(sample => {
    if (sample.source === "autoplay" && sample.settled && journey) void continueJourney();
  });
  function navigate(requested: Direction, target = energyDerivationNavigationTarget(selected, clock.getSnapshot().progress, requested)) {
    if (loading || !session) return;
    selectionRequest++;
    journey = { direction: requested, target };
    play(requested);
  }
  // Coalesce cross-edge seeks while a native scene prepares. Never discard the
  // last pointer sample just because an asynchronous handoff is in progress.
  async function seekPosition(position: number) {
    pendingSeek = position;
    journey = undefined; selectionRequest++; clock.pause();
    if (seeking) return;
    seeking = true;
    try {
      while (pendingSeek !== undefined && !abort.signal.aborted) {
        const wanted = pendingSeek; pendingSeek = undefined;
        const destination = resolveEnergyDerivationPosition(wanted);
        direction = wanted < selected + clock.getSnapshot().progress ? "rewind" : "forward";
        if (session && !loading && selected === destination.move) clock.seek(destination.progress);
        else await mount(destination.move, destination.progress);
        if (root.dataset["repair"] === "true") break;
        project();
      }
    } finally { seeking = false; }
  }
  async function step(requested: Direction, target?: number) {
    if (!session) {
      const initialization = seekPosition(0), request = selectionRequest;
      await initialization;
      if (request !== selectionRequest) return;
    }
    if (loading || !session || drag) return;
    hint.hidden = true;
    navigate(requested, target);
  }
  handle.addEventListener("keydown", event => {
    const requested = ({ ArrowUp: "rewind", ArrowDown: "forward", Home: "rewind", End: "forward" } as const)[event.key as "ArrowUp" | "ArrowDown" | "Home" | "End"];
    if (requested === undefined) return;
    event.preventDefault();
    void step(requested, event.key === "Home" ? 0 : event.key === "End" ? total - 1 : undefined);
  }, opts);
  handle.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    journey = undefined; selectionRequest++; clock.pause();
    hint.hidden = true;
    const box = handle.getBoundingClientRect();
    drag = { pointer: event.pointerId, offset: event.clientY - box.top - box.height / 2 };
    handle.setPointerCapture(event.pointerId);
    root.dataset["derivationDragging"] = "true";
    if (!session) void seekPosition(0);
    project();
  }, opts);
  handle.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const y = event.clientY - drag.offset - get(".energy-derivation-chain").getBoundingClientRect().top;
    void seekPosition(resolveEnergyDerivationMeasuredPosition(y, centers));
  }, opts);
  const endDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    drag = undefined;
    delete root.dataset["derivationDragging"];
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    // No release animation: the sampled pose, including an interior pose, holds.
  };
  handle.addEventListener("pointerup", endDrag, opts);
  handle.addEventListener("pointercancel", endDrag, opts);
  handle.addEventListener("lostpointercapture", endDrag, opts);
  previous.addEventListener("click", () => { void step("rewind"); }, opts);
  next.addEventListener("click", () => { void step("forward"); }, opts);
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); journey = undefined; clock.pause(); project(); }
  }, opts);
  const pause = () => { journey = undefined; selectionRequest++; clock.pause(); project(); };
  // Expanding the justification is a request to read, not a race against the
  // automatic act phase. The handle or explicit step controls resume inspection.
  interleaves.forEach(passage => passage.addEventListener("toggle", () => { pause(); measureRows(); project(); }, { ...opts, capture: true }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, opts);
  reduced.addEventListener("change", pause, opts);
  const visibility = new IntersectionObserver(entries => {
    if (!entries[0]?.isIntersecting) pause();
    else if (!session && !seeking && root.dataset["repair"] !== "true") void seekPosition(0);
  }); visibility.observe(root);
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
  measureRows(); rail.hidden = false;
  scope.hidden = false; transport.hidden = false; positionScope(0); previous.disabled = true;
}

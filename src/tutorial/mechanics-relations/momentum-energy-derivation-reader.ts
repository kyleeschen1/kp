import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";
import { bindEnergyDerivationReturn } from "./energy-derivation-return.ts";
import { createEnergyInspectionBookmarks, type EnergyInspectionPosition } from "./energy-derivation-bookmarks.ts";
import { energyDerivationInspection, sampleSubstitutionEmphasis, sampleDerivationRecordInspection, sampleEnergyDerivationLens, resolveEnergyDerivationMeasuredPosition, resolveEnergyDerivationPosition, energyDerivationNavigationTarget } from "./energy-derivation-presentation.ts";

import type { EnergyDerivationPlan } from "../../semantic/momentum-energy-derivation-plan.ts";
import type { EnergyDerivationDetail } from "../../../domains/physics/momentum-energy-derivation.ts";

export interface DerivationReaderBinding {
  loadPlan(detail: EnergyDerivationDetail): Promise<EnergyDerivationPlan>;
  inspection?(plan: EnergyDerivationPlan, index: number): {
    source: readonly string[]; target: readonly string[]; recordSource: readonly string[]; recordTarget: readonly string[];
  } | undefined;
}
const energyBinding: DerivationReaderBinding = {
  async loadPlan(detail) {
    const [{ createEnergyDerivationPlan }, domain] = await Promise.all([
      import("../../semantic/momentum-energy-derivation-plan.ts"), import("../../../domains/public-api.ts")
    ]);
    const checked = domain.checkMomentumEnergyDerivation(domain.momentumEnergyDerivationSource);
    if (checked.status !== "checked") throw new Error(checked.code);
    return createEnergyDerivationPlan(checked.model, detail);
  },
  inspection(plan, index) {
    if (plan.view.refinement && index === 1) return { ...energyDerivationInspection[1],
      recordTarget: ["rule", "norm", "scalar-before"].map(role => `energy.expand-mass-square.0.${role}`) };
    return !plan.view.refinement || index < 2 ? energyDerivationInspection[index] : undefined;
  }
};

/** Page scroll never owns derivation progress. One shared-clock instance owns
 * the active move; completed lines remain independent historical records. */
interface EnergyReaderState {
  revision: string; transition: string; progress: number;
  bookmarks: readonly EnergyInspectionPosition[]; disclosures: readonly boolean[];
}

/** Coarse and fine are two projections, never two simultaneously active
 * timelines. Retire the old compositor/clock before mounting the next view. */
export function enhanceEnergyDerivation(initialRoot: HTMLElement, binding: DerivationReaderBinding = energyBinding) {
  // Local explanation is part of the fluent reading, not an expert/beginner
  // setting. Keep the explicit comparison opt-out for existing review URLs.
  const detailMode = new URL(location.href).searchParams.get("derivation-detail");
  const enabled = detailMode === "expandable" || (detailMode === null && initialRoot.dataset["derivationReading"] === "fluent");
  if (!enabled) {
    const staticDetail = initialRoot.querySelector<HTMLElement>("[data-refinement-static]");
    if (staticDetail) staticDetail.hidden = true;
    mountEnergyDerivation(initialRoot, binding);
    return;
  }
  const prototype = initialRoot.cloneNode(true) as HTMLElement;
  const expanded = initialRoot.querySelector<HTMLTemplateElement>("[data-refinement-view]");
  let root = initialRoot, active = mountEnergyDerivation(root, binding);
  let saved: { state: EnergyReaderState; offset: number } | undefined;
  let busy = false;
  const bind = () => {
    const staticDetail = root.querySelector<HTMLElement>("[data-refinement-static]");
    if (staticDetail) staticDetail.hidden = true;
    const buttons = root.querySelectorAll<HTMLButtonElement>(saved ? "[data-refinement-collapse]" : "[data-refinement-expand]");
    if (!buttons.length || !enabled || !expanded) return;
    // Header and child affordances enter one transition, never independent
    // collapse states. The busy guard also covers overlapping activations.
    const toggle = async () => {
      if (busy) return;
      busy = true;
      try {
        const collapsing = saved !== undefined;
        const anchor = root.querySelector<HTMLElement>("[data-refinement-anchor]")!;
        if (!collapsing) saved = { state: active.capture(), offset: anchor.getBoundingClientRect().top };
        const next = collapsing ? prototype.cloneNode(true) as HTMLElement : expanded.content.firstElementChild!.cloneNode(true) as HTMLElement;
        const destination = collapsing ? saved!.state : { revision: next.dataset["derivationRevision"]!, transition: next.dataset["refinementFirst"]!, progress: 0, bookmarks: [], disclosures: [] };
        const offset = collapsing ? saved!.offset : anchor.getBoundingClientRect().top;
        active.dispose(); root.replaceWith(next); root = next;
        active = mountEnergyDerivation(root, binding, destination);
        await active.ready;
        if (root.dataset["repair"] === "true") throw new Error("Refinement scene requires repair");
        if (collapsing) saved = undefined;
        bind();
        window.scrollBy({ top: root.querySelector<HTMLElement>("[data-refinement-anchor]")!.getBoundingClientRect().top - offset, behavior: "instant" });
        root.querySelector<HTMLElement>(collapsing ? "[data-refinement-expand]" : "[data-refinement-collapse]")?.focus({ preventScroll: true });
      } catch (error) {
        // A failed optional view must not strand the reader or grant a visual
        // fallback authority. Restore the already checked compact inspection.
        if (saved && root.dataset["derivationDetail"] === "mass-refinement") {
          const previous = saved;
          active.dispose();
          const next = prototype.cloneNode(true) as HTMLElement;
          root.replaceWith(next); root = next;
          active = mountEnergyDerivation(root, binding, previous.state);
          saved = undefined;
          await active.ready;
          bind();
          window.scrollBy({ top: root.querySelector<HTMLElement>("[data-refinement-anchor]")!.getBoundingClientRect().top - previous.offset, behavior: "instant" });
          root.querySelector<HTMLElement>("[data-refinement-expand]")?.focus({ preventScroll: true });
        }
        const status = root.querySelector<HTMLElement>("[data-derivation-status]")!;
        status.hidden = false; status.textContent = "This detail needs repair; the written reasoning remains available.";
        console.error("Energy refinement repair", error);
      } finally { busy = false; }
    };
    buttons.forEach(button => { button.hidden = false; button.addEventListener("click", toggle); });
  };
  bind();
}

function mountEnergyDerivation(root: HTMLElement, binding: DerivationReaderBinding, initial?: EnergyReaderState) {
  const detail = root.dataset["derivationDetail"] === "mass-refinement" ? "mass-refinement" : "coarse";
  // Internal exemplar comparison, not an additional learner control or policy.
  const accented = new URL(location.href).searchParams.get("derivation-emphasis") !== "contrast";
  const motion = new URL(location.href).searchParams.get("derivation-motion");
  const participantOnly = motion === "participants";
  const contextual = motion !== "equation" && !participantOnly;
  const access = new URL(location.href).searchParams.get("derivation-access");
  const localAccess = access !== "off";
  // Desktop access is accepted; the separate phone presentation is not.
  const mobileCandidate = access === "local";
  const phone = matchMedia("(max-width: 520px)");
  const isPhone = () => mobileCandidate && phone.matches;
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  let stage = get<HTMLElement>("[data-derivation-stage]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  const equationSlots = rows.map(row => row.querySelector<HTMLElement>(".energy-derivation-equation")!);
  const interleaves = [...root.querySelectorAll<HTMLElement>("[data-derivation-interleave]")];
  const labels = interleaves.map(passage => {
    const label = passage.dataset["stepLabel"];
    if (!label || !/^[1-9]\d*(\.[1-9]\d*)?$/.test(label)) throw new Error("Missing published transition label");
    return label;
  });
  const ids = [...root.querySelectorAll<HTMLElement>("[data-derivation-template]")].map(el => el.dataset["transitionId"]!);
  const bookmarks = createEnergyInspectionBookmarks(root.dataset["derivationRevision"]!, ids);
  if (initial) {
    if (initial.revision !== root.dataset["derivationRevision"]) throw new Error("Stale energy reader state");
    initial.bookmarks.forEach(position => bookmarks.remember(position.transition, position.progress));
  }
  // Reject a stale/missing transition before allocating a clock or listeners.
  const initialPosition = initial ? bookmarks.position(initial.revision, initial.transition, initial.progress) : undefined;
  let mobileInspect = false, localTop = 0;
  // Controls are enhancement only. The authoritative static states and prose
  // are neither cloned nor made clickable, preserving text selection.
  const localControls = localAccess ? interleaves.map((passage, i) => {
    const controls = document.createElement("div");
    controls.className = "energy-derivation-local-access";
    const parent = passage.dataset["parentStep"];
    if (parent !== undefined && !/^[1-9]\d*$/.test(parent)) throw new Error("Invalid published parent step");
    const backToParent = parent ? `<button type="button" data-refinement-collapse data-refinement-local-return hidden><span aria-hidden="true">↑ </span>Back to step ${parent}</button>` : "";
    controls.innerHTML = `<div class="energy-derivation-actions"><button type="button" data-derivation-entry="${i}" aria-pressed="false">Inspect step ${labels[i]}</button>${backToParent}<button type="button" data-derivation-restart hidden>Restart</button></div>
      <div class="energy-derivation-mobile-well" hidden><small>Inspection · step ${labels[i]}</small><div data-derivation-mobile-slot></div><input type="range" min="0" max="1" step="0.001" value="0" aria-label="Inspect step ${labels[i]}"><div class="energy-derivation-actions"><button type="button" data-local-back>Back</button><button type="button" data-local-forward>Forward</button><button type="button" data-local-close>Done</button></div></div>`;
    const context = passage.querySelector("[data-nested-context]");
    if (context) context.after(controls); else passage.prepend(controls);
    return { element: controls, entry: controls.querySelector<HTMLButtonElement>("[data-derivation-entry]")!,
      restart: controls.querySelector<HTMLButtonElement>("[data-derivation-restart]")!,
      well: controls.querySelector<HTMLElement>(".energy-derivation-mobile-well")!,
      range: controls.querySelector<HTMLInputElement>("input")!,
      back: controls.querySelector<HTMLButtonElement>("[data-local-back]")!,
      forward: controls.querySelector<HTMLButtonElement>("[data-local-forward]")! };
  }) : [];
  root.dataset["localAccess"] = String(localAccess);
  root.dataset["mobileCandidate"] = String(mobileCandidate);
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
  let pendingSeek: { move: number; progress: number } | undefined;
  let seeking = false;
  let selectionRequest = 0;
  const status = get<HTMLElement>("[data-derivation-status]");
  const syncLocalLayout = () => {
    const anchor = localControls[selected]?.entry;
    const before = anchor?.getBoundingClientRect().top;
    root.dataset["mobileInspect"] = String(mobileInspect);
    localControls.forEach((controls, i) => { controls.well.hidden = !(isPhone() && mobileInspect && i === selected); });
    // Opening a local well can close an earlier one above the viewport. Keep
    // the selected entry at its reading offset, not at an old document pixel.
    if (isPhone() && anchor && before !== undefined) {
      const shift = anchor.getBoundingClientRect().top - before;
      if (shift) window.scrollBy({ top: shift, behavior: "instant" });
    }
  };
  const measureRows = () => {
    equationHeights = equationSlots.map(slot => slot.offsetHeight);
    centers = rows.map((row, i) => row.offsetTop + equationHeights[i]! / 2);
    sourceTop = rows[selected]!.offsetTop;
    rowDistance = rows[selected + 1]!.offsetTop - sourceTop;
    rail.style.top = `${centers[0]}px`;
    rail.style.height = `${centers[total]! - centers[0]!}px`;
    [...rail.children].forEach((tick, i) => { (tick as HTMLElement).style.top = `${centers[i]! - centers[0]!}px`; });
    if (isPhone() && mobileInspect) localTop = localControls[selected]!.well.querySelector<HTMLElement>("[data-derivation-mobile-slot]")!.getBoundingClientRect().top
      - get(".energy-derivation-chain").getBoundingClientRect().top;
  };
  const positionScope = (move: number, progress: number) => {
    const position = move + progress;
    scope.style.top = `${centers[move]! + (centers[move + 1]! - centers[move]!) * progress}px`;
    handle.setAttribute("aria-valuenow", String(position));
    handle.setAttribute("aria-valuetext", `Step ${labels[move]}, ${progress === 0 ? "source" : progress === 1 ? "result" : `${Math.round(progress * 100)} percent`}`);
  };
  const project = () => {
    const p = clock.getSnapshot().progress;
    if (!tracing || !session) return;
    const frame = sampleEnergyDerivationLens(p);
    // The host relocates one intact scene. Internal native/material ownership
    // remains exclusively compositor-owned, with co-located algebra endpoints.
    stage.style.transform = `translateY(${isPhone() ? localTop : sourceTop + rowDistance * frame.carry}px)`;
    session.apply(frame.algebra, accented ? sampleSubstitutionEmphasis(p).strength : 0);
    root.dataset["phase"] = frame.phase;
    root.dataset["algebraProgress"] = String(frame.algebra);
    // All three inspections share reversible departure/docking. The permanent
    // record remains independent of the compositor's internal paint ownership.
    const record = sampleDerivationRecordInspection(p, rowDistance, equationHeights[selected]!);
    root.dataset["inspectionExtent"] = participantOnly ? "participants" : "equation";
    root.style.setProperty("--derivation-record-participant-opacity", String(1 - .78 * record.inspectionOpacity));
    // Context belongs in the working expression too. The accepted treatment
    // keeps the whole scene and uses the same continuous handoff on every edge.
    stage.style.opacity = String(contextual || participantOnly || selected === 0 ? record.inspectionOpacity : record.kind === "docked" ? 0 : 1);
    // A labeled local inspection is not another statement in the record. Its
    // native endpoints stay visible inside the well, never atop the fenceposts.
    if (isPhone()) stage.style.opacity = mobileInspect ? "1" : "0";
    root.dataset["inspectionOwner"] = record.kind;
    positionScope(selected, p);
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
    if (!loading) bookmarks.remember(ids[selected]!, p);
    localControls.forEach((controls, i) => {
      const active = i === selected && (!isPhone() || mobileInspect);
      controls.entry.setAttribute("aria-pressed", String(active));
      controls.restart.hidden = !active;
      controls.restart.disabled = loading || p === 0;
      if (i === selected) {
        controls.range.value = String(p);
        controls.range.setAttribute("aria-valuetext", `${Math.round(p * 100)} percent, ${p === 0 ? "source" : p === 1 ? "result" : "between states"}`);
        controls.back.disabled = loading || p === 0;
        controls.forward.disabled = loading || p === 1;
      }
    });
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
      const [{ mountMomentumEnergyDerivationSession }, proofPlan] = await Promise.all([
        import("../../rendering/momentum-energy-derivation-session.ts"), binding.loadPlan(detail)
      ]);
      if (token !== generation) return;
      if (proofPlan.namespace !== root.dataset["derivationNamespace"] || proofPlan.sourceRevision !== root.dataset["derivationSourceRevision"] || proofPlan.moves.length !== ids.length ||
          proofPlan.moves.some((move, i) => move.id !== ids[i])) throw new Error("Published derivation does not match checked runtime binding");
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
      const move = proofPlan.moves[index]!;
      const focus = binding.inspection?.(proofPlan, index) ?? {
        source: [...move.exits, ...(move.notice ?? [])].map(role => `${proofPlan.namespace}.${move.id}.0.${role}`), target: [...move.entries, ...(move.notice ?? [])].map(role => `${proofPlan.namespace}.${move.id}.1.${role}`),
        recordSource: [], recordTarget: []
      };
      const refinement = proofPlan.compactInspection === "refinement" ? await binding.loadPlan("mass-refinement") : undefined;
      if (token !== generation) return;
      created = await mountMomentumEnergyDerivationSession(candidate, proofPlan, index,
        accented || participantOnly ? { ...focus, extent: participantOnly ? "participants" : "equation",
          records: participantOnly ? [{ root: equationSlots[index]!, entityIds: focus.recordSource },
            { root: equationSlots[index + 1]!, entityIds: focus.recordTarget }] : [] } : undefined, refinement);
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
      syncLocalLayout(); measureRows();
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
  function navigate(requested: Direction, target = energyDerivationNavigationTarget(selected, clock.getSnapshot().progress, requested, total)) {
    if (loading || !session) return;
    selectionRequest++;
    journey = { direction: requested, target };
    play(requested);
  }
  // Coalesce cross-edge seeks while a native scene prepares. Never discard the
  // last pointer sample just because an asynchronous handoff is in progress.
  async function seekPosition(position: number) {
    return seekTransition(resolveEnergyDerivationPosition(position, total));
  }
  async function seekTransition(position: { move: number; progress: number }) {
    pendingSeek = position;
    journey = undefined; selectionRequest++; clock.pause();
    if (seeking) return;
    seeking = true;
    try {
      while (pendingSeek !== undefined && !abort.signal.aborted) {
        const wanted = pendingSeek; pendingSeek = undefined;
        direction = wanted.move + wanted.progress < selected + clock.getSnapshot().progress ? "rewind" : "forward";
        if (session && !loading && selected === wanted.move) clock.seek(wanted.progress);
        else await mount(wanted.move, wanted.progress);
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
  localControls.forEach((controls, index) => {
    const activate = (restart = false) => {
      pause();
      try {
        const destination = bookmarks.recall(root.dataset["derivationRevision"]!, ids[index]!, restart);
        mobileInspect = true;
        // Measure only when entering/changing layout, never on scrub samples.
        if (session && !loading && selected === index) { syncLocalLayout(); measureRows(); }
        void seekTransition(destination);
      } catch (error) {
        status.hidden = false; status.textContent = "This inspection belongs to an older revision. Reload before inspecting.";
        console.error("Derivation selection repair", error);
      }
    };
    controls.entry.addEventListener("click", () => activate(), opts);
    controls.restart.addEventListener("click", () => activate(true), opts);
    controls.range.addEventListener("input", () => {
      if (index === selected) void seekTransition(bookmarks.position(root.dataset["derivationRevision"]!, ids[index]!, Number(controls.range.value)));
    }, opts);
    controls.back.addEventListener("click", () => { pause(); play("rewind"); }, opts);
    controls.forward.addEventListener("click", () => { pause(); play("forward"); }, opts);
    controls.element.querySelector("[data-local-close]")!.addEventListener("click", () => {
      pause(); mobileInspect = false; syncLocalLayout(); measureRows(); project();
      controls.entry.focus({ preventScroll: true });
    }, opts);
  });
  phone.addEventListener("change", () => { pause(); syncLocalLayout(); measureRows(); project(); }, opts);
  if (new URL(location.href).searchParams.get("derivation-provenance") !== "off") {
    bindEnergyDerivationReturn(root, {
      pause,
      async capturePosition() {
        // Finish the latest requested seek before saving a revision-pinned
        // bookmark; never capture a previous edge while its successor prepares.
        if (seeking || loading) throw new Error("Wait for the current derivation seek to finish");
        if (!session) await seekPosition(0);
        return { transition: ids[selected]!, progress: clock.getSnapshot().progress };
      },
      async restorePosition(id, progress) {
        const index = ids.indexOf(id);
        if (index < 0) throw new Error("Unknown derivation return transition");
        await mount(index, progress);
        if (!session) throw new Error("Derivation return scene could not be prepared");
      },
      remeasure() { measureRows(); project(); }
    }, abort.signal);
  }
  if (initial?.disclosures.length) [...root.querySelectorAll<HTMLDetailsElement>("details")].forEach((el, i) => { el.open = initial.disclosures[i] ?? false; });
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
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    pause(); retire(); visibility.disconnect(); resize.disconnect(); abort.abort(); clock.dispose();
  };
  window.addEventListener("pagehide", event => { pause(); if (!event.persisted) dispose(); }, opts);
  hint.hidden = false;
  measureRows(); rail.hidden = false;
  scope.hidden = false; transport.hidden = false; positionScope(0, 0); previous.disabled = true;
  const ready = initialPosition ? seekTransition(initialPosition) : Promise.resolve();
  return { ready, dispose, capture(): EnergyReaderState {
    pause();
    if (loading || seeking || !session) throw new Error("Wait for the active derivation scene to finish preparing");
    return { revision: root.dataset["derivationRevision"]!, transition: ids[selected]!, progress: clock.getSnapshot().progress,
      bookmarks: bookmarks.snapshot(), disclosures: [...root.querySelectorAll<HTMLDetailsElement>("details")].map(el => el.open) };
  } };
}

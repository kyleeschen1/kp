import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createInspectionEdgeScroll } from "../../reader/runtime/inspection-edge-scroll.ts";
import { holdDisclosureViewportAnchor } from "../../reader/runtime/disclosure-viewport-anchor.ts";
import { createEnergyRefinementUnfolding } from "./energy-refinement-unfolding.ts";
import { holdEnergyDisclosurePaint, visibleDerivationHandle } from "./energy-disclosure-paint.ts";
import { createDerivationScenePool } from "./derivation-scene-pool.ts";
import { lensProgressForAlgebra } from "./energy-derivation-presentation.ts";
import { equationViewportBounds, revealEquationInViewport } from "../../reader/runtime/equation-viewport.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";
import { bindEnergyDerivationReturn } from "./energy-derivation-return.ts";
import { createEnergyInspectionBookmarks, type EnergyInspectionPosition } from "./energy-derivation-bookmarks.ts";
import { energyDerivationInspection, sampleSubstitutionEmphasis, sampleDerivationRecordInspection, sampleInsetDerivationRecord, sampleEnergyDerivationLens, resolveEnergyDerivationMeasuredPosition, resolveEnergyDerivationPosition, energyDerivationNavigationTarget } from "./energy-derivation-presentation.ts";

import type { EnergyDerivationPlan } from "../../semantic/momentum-energy-derivation-plan.ts";
import type { EnergyDerivationDetail } from "../../../domains/physics/momentum-energy-derivation.ts";

export interface DerivationReaderBinding {
  loadPlan(detail: EnergyDerivationDetail, parentId?: string): Promise<EnergyDerivationPlan>;
  inspection?(plan: EnergyDerivationPlan, index: number): {
    source: readonly string[]; target: readonly string[]; recordSource: readonly string[]; recordTarget: readonly string[];
  } | undefined;
}
const energyBinding: DerivationReaderBinding = {
  async loadPlan(detail, parentId) {
    const [{ createEnergyDerivationPlan, unfoldDerivationInspection }, domain] = await Promise.all([
      import("../../semantic/momentum-energy-derivation-plan.ts"), import("../../../domains/public-api.ts")
    ]);
    const checked = domain.checkMomentumEnergyDerivation(domain.momentumEnergyDerivationSource);
    if (checked.status !== "checked") throw new Error(checked.code);
    return detail === "mass-refinement" && parentId === "scale-magnitude"
      ? unfoldDerivationInspection(createEnergyDerivationPlan(checked.model), parentId)
      : createEnergyDerivationPlan(checked.model, detail);
  },
  inspection(plan, index) {
    if (plan.view.refinement?.parentTransitionId === 'physics.energy.scale-magnitude') return undefined;
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
type PreparedScene = { element: HTMLElement; session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>>; cacheKey: string };
type ScenePool = ReturnType<typeof createDerivationScenePool<PreparedScene>>;
let rendererModule: Promise<typeof import('../../rendering/momentum-energy-derivation-session.ts')> | undefined;

/** Coarse and fine are two projections, never two simultaneously active
 * timelines. Retire the old compositor/clock before mounting the next view. */
export function enhanceEnergyDerivation(initialRoot: HTMLElement, binding: DerivationReaderBinding = energyBinding) {
  // Issued plans are immutable within this published reader. Reuse their
  // authority on disclosure instead of checking and compiling them again.
  const sourceBinding = binding, plans = new Map<string, Promise<EnergyDerivationPlan>>();
  binding = { ...sourceBinding, loadPlan(detail, parentId) {
    const key = JSON.stringify([detail, parentId]);
    let plan = plans.get(key);
    if (!plan) {
      plan = sourceBinding.loadPlan(detail, parentId);
      plans.set(key, plan);
      void plan.catch(() => plans.delete(key));
    }
    return plan;
  } };
  // Local explanation is part of the fluent reading, not an expert/beginner
  // setting. Keep the explicit comparison opt-out for existing review URLs.
  const detailMode = new URL(location.href).searchParams.get("derivation-detail");
  const enabled = detailMode === "expandable" || (detailMode === null &&
    (initialRoot.dataset["derivationReading"] === "fluent" || initialRoot.dataset["refinementDefault"] === "true"));
  if (!enabled) {
    const staticDetail = initialRoot.querySelector<HTMLElement>("[data-refinement-static]");
    if (staticDetail) staticDetail.hidden = true;
    mountEnergyDerivation(initialRoot, binding);
    return;
  }
  const prototype = initialRoot.cloneNode(true) as HTMLElement;
  const expansions = [...initialRoot.querySelectorAll<HTMLTemplateElement>("[data-refinement-view]")];
  const unfold = initialRoot.dataset['derivationNamespace'] === 'energy' && detailMode === null
    ? createEnergyRefinementUnfolding(initialRoot) : undefined;
  const pool = unfold ? createDerivationScenePool<PreparedScene>(initialRoot.querySelectorAll('[data-derivation-template]').length +
    expansions.reduce((sum, template) => sum + template.content.querySelectorAll('[data-derivation-template]').length, 0)) : undefined;
  if (pool) window.addEventListener('pagehide', event => { if (!event.persisted) pool.close(); });
  let root = initialRoot, active = mountEnergyDerivation(root, binding, undefined, pool);
  let saved: { state: EnergyReaderState; offset: number; parentId: string } | undefined;
  let busy = false;
  let controls = new AbortController();
  const replace = (next: HTMLElement) => {
    if (unfold) root = unfold(next);
    else { root.replaceWith(next); root = next; }
  };
  const bind = () => {
    controls.abort(); controls = new AbortController();
    root.querySelectorAll<HTMLElement>("[data-refinement-static]").forEach(el => el.hidden = true);
    root.querySelectorAll<HTMLElement>("[data-refinement-expand]").forEach(el => el.hidden = !!saved);
    const buttons = root.querySelectorAll<HTMLButtonElement>(saved ? "[data-refinement-collapse], [data-refinement-parent-return]" : "[data-refinement-expand]");
    if (!buttons.length || !enabled || !expansions.length) return;
    // Header and child affordances enter one transition, never independent
    // collapse states. The busy guard also covers overlapping activations.
    const toggle = async (event: Event) => {
      if (busy) return;
      const entry = event.currentTarget;
      if (!(entry instanceof HTMLElement)) return;
      busy = true;
      const grip = unfold ? visibleDerivationHandle(root) : undefined;
      const visualOffset = grip?.getBoundingClientRect().top;
      const viewportAnchor = holdDisclosureViewportAnchor(grip ?? entry);
      let paintHold: ReturnType<typeof holdEnergyDisclosurePaint> | undefined;
      try {
        const collapsing = saved !== undefined;
        if (!collapsing) saved = { state: active.capture(), offset: entry.getBoundingClientRect().top, parentId: entry.dataset['refinementExpand']! };
        const expanded = expansions.find(template => template.dataset['refinementView'] === saved!.parentId)!;
        const next = collapsing ? prototype.cloneNode(true) as HTMLElement : expanded.content.firstElementChild!.cloneNode(true) as HTMLElement;
        const destination: EnergyReaderState = collapsing ? { ...saved!.state } : { revision: next.dataset["derivationRevision"]!, transition: next.dataset["refinementFirst"]!, progress: 0, bookmarks: [], disclosures: [] };
        if (collapsing && (entry.hasAttribute('data-refinement-local-return') || entry.hasAttribute('data-refinement-parent-return'))) {
          destination.transition = saved!.parentId;
          destination.progress = saved!.state.transition === saved!.parentId ? saved!.state.progress :
            saved!.state.bookmarks.find(position => position.transition === saved!.parentId)?.progress ?? 0;
        }
        if (!collapsing) {
          const previous = saved!.state;
          const ids = [...next.querySelectorAll<HTMLElement>('[data-derivation-template]')].map(el => el.dataset['transitionId']);
          destination.bookmarks = previous.bookmarks.filter(position => ids.includes(position.transition))
            .map(position => ({ ...position, move: ids.indexOf(position.transition) }));
          if (ids.includes(previous.transition)) {
            destination.transition = previous.transition; destination.progress = previous.progress;
          } else if (previous.transition === saved!.parentId) {
            const coarse = await binding.loadPlan('coarse');
            if (coarse.inspections?.[saved!.parentId]) {
              const [{ unfoldDerivationInspection }, { createDerivationRefinementMapping }] = await Promise.all([
                import('../../semantic/momentum-energy-derivation-plan.ts'),
                import('../../animation/derivation-inspection-composition.ts')
              ]);
              const mapping = createDerivationRefinementMapping(coarse, unfoldDerivationInspection(coarse, saved!.parentId));
              const mapped = mapping.mapAlgebra(sampleEnergyDerivationLens(previous.progress).algebra);
              if (mapped) {
                destination.transition = mapped.transition;
                destination.progress = lensProgressForAlgebra(mapped.progress);
              }
            }
          }
        }
        const offset = saved!.offset;
        if (grip) paintHold = holdEnergyDisclosurePaint(root, grip, active.detachPaint());
        active.dispose(true); replace(next);
        paintHold?.attach();
        active = mountEnergyDerivation(root, binding, destination, pool);
        // Transfer before yielding: renderer preparation may span visible
        // frames, and a hidden control cannot supply an anchor rectangle.
        const restoredEntry = root.querySelector<HTMLElement>(collapsing ? `[data-refinement-expand="${saved!.parentId}"]` : "[data-refinement-collapse]")!;
        restoredEntry.hidden = false;
        viewportAnchor.retarget(grip ?? restoredEntry, visualOffset ?? offset);
        await active.ready;
        if (root.dataset["repair"] === "true") throw new Error("Refinement scene requires repair");
        paintHold?.release();
        if (collapsing) saved = undefined;
        bind();
        if (viewportAnchor.retarget(grip ?? restoredEntry, visualOffset ?? offset)) restoredEntry.focus({ preventScroll: true });
        if (!grip) active.reveal();
      } catch (error) {
        // A failed optional view must not strand the reader or grant a visual
        // fallback authority. Restore the already checked compact inspection.
        if (saved && root.dataset["derivationDetail"] === "mass-refinement") {
          const previous = saved;
          active.dispose(true);
          const next = prototype.cloneNode(true) as HTMLElement;
          replace(next);
          paintHold?.attach();
          active = mountEnergyDerivation(root, binding, previous.state, pool);
          saved = undefined;
          const restoredEntry = root.querySelector<HTMLElement>(`[data-refinement-expand="${previous.parentId}"]`)!;
          restoredEntry.hidden = false;
          viewportAnchor.retarget(grip ?? restoredEntry, visualOffset ?? previous.offset);
          await active.ready;
          paintHold?.release();
          bind();
          if (viewportAnchor.retarget(grip ?? restoredEntry, visualOffset ?? previous.offset)) restoredEntry.focus({ preventScroll: true });
        }
        // Recovery survives later compositor rebuilds, which own the separate
        // transient preparation status.
        let status = root.querySelector<HTMLElement>("[data-refinement-status]");
        if (!status) {
          status = document.createElement("p");
          status.dataset["refinementStatus"] = "";
          status.setAttribute("role", "status");
          root.querySelector("[data-derivation-status]")!.after(status);
        }
        status.hidden = false; status.textContent = "This detail needs repair; the written reasoning remains available.";
        console.error("Energy refinement repair", error);
      } finally { paintHold?.release(); busy = false; }
    };
    buttons.forEach(button => { button.hidden = false; button.addEventListener("click", toggle, { signal: controls.signal }); });
  };
  bind();
}

function mountEnergyDerivation(root: HTMLElement, binding: DerivationReaderBinding, initial?: EnergyReaderState, pool?: ScenePool) {
  const detail = root.dataset["derivationDetail"] === "mass-refinement" ? "mass-refinement" : "coarse";
  // Internal exemplar comparison, not an additional learner control or policy.
  const accented = new URL(location.href).searchParams.get("derivation-emphasis") !== "contrast";
  const motion = new URL(location.href).searchParams.get("derivation-motion");
  // Retired comparison URLs use the accepted full-context presentation. The
  // participant-only experiment cannot represent checked compound transitions.
  const contextual = motion !== "equation";
  if (motion === "participants") root.dataset["retiredComparison"] = "participants";
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
  const publicationRevision = root.dataset["derivationRevision"]!;
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
    controls.innerHTML = `<div class="energy-derivation-actions"><button type="button" data-derivation-entry="${i}" aria-pressed="false">Inspect step ${labels[i]}</button>${backToParent}<button type="button" data-derivation-restart style="visibility: hidden" disabled>Restart</button></div>
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
  // Energy is the review exemplar. Other derivations keep their accepted rail
  // until a second caller establishes which presentation choices should travel.
  const refinedRail = root.dataset["derivationNamespace"] === "energy";
  const railStops = [...rail.querySelectorAll<HTMLElement>(':scope > span')];
  if (refinedRail) root.dataset["railRefinement"] = "true";
  let centers: number[] = [];
  let equationHeights: number[] = [];
  const clock = createKpReaderTimelinePlaybackClock({ id: "energy.derivation.clock", durationMs: 4400 });
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
  let prepared: PreparedScene[] = [];
  let preparedPlan: EnergyDerivationPlan | undefined;
  let selected = 0, tracing = false, loading = false, generation = 0;
  let sourceTop = 0, rowDistance = 0;
  const scope = get<HTMLElement>("[data-derivation-scope]");
  const handle = get<HTMLButtonElement>("[data-derivation-handle]");
  const transport = get<HTMLElement>("[data-derivation-transport]");
  const previous = get<HTMLButtonElement>("[data-derivation-previous]");
  const next = get<HTMLButtonElement>("[data-derivation-next]");
  const hint = get<HTMLElement>("[data-derivation-hint]");
  if (refinedRail) {
    get('.energy-derivation-workspace').before(hint);
    hint.textContent = "Click the rail to jump; drag to inspect a move. Arrow keys step forward or back.";
    handle.querySelector('span')!.textContent = "";
  }
  const total = rows.length - 1;
  type Direction = "forward" | "rewind";
  let direction: Direction = "forward";
  let journey: { direction: Direction; target: number } | undefined;
  let drag: { pointer: number; offset: number } | undefined;
  let pendingSeek: { move: number; progress: number } | undefined;
  let seeking = false;
  let selectionRequest = 0;
  let revealRequested = false, revealFrame: number | undefined;
  const revealSelection = () => {
    if (!revealRequested || loading || seeking || drag || abort.signal.aborted) return;
    revealRequested = false;
    const p = clock.getSnapshot().progress;
    revealEquationInViewport(p === 0 ? equationSlots[selected]! : p === 1 ? equationSlots[selected + 1]! : stage);
  };
  const scheduleReveal = () => {
    if (revealFrame !== undefined) return;
    revealFrame = requestAnimationFrame(() => { revealFrame = undefined; revealSelection(); });
  };
  const cancelReveal = () => {
    revealRequested = false;
    if (revealFrame !== undefined) cancelAnimationFrame(revealFrame);
    revealFrame = undefined;
  };
  // Visibility follows explicit navigation, never ordinary reading scroll.
  document.addEventListener('wheel', cancelReveal, { ...opts, passive: true });
  document.addEventListener('touchstart', cancelReveal, { ...opts, passive: true });
  document.addEventListener('pointerdown', cancelReveal, { ...opts, capture: true });
  document.addEventListener('keydown', cancelReveal, { ...opts, capture: true });
  window.addEventListener('blur', cancelReveal, opts);
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
    const origin = get(".energy-derivation-chain").getBoundingClientRect().top;
    const boxes = equationSlots.map(slot => slot.getBoundingClientRect());
    equationHeights = boxes.map(box => box.height);
    centers = boxes.map(box => box.top - origin + box.height / 2);
    sourceTop = rows[selected]!.offsetTop;
    rowDistance = rows[selected + 1]!.offsetTop - sourceTop;
    rail.style.top = `${centers[0]}px`;
    rail.style.height = `${centers[total]! - centers[0]!}px`;
    railStops.forEach((tick, i) => { tick.style.top = `${centers[i]! - centers[0]!}px`; });
    if (isPhone() && mobileInspect) localTop = localControls[selected]!.well.querySelector<HTMLElement>("[data-derivation-mobile-slot]")!.getBoundingClientRect().top
      - get(".energy-derivation-chain").getBoundingClientRect().top;
  };
  const positionScope = (move: number, progress: number) => {
    const position = move + progress;
    scope.style.top = `${centers[move]! + (centers[move + 1]! - centers[move]!) * progress}px`;
    handle.setAttribute("aria-valuenow", String(position));
    handle.setAttribute("aria-valuetext", `Step ${labels[move]}, ${progress === 0 ? "source" : progress === 1 ? "result" : `${Math.round(progress * 100)} percent`}`);
    if (refinedRail) {
      const between = progress > 0 && progress < 1;
      const dock = progress === 0 ? move : move + 1;
      root.dataset["railPosition"] = between ? "between" : "docked";
      rail.style.setProperty('--rail-move-top', `${centers[move]! - centers[0]!}px`);
      rail.style.setProperty('--rail-move-height', `${centers[move + 1]! - centers[move]!}px`);
      railStops.forEach((stop, i) => {
        stop.dataset["railStop"] = between && (i === move || i === move + 1) ? "boundary" : !between && i === dock ? "current" : "rest";
      });
      interleaves.forEach((passage, i) => { passage.dataset["railActive"] = String(between && i === move); });
    }
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
    const inset = refinedRail && !isPhone()
      ? sampleInsetDerivationRecord(p, rowDistance, Math.max(equationHeights[selected]!, equationHeights[selected + 1]!)) : undefined;
    const record = inset ?? sampleDerivationRecordInspection(p, rowDistance, equationHeights[selected]!);
    root.dataset["insetFenceposts"] = String(inset !== undefined);
    root.dataset["inspectionExtent"] = "equation";
    root.style.setProperty("--derivation-record-participant-opacity", String(1 - .78 * record.inspectionOpacity));
    // Context belongs in the working expression too. The accepted treatment
    // keeps the whole scene and uses the same continuous handoff on every edge.
    stage.style.opacity = String(contextual || selected === 0 ? record.inspectionOpacity : record.kind === "docked" ? 0 : 1);
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
      if (inset) row.style.setProperty('--derivation-record-presence', String(i === selected ? inset.sourcePresence : i === selected + 1 ? inset.targetPresence : 1));
      else row.style.removeProperty('--derivation-record-presence');
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
      // Activation must not reflow the very interval being dragged. Reserve
      // the contextual control's space even when a narrow toolbar wraps.
      controls.restart.style.visibility = active ? "visible" : "hidden";
      controls.restart.disabled = !active || loading || p === 0;
      if (i === selected) {
        controls.range.value = String(p);
        controls.range.setAttribute("aria-valuetext", `${Math.round(p * 100)} percent, ${p === 0 ? "source" : p === 1 ? "result" : "between states"}`);
        controls.back.disabled = loading || p === 0;
        controls.forward.disabled = loading || p === 1;
      }
    });
  };
  clock.subscribe(project);
  const retire = (recycle = false) => {
    generation++;
    if (!recycle) pool?.clear();
    for (const scene of prepared) {
      if (recycle && pool) pool.put(scene);
      else { scene.session.dispose(); if (scene.element !== stage) scene.element.remove(); }
    }
    prepared = []; preparedPlan = undefined; session = undefined; handle.disabled = true;
  };
  const activate = (index: number, progress: number) => {
    const scene = prepared[index]!;
    stage.hidden = true; stage.removeAttribute("data-derivation-stage");
    stage = scene.element; session = scene.session;
    stage.hidden = false; stage.setAttribute("data-derivation-stage", "");
    root.querySelectorAll<HTMLElement>("[data-derivation-record-participant]").forEach(element => { delete element.dataset["derivationRecordParticipant"]; });
    session.activateRecords(); selected = index;
    syncLocalLayout(); measureRows();
    loading = false; status.hidden = true; handle.disabled = false;
    transport.hidden = false; scope.hidden = false;
    clock.seek(progress); project();
  };
  const read = () => {
    edgeScroll.stop();
    selectionRequest++; drag = undefined; journey = undefined; pendingSeek = undefined;
    clock.pause(); retire(); tracing = false; loading = false;
    delete root.dataset["derivationDragging"];
    root.dataset["tracing"] = "false"; stage.hidden = true;
    rows.forEach(row => { row.hidden = false; delete row.dataset["traceRole"]; row.style.removeProperty("--derivation-record-emphasis"); });
    transport.hidden = true; status.hidden = true;
    scope.hidden = true;
  };
  async function mount(index: number, progress: number) {
    // Every scene in this bounded checked view is ready before direct input.
    // Crossing an edge must not await fonts, compilation, or native measurement.
    if (prepared.length === total) { activate(index, progress); return; }
    clock.pause(); const token = ++generation; loading = true; project();
    // Keep the current paint and layout while fonts/measurement prepare the
    // successor. A visible stage reset to row zero is not an animation phase.
    status.hidden = tracing; status.textContent = "Preparing this move…";
    let candidate: HTMLElement | undefined;
    let created: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
    const pending: PreparedScene[] = [];
    let inspectionRight = 0;
    try {
      const [{ mountMomentumEnergyDerivationSession }, proofPlan] = await Promise.all([
        rendererModule ??= import("../../rendering/momentum-energy-derivation-session.ts"), binding.loadPlan(detail, root.dataset['refinementParentId'])
      ]);
      if (token !== generation) return;
      if (proofPlan.namespace !== root.dataset["derivationNamespace"] || proofPlan.sourceRevision !== root.dataset["derivationSourceRevision"] || proofPlan.moves.length !== ids.length ||
          proofPlan.moves.some((move, i) => move.id !== ids[i])) throw new Error("Published derivation does not match checked runtime binding");
      tracing = true;
      root.dataset["tracing"] = "true";
      rows.forEach(row => { row.hidden = false; });
      const refinement = proofPlan.compactInspection === "refinement" ? await binding.loadPlan("mass-refinement") : undefined;
      await document.fonts.ready;
      if (token !== generation) return;
      const alignBaselines = (equations: HTMLElement[]) => {
        // Align newly published records even when every compositor is reused.
        // The semantic prefix, not the changing strut envelope, owns the dock.
        for (const equation of equations) {
          const paint = equation.querySelector<HTMLElement>('.katex-display')!;
          paint.style.transform = 'none';
          const prefix = equation.querySelector<HTMLElement>('[data-kp-semantic-entity-id$=".prefix"]');
          if (!prefix) throw new Error('Derivation baseline requires its invariant semantic prefix');
          const frame = equation.getBoundingClientRect(), ink = prefix.getBoundingClientRect();
          paint.style.transform = `translateY(${frame.top + frame.height / 2 - ink.top - ink.height / 2}px)`;
        }
      };
      alignBaselines(equationSlots);
      const keyFor = (plan: EnergyDerivationPlan, sceneIndex: number, template: HTMLTemplateElement) => {
        const font = getComputedStyle(equationSlots[0]!.querySelector('.katex')!);
        return JSON.stringify([plan.sourceRevision, plan.moves[sceneIndex]!.id, template.innerHTML,
          root.getBoundingClientRect().width, font.font, font.letterSpacing, font.lineHeight, fontRevision]);
      };
      const prepareScene = async (plan: EnergyDerivationPlan, sceneIndex: number, template: HTMLTemplateElement) => {
        const cacheKey = keyFor(plan, sceneIndex, template);
        const cached = pool?.take(cacheKey);
        if (cached) { stage.parentElement!.append(cached.element); pending.push(cached); return; }
        candidate = stage.cloneNode(false) as HTMLElement;
        candidate.removeAttribute("data-derivation-stage");
        candidate.setAttribute("data-derivation-preparing", "");
        candidate.setAttribute("aria-hidden", "true");
        candidate.replaceChildren(template.content.cloneNode(true)); candidate.hidden = false;
        candidate.style.opacity = "0"; candidate.style.top = "0px"; candidate.style.transform = "none";
        stage.parentElement!.append(candidate);
        const target = candidate.querySelector<HTMLElement>("[data-derivation-target]")!;
        target.style.top = "0px";
        await document.fonts.ready;
        if (token !== generation) return;
        alignBaselines([...candidate.querySelectorAll<HTMLElement>('.energy-derivation-endpoint')]);
        if (root.hasAttribute("data-measured-inspection-lane")) {
          // Interior child states can exceed both coarse endpoints. Reserve
          // their native ink extent once before input, never during a drag.
          const origin = root.getBoundingClientRect().left;
          for (const ink of candidate.querySelectorAll<HTMLElement>(".katex-html > .base"))
            inspectionRight = Math.max(inspectionRight, ink.getBoundingClientRect().right - origin);
        }
        const move = plan.moves[sceneIndex]!;
        const focus = binding.inspection?.(plan, sceneIndex) ?? {
          source: [...move.exits, ...(move.notice ?? [])].map(role => `${plan.namespace}.${move.id}.0.${role}`), target: [...move.entries, ...(move.notice ?? [])].map(role => `${plan.namespace}.${move.id}.1.${role}`),
          recordSource: [], recordTarget: []
        };
        if (token !== generation) return;
        created = await mountMomentumEnergyDerivationSession(candidate, plan, sceneIndex,
          accented ? { ...focus, extent: "equation", records: [] } : undefined, refinement);
        if (token !== generation) return;
        candidate.hidden = true; candidate.removeAttribute("data-derivation-preparing");
        pending.push({ element: candidate, session: created, cacheKey });
        candidate = undefined; created = undefined;
      };
      for (let sceneIndex = 0; sceneIndex < total; sceneIndex++) {
        await prepareScene(proofPlan, sceneIndex, get<HTMLTemplateElement>(`[data-derivation-template="${sceneIndex}"]`));
        if (token !== generation) return;
      }
      // Prepare the bounded published detail set before offering direct input.
      // A first disclosure must not compile native scenes inside its click task.
      if (pool && detail === 'coarse' && !initial) {
        const activeKeys = new Set(pending.map(scene => scene.cacheKey));
        for (const view of root.querySelectorAll<HTMLTemplateElement>('[data-refinement-view]')) {
          const fine = await binding.loadPlan('mass-refinement', view.dataset['refinementView']);
          const templates = [...view.content.querySelectorAll<HTMLTemplateElement>('[data-derivation-template]')];
          for (const [i, template] of templates.entries()) {
            if (activeKeys.has(keyFor(fine, i, template))) continue;
            await prepareScene(fine, i, template);
            if (token !== generation) return;
            pool.put(pending.pop()!);
          }
        }
      }
      stage.remove();
      prepared = pending.splice(0);
      preparedPlan = proofPlan;
      if (inspectionRight > 0) root.style.setProperty("--derivation-inspection-lane", `${Math.ceil(inspectionRight)}px`);
      activate(index, progress);
    } catch (error) {
      if (token !== generation) return;
      read(); root.dataset["repair"] = "true"; status.hidden = false;
      status.textContent = "This animation needs repair. The complete derivation is still available below.";
      console.error("Energy derivation repair", error);
    } finally {
      created?.dispose(); candidate?.remove();
      for (const scene of pending) { scene.session.dispose(); scene.element.remove(); }
      scheduleGeometry();
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
    if (sample.settled && revealRequested) scheduleReveal();
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
    } finally { seeking = false; if (revealRequested) scheduleReveal(); }
  }
  async function step(requested: Direction, target?: number) {
    revealRequested = true;
    if (!session) {
      const initialization = seekPosition(0), request = selectionRequest;
      await initialization;
      if (request !== selectionRequest) return;
    }
    if (loading || !session || drag) return;
    if (!refinedRail) hint.hidden = true;
    navigate(requested, target);
  }
  handle.addEventListener("keydown", event => {
    const requested = ({ ArrowUp: "rewind", ArrowDown: "forward", Home: "rewind", End: "forward" } as const)[event.key as "ArrowUp" | "ArrowDown" | "Home" | "End"];
    if (requested === undefined) return;
    event.preventDefault();
    void step(requested, event.key === "Home" ? 0 : event.key === "End" ? total - 1 : undefined);
  }, opts);
  const edgeScroll = createInspectionEdgeScroll({ signal: abort.signal,
    // Reserve an extra upper reading margin in addition to the shared 48px
    // clearance; a docked first equation must not hug the viewport edge.
    readableBounds: () => ({ top: Math.min(root.getBoundingClientRect().top, equationViewportBounds(equationSlots[0]!).top) - 48,
      bottom: equationViewportBounds(equationSlots[total]!).bottom }),
    bounds: () => {
      const top = get(".energy-derivation-chain").getBoundingClientRect().top + (drag?.offset ?? 0);
      return { top: top + centers[0]!, bottom: top + centers[total]! };
    },
    sample: clientY => {
      if (!drag) return;
      const y = clientY - drag.offset - get(".energy-derivation-chain").getBoundingClientRect().top;
      void seekPosition(resolveEnergyDerivationMeasuredPosition(y, centers));
    }
  });
  const cancelDrag = () => {
    edgeScroll.stop();
    const pointer = drag?.pointer; drag = undefined;
    delete root.dataset["derivationDragging"];
    if (pointer !== undefined && handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
  };
  const beginInspection = (event: PointerEvent, jump: boolean) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    journey = undefined; selectionRequest++; clock.pause();
    if (!refinedRail) hint.hidden = true;
    // Expansion can reveal parent-return controls after scene preparation.
    // Capture current document geometry before the first sample, not at the
    // first crossed edge (which would jump the handle by the added height).
    measureRows();
    const box = handle.getBoundingClientRect();
    let clientY = event.clientY;
    if (jump) {
      const origin = get('.energy-derivation-chain').getBoundingClientRect().top;
      const stop = centers.find(center => Math.abs(origin + center - clientY) <= 6);
      if (stop !== undefined) clientY = origin + stop;
    }
    drag = { pointer: event.pointerId, offset: jump ? event.clientY - clientY : event.clientY - box.top - box.height / 2 };
    handle.setPointerCapture(event.pointerId);
    root.dataset["derivationDragging"] = "true";
    if (!session && !jump) void seekPosition(0);
    project();
    edgeScroll.update(event.clientY);
    handle.focus({ preventScroll: true });
  };
  handle.addEventListener('pointerdown', event => beginInspection(event, false), opts);
  if (refinedRail) rail.addEventListener('pointerdown', event => beginInspection(event, true), opts);
  handle.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    edgeScroll.update(event.clientY);
  }, opts);
  const endDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    cancelDrag();
    if (event.type === 'pointerup') { revealRequested = true; scheduleReveal(); }
    // No release animation: the sampled pose, including an interior pose, holds.
  };
  handle.addEventListener("pointerup", endDrag, opts);
  handle.addEventListener("pointercancel", endDrag, opts);
  handle.addEventListener("lostpointercapture", endDrag, opts);
  previous.addEventListener("click", () => { void step("rewind"); }, opts);
  next.addEventListener("click", () => { void step("forward"); }, opts);
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); cancelDrag(); journey = undefined; clock.pause(); project(); }
  }, opts);
  const pause = () => { cancelDrag(); journey = undefined; selectionRequest++; clock.pause(); project(); };
  window.addEventListener("blur", pause, opts);
  localControls.forEach((controls, index) => {
    const activate = (restart = false) => {
      pause();
      try {
        const destination = bookmarks.recall(root.dataset["derivationRevision"]!, ids[index]!, restart);
        mobileInspect = true;
        // Measure only when entering/changing layout, never on scrub samples.
        if (session && !loading && selected === index) { syncLocalLayout(); measureRows(); }
        revealRequested = true;
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
      async inspectUse(resultId) {
        const request = selectionRequest;
        const { resolveDerivationRecallUse } = await import("../../semantic/momentum-energy-derivation-plan.ts");
        if (abort.signal.aborted || request !== selectionRequest) return;
        if (!preparedPlan || loading || seeking || drag || publicationRevision !== root.dataset["derivationRevision"])
          throw new Error("Derivation reference is not ready in this publication");
        const use = resolveDerivationRecallUse(preparedPlan, resultId, root.dataset["derivationSourceRevision"]!);
        if (use.status !== "ready") throw new Error(use.code);
        // Reference identity chooses the operation; neither a DOM row number
        // nor matching LaTeX can authorize replay. One existing clock owns it.
        const selecting = seekTransition({ move: use.move, progress: 0 });
        const selectedRequest = selectionRequest;
        await selecting;
        if (abort.signal.aborted || selectedRequest !== selectionRequest || !session || loading) return;
        if (!refinedRail) hint.hidden = true;
        play("forward");
      },
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
  let disclosureAnchor: { summary: HTMLElement; viewport: ReturnType<typeof holdDisclosureViewportAnchor> } | undefined;
  root.addEventListener('click', event => {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    if (!(summary instanceof HTMLElement) || !root.contains(summary) || summary.parentElement?.tagName !== 'DETAILS') return;
    // Capture before the native disclosure changes layout. Keyboard activation
    // dispatches the same click; pausing here holds the pose at activation.
    pause();
    const viewport = holdDisclosureViewportAnchor(summary, abort.signal);
    disclosureAnchor = { summary, viewport };
  }, { ...opts, capture: true });
  // Expanding the justification is a request to read, not a race against the
  // automatic act phase. The handle or explicit step controls resume inspection.
  interleaves.forEach(passage => passage.addEventListener("toggle", event => {
    pause(); measureRows(); project();
    const anchor = disclosureAnchor;
    if (anchor?.summary.parentElement !== event.target) return;
    disclosureAnchor = undefined;
    anchor.viewport.refresh();
  }, { ...opts, capture: true }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, opts);
  reduced.addEventListener("change", pause, opts);
  const visibility = new IntersectionObserver(entries => {
    if (!entries[0]?.isIntersecting) pause();
    else if (!session && !loading && !seeking && root.dataset["repair"] !== "true") void seekPosition(0);
  }, { rootMargin: '100% 0px' }); visibility.observe(root);
  // Font-only zoom can change native ink and row spacing at unchanged width.
  // Observe stationary records, never moving compositor paint. Only native
  // metric changes rebuild scenes; prose reflow just remeasures the rail.
  const nativeInk = equationSlots.flatMap(slot => [...slot.querySelectorAll<HTMLElement>('.katex-html > .base')]);
  const nativeMetrics = () => JSON.stringify([root.getBoundingClientRect().width,
    ...equationSlots.flatMap(slot => {
      const box = slot.getBoundingClientRect(), font = getComputedStyle(slot.querySelector('.katex')!);
      return [box.width, box.height, font.font, font.letterSpacing];
    }), ...nativeInk.flatMap(ink => { const box = ink.getBoundingClientRect(); return [box.width, box.height]; })]);
  let metrics = nativeMetrics(), fontRevision = 0, measuredFontRevision = 0;
  let geometryFrame: number | undefined;
  const scheduleGeometry = () => {
    if (abort.signal.aborted || geometryFrame !== undefined) return;
    geometryFrame = requestAnimationFrame(() => {
      geometryFrame = undefined;
      if (abort.signal.aborted || loading || seeking) return;
      const next = nativeMetrics();
      if (next !== metrics || fontRevision !== measuredFontRevision) {
        metrics = next; measuredFontRevision = fontRevision;
        cancelDrag(); journey = undefined; clock.pause();
        if (tracing && session) {
          const p = clock.getSnapshot().progress;
          const current = equationViewportBounds(p === 0 ? equationSlots[selected]! : p === 1 ? equationSlots[selected + 1]! : stage);
          // Resize a currently visible inspection without dragging the reader
          // back to a selection they have already scrolled away from.
          if (current.bottom > 0 && current.top < innerHeight) revealRequested = true;
          const progress = clock.getSnapshot().progress;
          retire(); void mount(selected, progress).then(() => { if (revealRequested) scheduleReveal(); }); return;
        }
      }
      const origin = get('.energy-derivation-chain').getBoundingClientRect().top;
      const shifted = equationSlots.some((slot, i) => { const box = slot.getBoundingClientRect(); return Math.abs(box.top - origin + box.height / 2 - centers[i]!) > .5; });
      if (shifted) { cancelDrag(); measureRows(); project(); }
    });
  };
  const resize = new ResizeObserver(scheduleGeometry);
  [root, ...equationSlots, ...nativeInk, ...interleaves].forEach(element => resize.observe(element));
  document.fonts.addEventListener('loadingdone', () => { fontRevision++; scheduleGeometry(); }, opts);
  let disposed = false;
  const dispose = (recycle = false) => {
    if (disposed) return;
    disposed = true;
    if (geometryFrame !== undefined) cancelAnimationFrame(geometryFrame);
    if (revealFrame !== undefined) cancelAnimationFrame(revealFrame);
    pause(); retire(recycle); visibility.disconnect(); resize.disconnect(); abort.abort(); clock.dispose();
  };
  window.addEventListener("pagehide", event => { pause(); if (!event.persisted) dispose(); }, opts);
  hint.hidden = false;
  handle.disabled = true;
  measureRows(); rail.hidden = false;
  scope.hidden = false; transport.hidden = false; positionScope(0, 0); previous.disabled = true;
  const ready = initialPosition ? seekTransition(initialPosition) : Promise.resolve();
  return { ready, dispose, detachPaint() {
    pause();
    const retained = prepared.find(scene => scene.element === stage);
    if (!retained) throw new Error('Cannot retain an unprepared inspection');
    prepared = prepared.filter(scene => scene !== retained);
    // Retiring the clock may publish one final snapshot. Its projection no
    // longer owns this leased paint, whose viewport position is now frozen.
    session = undefined;
    stage.removeAttribute('data-derivation-stage');
    const style = stage.getAttribute('style');
    return { element: stage, dispose() {
      if (style === null) retained.element.removeAttribute('style'); else retained.element.setAttribute('style', style);
      delete retained.element.dataset['disclosurePaint'];
      if (pool) pool.put(retained); else { retained.session.dispose(); retained.element.remove(); }
    } };
  }, reveal() { revealRequested = true; scheduleReveal(); }, capture(): EnergyReaderState {
    pause();
    if (loading || seeking || !session) throw new Error("Wait for the active derivation scene to finish preparing");
    return { revision: root.dataset["derivationRevision"]!, transition: ids[selected]!, progress: clock.getSnapshot().progress,
      bookmarks: bookmarks.snapshot(), disclosures: [...root.querySelectorAll<HTMLDetailsElement>("details")].map(el => el.open) };
  } };
}

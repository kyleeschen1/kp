import { assertEnergyDerivationPlan, type EnergyDerivationPlan } from "../semantic/momentum-energy-derivation-plan.ts";
import { createKpEquationFontReadiness } from "./equation-font-readiness.ts";
import { observeKpNativeKatexRenderedScene, createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";
import { compileKpCanonicalNativeKatexScenePlan, createKpCanonicalNativeKatexSceneSession } from "./native-katex-scene-compositor.ts";
import { createKpNativeKatexTrackProjection } from "./native-katex-track-projection.ts";
import { sampleKpNativeKatexContributorFusionPaint } from "./native-katex-contributor-fusion-sampling.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from "./native-katex-base-scene-plan.ts";
import { easedProgressBetweenSemanticBeat, linearEquationDemoBeatTimeline } from "./semantic-beat-compiler.ts";
import { createDerivationInspectionComposition } from "../animation/derivation-inspection-composition.ts";
import { createKpNativeKatexCompoundScenePlan } from "./native-katex-compound-scene-plan.ts";
import { projectKpNativeKatexInkWithdrawal } from "./native-katex-carrier-preserving-simplification-motion.ts";
import { sampleKpNativeKatexCarrierPreservingSimplificationOptics, kpNativeKatexCarrierPreservingSimplificationOpticalProfile } from "./native-katex-carrier-preserving-simplification-profile.ts";
import { planKpEquationMotionPathBetweenPoints } from "./equation-motion-path-planner.ts";

type InspectionFocus = { readonly source: readonly string[]; readonly target: readonly string[]; readonly extent?: "participants" | "equation";
  readonly records?: readonly { readonly root: HTMLElement; readonly entityIds: readonly string[] }[] };

/** One parent playhead selects a child native scene. Every child is prepared
 * before publication, so crossing a boundary never waits on mounting or fonts.
 * Endpoint-equivalent scenes exchange visibility atomically; only their native
 * compositor sessions may own equation paint. */
export async function mountMomentumEnergyDerivationSession(stage: HTMLElement, compiled: EnergyDerivationPlan, index: number,
  focus?: InspectionFocus, refinement?: EnergyDerivationPlan) {
  assertEnergyDerivationPlan(compiled);
  const nested = compiled.inspections?.[compiled.moves[index]!.id];
  if (compiled.compactInspection !== "refinement" && !nested) return mountDerivationLeaf(stage, compiled, index, focus);
  refinement = nested ?? refinement;
  if (focus?.extent === "participants") throw new Error("Compound inspection requires full equation context");
  if (!refinement) throw new Error("Compound inspection requires its checked children; atomic fallback is forbidden");
  const composition = createDerivationInspectionComposition(compiled, refinement, index);
  const roots = [...stage.querySelectorAll<HTMLElement>(":scope > [data-derivation-child]")];
  if (roots.length !== composition.indices.length || roots.some((root, i) =>
    root.dataset["childOperation"] !== refinement.moves[composition.indices[i]!]!.id))
    throw new Error("Published compound inspection does not match checked child operations");
  const sessions: Awaited<ReturnType<typeof mountDerivationLeaf>>[] = [];
  try {
    for (const [i, child] of composition.indices.entries()) {
      const move = refinement.moves[child]!;
      const childFocus = focus ? { extent: "equation" as const,
        source: [...move.exits, ...(move.notice ?? []), ...(move.split ? ["power"] : [])].map(role => `${refinement.namespace}.${move.id}.0.${role}`),
        target: [...move.entries, ...(move.notice ?? []), ...(move.split ? ["power-top", "power-bottom"] : [])].map(role => `${refinement.namespace}.${move.id}.1.${role}`) } : undefined;
      sessions.push(await mountDerivationLeaf(roots[i]!, refinement, child, childFocus));
    }
    const timeline = composition.clock;
    const compound = createKpNativeKatexCompoundScenePlan({ timeline: {
      operationIds: timeline.segments.map(segment => segment.canonicalOperationId),
      compressedDurationMs: timeline.totalDurationMs,
      segments: timeline.segments.map(segment => ({ ...segment, operationId: segment.canonicalOperationId }))
    }, scenes: sessions.map((session, i) => ({ id: `inspection.${i}`, operationId: timeline.segments[i]!.canonicalOperationId, tracks: session.tracks })) });
    stage.dataset["derivationRenderer"] = "canonical-native-katex-scene-session";
    const apply = (progress: number, emphasis = 0) => {
      const frame = compound.sample(progress);
      roots.forEach((root, i) => { root.hidden = i !== frame.activeSceneIndex; });
      sessions[frame.activeSceneIndex]!.apply(frame.localProgress, emphasis);
      stage.dataset["inspectionOperation"] = frame.operationId;
      stage.dataset["inspectionChildProgress"] = String(frame.localProgress);
    };
    apply(0);
    return { apply, sample(progress: number) { const frame = compound.sample(progress); return sessions[frame.activeSceneIndex]!.sample(frame.localProgress); },
      tracks: sessions.flatMap(session => session.tracks),
      activateRecords() {}, dispose() { sessions.forEach(session => session.dispose()); } };
  } catch (error) { sessions.forEach(session => session.dispose()); throw error; }
}

/** One candidate renderer binding, not a new paint owner. Native observation,
 * material ownership, optical ink-knot sampling and endpoint handoff are shared.
 * Only the bounded proof selects which fragments persist or are rewritten. */
async function mountDerivationLeaf(stage: HTMLElement, compiled: EnergyDerivationPlan, index: number, focus?: InspectionFocus) {
  assertEnergyDerivationPlan(compiled);
  const move = compiled.moves[index];
  if (!move) throw new Error("Unsupported energy derivation step");
  const sourceRoot = stage.querySelector<HTMLElement>("[data-derivation-source]")!;
  const targetRoot = stage.querySelector<HTMLElement>("[data-derivation-target]")!;
  const font = createKpEquationFontReadiness(stage.ownerDocument);
  await font.whenReady();
  const observe = (endpoint: "source" | "target", root: HTMLElement) => compactGroups(observeKpNativeKatexRenderedScene({
    endpoint, stage, root, semanticEntityId: compiled.namespace, presentationGroupId: `group.${compiled.namespace}`, fontReadiness: font
  }));
  const source = observe("source", sourceRoot), target = observe("target", targetRoot);
  const sid = (role: string) => `${compiled.namespace}.${move.id}.0.${role}`;
  const tid = (role: string) => `${compiled.namespace}.${move.id}.1.${role}`;
  const relations = move.persist.map(role => ({ id: `persist.${role}`, relation: "persist" as const,
    sourceEntityIds: [sid(role)], targetEntityIds: [tid(role)] }));
  const split = [...(move.split ? [{ id: "square-homogeneity", relation: "split" as const,
    sourceEntityIds: [sid("power")], targetEntityIds: [tid("power-top"), tid("power-bottom")] }] : []),
    ...(move.copies ?? []).map(copy => ({ id: `copy.${copy.source}`, relation: "split" as const,
      sourceEntityIds: [sid(copy.source)], targetEntityIds: copy.targets.map(tid) }))];
  const projection = move.exits.length === 0 && !move.syntaxOnly ? undefined : createKpNativeKatexTrackProjection({
    id: `projection.${compiled.operationPrefix}.${move.id}`,
    project({ tracks }) {
      const before = source.atoms.filter(a => move.exits.some(role => a.semanticEntityId === sid(role)));
      const after = target.atoms.filter(a => move.entries.some(role => a.semanticEntityId === tid(role)));
      if (move.syntaxOnly) {
        // Parentheses are explicit grouping syntax, never successors of norm
        // bars or the power. Reuse ink withdrawal/reception, not glyph matching.
        const removed = new Set(before.map(atom => atom.id)), added = new Set(after.map(atom => atom.id));
        const scope = move.split && move.branching === "scope-propagation";
        const roleTrack = (role: string) => tracks.find(track => target.atoms.some(atom =>
          atom.id === track.targetAtomId && atom.semanticEntityId === tid(role)));
        const denominatorPower = scope ? roleTrack("power-bottom") : undefined;
        const fractionRule = scope ? roleTrack("rule") : undefined;
        if (scope && (!denominatorPower || !fractionRule)) throw new Error("Scope penetration requires a denominator power and fraction rule");
        const transit = (p: number) => sampleKpNativeKatexCarrierPreservingSimplificationOptics(p).carrier.transitProgress;
        return tracks.map(track => {
          const crossing = scope && (track === denominatorPower || track === fractionRule) ? {
            intentionalForegroundOcclusion: Object.freeze({ id: `scope.${move.id}.through-rule`,
              role: track === denominatorPower ? "occluder" as const : "occluded" as const,
              counterpartTrackId: (track === denominatorPower ? fractionRule : denominatorPower)!.id,
              progressWindow: kpNativeKatexCarrierPreservingSimplificationOpticalProfile.carrierTransit })
          } : {};
          if (scope && (track.lifecycle === "split" || track.lifecycle === "persist")) {
            // Disabling fan-out does not constrain the downstream collision
            // planner. Declare the direct route so it cannot invent an arc.
            const center = (r: typeof track.startRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            const path = planKpEquationMotionPathBetweenPoints({ id: `scope.${track.id}`,
              // Paths are ink-centered, not wrapper-centered. Firefox's
              // different glyph bearings expose an endpoint displacement if
              // layout rectangles are used with the paint-aware sampler.
              start: center(track.startPaintRect ?? track.startRect),
              end: center(track.endPaintRect ?? track.endRect), variants: ["direct"] });
            // Withdraw obsolete grouping before transit. The denominator
            // power deliberately crosses its own rule in front, not around
            // the fraction; only that reciprocal pair permits contact.
            return Object.freeze({ ...track, ...crossing, motionPath: path.selected, sampleProgress: transit });
          }
          if (track.lifecycle === "eliminate" && track.sourceAtomId && removed.has(track.sourceAtomId))
            return projectKpNativeKatexInkWithdrawal(track, `syntax.${move.id}`);
          if (track.lifecycle === "introduce" && track.targetAtomId && added.has(track.targetAtomId)) {
            const growth = (p: number) => 1 - sampleKpNativeKatexCarrierPreservingSimplificationOptics(1 - p).removedSyntaxCohort.withdrawalProgress;
            return Object.freeze({ ...track, startRect: track.endRect, startPaintRect: track.endPaintRect,
              sampleProgress: () => 1, sampleMaterialScale: (p: number) => Math.max(Number.EPSILON, growth(p)),
              samplePaintPresence: (p: number) => Number(growth(p) > 0), opacityScheduleAuthority: "semantic-choreography" as const });
          }
          if (track.lifecycle === "introduce" || track.lifecycle === "eliminate") throw new Error("Unclassified grouping syntax");
          return track;
        });
      }
      if (move.operationKind === "cancel-unit-power") {
        if (compiled.cancellationScore.kind !== "fluent" || !before.length || after.length)
          throw new Error("Fluent cancellation requires checked retained carriers and omitted syntax");
        const removed = new Set(before.map(atom => atom.id));
        return tracks.map(track => {
          if (track.sourceAtomId && removed.has(track.sourceAtomId))
            return projectKpNativeKatexInkWithdrawal(track, `cohort.${move.id}.consumed-syntax`);
          if (track.lifecycle !== "persist") throw new Error("Unclassified fluent cancellation paint");
          return Object.freeze({ ...track, sampleProgress: (p: number) =>
            sampleKpNativeKatexCarrierPreservingSimplificationOptics(p).carrier.transitProgress });
        });
      }
      if (!before.length || !after.length) throw new Error("Missing checked substitution/cancellation paint cohort");
      const input = (atoms: typeof before) => atoms.map(a => ({ rect: a.rect,
        pivot: { x: a.rect.left + a.rect.width / 2, y: a.rect.top + a.rect.height / 2 }, role: "successor-source:material-input" }));
      const beforeInput = input(before), afterInput = input(after);
      const sample = (p: number) => sampleKpNativeKatexContributorFusionPaint({ source: beforeInput, target: afterInput, progress: p });
      return tracks.map((track): KpNativeKatexPaintMeasuredSceneTrack => {
        const sourceIndex = before.findIndex(a => a.id === track.sourceAtomId);
        const targetIndex = after.findIndex(a => a.id === track.targetAtomId);
        const exiting = sourceIndex >= 0 && track.lifecycle === "eliminate";
        const entering = targetIndex >= 0 && track.lifecycle === "introduce";
        if (!exiting && !entering) return Object.freeze({ ...track,
          sampleProgress: (p: number) => easedProgressBetweenSemanticBeat(linearEquationDemoBeatTimeline, p, "layout-shift")
        });
        const pose = (p: number) => exiting ? sample(p).source[sourceIndex]! : sample(p).target[targetIndex]!;
        const native = exiting ? track.startRect : track.endRect;
        const paint = exiting ? track.startPaintRect : track.endPaintRect;
        // The shared ink-knot sampler owns compression and recognition. The
        // geometry mapping only projects its measured pivot into compositor
        // tracks; it never mutates DOM or creates an external material layer.
        const start = pose(0), end = pose(1);
        return Object.freeze({ ...track,
          // These exact proof-selected contributors intentionally converge to
          // one ink knot. Declare their contact, as the shared evaluation motif
          // does, without exempting any persistent context from collision checks.
          intentionalContactGroupId: `contact.${compiled.operationPrefix}.${move.id}.ink-knot`,
          startRect: { ...native, left: native.left + start.translateX, top: native.top + start.translateY },
          endRect: { ...native, left: native.left + end.translateX, top: native.top + end.translateY },
          ...(paint ? { startPaintRect: { ...paint, left: paint.left + start.translateX, top: paint.top + start.translateY },
            endPaintRect: { ...paint, left: paint.left + end.translateX, top: paint.top + end.translateY } } : {}),
          motionPath: undefined, motionPathSampling: undefined,
          sampleProgress: (p: number) => {
            const current = pose(p);
            const dx = end.translateX - start.translateX, dy = end.translateY - start.translateY;
            return Math.abs(dx) > Math.abs(dy) ? (dx ? (current.translateX - start.translateX) / dx : 0)
              : (dy ? (current.translateY - start.translateY) / dy : 0);
          },
          sampleMaterialScale: (p: number) => pose(p).scale,
          samplePaintPresence: (p: number) => p === 0 ? (exiting ? 1 : 0) : p === 1 ? (entering ? 1 : 0) : Number(pose(p).present),
          opacityScheduleAuthority: "semantic-choreography", timingGroupId: `cohort.${move.id}`
        });
      });
    }
  });
  const plan = compileKpCanonicalNativeKatexScenePlan({ source, target, relations: [...relations, ...split],
    ...(projection ? { trackProjection: projection } : {}),
    // Quotient powers change scope locally; the shared distribution routing
    // is reserved for operand-to-term travel, not inferred from split lineage.
    copyFanOutRouting: move.split && move.branching === "operand-distribution" });
  if (plan.disposition.mode !== "motion") throw new Error(`Energy derivation requires repair: ${plan.disposition.reason}`);
  if (move.split && move.branching === "scope-propagation" && plan.tracks.some(track =>
    track.motionPath !== undefined && track.motionPath.variant !== "direct"))
    throw new Error("Scope propagation cannot acquire a downstream clearance detour");
  const canonical = createKpCanonicalNativeKatexSceneSession(plan);
  // Resolve semantic targets once; material paint stays owned by the canonical
  // compositor. Its correlations, not glyph spelling or travel distance, bind
  // the inspection treatment to the same participants across paint handoffs.
  const pendingOwners = new Map<string, { entityId: string; participant: boolean }>();
  const recordAtoms: { element: HTMLElement; entityId: string }[] = [];
  if (focus) {
    for (const [scene, ids] of [[source, focus.source], [target, focus.target]] as const) {
      for (const id of ids) {
        if (!scene.atoms.some(atom => atom.semanticEntityId === id)) throw new Error(`Missing derivation emphasis binding: ${id}`);
      }
      // Bind owned paint, not an enclosing fraction wrapper: its numerator may
      // be context while the rule and denominator participate in cancellation.
      for (const atom of scene.atoms) {
        if (ids.includes(atom.semanticEntityId)) atom.sourceElement.dataset["derivationParticipant"] = atom.semanticEntityId;
        else if (focus.extent === "participants") atom.sourceElement.dataset["derivationInspectionContext"] = "";
      }
    }
    for (const correlation of plan.handoffCorrelations) {
      const participant = focus.source.includes(correlation.semanticEntityId) || focus.target.includes(correlation.semanticEntityId);
      if (participant || focus.extent === "participants")
        pendingOwners.set(correlation.materialOwnerId, { entityId: correlation.semanticEntityId, participant });
    }
    for (const record of focus.records ?? []) {
      const scene = observe("source", record.root);
      for (const id of record.entityIds) {
        const atoms = scene.atoms.filter(atom => atom.semanticEntityId === id);
        if (!atoms.length) throw new Error(`Missing permanent participant record: ${id}`);
        atoms.forEach(atom => recordAtoms.push({ element: atom.sourceElement, entityId: id }));
      }
    }
  }
  stage.dataset["derivationRenderer"] = canonical.kind;
  return { apply(progress: number, emphasis = 0) {
      canonical.session.apply(progress);
      stage.style.setProperty("--derivation-participant-strength", `${emphasis * 100}%`);
      // Material owners may be allocated on first transit. Cache their binding;
      // no geometry reads or per-frame descendant recoloring are necessary.
      for (const [ownerId, binding] of pendingOwners) {
        const owner = stage.querySelector<HTMLElement>(`[data-kp-equation-material-owner-id="${CSS.escape(ownerId)}"]`);
        if (owner) {
          if (binding.participant) owner.dataset["derivationParticipant"] = binding.entityId;
          else owner.dataset["derivationInspectionContext"] = "";
          pendingOwners.delete(ownerId);
        }
      }
    }, sample: canonical.session.sample, tracks: plan.tracks,
    activateRecords() { recordAtoms.forEach(({ element, entityId }) => { element.dataset["derivationRecordParticipant"] = entityId; }); },
    dispose() { canonical.session.retire({ kind: "native-katex-paint-preserving-retirement", reason: "scene-replaced", structuralSuccession: "retire-preserving-paint" }); font.dispose(); } };
}

/** Compound semantic fragments travel as chunks. Only groups containing no
 * differently owned descendants can become a subtree atom; fraction rules
 * surrounding independently tracked numerator/denominator keep native atoms. */
function compactGroups(scene: KpNativeKatexRenderedSceneObservation) {
  const consumed = new Set<string>();
  const atoms = scene.groups.flatMap(group => {
    const members = scene.atoms.filter(a => group.atomIds.includes(a.id));
    if (!group.sourceElement || !members.length || members.some(a => a.semanticEntityId !== group.semanticEntityId)) return [];
    members.forEach(a => consumed.add(a.id));
    return [{ ...members[0]!, id: `${scene.endpoint}.${group.id}`, paintKind: "glyph" as const,
      paintMeasurement: "subtree" as const, sourceElement: group.sourceElement,
      rect: group.rect, baselineY: group.baselineY, visualKey: group.sourceElement.textContent ?? "", presentationGroupId: group.id }];
  });
  const all = [...scene.atoms.filter(a => !consumed.has(a.id)), ...atoms];
  return createKpNativeKatexRenderedSceneObservation({ ...scene, atoms: all,
    groups: scene.groups.map(group => ({ ...group, atomIds: all.filter(a => group.sourceElement?.contains(a.sourceElement)).map(a => a.id) })) });
}

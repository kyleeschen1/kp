import type { KpNativeKatexFactoringSceneBinding } from "./native-katex-factoring-binding-types.ts";
import { kpEquationSettlementTolerancePx } from "../animation/equation-shared-presentation-policy.ts";
export type { KpNativeKatexFactoringSceneBinding } from "./native-katex-factoring-binding-types.ts";

import {
  compileKpFactoringFusionPlan,
  sampleKpFactoringAddendCompactionProgress,
  sampleKpFactoringChoreography,
  sampleKpFactoringCopyFocus,
  assertKpCompleteFactoringChoreography,
  type KpFactoringChoreographyFrame,
  type KpFactoringChoreographyPlan
} from "../animation/factoring-choreography.ts";
import {
  reverseKpFissionFusionPlan,
  sampleKpFissionFusion,
  type KpFissionFusionPlan
} from "../animation/fission-fusion.ts";
import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-dom.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  planKpCanonicalLineageBranch,
  canonicalFactoringGroupingEntry,
  inspectKpEquationProtectedTransitTracks,
  sampleKpEquationMotionPath,
  type KpProtectedTransitAudit,
  type KpEquationMotionPathCandidate
} from "./equation-motion-path-planner.ts";
import { normalizeKpStageRelativeRect } from "./native-katex-fragment-observer.ts";
import { measureKpNativeKatexPaintAtomRect } from "./native-katex-paint-geometry.ts";
import { unionKpStageRelativeRects } from "./native-katex-rendered-scene.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type { KpFactorCommonTermMotifBinding } from "../animation/factoring-motif-binding.ts";

export const kpMaximumFactoringExcursionInLocalInkHeights = 3.75;

export type KpNativeKatexFactoringChoreographyIntent =
  KpFactorCommonTermMotifBinding;

type PaintRect = KpNativeKatexPaintAtomObservation["rect"];
interface FactoringAtomGeometry {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly sourceElement: HTMLElement;
  readonly rect: PaintRect;
  readonly paintRect: PaintRect;
  readonly members: readonly { readonly atom: KpNativeKatexPaintAtomObservation; readonly paintRect: PaintRect }[];
}

/** A compound keeps its real native wrapper and every member's geometry.
 * It is neither a synthetic glyph nor independently moving member ink. */
function factorGeometry(scene: KpNativeKatexRenderedSceneObservation, semanticEntityId: string): FactoringAtomGeometry {
  const atoms = scene.atoms.filter(atom => atom.semanticEntityId === semanticEntityId);
  if (!atoms.length || atoms.some(atom => atom.paintKind !== "glyph"))
    throw new Error(`Factoring entity ${semanticEntityId} requires a bounded text-paint group.`);
  const members = atoms.map(atom => ({ atom, paintRect: measureKpNativeKatexPaintAtomRect(scene.stage, atom) })), first = atoms[0]!;
  if (atoms.length === 1) return Object.freeze({ id: first.id, semanticEntityId, sourceElement: first.sourceElement,
    rect: first.rect, paintRect: members[0]!.paintRect, members: Object.freeze(members) });
  const groups = scene.groups.filter(group => group.semanticEntityId === semanticEntityId && group.atomIds.length === atoms.length &&
    atoms.every(atom => group.atomIds.includes(atom.id)) && group.sourceElement && atoms.every(atom => group.sourceElement!.contains(atom.sourceElement)));
  if (groups.length !== 1) throw new Error(`Factoring entity ${semanticEntityId} requires one exact native group owner.`);
  const group = groups[0]!, sourceElement = group.sourceElement!, stageRect = scene.stage.getBoundingClientRect();
  // Wrapper layout and member ink union are separate measurement authorities.
  const rect = normalizeKpStageRelativeRect({ stageClientRect: stageRect,
    stageLayoutWidth: scene.stage.offsetWidth || stageRect.width, stageLayoutHeight: scene.stage.offsetHeight || stageRect.height,
    fragmentClientRect: sourceElement.getBoundingClientRect() });
  return Object.freeze({ id: group.id, semanticEntityId, sourceElement, rect,
    paintRect: unionKpStageRelativeRects(members.map(member => member.paintRect)), members: Object.freeze(members) });
}

function assertTypographyCompatible(geometries: readonly FactoringAtomGeometry[]): void {
  const reference = geometries[0];
  if (!reference) throw new Error("Factoring scene requires measured factor paint.");
  const fingerprint = (atom: KpNativeKatexPaintAtomObservation) => atom.styleFingerprint.split("|")
    .filter(entry => ["font-family:", "font-size:", "font-style:", "font-weight:"].some(property => entry.startsWith(property))).join("|");
  for (const geometry of geometries) {
    if (geometry.members.length !== reference.members.length || geometry.members.some((member, i) => {
      const other = reference.members[i]!;
      return member.atom.visualKey !== other.atom.visualKey || member.atom.fontRevision !== other.atom.fontRevision ||
        fingerprint(member.atom) !== fingerprint(other.atom) ||
        Math.abs(member.paintRect.width - other.paintRect.width) > .75 || Math.abs(member.paintRect.height - other.paintRect.height) > .75 ||
        Math.abs((member.paintRect.left - geometry.paintRect.left) - (other.paintRect.left - reference.paintRect.left)) > .75 ||
        Math.abs((member.paintRect.top - geometry.paintRect.top) - (other.paintRect.top - reference.paintRect.top)) > .75;
    })) throw new Error(`Factoring fusion cannot atomically transfer typography-incompatible paint ${geometry.semanticEntityId}.`);
  }
}

export interface KpNativeKatexFactoringScenePlan {
  readonly kind: "native-katex-factoring-scene-plan";
  readonly id: string;
  readonly direction: "forward" | "rewind";
  readonly transferPlan: KpFissionFusionPlan;
  readonly sourceFactors: readonly FactoringAtomGeometry[];
  readonly targetFactors: readonly FactoringAtomGeometry[];
  readonly pathsByEntityId: ReadonlyMap<string, KpEquationMotionPathCandidate>;
  readonly claimedSourceAtomIds: ReadonlySet<string>;
  readonly claimedTargetAtomIds: ReadonlySet<string>;
  readonly complete?: {
    readonly choreography: KpFactoringChoreographyPlan;
    readonly grouping: readonly FactoringAtomGeometry[];
    readonly entries: readonly { readonly x: number; readonly y: number }[];
  } | undefined;
}

export function bindKpNativeKatexFactoringScene(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly intent: KpNativeKatexFactoringChoreographyIntent;
  readonly choreography?: KpFactoringChoreographyPlan | undefined;
}): KpNativeKatexFactoringSceneBinding {
  const plan = compileKpNativeKatexFactoringScenePlan(input);
  let transit: KpProtectedTransitAudit | undefined;
  let lastProgress = Number.NaN, lastFrame: KpFactoringChoreographyFrame | undefined;
  const sample = (progress: number) => {
    if (lastFrame !== undefined && progress === lastProgress) return lastFrame;
    if (!plan.complete) throw new Error("Missing complete factoring composition.");
    lastProgress = progress;
    return lastFrame = sampleKpFactoringChoreography({ plan: plan.complete.choreography,
      progress: plan.direction === "forward" ? progress : 1 - progress });
  };
  const sampleContextProgress = (progress: number) =>
    sampleKpNativeKatexFactoringContextProgress(
      progress,
      plan.transferPlan.transferEvent.progress
    );
  const material = (progress: number) => sampleKpNativeKatexFactoringScenePlan({ plan, progress });
  return Object.freeze<KpNativeKatexFactoringSceneBinding>({
    semanticClock: plan.complete?.choreography,
    claimTracks(tracks) {
      return Object.freeze(tracks.filter((track) =>
        !plan.claimedSourceAtomIds.has(track.sourceAtomId ?? "") &&
        !plan.claimedTargetAtomIds.has(track.targetAtomId ?? "") &&
        !plan.claimedSourceAtomIds.has(track.visualAtomId) &&
        !plan.claimedTargetAtomIds.has(track.visualAtomId)
      ).map((track) => {
        const complete = plan.complete;
        if (!complete) return Object.freeze({ ...track, sampleProgress: sampleContextProgress });
        const index = complete.grouping.findIndex(g => g.members.some(member => member.atom.id === track.visualAtomId));
        if (index < 0) return Object.freeze({ ...track, motionPath: undefined, motionProgressRange: undefined,
          sampleProgress: (p: number) => plan.direction === "forward"
            ? sample(p).addendCompactionProgress : 1 - sample(p).addendCompactionProgress });
        if (track.lifecycle !== "introduce" && track.lifecycle !== "eliminate")
          throw new Error("Grouping requires an explicit presence lifecycle.");
        const entry = complete.entries[index]!;
        const offset = (rect: typeof track.startRect) => ({ ...rect, left: rect.left + entry.x, top: rect.top + entry.y });
        const forward = plan.direction === "forward";
        const progress = (p: number) => forward ? sample(p).groupingOpacity : 1 - sample(p).groupingOpacity;
        const reception = (p: number) => forward ? sample(p).groupingReceptionProgress : 1 - sample(p).groupingReceptionProgress;
        return Object.freeze({ ...track, opacityStepAt: undefined, motionPath: undefined, motionProgressRange: undefined,
          startRect: forward ? offset(track.endRect) : track.startRect,
          endRect: forward ? track.endRect : offset(track.startRect),
          startPaintRect: forward && track.endPaintRect ? offset(track.endPaintRect) : track.startPaintRect,
          endPaintRect: !forward && track.startPaintRect ? offset(track.startPaintRect) : track.endPaintRect,
          sampleProgress: reception, sampleOpacityProgress: progress, opacityScheduleAuthority: "semantic-choreography" as const });
      }));
    },
    claimedTargetAtomIds: plan.claimedTargetAtomIds,
    sampleMaterialOwners: material,
    inspectTransit(tracks, sampleFrames) {
      if (plan.complete) {
        const p = plan.transferPlan.transferEvent.progress;
        const poses = [...material(p - 1e-7), ...material(p + 1e-7)]
          .filter(owner => owner.opacity === 1).map(owner => owner.expectedPaintRect!);
        if (poses.some(rect => (["left", "top", "width", "height"] as const)
          .some(key => Math.abs(rect[key] - poses[0]![key]) > kpEquationSettlementTolerancePx)))
          throw new Error("Factoring fusion requires a shared native paint pose.");
      }
      // Fusion contact is declared by the cohort. Other intersections remain
      // visible diagnostics, not authority to inflate a canonical trajectory.
      const endpoints = material(1);
      const factors = material(0).map((owner, index) => ({
        id: owner.ownerId, componentId: plan.id, lifecycle: "merge",
        startRect: owner.expectedPaintRect!, endRect: endpoints[index]!.expectedPaintRect!
      }));
      return transit = inspectKpEquationProtectedTransitTracks({
        tracks: [...tracks, ...factors],
        sampleFrames: (_, progress) => [...sampleFrames(tracks, progress), ...material(progress).map(owner => ({
          trackId: owner.ownerId, componentId: plan.id, rect: owner.expectedPaintRect!, opacity: owner.opacity
        }))]
      });
    },
    recordEvidence() {
      if (!transit) throw new Error("Factoring paint requires scene occupancy inspection before publication.");
      Object.assign(input.source.stage.dataset, {
        kpNativeKatexFactoringTransitContacts: String(transit.intersections.length),
        kpNativeKatexFactoringContactPolicy: plan.complete?.choreography.composition.transitContact ?? "diagnostic",
        kpNativeKatexFactoringOwnership: "atomic-fission-fusion",
        kpNativeKatexFactoringGeometry: "paint-space",
        kpNativeKatexFactoringSynchronization: input.intent.synchronization,
        kpNativeKatexFactoringPaintPolicy: input.intent.fusionPaintPolicy,
        kpNativeKatexFactoringEvaluation: input.intent.coefficientEvaluation,
        kpNativeKatexFactoringComposition: plan.complete ? "complete-canonical" : "existing-group"
      });
    }
  });
}

export function compileKpNativeKatexFactoringScenePlan(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly intent: KpNativeKatexFactoringChoreographyIntent;
  readonly choreography?: KpFactoringChoreographyPlan | undefined;
}): KpNativeKatexFactoringScenePlan {
  assertFactoringIntent(input.intent);
  const forwardPlan = compileKpFactoringFusionPlan({
    id: input.intent.id,
    factorCopyIds: input.intent.factorCopyIds,
    commonFactorId: input.intent.commonFactorId
  });
  const transferPlan = input.intent.direction === "forward"
    ? forwardPlan
    : reverseKpFissionFusionPlan({
        id: `${input.intent.id}.rewind`,
        plan: forwardPlan,
        semanticOrder: input.intent.factorCopyIds
      });
  const sourceFactors = transferPlan.sourceEntityIds.map((entityId) =>
    factorGeometry(input.source, entityId)
  );
  const targetFactors = transferPlan.targetEntityIds.map((entityId) =>
    factorGeometry(input.target, entityId)
  );
  assertTypographyCompatible([...sourceFactors, ...targetFactors]);

  const forwardSource = input.intent.direction === "forward" ? input.source : input.target;
  const forwardTarget = input.intent.direction === "forward" ? input.target : input.source;
  const commonGeometry = input.intent.direction === "forward" ? targetFactors[0]! : sourceFactors[0]!;
  const complete = input.intent.structuralArtifactIds.length === 0 ? undefined : (() => {
    const choreography = input.choreography;
    assertKpCompleteFactoringChoreography(choreography);
    if (!choreography || choreography.commonFactorId !== input.intent.commonFactorId ||
        JSON.stringify(choreography.factorCopyIds) !== JSON.stringify(input.intent.factorCopyIds) ||
        JSON.stringify(choreography.groupingArtifactIds) !== JSON.stringify(input.intent.structuralArtifactIds))
      throw new Error("Complete factoring requires its canonical composition, not fusion-only motion.");
    const context = [...choreography.addendPairs, ...choreography.connectorPairs];
    const grouping = choreography.groupingArtifactIds.map(id => factorGeometry(forwardTarget, id))
      .sort((a, b) => a.rect.left - b.rect.left);
    const sourceIds = new Set([...choreography.factorCopyIds, ...context.map(pair => pair.sourceId)]);
    const targetIds = new Set([choreography.commonFactorId, ...context.map(pair => pair.targetId), ...choreography.groupingArtifactIds]);
    if ([...sourceIds].some(id => !forwardSource.atoms.some(atom => atom.semanticEntityId === id)) ||
        [...targetIds].some(id => !forwardTarget.atoms.some(atom => atom.semanticEntityId === id)) ||
        forwardSource.atoms.some(atom => !sourceIds.has(atom.semanticEntityId)) || forwardTarget.atoms.some(atom => !targetIds.has(atom.semanticEntityId)))
      throw new Error("Complete factoring composition must own every native paint atom.");
    const corridor = context.map(pair => ({ source: factorGeometry(forwardSource, pair.sourceId).paintRect,
      target: factorGeometry(forwardTarget, pair.targetId).paintRect }));
    return { choreography, grouping, entries: grouping.map((group, index) => {
      const entry = canonicalFactoringGroupingEntry(index, grouping.length, corridor);
      const factor = commonGeometry.paintRect, rect = group.paintRect;
      // Delimiters may receive from outside the row, never through adjacent factor ink.
      return { ...entry, x: factor.left < rect.left
        ? Math.max(entry.x, factor.left + factor.width - rect.left)
        : Math.min(entry.x, factor.left - rect.left - rect.width) };
    }) };
  })();

  const branchGeometry = input.intent.direction === "forward"
    ? sourceFactors
    : targetFactors;
  const localInkHeight = Math.max(
    commonGeometry.paintRect.height,
    ...branchGeometry.map(({ paintRect }) => paintRect.height)
  );
  const pathsByEntityId = new Map(branchGeometry.map((geometry, index) => {
    if (complete !== undefined) return [geometry.semanticEntityId,
      planKpCanonicalLineageBranch({ id: `${input.intent.id}.branch.${index}`,
        origin: rectCenter(commonGeometry.paintRect), destination: rectCenter(geometry.paintRect), branchIndex: index,
        // Keep the pre-repair arc envelope; inspection cannot expand it.
        minimumClearance: geometry.members.length > 1 ? geometry.paintRect.width + localInkHeight : undefined })] as const;
    const source = input.intent.direction === "forward"
      ? rectCenter(geometry.paintRect)
      : rectCenter(commonGeometry.paintRect);
    const target = input.intent.direction === "forward"
      ? rectCenter(commonGeometry.paintRect)
      : rectCenter(geometry.paintRect);
    const branchOffset = branchGeometry.length <= 1 ? 0 : index / (branchGeometry.length - 1) * 0.4;
    // Offset is bounded by .4, leaving at least .1 below the excursion limit.
    const clearance = localInkHeight * (kpMaximumFactoringExcursionInLocalInkHeights - 0.5 + branchOffset);
    return [
      geometry.semanticEntityId,
      planKpEquationMotionPathBetweenPoints({
        id: `${input.intent.id}.paint-path.${geometry.semanticEntityId}`,
        start: source,
        end: target,
        variants: ["arc-above"],
        clearance,
        moverRadius: 0
      }).selected
    ] as const;
  }));

  return Object.freeze({
    kind: "native-katex-factoring-scene-plan",
    id: input.intent.id,
    direction: input.intent.direction,
    complete,
    transferPlan,
    sourceFactors: Object.freeze(sourceFactors),
    targetFactors: Object.freeze(targetFactors),
    pathsByEntityId,
    claimedSourceAtomIds: new Set(sourceFactors.flatMap(g => g.members.map(({ atom }) => atom.id))),
    claimedTargetAtomIds: new Set(targetFactors.flatMap(g => g.members.map(({ atom }) => atom.id)))
  });
}

function assertFactoringIntent(intent: KpNativeKatexFactoringChoreographyIntent): void {
  if (intent.operation !== "factorCommonTerm" || intent.motif !== "merge-fan-in" ||
      intent.fusionPaintPolicy !== "opaque-many-to-one" || intent.synchronization !== "simultaneous" ||
      intent.coefficientEvaluation !== "deferred" || intent.factorCopyIds.length < 2 ||
      new Set(intent.factorCopyIds).size !== intent.factorCopyIds.length ||
      intent.factorCopyIds.includes(intent.commonFactorId) ||
      intent.lifecycle !== (intent.direction === "forward" ? "merge" : "split"))
    throw new Error("Factoring scene requires one coherent typed motif cohort.");
}

export function sampleKpNativeKatexFactoringScenePlan(input: {
  readonly plan: KpNativeKatexFactoringScenePlan;
  readonly progress: number;
}): readonly KpEquationMaterialLayerOwnerFrame[] {
  const plan = input.plan, bounded = clamp01(input.progress);
  const complete = plan.complete && sampleKpFactoringChoreography({
    plan: plan.complete.choreography, progress: plan.direction === "forward" ? bounded : 1 - bounded
  });
  const frame = complete?.fusion ?? sampleKpFissionFusion({ plan: plan.transferPlan, progress: bounded });
  const byId = new Map([...frame.sources, ...frame.targets].map(f => [f.entityId, f]));
  return Object.freeze((["source", "target"] as const).flatMap(side => {
    const geometries = side === "source" ? plan.sourceFactors : plan.targetFactors;
    const moving = (side === "source") === (plan.direction === "forward");
    return geometries.map(geometry => {
      const id = geometry.semanticEntityId, selected = byId.get(id);
      if (!selected) throw new Error("Factoring material has no lineage frame.");
      const path = moving ? plan.pathsByEntityId.get(id) : undefined;
      if (moving && !path) throw new Error(`Factoring material lacks path ${id}.`);
      let paint = geometry.paintRect;
      if (path && complete) {
        const point = sampleKpEquationMotionPath(path, 1 - selected.junctionProgress);
        const origin = rectCenter(geometry.paintRect);
        paint = { ...paint, left: paint.left + point.x - origin.x, top: paint.top + point.y - origin.y };
      } else if (path) {
        paint = paintRectAlongPath(path, selected.pathProgress,
          side === "target" ? plan.sourceFactors[0]!.paintRect : geometry.paintRect);
      }
      const index = complete?.factorCopies.findIndex(copy => copy.entityId === id) ?? -1;
      // Keep emphasis continuous across fusion to avoid a scale jump.
      const focus = complete ? sampleKpFactoringCopyFocus(complete, Math.max(0, index), index < 0 ? "common-factor" : "factor-copy") : undefined;
      const scale = complete ? selected.scale : 1, visibleScale = scale * Number(focus?.variables["--kp-focus-scale"] ?? 1);
      // Wrapper placement and visible ink share one frame.
      return Object.freeze({ ownerId: `native-factoring-owner.${plan.id}.${side}.${geometry.id}`,
        sourceElement: geometry.sourceElement, semanticEntityId: id,
        rect: Object.freeze({ ...geometry.rect,
          left: paint.left - geometry.paintRect.left + geometry.rect.left,
          top: paint.top - geometry.paintRect.top + geometry.rect.top }),
        paintAlignmentRect: paint, opacity: selected.opacity, focus,
        fragmentRole: `${geometry.members.length === 1 ? "glyph" : "group"}:factoring-${side}`,
        transform: complete ? "scale(" + scale + ")" : "none",
        expectedPaintRect: { left: paint.left + paint.width * (1 - visibleScale) / 2,
          top: paint.top + paint.height * (1 - visibleScale) / 2,
          width: paint.width * visibleScale, height: paint.height * visibleScale } });
    });
  }));
}

export function sampleKpNativeKatexFactoringContextProgress(
  progress: number,
  transferProgress = 1
): number {
  const coordinated = smoothstep(interval(progress, transferProgress * 0.3, transferProgress * 0.8));
  return sampleKpFactoringAddendCompactionProgress(interpolate(0.08, 0.78, coordinated));
}

function paintRectAlongPath(path: KpEquationMotionPathCandidate, progress: number, paint: PaintRect): PaintRect {
  const p = clamp01(progress);
  const lift = smoothstep(interval(p, 0, 0.18));
  const traverse = smoothstep(interval(p, 0.22, 0.8));
  const descend = smoothstep(interval(p, 0.65, 1));
  const laneY = path.control.y;
  const center = {
    x: interpolate(path.start.x, path.end.x, traverse),
    y: interpolate(
      interpolate(path.start.y, laneY, lift),
      path.end.y,
      descend
    )
  };
  return {
    left: center.x - paint.width / 2,
    top: center.y - paint.height / 2,
    width: paint.width,
    height: paint.height
  };
}

function rectCenter(rect: PaintRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function interval(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

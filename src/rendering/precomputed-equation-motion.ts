import {
  createKpEquationLayoutPlan,
  type KpEquationLayoutPlan
} from "./equation-layout-plan.ts";
import type { KpMeasuredEquationTransitionGeometry } from "./equation-motion-dom.ts";
import {
  planKpEquationMotionPath,
  planKpEquationMotionPathBetweenPoints,
  type KpEquationMotionPathCandidate,
  type KpEquationMotionPathPlan
} from "./equation-motion-path-planner.ts";
import {
  compileKpEquationSemanticTimeline,
  createEquationVisualMotifTimeline,
  type KpEquationSemanticTimeline
} from "./equation-visual-motif-timeline.ts";
import { linearEquationDemoBeatTimeline } from "./semantic-beat-compiler.ts";
import {
  createVisualMotifPlan,
  phaseIdsForEquationVisualMotifKind,
  primitiveIdsForEquationVisualMotifKind,
  type EquationVisualMotifKind
} from "../animation/motifs/visual-motif.ts";
import type { EquationMotionPlan } from "./equation-motion-plan.ts";
import { createKpEquationSuccessorSynthesisPlan } from "./equation-linear-rearrangement.ts";
import {
  kpEquationWitnessedAnnihilationRuntime
} from "./equation-witnessed-annihilation-runtime.ts";
import {
  createKpIndependentZeroWitnessPlan
} from "./equation-independent-zero-witness.ts";

export interface KpPrecomputedEquationMotionPlan {
  readonly kind: "precomputed-equation-motion-plan";
  readonly id: string;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly layoutPlan: KpEquationLayoutPlan;
  readonly relationPathPlans: ReadonlyMap<string, KpEquationMotionPathPlan>;
  readonly tokenPathPlans: ReadonlyMap<string, KpEquationMotionPathCandidate>;
  readonly semanticTimeline: KpEquationSemanticTimeline;
}

export function createKpPrecomputedEquationMotionPlan(input: {
  readonly id: string;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly motifKind: EquationVisualMotifKind;
  readonly spacing?: "compact" | "balanced" | "spacious" | undefined;
  readonly pathPreference?:
    | "automatic"
    | "arc-above"
    | "arc-below"
    | "around-left"
    | "around-right"
    | undefined;
}): KpPrecomputedEquationMotionPlan {
  const spacing = input.spacing ?? "balanced";
  const pathPreference = input.pathPreference ?? "automatic";
  const timelineMotifKind = baseTimelineMotifKind(input.motifKind);
  const successorSynthesisPlan =
    input.geometry.successorPresentationRecipe === "successor-synthesis-v1"
      ? createKpEquationSuccessorSynthesisPlan(input.geometry)
      : undefined;
  const witnessedAnnihilationPlan = input.geometry.witnessedAnnihilationBinding === undefined
    ? undefined
    : kpEquationWitnessedAnnihilationRuntime()?.createPlan(input.geometry);
  if (
    input.geometry.witnessedAnnihilationBinding !== undefined &&
    witnessedAnnihilationPlan === undefined
  ) {
    throw new Error("Witnessed annihilation was not registered by the selected capability pack.");
  }
  const independentZeroWitnessPlan = createKpIndependentZeroWitnessPlan(
    input.geometry
  );
  const measuredGeometry: KpMeasuredEquationTransitionGeometry = {
    ...input.geometry,
    ...(successorSynthesisPlan === undefined
      ? {}
      : { successorSynthesisPlan }),
    ...(witnessedAnnihilationPlan === undefined
      ? {}
      : { witnessedAnnihilationPlan }),
    ...(independentZeroWitnessPlan === undefined
      ? {}
      : { independentZeroWitnessPlan })
  };
  const layoutPlan = createKpEquationLayoutPlan({
    id: `${input.id}.layout`,
    geometry: measuredGeometry,
    destinationPadding: spacing === "compact" ? 1 : spacing === "spacious" ? 4 : 2,
    transitPadding: spacing === "compact" ? 4 : spacing === "spacious" ? 10 : 6
  });
  const relationPathPlans = new Map(
    measuredGeometry.relations.flatMap((relation) =>
      relation.source === undefined || relation.target === undefined
        ? []
        : [[relation.recordId, planKpEquationMotionPath({
            id: `${input.id}.path.${relation.recordId}`,
            layoutPlan,
            relationRecordId: relation.recordId,
            ...(pathPreference === "automatic"
              ? {}
              : { preferredVariant: pathPreference })
          })] as const]
    )
  );
  const tokenPathPlans = lineageTokenPathPlans(
    measuredGeometry,
    input.id,
    pathPreference
  );
  const geometry: KpMeasuredEquationTransitionGeometry = {
    ...measuredGeometry,
    precomputedMotionPathsByMotionId: Object.fromEntries(tokenPathPlans),
    precomputedRelationMotionPathsByRecordId: Object.fromEntries(
      [...relationPathPlans].map(([recordId, plan]) => [
        recordId,
        plan.selected
      ])
    )
  };
  const motif = createVisualMotifPlan({
    id: `${input.id}.motif`,
    kind: timelineMotifKind,
    correspondenceRecordId: input.geometry.relations[0]?.recordId ?? "transition",
    sourceTokenIds: input.geometry.sourceTokens.map((token) => token.motionId),
    targetTokenIds: input.geometry.targetTokens.map((token) => token.motionId),
    motionPrimitiveIds: primitiveIdsForEquationVisualMotifKind(timelineMotifKind),
    phaseIds: phaseIdsForEquationVisualMotifKind(timelineMotifKind),
    summary: `${timelineMotifKind} semantic editor timeline.`
  });
  const motionPlan: EquationMotionPlan = {
    sourceLatex: "",
    targetLatex: "",
    correspondenceMap: { id: `${input.id}.correspondence`, records: [] },
    tokens: [],
    tracks: [],
    visualMotifs: [motif]
  };
  const semanticTimeline = compileKpEquationSemanticTimeline(
    createEquationVisualMotifTimeline(motionPlan, linearEquationDemoBeatTimeline)
  );
  return {
    kind: "precomputed-equation-motion-plan",
    id: input.id,
    geometry,
    layoutPlan,
    relationPathPlans,
    tokenPathPlans,
    semanticTimeline
  };
}

function baseTimelineMotifKind(
  motifKind: EquationVisualMotifKind
): EquationVisualMotifKind {
  // Fraction and exponent choreography has its own causal phase clock. The
  // shared token timeline only supplies its preview/change/outro envelope, so
  // compiling those specialized phase IDs here would create a second clock.
  switch (motifKind) {
    case "fraction-factor-split": return "copy-fan-out";
    case "fraction-common-factor-extract": return "merge-fan-in";
    case "fraction-unit-absorb": return "simplify-into";
    case "exponent-factor-peel": return "append-after-shift";
    case "exponent-unit-absorb": return "unwrap";
    default: return motifKind;
  }
}

function lineageTokenPathPlans(
  geometry: KpMeasuredEquationTransitionGeometry,
  planId: string,
  pathPreference: "automatic" | "arc-above" | "arc-below" | "around-left" | "around-right"
): ReadonlyMap<string, KpEquationMotionPathCandidate> {
  const kind = geometry.lineageChoreographyKind;
  const relation = geometry.relations.find((candidate) =>
    kind === "copy-fan-out" || kind === "substitute"
      ? candidate.lifecycle === "split"
      : kind === "merge-fan-in"
        ? candidate.lifecycle === "merge"
        : false
  );
  if (kind === undefined || relation?.source === undefined || relation.target === undefined) {
    return new Map();
  }
  const tokens = kind === "copy-fan-out" || kind === "substitute"
    ? geometry.targetTokens
    : geometry.sourceTokens;
  const motionIds = kind === "copy-fan-out" || kind === "substitute"
    ? relation.target.motionIds
    : relation.source.motionIds;
  const origin = distributionFissionOrigin(geometry, relation) ?? center(
    kind === "copy-fan-out" || kind === "substitute"
      ? relation.source.bounds
      : relation.target.bounds
  );
  return new Map(motionIds.map((motionId, branchIndex) => {
    const token = tokens.find((candidate) => candidate.motionId === motionId);
    if (token === undefined) throw new Error(`Missing lineage token ${motionId}.`);
    const preferredVariant = pathPreference === "automatic"
      ? derivativeBranchVariant(geometry, relation, motionId) ??
        (branchIndex % 2 === 0 ? "arc-above" : "arc-below")
      : pathPreference;
    const variants = pathPreference.startsWith("around")
      ? ["around-left", "around-right"] as const
      : ["arc-above", "arc-below"] as const;
    const path = planKpEquationMotionPathBetweenPoints({
      id: `${planId}.lineage.${branchIndex}`,
      start: origin,
      end: center(token.localRect),
      variants,
      preferredVariant,
      clearance: 18 + branchIndex * 3,
      moverRadius: 0
    });
    return [motionId, path.selected] as const;
  }));
}

function distributionFissionOrigin(
  geometry: KpMeasuredEquationTransitionGeometry,
  relation: KpMeasuredEquationTransitionGeometry["relations"][number]
): { readonly x: number; readonly y: number } | undefined {
  if (
    geometry.distributionChoreographyKind !== "canonical-fan-out" ||
    relation.lifecycle !== "split" ||
    relation.source === undefined ||
    relation.target === undefined
  ) return undefined;
  // The lesson-derived renderer moves one factor continuously and peels the
  // follower from that live pose; lineage evidence still begins at the exact
  // semantic source instead of encoding an obsolete shared-birth offset.
  return center(relation.source.bounds);
}

function derivativeBranchVariant(
  geometry: KpMeasuredEquationTransitionGeometry,
  relation: KpMeasuredEquationTransitionGeometry["relations"][number],
  motionId: string
): "arc-above" | "arc-below" | undefined {
  const plan = geometry.derivativePowerChoreographyPlan;
  const motionIndex = relation.target?.motionIds.indexOf(motionId) ?? -1;
  const selectorId = relation.target?.selectorIds[motionIndex];
  if (plan === undefined || selectorId === undefined) return undefined;
  if (selectorId === plan.exponent.coefficientSelectorId) {
    return plan.exponent.coefficientPathVariant;
  }
  if (selectorId === plan.exponent.decrementInputSelectorId) {
    return plan.exponent.decrementInputPathVariant;
  }
  return undefined;
}

function center(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

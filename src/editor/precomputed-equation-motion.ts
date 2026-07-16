import {
  createKpEquationLayoutPlan,
  type KpEquationLayoutPlan
} from "../rendering/equation-layout-plan.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../rendering/equation-motion-dom.ts";
import {
  planKpEquationMotionPath,
  planKpEquationMotionPathBetweenPoints,
  type KpEquationMotionPathCandidate,
  type KpEquationMotionPathPlan
} from "../rendering/equation-motion-path-planner.ts";
import {
  compileKpEquationSemanticTimeline,
  createEquationVisualMotifTimeline,
  type KpEquationSemanticTimeline
} from "../rendering/equation-visual-motif-timeline.ts";
import { linearEquationDemoBeatTimeline } from "../rendering/semantic-beat-compiler.ts";
import {
  createVisualMotifPlan,
  phaseIdsForEquationVisualMotifKind,
  primitiveIdsForEquationVisualMotifKind,
  type EquationVisualMotifKind
} from "../rendering/visual-motif.ts";
import type { EquationMotionPlan } from "../rendering/equation-motion-plan.ts";

export interface KpEditorPrecomputedEquationMotionPlan {
  readonly kind: "editor-precomputed-equation-motion-plan";
  readonly id: string;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly layoutPlan: KpEquationLayoutPlan;
  readonly relationPathPlans: ReadonlyMap<string, KpEquationMotionPathPlan>;
  readonly tokenPathPlans: ReadonlyMap<string, KpEquationMotionPathCandidate>;
  readonly semanticTimeline: KpEquationSemanticTimeline;
}

export function createKpEditorPrecomputedEquationMotionPlan(input: {
  readonly id: string;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly motifKind: EquationVisualMotifKind;
}): KpEditorPrecomputedEquationMotionPlan {
  const layoutPlan = createKpEquationLayoutPlan({
    id: `${input.id}.layout`,
    geometry: input.geometry
  });
  const relationPathPlans = new Map(
    input.geometry.relations.flatMap((relation) =>
      relation.source === undefined || relation.target === undefined
        ? []
        : [[relation.recordId, planKpEquationMotionPath({
            id: `${input.id}.path.${relation.recordId}`,
            layoutPlan,
            relationRecordId: relation.recordId
          })] as const]
    )
  );
  const tokenPathPlans = lineageTokenPathPlans(input.geometry, input.id);
  const geometry: KpMeasuredEquationTransitionGeometry = {
    ...input.geometry,
    precomputedMotionPathsByMotionId: Object.fromEntries(tokenPathPlans)
  };
  const motif = createVisualMotifPlan({
    id: `${input.id}.motif`,
    kind: input.motifKind,
    correspondenceRecordId: input.geometry.relations[0]?.recordId ?? "transition",
    sourceTokenIds: input.geometry.sourceTokens.map((token) => token.motionId),
    targetTokenIds: input.geometry.targetTokens.map((token) => token.motionId),
    motionPrimitiveIds: primitiveIdsForEquationVisualMotifKind(input.motifKind),
    phaseIds: phaseIdsForEquationVisualMotifKind(input.motifKind),
    summary: `${input.motifKind} semantic editor timeline.`
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
    kind: "editor-precomputed-equation-motion-plan",
    id: input.id,
    geometry,
    layoutPlan,
    relationPathPlans,
    tokenPathPlans,
    semanticTimeline
  };
}

function lineageTokenPathPlans(
  geometry: KpMeasuredEquationTransitionGeometry,
  planId: string
): ReadonlyMap<string, KpEquationMotionPathCandidate> {
  const kind = geometry.lineageChoreographyKind;
  const relation = geometry.relations.find((candidate) =>
    kind === "copy-fan-out"
      ? candidate.lifecycle === "split"
      : kind === "merge-fan-in"
        ? candidate.lifecycle === "merge"
        : false
  );
  if (kind === undefined || relation?.source === undefined || relation.target === undefined) {
    return new Map();
  }
  const tokens = kind === "copy-fan-out" ? geometry.targetTokens : geometry.sourceTokens;
  const motionIds = kind === "copy-fan-out"
    ? relation.target.motionIds
    : relation.source.motionIds;
  const origin = center(
    kind === "copy-fan-out" ? relation.source.bounds : relation.target.bounds
  );
  return new Map(motionIds.map((motionId, branchIndex) => {
    const token = tokens.find((candidate) => candidate.motionId === motionId);
    if (token === undefined) throw new Error(`Missing lineage token ${motionId}.`);
    const preferredVariant = branchIndex % 2 === 0 ? "arc-above" : "arc-below";
    const path = planKpEquationMotionPathBetweenPoints({
      id: `${planId}.lineage.${branchIndex}`,
      start: origin,
      end: center(token.localRect),
      variants: ["arc-above", "arc-below"],
      preferredVariant,
      clearance: 18 + branchIndex * 3,
      moverRadius: 0
    });
    return [motionId, path.selected] as const;
  }));
}

function center(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

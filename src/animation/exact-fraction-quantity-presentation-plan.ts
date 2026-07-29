import {
  compileKpFissionFusionPlan,
  type KpFissionFusionPlan
} from "./fission-fusion.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame,
  type KpExactFractionQuantitySelectionTransition
} from "./exact-fraction-quantity-neutral-frame.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import type {
  KpCanonicalOperationId
} from "../semantic/canonical-operation.ts";
import {
  createKpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";

export interface KpExactQuantityOpaquePaintBinding {
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly atomicPartIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly paintOpacity: 1;
  readonly ownership:
    | "continuous-owned-paint"
    | "atomic-exclusive-handoff";
}

interface KpExactFractionQuantityPresentationBeatBase {
  readonly beatId: string;
  readonly canonicalOperationId: KpCanonicalOperationId;
  readonly scheduler: "shared-canonical-beat";
  readonly paintBindings: readonly KpExactQuantityOpaquePaintBinding[];
}

export type KpExactFractionQuantityPresentationBeat =
  | (KpExactFractionQuantityPresentationBeatBase & {
      readonly motif: {
        readonly kind: "existing";
        readonly motifId:
          | "focus-continuant"
          | "group-continuants"
          | "structural-succession";
      };
    })
  | (KpExactFractionQuantityPresentationBeatBase & {
      readonly canonicalOperationId: "kp.core.fan-out";
      readonly motif: {
        readonly kind: "partition-refinement";
        readonly sourceSelectionId: string;
        readonly targetAtomicPartIds: readonly [string, string];
        readonly dividerPolicy: "reveal-without-area-change";
        readonly fissionPlan: KpFissionFusionPlan;
      };
    })
  | (KpExactFractionQuantityPresentationBeatBase & {
      readonly canonicalOperationId: "kp.core.merge";
      readonly motif: {
        readonly kind: "part-merge";
        readonly contributorAtomicPartIds:
          readonly [string, string, ...string[]];
        readonly targetSelectionId: string;
        readonly mergePolicy: "simultaneous-opaque-fusion";
        readonly fusionPlan: KpFissionFusionPlan;
      };
    });

export interface KpExactFractionQuantityPresentationPlan {
  readonly schemaVersion:
    "kp.exact-fraction-quantity-presentation-plan.v1";
  readonly traceId: string;
  readonly beats: readonly KpExactFractionQuantityPresentationBeat[];
  readonly lifecycleVocabulary:
    readonly ["persist", "fission", "fusion"];
  readonly schedulerVocabulary: readonly ["shared-canonical-beat"];
}

export function createKpExactFractionQuantityPresentationPlan(
  trace: KpExactFractionQuantityTrace =
    createKpExactFractionQuantityTrace()
): KpExactFractionQuantityPresentationPlan {
  const neutralFrames = manifest.pacing.map((pacing) =>
    sampleKpExactFractionQuantityNeutralFrame({
      progress:
        ((pacing.startPermille + pacing.endPermille) / 2) / 1_000,
      trace
    })
  );
  const refinement = neutralFrames[1]!.selectionTransitions.find(
    ({ lifecycle }) => lifecycle === "fission"
  );
  if (
    refinement === undefined ||
    refinement.sourceSelectionIds.length !== 1 ||
    refinement.atomicPartIds.length !== 2
  ) {
    throw new Error(
      "Exact quantity refinement requires one source and two certified sixth atoms."
    );
  }
  const merge = neutralFrames[3]!.selectionTransitions.find(
    ({ lifecycle }) => lifecycle === "fusion"
  );
  if (
    merge === undefined ||
    merge.atomicPartIds.length < 2 ||
    merge.targetSelectionIds.length !== 1
  ) {
    throw new Error(
      "Exact quantity merge requires all atomic contributors and one result."
    );
  }
  const refinementTargets =
    Object.freeze([...refinement.atomicPartIds]) as readonly [string, string];
  const mergeContributors =
    Object.freeze([...merge.atomicPartIds]) as
      readonly [string, string, ...string[]];
  const fissionPlan = compileKpFissionFusionPlan({
    id: "motion.exact-fraction-quantity.partition-refinement",
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.exact-fraction-quantity.partition-refinement",
      sourceEntityIds: refinement.sourceSelectionIds,
      targetEntityIds: refinementTargets,
      edges: [{
        id: "lineage-edge.exact-fraction-quantity.partition-refinement",
        relation: "split",
        sourceEntityIds: refinement.sourceSelectionIds,
        targetEntityIds: refinementTargets,
        summary: "One selected third refines into its exact two sixth atoms."
      }]
    }),
    semanticOrder: refinementTargets,
    microStaggerSpan: 0,
    junctionScale: 1
  });
  const fusionPlan = compileKpFissionFusionPlan({
    id: "motion.exact-fraction-quantity.part-merge",
    mode: "fusion",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.exact-fraction-quantity.part-merge",
      sourceEntityIds: mergeContributors,
      targetEntityIds: merge.targetSelectionIds,
      edges: [{
        id: "lineage-edge.exact-fraction-quantity.part-merge",
        relation: "merge",
        sourceEntityIds: mergeContributors,
        targetEntityIds: merge.targetSelectionIds,
        summary: "Three selected sixth atoms merge into one exact sum."
      }]
    }),
    semanticOrder: mergeContributors,
    microStaggerSpan: 0,
    junctionScale: 1
  });
  const beats: readonly KpExactFractionQuantityPresentationBeat[] =
    Object.freeze([
      existingBeat(
        trace.beats[0]!.id,
        "kp.core.focus",
        "focus-continuant",
        neutralFrames[0]!.selectionTransitions
      ),
      Object.freeze({
        beatId: trace.beats[1]!.id,
        canonicalOperationId: "kp.core.fan-out" as const,
        scheduler: "shared-canonical-beat" as const,
        paintBindings: paintBindings(
          neutralFrames[1]!.selectionTransitions
        ),
        motif: Object.freeze({
          kind: "partition-refinement" as const,
          sourceSelectionId: refinement.sourceSelectionIds[0]!,
          targetAtomicPartIds: refinementTargets,
          dividerPolicy: "reveal-without-area-change" as const,
          fissionPlan
        })
      }),
      existingBeat(
        trace.beats[2]!.id,
        "kp.core.group",
        "group-continuants",
        neutralFrames[2]!.selectionTransitions
      ),
      Object.freeze({
        beatId: trace.beats[3]!.id,
        canonicalOperationId: "kp.core.merge" as const,
        scheduler: "shared-canonical-beat" as const,
        paintBindings: paintBindings(
          neutralFrames[3]!.selectionTransitions
        ),
        motif: Object.freeze({
          kind: "part-merge" as const,
          contributorAtomicPartIds: mergeContributors,
          targetSelectionId: merge.targetSelectionIds[0]!,
          mergePolicy: "simultaneous-opaque-fusion" as const,
          fusionPlan
        })
      }),
      existingBeat(
        trace.beats[4]!.id,
        "kp.core.persist",
        "structural-succession",
        neutralFrames[4]!.selectionTransitions
      )
    ]);
  if (
    beats.length !== trace.beats.length ||
    beats.some((beat, index) => beat.beatId !== trace.beats[index]?.id)
  ) {
    throw new Error(
      "Exact quantity presentation must bind every verified beat exactly once."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-presentation-plan.v1",
    traceId: trace.id,
    beats,
    lifecycleVocabulary: Object.freeze([
      "persist",
      "fission",
      "fusion"
    ] as const),
    schedulerVocabulary: Object.freeze(["shared-canonical-beat"] as const)
  });
}

function existingBeat(
  beatId: string,
  canonicalOperationId: KpCanonicalOperationId,
  motifId:
    | "focus-continuant"
    | "group-continuants"
    | "structural-succession",
  transitions: readonly KpExactFractionQuantitySelectionTransition[]
): KpExactFractionQuantityPresentationBeat {
  return Object.freeze({
    beatId,
    canonicalOperationId,
    scheduler: "shared-canonical-beat",
    paintBindings: paintBindings(transitions),
    motif: Object.freeze({
      kind: "existing",
      motifId
    })
  });
}

function paintBindings(
  transitions: readonly KpExactFractionQuantitySelectionTransition[]
): readonly KpExactQuantityOpaquePaintBinding[] {
  return Object.freeze(transitions.map((transition) => Object.freeze({
    sourceSelectionIds: transition.sourceSelectionIds,
    targetSelectionIds: transition.targetSelectionIds,
    atomicPartIds: transition.atomicPartIds,
    lifecycle: transition.lifecycle,
    paintOpacity: 1 as const,
    ownership: transition.lifecycle === "persist"
      ? "continuous-owned-paint" as const
      : "atomic-exclusive-handoff" as const
  })));
}

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

declare const kpExactQuantityMotifInvocationBrand: unique symbol;

const sealedMotifInvocations = new WeakSet<object>();

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

export interface KpExactQuantityMotifInvocation {
  readonly kind: "exact-quantity-canonical-motif-invocation";
  readonly id: string;
  readonly operationId: KpCanonicalOperationId;
  readonly symbolicDispatches: readonly (
    | "continuant"
    | "copy-fan-out"
    | "semantic-group"
    | "merge-fan-in"
    | "structural-succession"
  )[];
  readonly atomicDispatch:
    | "focus"
    | "fission"
    | "group"
    | "fusion"
    | "structural-succession";
  readonly viewContract: "all-required-views-one-visible-beat";
  readonly [kpExactQuantityMotifInvocationBrand]: true;
}

interface KpExactFractionQuantityPresentationBeatBase {
  readonly beatId: string;
  readonly canonicalOperationId: KpCanonicalOperationId;
  readonly scheduler: "shared-canonical-beat";
  readonly paintBindings: readonly KpExactQuantityOpaquePaintBinding[];
  readonly execution: KpExactQuantityMotifInvocation;
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

export interface KpExactQuantityVisiblePhaseBinding {
  readonly view:
    | "symbolic"
    | "partitioned-circle"
    | "fraction-bar"
    | "number-line";
  readonly invocationId: string;
  readonly operationId: KpCanonicalOperationId;
  readonly phase: "setup" | "action" | "settle";
  readonly actionProgress: number;
}

export interface KpExactQuantityVisibleOperationFrame {
  readonly invocationId: string;
  readonly operationId: KpCanonicalOperationId;
  readonly phase: "setup" | "action" | "settle";
  readonly phaseProgress: number;
  readonly actionProgress: number;
  readonly viewBindings: readonly [
    KpExactQuantityVisiblePhaseBinding,
    KpExactQuantityVisiblePhaseBinding,
    KpExactQuantityVisiblePhaseBinding,
    KpExactQuantityVisiblePhaseBinding
  ];
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
        execution: createMotifInvocation({
          beatId: trace.beats[1]!.id,
          operationId: "kp.core.fan-out",
          symbolicDispatches: ["copy-fan-out", "merge-fan-in"],
          atomicDispatch: "fission"
        }),
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
        execution: createMotifInvocation({
          beatId: trace.beats[3]!.id,
          operationId: "kp.core.merge",
          symbolicDispatches: ["merge-fan-in"],
          atomicDispatch: "fusion"
        }),
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

export function isKpExactQuantityMotifInvocation(
  value: unknown
): value is KpExactQuantityMotifInvocation {
  return typeof value === "object" &&
    value !== null &&
    sealedMotifInvocations.has(value);
}

export function sampleKpExactQuantityVisibleOperation(input: {
  readonly beat: KpExactFractionQuantityPresentationBeat;
  readonly localProgress: number;
}): KpExactQuantityVisibleOperationFrame {
  if (!isKpExactQuantityMotifInvocation(input.beat.execution)) {
    throw new Error(
      "Exact-quantity runtime requires a sealed executable motif invocation."
    );
  }
  if (
    input.beat.execution.operationId !== input.beat.canonicalOperationId
  ) {
    throw new Error(
      "Exact-quantity motif invocation diverges from its canonical operation."
    );
  }
  const progress = Math.max(0, Math.min(1, input.localProgress));
  const phase = progress < 0.18
    ? "setup" as const
    : progress < 0.82
      ? "action" as const
      : "settle" as const;
  const phaseProgress = phase === "setup"
    ? progress / 0.18
    : phase === "action"
      ? (progress - 0.18) / 0.64
      : (progress - 0.82) / 0.18;
  const actionProgress = phase === "setup"
    ? 0
    : phase === "action"
      ? phaseProgress
      : 1;
  const viewBindings = ([
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ] as const).map((view) => Object.freeze({
    view,
    invocationId: input.beat.execution.id,
    operationId: input.beat.execution.operationId,
    phase,
    actionProgress
  })) as unknown as KpExactQuantityVisibleOperationFrame["viewBindings"];
  return Object.freeze({
    invocationId: input.beat.execution.id,
    operationId: input.beat.execution.operationId,
    phase,
    phaseProgress,
    actionProgress,
    viewBindings: Object.freeze(viewBindings)
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
    execution: createMotifInvocation({
      beatId,
      operationId: canonicalOperationId,
      symbolicDispatches: [
        motifId === "focus-continuant"
          ? "continuant"
          : motifId === "group-continuants"
            ? "merge-fan-in"
            : "structural-succession"
      ],
      atomicDispatch: motifId === "focus-continuant"
        ? "focus"
        : motifId === "group-continuants"
          ? "group"
          : "structural-succession"
    }),
    motif: Object.freeze({
      kind: "existing",
      motifId
    })
  });
}

function createMotifInvocation(input: {
  readonly beatId: string;
  readonly operationId: KpCanonicalOperationId;
  readonly symbolicDispatches:
    KpExactQuantityMotifInvocation["symbolicDispatches"];
  readonly atomicDispatch:
    KpExactQuantityMotifInvocation["atomicDispatch"];
}): KpExactQuantityMotifInvocation {
  const invocation = Object.freeze({
    kind: "exact-quantity-canonical-motif-invocation" as const,
    id: `motif-invocation.${input.beatId}`,
    operationId: input.operationId,
    symbolicDispatches: Object.freeze([...input.symbolicDispatches]),
    atomicDispatch: input.atomicDispatch,
    viewContract: "all-required-views-one-visible-beat" as const
  });
  sealedMotifInvocations.add(invocation);
  return invocation as KpExactQuantityMotifInvocation;
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

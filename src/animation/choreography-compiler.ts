import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { KpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../rendering/semantic-equation-transition-compiler.ts";
import type { KpEquationTransitionIr } from "../domain-ir/public-api.ts";
import {
  activeKpChoreographyPhase,
  createKpChoreographyPlan,
  noOpKpChoreographyPhase,
  type KpChoreographyPlan
} from "./choreography-plan.ts";
import {
  checkKpChoreographyEnvelopeLaws
} from "./choreography-envelope-laws.ts";
import {
  validateKpChoreographyLifecycle,
  type KpChoreographyLifecycle
} from "./choreography-lifecycle.ts";
import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary,
  type KpSemanticContinuant
} from "./choreography-vocabulary.ts";
import {
  validateKpTransferableSalienceGraph,
  type KpTransferableSalienceGraph
} from "./salience-graph.ts";
import {
  validateKpSemanticTraversalPlan,
  type KpSemanticTraversalPlan
} from "./semantic-traversal.ts";

export interface KpCompiledChoreographyPlan extends KpChoreographyPlan {
  readonly semantic: {
    readonly transformationId: string;
    readonly canonicalOperationId: string;
    readonly lifecycle: KpChoreographyLifecycle;
    readonly lineage: KpSemanticLineageGraph;
    readonly salience: KpTransferableSalienceGraph;
    readonly traversal: KpSemanticTraversalPlan;
    readonly layoutPlanId: string;
    readonly motifIds: readonly string[];
  };
  readonly equationTransition: KpEquationTransitionIr;
}

export type KpChoreographyCompileGapReason =
  | "semantic-transition-gap"
  | "invalid-vocabulary"
  | "invalid-lifecycle"
  | "invalid-salience"
  | "invalid-traversal"
  | "ambiguous-continuant"
  | "missing-operation"
  | "invalid-entity-reference"
  | "missing-layout"
  | "missing-motif"
  | "envelope-law-failed";

export interface KpChoreographyCompileGap {
  readonly kind: "choreography-compile-gap";
  readonly reason: KpChoreographyCompileGapReason;
  readonly path: string;
  readonly message: string;
  readonly promotable: false;
}

export type KpChoreographyCompileResult =
  | {
      readonly status: "compiled";
      readonly plan: KpCompiledChoreographyPlan;
      readonly gaps: readonly [];
    }
  | {
      readonly status: "gap";
      readonly gaps: readonly KpChoreographyCompileGap[];
    };

export function compileKpChoreographyPlan(input: {
  readonly id: string;
  readonly timelineRefId: string;
  readonly canonicalOperationId: string;
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly lifecycle: KpChoreographyLifecycle;
  readonly lineage: KpSemanticLineageGraph;
  readonly salience: KpTransferableSalienceGraph;
  readonly traversal: KpSemanticTraversalPlan;
  readonly layoutPlanId: string;
  readonly motifIds: readonly string[];
}): KpChoreographyCompileResult {
  const gaps: KpChoreographyCompileGap[] = [];
  const transition = compileKpSemanticEquationTransitionResult({
    transformation: input.transformation,
    bundle: input.bundle,
    unsupportedPolicy: "typed-gap"
  });
  if (transition.status !== "semantic" || transition.ir === undefined) {
    return {
      status: "gap",
      gaps: [gap(
        "semantic-transition-gap",
        "transformation",
        transition.gap?.summary ?? "Semantic equation transition did not compile."
      )]
    };
  }
  const vocabulary = checkKpChoreographyVocabularyContract(input.vocabulary);
  vocabulary.failures.forEach((failure) =>
    gaps.push(gap("invalid-vocabulary", `vocabulary.${failure.path}`, failure.message))
  );
  const sourceEntityIds = semanticSelectorIds(transition.ir.source);
  const targetEntityIds = semanticSelectorIds(transition.ir.target);
  const visibleEntityIds = new Set([...sourceEntityIds, ...targetEntityIds]);
  if (input.canonicalOperationId.trim().length === 0) {
    gaps.push(gap("missing-operation", "canonicalOperationId", "Choreography compilation requires a canonical operation binding."));
  }
  validateKpChoreographyLifecycle({
    lifecycle: input.lifecycle,
    vocabulary: input.vocabulary,
    sourceEntityIds,
    targetEntityIds
  }).forEach((failure) =>
    gaps.push(gap("invalid-lifecycle", `lifecycle.${failure.path}`, failure.message))
  );
  validateKpTransferableSalienceGraph(input.salience, input.lineage)
    .forEach((failure) =>
      gaps.push(gap("invalid-salience", `salience.${failure.path}`, failure.message))
    );
  validateKpSemanticTraversalPlan(input.traversal).forEach((failure) =>
    gaps.push(gap("invalid-traversal", `traversal.${failure.path}`, failure.message))
  );
  input.salience.nodes.forEach((node, nodeIndex) => {
    node.entityIds.forEach((entityId, entityIndex) => {
      if (!visibleEntityIds.has(entityId)) {
        gaps.push(gap(
          "invalid-entity-reference",
          `salience.nodes[${nodeIndex}].entityIds[${entityIndex}]`,
          `Salience node ${node.id} references entity ${entityId} outside the compiled transition.`
        ));
      }
    });
  });
  input.traversal.participants.forEach((participant, participantIndex) => {
    participant.entityIds.forEach((entityId, entityIndex) => {
      if (!visibleEntityIds.has(entityId)) {
        gaps.push(gap(
          "invalid-entity-reference",
          `traversal.participants[${participantIndex}].entityIds[${entityIndex}]`,
          `Traversal participant ${participant.id} references entity ${entityId} outside the compiled transition.`
        ));
      }
    });
  });
  gaps.push(...continuantBindingGaps(transition.ir, input.vocabulary.continuants));
  if (input.layoutPlanId.trim().length === 0) {
    gaps.push(gap("missing-layout", "layoutPlanId", "Choreography compilation requires a declared layout plan."));
  }
  if (input.motifIds.length === 0) {
    gaps.push(gap("missing-motif", "motifIds", "Choreography compilation requires at least one canonical motif."));
  }
  if (gaps.length > 0) return { status: "gap", gaps };

  const plan = buildPlan(input, transition.ir, targetEntityIds);
  const envelope = checkKpChoreographyEnvelopeLaws(plan);
  if (!envelope.passed) {
    return {
      status: "gap",
      gaps: envelope.failures.map((failure) =>
        gap("envelope-law-failed", failure.path, failure.message)
      )
    };
  }
  return { status: "compiled", plan, gaps: [] };
}

function buildPlan(
  input: Parameters<typeof compileKpChoreographyPlan>[0],
  equationTransition: KpEquationTransitionIr,
  targetEntityIds: readonly string[]
): KpCompiledChoreographyPlan {
  const focusEntityIds = unique(
    input.salience.nodes
      .filter((node) => node.role === "source")
      .flatMap((node) => node.entityIds)
  );
  const continuantEntityIds = unique(
    input.vocabulary.continuants.flatMap((continuant) => [
      continuant.source.entityId,
      continuant.target.entityId
    ])
  );
  const actEntityIds = unique(
    input.lifecycle.records
      .filter((record) => record.kind !== "continuant")
      .flatMap((record) => [...record.sourceEntityIds, ...record.targetEntityIds])
  );
  const releaseEntityIds = unique(
    input.salience.nodes.flatMap((node) => node.entityIds)
  );
  const activities = [
    ...(focusEntityIds.length === 0 ? [] : [{
      id: `${input.id}.orient.focus`,
      phaseId: "orient" as const,
      kind: "focus" as const,
      entityIds: focusEntityIds,
      summary: "Orient attention to the smallest causal semantic group.",
      motionClassificationIds: [],
      dependsOnActivityIds: [],
      prerequisiteCheckpointIds: []
    }]),
    ...(continuantEntityIds.length === 0 ? [] : [{
      id: `${input.id}.reflow.continuants`,
      phaseId: "reflow" as const,
      kind: "move-continuant" as const,
      entityIds: continuantEntityIds,
      summary: "Move semantic continuants into reserved target roles.",
      motionClassificationIds: [],
      dependsOnActivityIds: [],
      prerequisiteCheckpointIds: [`${input.id}.checkpoint.space-reserved`]
    }]),
    {
      id: `${input.id}.act.operation`,
      phaseId: "act" as const,
      kind: "execute-operation" as const,
      entityIds: actEntityIds.length === 0 ? targetEntityIds : actEntityIds,
      summary: `Execute canonical operation ${input.canonicalOperationId}.`,
      motionClassificationIds: meaningfulClassifications(input.vocabulary),
      dependsOnActivityIds: [],
      prerequisiteCheckpointIds: [
        `${input.id}.checkpoint.focus-ready`,
        `${input.id}.checkpoint.reflow-complete`
      ]
    },
    {
      id: `${input.id}.settle.recognition`,
      phaseId: "settle" as const,
      kind: "recognition-hold" as const,
      entityIds: targetEntityIds,
      summary: "Hold the exact target at a stable recognition checkpoint.",
      motionClassificationIds: [],
      dependsOnActivityIds: [],
      prerequisiteCheckpointIds: [`${input.id}.checkpoint.act-complete`]
    },
    ...(releaseEntityIds.length === 0 ? [] : [{
      id: `${input.id}.release.attention`,
      phaseId: "release" as const,
      kind: "release-attention" as const,
      entityIds: releaseEntityIds,
      summary: "Return focus and context treatment to neutral.",
      motionClassificationIds: [],
      dependsOnActivityIds: [],
      prerequisiteCheckpointIds: [`${input.id}.checkpoint.recognition`]
    }])
  ];
  const checkpoints = [
    checkpoint(input.id, "focus-ready", "orient", false),
    checkpoint(input.id, "space-reserved", "orient", false),
    checkpoint(input.id, "reflow-complete", "reflow", false),
    checkpoint(input.id, "act-complete", "act", false),
    checkpoint(input.id, "recognition", "settle", true),
    checkpoint(input.id, "neutral", "release", true)
  ] as const;
  const base = createKpChoreographyPlan({
    id: input.id,
    timelineRefId: input.timelineRefId,
    vocabulary: input.vocabulary,
    phases: [
      focusEntityIds.length === 0
        ? noOpKpChoreographyPhase({
            id: "orient",
            reason: "No salience source requires an orientation preview.",
            completionCheckpointId: `${input.id}.checkpoint.focus-ready`
          })
        : activeKpChoreographyPhase({
            id: "orient",
            activityIds: [`${input.id}.orient.focus`],
            completionCheckpointId: `${input.id}.checkpoint.focus-ready`
          }),
      continuantEntityIds.length === 0
        ? noOpKpChoreographyPhase({
            id: "reflow",
            reason: "The operation has no semantic continuants requiring accommodation.",
            dependsOnPhaseIds: ["orient"],
            prerequisiteCheckpointIds: [
              `${input.id}.checkpoint.focus-ready`,
              `${input.id}.checkpoint.space-reserved`
            ],
            completionCheckpointId: `${input.id}.checkpoint.reflow-complete`
          })
        : activeKpChoreographyPhase({
            id: "reflow",
            activityIds: [`${input.id}.reflow.continuants`],
            dependsOnPhaseIds: ["orient"],
            prerequisiteCheckpointIds: [
              `${input.id}.checkpoint.focus-ready`,
              `${input.id}.checkpoint.space-reserved`
            ],
            completionCheckpointId: `${input.id}.checkpoint.reflow-complete`
          }),
      activeKpChoreographyPhase({
        id: "act",
        activityIds: [`${input.id}.act.operation`],
        dependsOnPhaseIds: ["reflow"],
        prerequisiteCheckpointIds: [
          `${input.id}.checkpoint.focus-ready`,
          `${input.id}.checkpoint.reflow-complete`
        ],
        completionCheckpointId: `${input.id}.checkpoint.act-complete`
      }),
      activeKpChoreographyPhase({
        id: "settle",
        activityIds: [`${input.id}.settle.recognition`],
        dependsOnPhaseIds: ["act"],
        prerequisiteCheckpointIds: [`${input.id}.checkpoint.act-complete`],
        completionCheckpointId: `${input.id}.checkpoint.recognition`
      }),
      releaseEntityIds.length === 0
        ? noOpKpChoreographyPhase({
            id: "release",
            reason: "No salience treatment remains to release.",
            dependsOnPhaseIds: ["settle"],
            prerequisiteCheckpointIds: [`${input.id}.checkpoint.recognition`],
            completionCheckpointId: `${input.id}.checkpoint.neutral`
          })
        : activeKpChoreographyPhase({
            id: "release",
            activityIds: [`${input.id}.release.attention`],
            dependsOnPhaseIds: ["settle"],
            prerequisiteCheckpointIds: [`${input.id}.checkpoint.recognition`],
            completionCheckpointId: `${input.id}.checkpoint.neutral`
          })
    ],
    activities,
    checkpoints
  });
  return {
    ...base,
    semantic: {
      transformationId: input.transformation.id,
      canonicalOperationId: input.canonicalOperationId,
      lifecycle: structuredClone(input.lifecycle),
      lineage: structuredClone(input.lineage),
      salience: structuredClone(input.salience),
      traversal: structuredClone(input.traversal),
      layoutPlanId: input.layoutPlanId,
      motifIds: [...input.motifIds]
    },
    equationTransition
  };
}

function continuantBindingGaps(
  ir: KpEquationTransitionIr,
  continuants: readonly KpSemanticContinuant[]
): readonly KpChoreographyCompileGap[] {
  return ir.correspondenceMap.records
    .filter((record) =>
      record.relation === "identity" || record.relation === "role-change"
    )
    .flatMap((record, index) => {
      const matches = continuants.filter((continuant) =>
        sameSet(continuant.source.selectorIds, record.sourceSelectorIds) &&
        sameSet(continuant.target.selectorIds, record.targetSelectorIds)
      );
      return matches.length === 1 ? [] : [gap(
        "ambiguous-continuant",
        `correspondenceMap.records[${index}]`,
        `Correspondence ${record.id} resolves to ${matches.length} semantic continuants; exactly one authored continuant is required.`
      )];
    });
}

function semanticSelectorIds(
  states: KpEquationTransitionIr["source"]
): readonly string[] {
  return states.flatMap((state) =>
    state.selectors
      .filter((selector) => selector.kind === "semantic")
      .map((selector) => selector.id)
  );
}

function meaningfulClassifications(
  vocabulary: KpChoreographyVocabulary
): readonly string[] {
  return vocabulary.motionClassifications
    .filter((classification) => classification.motionClass === "meaningful")
    .map((classification) => classification.id);
}

function checkpoint(
  planId: string,
  suffix: string,
  phaseId: "orient" | "reflow" | "act" | "settle" | "release",
  stable: boolean
) {
  const kinds = {
    "focus-ready": "focus-ready",
    "space-reserved": "space-reserved",
    "reflow-complete": "phase-complete",
    "act-complete": "phase-complete",
    recognition: "recognition",
    neutral: "neutral"
  } as const;
  return {
    id: `${planId}.checkpoint.${suffix}`,
    phaseId,
    kind: kinds[suffix as keyof typeof kinds],
    requirement: `${suffix} must be satisfied.`,
    stable
  };
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function gap(
  reason: KpChoreographyCompileGapReason,
  path: string,
  message: string
): KpChoreographyCompileGap {
  return {
    kind: "choreography-compile-gap",
    reason,
    path,
    message,
    promotable: false
  };
}

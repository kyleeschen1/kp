import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset,
  kpFivePlusTwoEvaluationAnimationId,
  kpOnePlusTwoEvaluationAnimationId,
  kpThreeSixthsEvaluationAnimationId
} from "../animation/operation-evaluation-adapter.ts";
import {
  kpBoundedSemanticContactPaintContinuityCompiler,
  kpOperationEvaluationExecutableProgramCompiler,
  kpSuccessorSynthesisPresentationPlanCompiler,
  resolveKpOperationEvaluationPresentationRoute
} from "../animation/operation-evaluation-presentation-registry.ts";
import {
  kpOperationEvaluationContinuityReference
} from "../animation/operation-evaluation-continuity-reference.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../animation/motifs/executable-successor-motif-program.ts";
import type {
  KpRegisteredSuccessorSynthesisBinding
} from "../animation/successor-synthesis-presentation-plan.ts";
import type {
  KpNativeKatexSuccessorSynthesisIntent
} from "../rendering/native-katex-successor-synthesis.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  resolveKpExecutableSuccessorMotifProgramRoute,
  type KpExecutableSuccessorMotifProgramRoute
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import {
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationTransitionPlan
} from "../reader/renderers/equation-render-plan.ts";

const kpOperationEvaluationCallerConformanceAuthority = Symbol(
  "kp.operation-evaluation-caller-conformance"
);
const verifiedCallerConformanceManifests = new WeakSet<object>();

const expectedCallers = Object.freeze([
  Object.freeze({
    animationId: kpOnePlusTwoEvaluationAnimationId,
    reference:
      kpOperationEvaluationContinuityReference.requiredConformanceCallers[0]!
  }),
  Object.freeze({
    animationId: kpFivePlusTwoEvaluationAnimationId,
    reference:
      kpOperationEvaluationContinuityReference.requiredConformanceCallers[1]!
  }),
  Object.freeze({
    animationId: kpThreeSixthsEvaluationAnimationId,
    reference:
      kpOperationEvaluationContinuityReference.requiredConformanceCallers[2]!
  })
] as const);

export type KpOperationEvaluationCallerAssetCohort = readonly [
  KpAnimationAsset,
  KpAnimationAsset,
  KpAnimationAsset
];

export interface KpOperationEvaluationPhaseFidelityEvidence {
  readonly phaseId: string;
  readonly effect: string;
  readonly requiredRoles: readonly string[];
  readonly executionOrdinal: number;
  readonly sampledActivePhaseId: string;
}

export interface KpOperationEvaluationCallerConformanceEntry {
  readonly referenceCallerId: string;
  readonly animationId: string;
  readonly transformationId: string;
  readonly transformationKind: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly semanticOperationId: string;
  readonly presentationId: string;
  readonly materialInputAnnotationIds: readonly string[];
  readonly catalystAnnotationIds: readonly string[];
  readonly resultAnnotationIds: readonly string[];
  readonly lineageSourceAnnotationIds: readonly string[];
  readonly lineageTargetAnnotationIds: readonly string[];
  readonly contextAuthority: "preserve-unclaimed-context";
  readonly continuity: {
    readonly topology: "bounded-semantic-contact-co-presence";
    readonly nonZeroPaint: "opaque";
    readonly endpointSettlement: "native-source-and-target";
    readonly visibilityKind: "continuous-visible-ink";
    readonly minimumVisibleInkRatio: number;
  };
  readonly forwardPhases:
    readonly KpOperationEvaluationPhaseFidelityEvidence[];
  readonly rewindPhases:
    readonly KpOperationEvaluationPhaseFidelityEvidence[];
}

export interface KpOperationEvaluationCallerConformanceManifest {
  readonly schemaVersion:
    "kp.operation-evaluation-caller-conformance.v1";
  readonly kind: "operation-evaluation-caller-conformance";
  readonly callerCount: 3;
  readonly program: KpVerifiedExecutableSuccessorMotifProgram & {
    readonly kind: "operation-evaluation";
  };
  readonly route: KpExecutableSuccessorMotifProgramRoute & {
    readonly programKind: "operation-evaluation";
    readonly primitiveRoute: "native-katex-successor-synthesis";
  };
  readonly sharedCompilerAuthority: {
    readonly planCompilerId: string;
    readonly planCompilerVersion: string;
    readonly executableProgramCompilerId: string;
    readonly executableProgramCompilerVersion: string;
    readonly paintContinuityCompilerId: string;
    readonly paintContinuityCompilerVersion: string;
  };
  readonly callers:
    readonly [
      KpOperationEvaluationCallerConformanceEntry,
      KpOperationEvaluationCallerConformanceEntry,
      KpOperationEvaluationCallerConformanceEntry
    ];
  readonly unsupportedFallback: {
    readonly resolutionStatus: "unknown-operation";
    readonly planKind: "explicit-static-checkpoint";
    readonly reason: "unsupported-presentation";
  };
  readonly [kpOperationEvaluationCallerConformanceAuthority]: true;
}

/**
 * The stable manifest is regenerated from the actual semantic assets, reader
 * plans, registry compilers, and exhaustive adapter. Names and prior snapshots
 * are deliberately insufficient because they cannot exercise those mints.
 */
export function generateKpOperationEvaluationCallerConformanceManifest():
KpOperationEvaluationCallerConformanceManifest {
  return certifyKpOperationEvaluationCallerCohort([
    createKpOnePlusTwoEvaluationAnimationAsset(),
    createKpFivePlusTwoEvaluationAnimationAsset(),
    createKpThreeSixthsEvaluationAnimationAsset()
  ]);
}

export function certifyKpOperationEvaluationCallerCohort(
  assets: KpOperationEvaluationCallerAssetCohort
): KpOperationEvaluationCallerConformanceManifest {
  requireExactCallerCohort(assets);
  const program = kpOperationEvaluationExecutableProgramCompiler.program;
  if (program.kind !== "operation-evaluation") {
    throw new Error(
      "Operation-evaluation conformance requires its exact program variant."
    );
  }
  const route = resolveKpExecutableSuccessorMotifProgramRoute(program);
  if (
    route.programKind !== "operation-evaluation" ||
    route.primitiveRoute !== "native-katex-successor-synthesis"
  ) {
    throw new Error(
      "Operation-evaluation conformance requires the exhaustive native route."
    );
  }
  const operationRoute =
    route as KpOperationEvaluationCallerConformanceManifest["route"];

  const callers = assets.map((asset, index) =>
    compileCallerEvidence({
      asset,
      expected: expectedCallers[index]!,
      program,
      route: operationRoute
    })
  ) as [
    KpOperationEvaluationCallerConformanceEntry,
    KpOperationEvaluationCallerConformanceEntry,
    KpOperationEvaluationCallerConformanceEntry
  ];
  const unsupported = resolveKpOperationEvaluationPresentationRoute({
    transformationId:
      "transform.operation-evaluation.conformance.unsupported",
    transformationKind: "unsupportedOperationEvaluation",
    semanticOperationId: "kp.arithmetic.unsupported"
  });
  if (
    unsupported.status !== "explicit-static" ||
    unsupported.resolutionStatus !== "unknown-operation" ||
    unsupported.checkpoint.kind !== "explicit-static-checkpoint" ||
    unsupported.checkpoint.reason !== "unsupported-presentation"
  ) {
    throw new Error(
      "Unknown operation evaluation must remain an explicit static checkpoint."
    );
  }

  const manifest = Object.freeze({
    schemaVersion:
      "kp.operation-evaluation-caller-conformance.v1" as const,
    kind: "operation-evaluation-caller-conformance" as const,
    callerCount: 3 as const,
    program,
    route: operationRoute,
    sharedCompilerAuthority: Object.freeze({
      planCompilerId: kpSuccessorSynthesisPresentationPlanCompiler.id,
      planCompilerVersion:
        kpSuccessorSynthesisPresentationPlanCompiler.version,
      executableProgramCompilerId:
        kpOperationEvaluationExecutableProgramCompiler.id,
      executableProgramCompilerVersion:
        kpOperationEvaluationExecutableProgramCompiler.version,
      paintContinuityCompilerId:
        kpBoundedSemanticContactPaintContinuityCompiler.id,
      paintContinuityCompilerVersion:
        kpBoundedSemanticContactPaintContinuityCompiler.version
    }),
    callers: Object.freeze(callers) as
      KpOperationEvaluationCallerConformanceManifest["callers"],
    unsupportedFallback: Object.freeze({
      resolutionStatus: unsupported.resolutionStatus,
      planKind: unsupported.checkpoint.kind,
      reason: unsupported.checkpoint.reason
    }),
    [kpOperationEvaluationCallerConformanceAuthority]: true as const
  });
  verifiedCallerConformanceManifests.add(manifest);
  return manifest;
}

export function isKpOperationEvaluationCallerConformanceManifest(
  value: unknown
): value is KpOperationEvaluationCallerConformanceManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedCallerConformanceManifests.has(value)
  );
}

function compileCallerEvidence(input: {
  readonly asset: KpAnimationAsset;
  readonly expected: typeof expectedCallers[number];
  readonly program:
    KpOperationEvaluationCallerConformanceManifest["program"];
  readonly route:
    KpOperationEvaluationCallerConformanceManifest["route"];
}): KpOperationEvaluationCallerConformanceEntry {
  const forward = compileDirection(input.asset, "forward");
  const rewind = compileDirection(input.asset, "rewind");
  const transition = forward.transition;
  const binding = forward.binding;
  const sourceLatex = requireSingleLatex(transition.source, "source");
  const targetLatex = requireSingleLatex(transition.target, "target");
  if (
    sourceLatex !== input.expected.reference.sourceLatex ||
    targetLatex !== input.expected.reference.targetLatex ||
    transition.transformType !==
      input.expected.reference.transformationKind
  ) {
    throw new Error(
      `Caller ${input.asset.id} no longer matches its frozen semantic reference.`
    );
  }
  if (
    forward.program !== input.program ||
    rewind.program !== input.program ||
    forward.execution.route !== input.route ||
    rewind.execution.route !== input.route
  ) {
    throw new Error(
      `Caller ${input.asset.id} did not use the shared program and adapter route.`
    );
  }
  if (
    forward.binding.continuityProgram !==
      kpBoundedSemanticContactPaintContinuityCompiler.continuityProgram ||
    rewind.binding.continuityProgram !== forward.binding.continuityProgram ||
    forward.execution.continuityProgram !==
      forward.binding.continuityProgram ||
    rewind.execution.continuityProgram !== forward.binding.continuityProgram
  ) {
    throw new Error(
      `Caller ${input.asset.id} did not use the shared continuity program.`
    );
  }

  const registryRoute = resolveKpOperationEvaluationPresentationRoute({
    transformationId: transition.id,
    transformationKind: transition.transformType,
    semanticOperationId: binding.authority.operationId
  });
  if (
    registryRoute.status !== "resolved" ||
    registryRoute.certificate.planCompiler.id !==
      kpSuccessorSynthesisPresentationPlanCompiler.id ||
    registryRoute.certificate.planCompiler.version !==
      kpSuccessorSynthesisPresentationPlanCompiler.version ||
    registryRoute.certificate.executableProgramCompiler.id !==
      kpOperationEvaluationExecutableProgramCompiler.id ||
    registryRoute.certificate.executableProgramCompiler.version !==
      kpOperationEvaluationExecutableProgramCompiler.version ||
    registryRoute.certificate.executableProgramCompiler.program !==
      input.program ||
    registryRoute.certificate.paintContinuityCompiler.id !==
      kpBoundedSemanticContactPaintContinuityCompiler.id ||
    registryRoute.certificate.paintContinuityCompiler.version !==
      kpBoundedSemanticContactPaintContinuityCompiler.version ||
    registryRoute.certificate.paintContinuityCompiler.continuityProgram !==
      forward.binding.continuityProgram
  ) {
    throw new Error(
      `Caller ${input.asset.id} did not resolve the shared compiler authority.`
    );
  }

  const roleAndLineage = certifyRoleAndLineageCoverage({
    animationId: input.asset.id,
    transition,
    binding
  });
  const continuity = binding.continuityProgram;
  const paint = binding.paintContinuityPlan;
  if (
    continuity.topology !== "bounded-semantic-contact-co-presence" ||
    continuity.visibility.kind !== "continuous-visible-ink" ||
    paint.nonZeroPaint !== "opaque" ||
    paint.endpointSettlement !== "native-source-and-target" ||
    paint.carriers.length === 0 ||
    paint.carriers.some(({ transferTopology }) =>
      transferTopology !== "bounded-semantic-contact-co-presence"
    )
  ) {
    throw new Error(
      `Caller ${input.asset.id} did not preserve perceptual continuity.`
    );
  }

  return Object.freeze({
    referenceCallerId: input.expected.reference.id,
    animationId: input.asset.id,
    transformationId: transition.id,
    transformationKind: transition.transformType,
    sourceLatex,
    targetLatex,
    semanticOperationId: binding.authority.operationId,
    presentationId: registryRoute.certificate.presentationId,
    ...roleAndLineage,
    contextAuthority: input.program.context.policy,
    continuity: Object.freeze({
      topology: continuity.topology,
      nonZeroPaint: paint.nonZeroPaint,
      endpointSettlement: paint.endpointSettlement,
      visibilityKind: continuity.visibility.kind,
      minimumVisibleInkRatio:
        continuity.visibility.minimumVisibleInkRatio
    }),
    forwardPhases: certifyPhaseFidelity(
      input.asset.id,
      input.program,
      forward.execution,
      "forward"
    ),
    rewindPhases: certifyPhaseFidelity(
      input.asset.id,
      input.program,
      rewind.execution,
      "rewind"
    )
  });
}

function compileDirection(
  asset: KpAnimationAsset,
  direction: "forward" | "rewind"
) {
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation: asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset,
      direction,
      progress: 0.5
    })
  });
  if (
    renderPlan.diagnostics.length > 0 ||
    renderPlan.transitions.length !== 1
  ) {
    throw new Error(
      `Caller ${asset.id} did not compile exactly one reader transition.`
    );
  }
  const transition = renderPlan.transitions[0]!;
  if (
    transition.semanticStatus !== "ready" ||
    transition.presentationPlan.planKind !== "successor-synthesis" ||
    transition.presentationPlan.successorSyntheses.length !== 1
  ) {
    throw new Error(
      `Caller ${asset.id} requires one semantic successor synthesis.`
    );
  }
  const program = transition.presentationPlan.executableProgram;
  if (program.kind !== "operation-evaluation") {
    throw new Error(
      `Caller ${asset.id} resolved a non-evaluation program.`
    );
  }
  const binding = transition.presentationPlan.successorSyntheses[0]!;
  const intent = {
    binding,
    direction,
    motion: "full"
  } satisfies KpNativeKatexSuccessorSynthesisIntent;
  const execution = compileKpExecutableSuccessorMotifProgramAdapter({
    kind: "operation-evaluation",
    program,
    direction,
    primitive: {
      kind: "native-katex-successor-synthesis",
      intents: [intent]
    }
  });
  if (execution.programKind !== "operation-evaluation") {
    throw new Error(
      `Caller ${asset.id} did not compile the evaluation adapter variant.`
    );
  }
  return { transition, binding, program, execution };
}

function certifyRoleAndLineageCoverage(input: {
  readonly animationId: string;
  readonly transition: KpReaderEquationTransitionPlan;
  readonly binding: KpRegisteredSuccessorSynthesisBinding;
}) {
  const sourceSelectorIds = input.transition.source.flatMap(({ selectors }) =>
    selectors.map(({ id }) => id)
  );
  const targetSelectorIds = input.transition.target.flatMap(({ selectors }) =>
    selectors.map(({ id }) => id)
  );
  const boundSourceSelectorIds = input.binding.sourceAnnotations.flatMap(
    ({ selectorIds }) => selectorIds
  );
  const boundTargetSelectorIds = input.binding.targetAnnotations.flatMap(
    ({ selectorIds }) => selectorIds
  );
  requireSameUniqueSet(
    sourceSelectorIds,
    boundSourceSelectorIds,
    `${input.animationId} source role coverage`
  );
  requireSameUniqueSet(
    targetSelectorIds,
    boundTargetSelectorIds,
    `${input.animationId} target role coverage`
  );

  const materialInputAnnotationIds = input.binding.sourceAnnotations
    .filter(({ contribution }) => contribution === "material-input")
    .map(({ id }) => id);
  const catalystAnnotationIds = input.binding.sourceAnnotations
    .filter(({ contribution }) => contribution === "catalyst")
    .map(({ id }) => id);
  const resultAnnotationIds = input.binding.targetAnnotations.map(
    ({ id }) => id
  );
  if (
    materialInputAnnotationIds.length === 0 ||
    catalystAnnotationIds.length === 0 ||
    resultAnnotationIds.length === 0 ||
    input.binding.sourceAnnotations.some(
      ({ semanticRole }) => semanticRole.trim().length === 0
    ) ||
    input.binding.targetAnnotations.some(
      ({ semanticRole }) => semanticRole.trim().length === 0
    )
  ) {
    throw new Error(
      `Caller ${input.animationId} has incomplete semantic role coverage.`
    );
  }

  const lineageSourceAnnotationIds = input.binding.lineages.flatMap(
    ({ sourceAnnotationIds }) => sourceAnnotationIds
  );
  const lineageTargetAnnotationIds = input.binding.lineages.flatMap(
    ({ targetAnnotationIds }) => targetAnnotationIds
  );
  requireSameUniqueSet(
    materialInputAnnotationIds,
    lineageSourceAnnotationIds,
    `${input.animationId} material lineage`
  );
  requireSameUniqueSet(
    resultAnnotationIds,
    lineageTargetAnnotationIds,
    `${input.animationId} result lineage`
  );
  if (
    catalystAnnotationIds.some((id) =>
      lineageSourceAnnotationIds.includes(id)
    )
  ) {
    throw new Error(
      `Caller ${input.animationId} placed a catalyst in material lineage.`
    );
  }

  return {
    materialInputAnnotationIds: Object.freeze(materialInputAnnotationIds),
    catalystAnnotationIds: Object.freeze(catalystAnnotationIds),
    resultAnnotationIds: Object.freeze(resultAnnotationIds),
    lineageSourceAnnotationIds:
      Object.freeze(lineageSourceAnnotationIds),
    lineageTargetAnnotationIds:
      Object.freeze(lineageTargetAnnotationIds)
  };
}

function certifyPhaseFidelity(
  animationId: string,
  program: KpOperationEvaluationCallerConformanceManifest["program"],
  execution: ReturnType<
    typeof compileKpExecutableSuccessorMotifProgramAdapter
  > & { readonly programKind: "operation-evaluation" },
  direction: "forward" | "rewind"
): readonly KpOperationEvaluationPhaseFidelityEvidence[] {
  const phases = direction === "forward"
    ? [...program.phases]
    : [...program.phases].reverse();
  const expectedIds = phases.map(({ id }) => id);
  if (
    execution.direction !== direction ||
    !sameOrderedValues(execution.phaseOrder, expectedIds)
  ) {
    throw new Error(
      `Caller ${animationId} has ${direction} adapter phase drift.`
    );
  }
  return Object.freeze(phases.map((phase, executionOrdinal) => {
    const progress = (executionOrdinal + 0.5) / phases.length;
    const telemetry = execution.samplePhaseTelemetry(progress);
    const sampled = telemetry.phases[executionOrdinal];
    if (
      telemetry.activePhaseId !== phase.id ||
      sampled?.id !== phase.id ||
      sampled.effect !== phase.effect ||
      sampled.executionOrdinal !== executionOrdinal ||
      !sameOrderedValues(sampled.requiredRoles, phase.requiredRoles)
    ) {
      throw new Error(
        `Caller ${animationId} lacks positive ${direction} phase fidelity ` +
        `for ${phase.id}.`
      );
    }
    return Object.freeze({
      phaseId: phase.id,
      effect: phase.effect,
      requiredRoles: Object.freeze([...phase.requiredRoles]),
      executionOrdinal,
      sampledActivePhaseId: telemetry.activePhaseId
    });
  }));
}

function requireExactCallerCohort(
  assets: KpOperationEvaluationCallerAssetCohort
): void {
  const ids = assets.map(({ id }) => id);
  const expectedIds = expectedCallers.map(({ animationId }) => animationId);
  if (!sameOrderedValues(ids, expectedIds) || new Set(ids).size !== 3) {
    throw new Error(
      "Operation-evaluation conformance requires the ordered canonical " +
      "1+2, 5+2, and 3/6 caller cohort."
    );
  }
}

function requireSingleLatex(
  states: KpReaderEquationTransitionPlan["source"],
  side: "source" | "target"
): string {
  if (states.length !== 1 || states[0]?.latex === undefined) {
    throw new Error(
      `Operation-evaluation conformance requires one ${side} equation state.`
    );
  }
  return states[0].latex;
}

function requireSameUniqueSet(
  expected: readonly string[],
  actual: readonly string[],
  label: string
): void {
  if (
    new Set(expected).size !== expected.length ||
    new Set(actual).size !== actual.length ||
    expected.length !== actual.length ||
    expected.some((id) => !actual.includes(id))
  ) {
    throw new Error(`${label} must be total, unique, and exact.`);
  }
}

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

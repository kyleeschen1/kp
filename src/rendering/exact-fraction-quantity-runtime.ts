import type {
  KpAnimationRuntimeClock
} from "../animation/runtime-sampler.ts";
import {
  createKpExactFractionQuantityPresentationPlan,
  sampleKpExactQuantityVisibleOperation,
  type KpExactFractionQuantityPresentationPlan,
  type KpExactQuantityMotifInvocation,
  type KpExactQuantityVisibleOperationFrame
} from "../animation/exact-fraction-quantity-presentation-plan.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  compileKpFissionFusionPlan,
  sampleKpFissionFusion,
  type KpFissionFusionFrame,
  type KpFissionFusionPlan
} from "../animation/fission-fusion.ts";
import {
  projectKpExactFractionQuantityBar
} from "./exact-fraction-quantity-bar-projection.ts";
import {
  projectKpExactFractionQuantityCircle
} from "./exact-fraction-quantity-circle-projection.ts";
import {
  projectKpExactFractionQuantityNumberLine
} from "./exact-fraction-quantity-number-line-projection.ts";
import {
  certifyKpExactFractionQuantitySynchronizedFrame,
  type KpExactFractionQuantitySynchronizedFrame
} from "./exact-fraction-quantity-synchronized-projection.ts";
import {
  createKpExactFractionQuantitySymbolicProjection,
  type KpExactFractionQuantitySymbolicProjection,
  type KpExactOpaqueSuccessorSynthesisBinding,
  type KpExactFractionSymbolicMotionSegment
} from "./exact-fraction-quantity-symbolic-projection.ts";
import {
  createKpExactFractionQuantityAccessibleProjection,
  type KpExactFractionQuantityAccessibleProjection
} from "./exact-fraction-quantity-accessible-projection.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch,
  type KpExecutableSuccessorMotifProgramRoute
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import {
  createKpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import type {
  KpVerifiedIdentityFissionExecutableProgram
} from "../animation/motifs/identity-fission-executable-program.ts";

declare const kpExactFractionQuantityRuntimeSessionBrand: unique symbol;

const sealedRuntimeSessions = new WeakSet<object>();

type KpIdentityFissionProgramExecution = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "identity-fission" }
>;

interface KpExactFractionQuantityIdentityFissionExecutions {
  readonly program: KpVerifiedIdentityFissionExecutableProgram;
  readonly route: KpExecutableSuccessorMotifProgramRoute & {
    readonly programKind: "identity-fission";
    readonly primitiveRoute: "fission-fusion:fission";
  };
  readonly concrete: {
    readonly forward: KpIdentityFissionProgramExecution;
    readonly rewind: KpIdentityFissionProgramExecution;
  };
  readonly symbolic: readonly {
    readonly segmentId: string;
    readonly forward: readonly [
      KpIdentityFissionProgramExecution,
      ...KpIdentityFissionProgramExecution[]
    ];
    readonly rewind: readonly [
      KpIdentityFissionProgramExecution,
      ...KpIdentityFissionProgramExecution[]
    ];
  }[];
}

export type KpExactFractionQuantityRuntimeClock =
  Pick<KpAnimationRuntimeClock, "direction" | "progress">;

export interface KpExactFractionQuantityRuntimeSession {
  readonly schemaVersion: "kp.exact-fraction-quantity-runtime-session.v1";
  readonly id: "runtime-session.exact-fraction-quantity.third-plus-sixth";
  readonly rendererSessionId:
    "renderer-session.exact-fraction-quantity.third-plus-sixth";
  readonly rendererSessionCount: 1;
  readonly clockAuthority: "shared-animation-runtime-clock";
  readonly trace: KpExactFractionQuantityTrace;
  readonly symbolic: KpExactFractionQuantitySymbolicProjection;
  readonly accessibility: KpExactFractionQuantityAccessibleProjection;
  readonly presentation: KpExactFractionQuantityPresentationPlan;
  readonly identityFission:
    KpExactFractionQuantityIdentityFissionExecutions;
  readonly [kpExactFractionQuantityRuntimeSessionBrand]: true;
}

export interface KpExactFractionQuantityViewPaintOwnership {
  readonly view:
    | "symbolic"
    | "partitioned-circle"
    | "fraction-bar"
    | "number-line";
  readonly owner:
    | "native-katex"
    | "native-svg"
    | "shared-transient-paint";
  readonly nativeOpacity: 0 | 1;
  readonly transientOpacity: 0 | 1;
}

export interface KpExactFractionQuantityRuntimeFrame {
  readonly schemaVersion: "kp.exact-fraction-quantity-runtime-frame.v1";
  readonly sessionId: KpExactFractionQuantityRuntimeSession["id"];
  readonly rendererSessionId:
    KpExactFractionQuantityRuntimeSession["rendererSessionId"];
  readonly clock: KpExactFractionQuantityRuntimeClock;
  readonly projection: KpExactFractionQuantitySynchronizedFrame;
  readonly presentationBeatId: string;
  readonly visibleOperation: KpExactQuantityVisibleOperationFrame;
  readonly symbolicMotion: {
    readonly segment: KpExactFractionSymbolicMotionSegment;
    readonly segmentProgress: number;
    readonly dispatch:
      KpExactQuantityMotifInvocation["symbolicDispatches"][number];
    readonly identityFissionExecutions?:
      readonly [
        KpIdentityFissionProgramExecution,
        ...KpIdentityFissionProgramExecution[]
      ] | undefined;
  };
  readonly identityFission?: {
    readonly programId: string;
    readonly programVersion: string;
    readonly primitiveRoute: "fission-fusion:fission";
    readonly programProgress: number;
    readonly concreteExecution: KpIdentityFissionProgramExecution;
    readonly symbolicExecutions:
      readonly KpIdentityFissionProgramExecution[];
  } | undefined;
  readonly motifFrame?: KpFissionFusionFrame | undefined;
  readonly ownershipPhase:
    | "source-native"
    | "transient"
    | "target-native";
  readonly viewPaintOwnership:
    readonly KpExactFractionQuantityViewPaintOwnership[];
  readonly settlementPolicy: "reuse-native-endpoint-geometry";
  readonly easingApplications: 1;
}

export function createKpExactFractionQuantityRuntimeSession():
KpExactFractionQuantityRuntimeSession {
  const trace = createKpExactFractionQuantityTrace();
  const symbolic = createKpExactFractionQuantitySymbolicProjection(trace);
  const presentation = createKpExactFractionQuantityPresentationPlan(trace);
  const identityFission = compileIdentityFissionExecutions({
    symbolic,
    presentation
  });
  const session = Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-runtime-session.v1",
    id: "runtime-session.exact-fraction-quantity.third-plus-sixth",
    rendererSessionId:
      "renderer-session.exact-fraction-quantity.third-plus-sixth",
    rendererSessionCount: 1 as const,
    clockAuthority: "shared-animation-runtime-clock" as const,
    trace,
    symbolic,
    accessibility: createKpExactFractionQuantityAccessibleProjection({
      trace,
      symbolic
    }),
    presentation,
    identityFission
  });
  sealedRuntimeSessions.add(session);
  return session as KpExactFractionQuantityRuntimeSession;
}

export function isKpExactFractionQuantityRuntimeSession(
  value: unknown
): value is KpExactFractionQuantityRuntimeSession {
  return typeof value === "object" &&
    value !== null &&
    sealedRuntimeSessions.has(value);
}

export function sampleKpExactFractionQuantityRuntime(input: {
  readonly session: KpExactFractionQuantityRuntimeSession;
  readonly clock: KpExactFractionQuantityRuntimeClock;
}): KpExactFractionQuantityRuntimeFrame {
  if (!isKpExactFractionQuantityRuntimeSession(input.session)) {
    throw new Error(
      "Exact-fraction runtime requires its sealed canonical session."
    );
  }
  const progress = normalizeProgress(input.clock.progress);
  // Direction is control intent, not a second semantic coordinate. Both play
  // directions sample the identical absolute frame, eliminating rewind-only
  // geometry and endpoint history.
  const neutralFrame = sampleKpExactFractionQuantityNeutralFrame({
    progress,
    direction: "forward",
    trace: input.session.trace
  });
  const projection = certifyKpExactFractionQuantitySynchronizedFrame({
    trace: input.session.trace,
    neutralFrame,
    symbolic: input.session.symbolic,
    circle: projectKpExactFractionQuantityCircle(neutralFrame),
    bar: projectKpExactFractionQuantityBar(neutralFrame),
    numberLine: projectKpExactFractionQuantityNumberLine(neutralFrame)
  });
  const presentationBeat =
    input.session.presentation.beats[neutralFrame.beat.index];
  if (
    presentationBeat === undefined ||
    presentationBeat.beatId !== neutralFrame.beat.id
  ) {
    throw new Error(
      "Exact-fraction runtime presentation is detached from its sampled beat."
    );
  }
  const visibleOperation = sampleKpExactQuantityVisibleOperation({
    beat: presentationBeat,
    localProgress: neutralFrame.beat.localProgress
  });
  const sampledSymbolicMotion = sampleSymbolicMotion(
    input.session.symbolic.motionInputs[neutralFrame.beat.index]!.segments,
    visibleOperation.actionProgress,
    presentationBeat.execution
  );
  const symbolicIdentityFission =
    input.session.identityFission.symbolic.find(
      ({ segmentId }) =>
        segmentId === sampledSymbolicMotion.segment.id
    );
  const symbolicMotion = Object.freeze({
    ...sampledSymbolicMotion,
    ...(sampledSymbolicMotion.dispatch === "identity-fission"
      ? {
          identityFissionExecutions:
            symbolicIdentityFission?.forward
        }
      : {})
  });
  if (
    sampledSymbolicMotion.dispatch === "identity-fission" &&
    symbolicIdentityFission === undefined
  ) {
    throw new Error(
      "Symbolic identity fission lacks compiled program executions."
    );
  }
  const expectedAtomicDispatch =
    presentationBeat.motif.kind === "partition-refinement"
      ? "fission"
      : presentationBeat.motif.kind === "part-merge"
        ? "fusion"
        : presentationBeat.motif.motifId === "focus-continuant"
          ? "focus"
          : presentationBeat.motif.motifId === "group-continuants"
            ? "group"
            : "structural-succession";
  if (presentationBeat.execution.atomicDispatch !== expectedAtomicDispatch) {
    throw new Error(
      "Exact-fraction executable motif diverges from its atomic renderer."
    );
  }
  const motifFrame = presentationBeat.motif.kind === "partition-refinement"
    ? sampleKpFissionFusion({
        plan: presentationBeat.motif.fissionPlan,
        progress: requireIdentityFissionProgramProgress(visibleOperation)
      })
    : presentationBeat.motif.kind === "part-merge"
      ? sampleKpFissionFusion({
          plan: presentationBeat.motif.fusionPlan,
          progress: visibleOperation.actionProgress
        })
      : undefined;
  const identityFission =
    presentationBeat.motif.kind === "partition-refinement"
      ? Object.freeze({
          programId: input.session.identityFission.program.id,
          programVersion:
            input.session.identityFission.program.programVersion,
          primitiveRoute:
            input.session.identityFission.route.primitiveRoute,
          programProgress:
            requireIdentityFissionProgramProgress(visibleOperation),
          concreteExecution:
            input.session.identityFission.concrete.forward,
          symbolicExecutions:
            symbolicIdentityFission?.forward ?? Object.freeze([])
        })
      : undefined;
  const ownershipPhase = visibleOperation.actionProgress === 0
    ? "source-native"
    : visibleOperation.actionProgress === 1
      ? "target-native"
      : "transient";
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-runtime-frame.v1",
    sessionId: input.session.id,
    rendererSessionId: input.session.rendererSessionId,
    clock: Object.freeze({
      direction: input.clock.direction,
      progress
    }),
    projection,
    presentationBeatId: presentationBeat.beatId,
    visibleOperation,
    symbolicMotion,
    ...(motifFrame === undefined ? {} : { motifFrame }),
    ...(identityFission === undefined ? {} : { identityFission }),
    ownershipPhase,
    viewPaintOwnership: createViewPaintOwnership(ownershipPhase),
    settlementPolicy: "reuse-native-endpoint-geometry",
    easingApplications: 1
  });
}

function sampleSymbolicMotion(
  segments: readonly KpExactFractionSymbolicMotionSegment[],
  actionProgress: number,
  execution: KpExactQuantityMotifInvocation
): KpExactFractionQuantityRuntimeFrame["symbolicMotion"] {
  if (segments.length === 0) {
    throw new Error("Exact-fraction symbolic beat requires a motion segment.");
  }
  if (execution.symbolicDispatches.length !== segments.length) {
    throw new Error(
      "Exact-fraction executable motif must dispatch every symbolic segment."
    );
  }
  const scaled = actionProgress * segments.length;
  const index = actionProgress === 1
    ? segments.length - 1
    : Math.min(segments.length - 1, Math.floor(scaled));
  const segmentProgress = actionProgress === 1
    ? 1
    : scaled - index;
  const segment = segments[index]!;
  const dispatch = execution.symbolicDispatches[index]!;
  const successorBacked =
    dispatch === "opaque-successor" ||
    dispatch === "identity-fission" ||
    dispatch === "operation-evaluation";
  if (
    successorBacked !==
      (segment.successorSyntheses.length > 0)
  ) {
    throw new Error(
      "Changed-glyph exact-quantity work must execute through its opaque " +
      "successor binding instead of degrading to native fades."
    );
  }
  if (
    dispatch === "identity-fission" &&
    (
      segment.successorSyntheses.length === 0 ||
      segment.successorSyntheses.some((binding) =>
        binding.motif !== "successor-synthesis" ||
        binding.authority.operationId !== "kp.core.fan-out" ||
        binding.sourceAnnotations.filter(
          ({ contribution }) => contribution === "material-input"
        ).length !== 1 ||
        binding.sourceAnnotations.some(
          ({ contribution }) => contribution === "catalyst"
        ) ||
        binding.targetAnnotations.length < 2
      )
    )
  ) {
    throw new Error(
      "Exact-fraction identity fission requires independent one-to-many " +
      "child lineage without catalyst material."
    );
  }
  if (
    dispatch === "operation-evaluation" &&
    (
      segment.successorSyntheses.length !== 1 ||
      segment.successorSyntheses[0]?.motif !== "operation-evaluation" ||
      segment.successorSyntheses[0]?.authority.operationId !==
        "kp.arithmetic.divide"
    )
  ) {
    throw new Error(
      "Exact-fraction division evaluation requires one typed arithmetic " +
      "evaluation binding; cancellation and generic replacement are invalid."
    );
  }
  if (
    (dispatch === "opaque-successor" ||
      dispatch === "identity-fission") &&
    segment.successorSyntheses.some(
      ({ motif }) => motif !== "successor-synthesis"
    )
  ) {
    throw new Error(
      "Exact-fraction successor dispatch cannot consume an operation-" +
      "evaluation binding."
    );
  }
  return Object.freeze({
    segment,
    segmentProgress,
    dispatch
  });
}

function compileIdentityFissionExecutions(input: {
  readonly symbolic: KpExactFractionQuantitySymbolicProjection;
  readonly presentation: KpExactFractionQuantityPresentationPlan;
}): KpExactFractionQuantityIdentityFissionExecutions {
  const refinement = input.presentation.beats.find(
    ({ motif }) => motif.kind === "partition-refinement"
  );
  if (refinement?.motif.kind !== "partition-refinement") {
    throw new Error(
      "Exact-fraction runtime requires one partition-refinement beat."
    );
  }
  const program = refinement.motif.executableProgram;
  const concreteForward = compileIdentityFissionProgram({
    program,
    plan: refinement.motif.fissionPlan,
    direction: "forward"
  });
  const concreteRewind = compileIdentityFissionProgram({
    program,
    plan: refinement.motif.fissionPlan,
    direction: "rewind"
  });
  const symbolic = input.symbolic.motionInputs.flatMap((motionInput) => {
    const beat = input.presentation.beats.find(
      ({ beatId }) => beatId === motionInput.beatId
    );
    if (beat === undefined) {
      throw new Error(
        `Symbolic motion ${motionInput.beatId} lacks a presentation beat.`
      );
    }
    if (
      beat.execution.symbolicDispatches.length !==
      motionInput.segments.length
    ) {
      throw new Error(
        `Symbolic motion ${motionInput.beatId} has dispatch drift.`
      );
    }
    return motionInput.segments.flatMap((segment, index) => {
      if (
        beat.execution.symbolicDispatches[index] !== "identity-fission"
      ) return [];
      const plans = segment.successorSyntheses.map((binding) =>
        compileSymbolicFissionPlan(segment.id, binding)
      );
      if (plans.length === 0) {
        throw new Error(
          `Symbolic identity fission ${segment.id} has no child lineage.`
        );
      }
      return [Object.freeze({
        segmentId: segment.id,
        forward: Object.freeze(plans.map((plan) =>
          compileIdentityFissionProgram({
            program,
            plan,
            direction: "forward"
          })
        )) as KpExactFractionQuantityIdentityFissionExecutions[
          "symbolic"
        ][number]["forward"],
        rewind: Object.freeze(plans.map((plan) =>
          compileIdentityFissionProgram({
            program,
            plan,
            direction: "rewind"
          })
        )) as KpExactFractionQuantityIdentityFissionExecutions[
          "symbolic"
        ][number]["rewind"]
      })];
    });
  });
  if (symbolic.length === 0) {
    throw new Error(
      "Exact-fraction symbolic projection did not compile identity fission."
    );
  }
  return Object.freeze({
    program,
    route: concreteForward.route as
      KpExactFractionQuantityIdentityFissionExecutions["route"],
    concrete: Object.freeze({
      forward: concreteForward,
      rewind: concreteRewind
    }),
    symbolic: Object.freeze(symbolic)
  });
}

function compileSymbolicFissionPlan(
  segmentId: string,
  binding: KpExactOpaqueSuccessorSynthesisBinding
): KpFissionFusionPlan {
  const material = binding.sourceAnnotations.filter(
    ({ contribution }) => contribution === "material-input"
  );
  const catalysts = binding.sourceAnnotations.filter(
    ({ contribution }) => contribution === "catalyst"
  );
  // Annotation identities stay distinct even when native source paint persists
  // inside one child. Selector IDs would manufacture a split cycle and merge
  // otherwise independent descendants before the renderer sees them.
  const sourceEntityIds = material.map(({ id }) => id);
  const targetEntityIds = binding.targetAnnotations.map(({ id }) => id);
  const lineageSourceIds = binding.lineages.flatMap(
    ({ sourceAnnotationIds }) => sourceAnnotationIds
  );
  const lineageTargetIds = binding.lineages.flatMap(
    ({ targetAnnotationIds }) => targetAnnotationIds
  );
  if (
    sourceEntityIds.length !== 1 ||
    targetEntityIds.length < 2 ||
    catalysts.length !== 0 ||
    !sameUniqueSet(
      material.map(({ id }) => id),
      lineageSourceIds
    ) ||
    !sameUniqueSet(
      binding.targetAnnotations.map(({ id }) => id),
      lineageTargetIds
    )
  ) {
    throw new Error(
      `Symbolic identity fission ${binding.id} requires one source, ` +
      "independent descendants, and total catalyst-free lineage."
    );
  }
  return compileKpFissionFusionPlan({
    id: `motion.${segmentId}.${binding.id}.identity-fission`,
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: `lineage.${segmentId}.${binding.id}.identity-fission`,
      sourceEntityIds,
      targetEntityIds,
      edges: [{
        id: `lineage-edge.${segmentId}.${binding.id}.identity-fission`,
        relation: "split",
        sourceEntityIds,
        targetEntityIds,
        summary:
          "One symbolic identity establishes its independently tracked " +
          "refinement descendants."
      }]
    }),
    semanticOrder: targetEntityIds,
    microStaggerSpan: 0,
    junctionScale: 1
  });
}

function compileIdentityFissionProgram(input: {
  readonly program: KpVerifiedIdentityFissionExecutableProgram;
  readonly plan: KpFissionFusionPlan;
  readonly direction: "forward" | "rewind";
}): KpIdentityFissionProgramExecution {
  if (input.plan.mode !== "fission") {
    throw new Error("Identity-fission program requires a fission plan.");
  }
  const execution = compileKpExecutableSuccessorMotifProgramAdapter({
    kind: "identity-fission",
    program: input.program,
    direction: input.direction,
    primitive: {
      kind: "fission-fusion",
      plan: input.plan as KpFissionFusionPlan & {
        readonly mode: "fission";
      }
    }
  });
  if (
    execution.programKind !== "identity-fission" ||
    execution.route.primitiveRoute !== "fission-fusion:fission"
  ) {
    throw new Error(
      "Identity-fission program resolved a non-fission primitive route."
    );
  }
  return execution;
}

function requireIdentityFissionProgramProgress(
  operation: KpExactQuantityVisibleOperationFrame
): number {
  if (
    operation.programPhase?.kind !== "identity-fission-program-phase"
  ) {
    throw new Error(
      "Partition refinement lacks shared identity-fission program phase."
    );
  }
  return operation.programPhase.programProgress;
}

function sameUniqueSet(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.length === right.length &&
    left.every((id) => right.includes(id));
}

function createViewPaintOwnership(
  phase: KpExactFractionQuantityRuntimeFrame["ownershipPhase"]
): readonly KpExactFractionQuantityViewPaintOwnership[] {
  const transient = phase === "transient";
  return Object.freeze(([
    ["symbolic", "native-katex"],
    ["partitioned-circle", "native-svg"],
    ["fraction-bar", "native-svg"],
    ["number-line", "native-svg"]
  ] as const).map(([view, nativeOwner]) => Object.freeze({
    view,
    owner: transient ? "shared-transient-paint" : nativeOwner,
    nativeOpacity: transient ? 0 as const : 1 as const,
    transientOpacity: transient ? 1 as const : 0 as const
  })));
}

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Exact-fraction runtime progress must be finite.");
  }
  return Math.max(0, Math.min(1, progress));
}

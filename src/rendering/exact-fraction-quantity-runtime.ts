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
  sampleKpFissionFusion,
  type KpFissionFusionFrame
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

declare const kpExactFractionQuantityRuntimeSessionBrand: unique symbol;

const sealedRuntimeSessions = new WeakSet<object>();

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
  };
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
    presentation: createKpExactFractionQuantityPresentationPlan(trace)
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
  const symbolicMotion = sampleSymbolicMotion(
    input.session.symbolic.motionInputs[neutralFrame.beat.index]!.segments,
    visibleOperation.actionProgress,
    presentationBeat.execution
  );
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
        progress: visibleOperation.actionProgress
      })
    : presentationBeat.motif.kind === "part-merge"
      ? sampleKpFissionFusion({
          plan: presentationBeat.motif.fusionPlan,
          progress: visibleOperation.actionProgress
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
  return Object.freeze({
    segment: segments[index]!,
    segmentProgress,
    dispatch: execution.symbolicDispatches[index]!
  });
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

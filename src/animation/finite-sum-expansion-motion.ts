import {
  kpCanonicalFiniteSumExpansionPresentationPlan,
  type KpFiniteSumExpansionPresentationPlan,
  type KpFiniteSumPresentationWindow
} from "./finite-sum-expansion-presentation-plan.ts";

export type KpFiniteSumMotionMode = "full" | "reduced" | "static";

export interface KpFiniteSumExpansionMotionFrame {
  readonly kind: "finite-sum-expansion-motion-frame";
  readonly progress: number;
  readonly mode: KpFiniteSumMotionMode;
  readonly phase:
    | "source-hold"
    | "source-withdrawal"
    | "ordered-expansion"
    | "target-hold";
  readonly endpoint: "source" | "transition" | "target";
  readonly sourceScope: Readonly<{
    contractionProgress: number;
    presence: number;
  }>;
  readonly sourceReferencePresence: number;
  readonly instances: readonly Readonly<{
    ordinal: number;
    bodyTransitProgress: number;
    bodyPresence: number;
    referenceTransitProgress: number;
    referencePresence: number;
    precedingConnectorPresence: number;
  }>[];
}

/** Pure normalized-clock sampler; hosts may seek in any order without state. */
export function sampleKpFiniteSumExpansionMotion(
  progress: number,
  mode: KpFiniteSumMotionMode = "full",
  plan: KpFiniteSumExpansionPresentationPlan =
    kpCanonicalFiniteSumExpansionPresentationPlan
): KpFiniteSumExpansionMotionFrame {
  const boundedProgress = bounded(progress);
  if (mode === "static") {
    return staticFrame(boundedProgress, plan);
  }
  const sourceScopePresence = 1 - sampleWindow(
    plan.sourceScopeWithdrawal.presenceWindow,
    boundedProgress
  );
  const instances = plan.instances.map((instance) => {
    const bodyTransitProgress = sampleWindow(
      instance.bodyTransitWindow,
      boundedProgress
    );
    const connector = instance.precedingConnector;
    const referenceTransitProgress = sampleWindow(
      instance.referenceReceptionWindow,
      boundedProgress
    );
    return Object.freeze({
      ordinal: instance.ordinal,
      bodyTransitProgress,
      // Lineage-backed body paint arrives through motion, never a fade.
      bodyPresence: bodyTransitProgress === 0
        ? instance.ordinal === 0 && boundedProgress > 0 ? 1 : 0
        : 1,
      referenceTransitProgress,
      referencePresence: instance.referenceReception.kind ===
        "boundary-transfer" ? 1 : referenceTransitProgress,
      precedingConnectorPresence: connector === undefined
        ? 0
        : sampleWindow(connector.receptionWindow, boundedProgress)
    });
  });
  return Object.freeze({
    kind: "finite-sum-expansion-motion-frame" as const,
    progress: boundedProgress,
    mode,
    phase: phaseAt(boundedProgress, plan),
    endpoint: boundedProgress === 0
      ? "source" as const
      : boundedProgress === 1
        ? "target" as const
        : "transition" as const,
    sourceScope: Object.freeze({
      // Reduced motion keeps the semantic withdrawal but removes depth scale.
      contractionProgress: mode === "reduced"
        ? 0
        : sampleWindow(
            plan.sourceScopeWithdrawal.contractionWindow,
            boundedProgress
          ),
      presence: sourceScopePresence
    }),
    sourceReferencePresence: 1 - sampleWindow(
      plan.sourceReferenceWithdrawal.presenceWindow,
      boundedProgress
    ),
    instances: Object.freeze(instances)
  });
}

function staticFrame(
  progress: number,
  plan: KpFiniteSumExpansionPresentationPlan
): KpFiniteSumExpansionMotionFrame {
  const target = progress >= 0.5;
  return Object.freeze({
    kind: "finite-sum-expansion-motion-frame" as const,
    progress,
    mode: "static" as const,
    phase: target ? "target-hold" as const : "source-hold" as const,
    endpoint: target ? "target" as const : "source" as const,
    sourceScope: Object.freeze({
      contractionProgress: 0,
      presence: target ? 0 : 1
    }),
    sourceReferencePresence: target ? 0 : 1,
    instances: Object.freeze(plan.instances.map((instance) => Object.freeze({
      ordinal: instance.ordinal,
      bodyTransitProgress: target ? 1 : 0,
      bodyPresence: target ? 1 : 0,
      referenceTransitProgress: target ? 1 : 0,
      referencePresence: target ? 1 : 0,
      precedingConnectorPresence:
        target && instance.precedingConnector !== undefined ? 1 : 0
    })))
  });
}

function phaseAt(
  progress: number,
  plan: KpFiniteSumExpansionPresentationPlan
): KpFiniteSumExpansionMotionFrame["phase"] {
  if (progress <= plan.sourceHoldWindow.end) return "source-hold";
  if (progress < plan.instances[0]!.bodyTransitWindow.start) {
    return "source-withdrawal";
  }
  if (progress < plan.targetHoldWindow.start) return "ordered-expansion";
  return "target-hold";
}

function sampleWindow(
  motionWindow: KpFiniteSumPresentationWindow,
  progress: number
): number {
  if (motionWindow.end === motionWindow.start) {
    return progress < motionWindow.start ? 0 : 1;
  }
  const local = Math.max(0, Math.min(1,
    (progress - motionWindow.start) /
    (motionWindow.end - motionWindow.start)
  ));
  return local * local * (3 - 2 * local);
}

function bounded(progress: number): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Finite-sum motion progress must be finite.");
  }
  return Math.max(0, Math.min(1, progress));
}

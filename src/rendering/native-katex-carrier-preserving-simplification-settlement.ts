import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "./native-katex-carrier-preserving-simplification-profile.ts";
import type {
  KpNativeKatexCarrierPreservingSimplificationMotionPlan
} from "./native-katex-carrier-preserving-simplification-motion.ts";
import {
  createKpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  assertKpNativeKatexEndpointRevision,
  type KpNativeKatexRenderedEndpointRevision
} from "./native-katex-rendered-scene.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "./native-katex-scene-track-sampling.ts";
import type {
  KpNativeKatexPaintPreservingRetirement
} from "./native-katex-scene-track-contract.ts";

export interface KpNativeKatexCarrierSettlementCertificate {
  readonly kind: "native-katex-carrier-settlement-certificate";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly carrierTrackId: string;
  readonly targetSelectorRef: string;
  readonly targetRect: KpStageRelativeRect;
  readonly targetBaselineY: number;
  readonly terminalStableFrom: number;
  readonly nativeOwnerAtCompletion: "target-native";
  readonly toJSON: () => never;
}

export interface KpNativeKatexCarrierPreservingSimplificationSession {
  readonly kind:
    "native-katex-carrier-preserving-simplification-session";
  readonly lifecycle: "renderer-session";
  readonly settlement: KpNativeKatexCarrierSettlementCertificate;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: KpNativeKatexPaintPreservingRetirement["reason"]
  ) => void;
}

export function certifyKpNativeKatexCarrierSettlement(
  plan: KpNativeKatexCarrierPreservingSimplificationMotionPlan
): KpNativeKatexCarrierSettlementCertificate {
  const carrierTrack = plan.rendererPlan.tracks.find(
    ({ id }) => id === plan.carrierTrackId
  );
  if (
    carrierTrack === undefined ||
    carrierTrack.lifecycle !== "persist" ||
    carrierTrack.targetAtomId === undefined
  ) {
    throw new Error("Carrier settlement requires one target-bound persist track.");
  }
  const target = plan.binding.carrier.target;
  const targetAtom = plan.rendererPlan.reconciliation.target.atoms.find(
    ({ id }) => id === carrierTrack.targetAtomId
  );
  if (targetAtom?.semanticEntityId !== target.selectorRef) {
    throw new Error("Carrier settlement target lacks verified semantic identity.");
  }
  if (rectDelta(carrierTrack.endPaintRect, target.rect) !== 0) {
    throw new Error("Carrier track does not end at exact native target ink.");
  }
  const terminalStableFrom =
    kpNativeKatexCarrierPreservingSimplificationOpticalProfile
      .carrierTransit.end;
  const stable = sampleKpNativeKatexSceneTrackFrames(
    [carrierTrack],
    terminalStableFrom,
    false
  )[0]!;
  const completed = sampleKpNativeKatexSceneTrackFrames(
    [carrierTrack],
    1,
    false
  )[0]!;
  if (
    stable.opacity !== 1 ||
    completed.opacity !== 1 ||
    stable.materialScale !== undefined ||
    completed.materialScale !== undefined ||
    rectDelta(stable.expectedPaintRect ?? stable.rect, target.rect) !== 0 ||
    rectDelta(completed.expectedPaintRect ?? completed.rect, target.rect) !== 0
  ) {
    throw new Error("Carrier requires a terminal correction before native paint.");
  }
  return Object.freeze({
    kind: "native-katex-carrier-settlement-certificate" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    carrierTrackId: carrierTrack.id,
    targetSelectorRef: target.selectorRef,
    targetRect: target.rect,
    targetBaselineY: target.baselineY,
    terminalStableFrom,
    nativeOwnerAtCompletion: "target-native" as const,
    toJSON(): never {
      throw new Error(
        "Native KaTeX carrier settlement certificates cannot enter durable state."
      );
    }
  });
}

export function assertKpNativeKatexCarrierEndpointRevisions(input: {
  readonly plan: KpNativeKatexCarrierPreservingSimplificationMotionPlan;
  readonly current: {
    readonly source: KpNativeKatexRenderedEndpointRevision;
    readonly target: KpNativeKatexRenderedEndpointRevision;
  };
}): void {
  assertKpNativeKatexEndpointRevision({
    handle: input.plan.binding.sourceHandle,
    current: input.current.source
  });
  assertKpNativeKatexEndpointRevision({
    handle: input.plan.binding.targetHandle,
    current: input.current.target
  });
}

/**
 * Revision checks happen before delegating to the canonical compositor. A
 * resize or font change therefore cannot paint one frame from stale geometry;
 * the host must replace the whole measured session instead.
 */
export function createKpNativeKatexCarrierPreservingSimplificationSession(
  input: {
    readonly plan: KpNativeKatexCarrierPreservingSimplificationMotionPlan;
    readonly currentRevisions: () => {
      readonly source: KpNativeKatexRenderedEndpointRevision;
      readonly target: KpNativeKatexRenderedEndpointRevision;
    };
  }
): KpNativeKatexCarrierPreservingSimplificationSession {
  assertKpNativeKatexCarrierEndpointRevisions({
    plan: input.plan,
    current: input.currentRevisions()
  });
  const settlement = certifyKpNativeKatexCarrierSettlement(input.plan);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    input.plan.rendererPlan
  );
  let retired = false;
  return Object.freeze({
    kind:
      "native-katex-carrier-preserving-simplification-session" as const,
    lifecycle: "renderer-session" as const,
    settlement,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired carrier-preserving session.");
      }
      assertKpNativeKatexCarrierEndpointRevisions({
        plan: input.plan,
        current: input.currentRevisions()
      });
      const frame = canonical.session.apply(progress);
      if (progress === 1 && frame.visualOwner !== "target-native") {
        throw new Error("Carrier completion did not select native target paint.");
      }
      return frame;
    },
    retire(
      reason: KpNativeKatexPaintPreservingRetirement["reason"] =
        "surface-disposed"
    ) {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason,
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function rectDelta(left: KpStageRelativeRect, right: KpStageRelativeRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

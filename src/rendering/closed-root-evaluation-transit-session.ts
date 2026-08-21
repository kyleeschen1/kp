import {
  isKpVerifiedClosedRootEvaluationExemplar,
  type KpVerifiedClosedRootEvaluationExemplar
} from "../semantic/closed-root-evaluation-exemplar.ts";
import type {
  KpNativeKatexRendererReadyScenePlan
} from "./native-katex-base-scene-plan.ts";
import type {
  KpClosedRootEvaluationNativeEndpointSet
} from "./closed-root-evaluation-native-endpoints.ts";
import {
  createKpNativeKatexClosedEvaluationFusion,
  type KpNativeKatexClosedEvaluationFusionBinding
} from "./native-katex-closed-evaluation-fusion.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";

export interface KpClosedRootEvaluationMotionPlan {
  readonly kind: "closed-root-evaluation-motion-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly exemplar: KpVerifiedClosedRootEvaluationExemplar;
  readonly rendererPlan: KpNativeKatexRendererReadyScenePlan;
  readonly fusion: KpNativeKatexClosedEvaluationFusionBinding;
  readonly sourceContributorTrackIds: readonly [string, ...string[]];
  readonly targetResultTrackIds: readonly [string, ...string[]];
  readonly toJSON: () => never;
}

export interface KpClosedRootEvaluationTransitSession {
  readonly kind: "closed-root-evaluation-transit-session";
  readonly lifecycle: "renderer-session";
  readonly motion: KpClosedRootEvaluationMotionPlan;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated" | "scene-replaced"
  ) => void;
}

export function compileKpClosedRootEvaluationMotion(input: {
  readonly exemplar: KpVerifiedClosedRootEvaluationExemplar;
  readonly endpoints: KpClosedRootEvaluationNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpClosedRootEvaluationMotionPlan {
  assertInput(input);
  const [sourceState, targetState] = input.exemplar.states;
  const fuseDisposition = input.exemplar.plan.dispositions.find(
    ({ kind }) => kind === "fuse"
  );
  if (
    fuseDisposition === undefined ||
    !sameSet(fuseDisposition.sourceEntityIds, [
      sourceState.radical.entityId,
      sourceState.radicand.entityId
    ]) ||
    !sameSet(fuseDisposition.targetEntityIds, [targetState.value.entityId])
  ) {
    throw new Error(
      "Closed-root realization requires compiler-owned fuse disposition."
    );
  }
  const fusion = createKpNativeKatexClosedEvaluationFusion({
    id: input.exemplar.id,
    sourceEntityIds: [
      sourceState.radical.entityId,
      sourceState.radicand.entityId
    ],
    targetEntityId: targetState.value.entityId
  });
  const rendererPlan = compileKpCanonicalNativeKatexScenePlan({
    source: createKpNativeKatexRenderedEndpointHandle({
      observation: input.source
    }),
    target: createKpNativeKatexRenderedEndpointHandle({
      observation: input.target
    }),
    relations: [],
    trackProjection: fusion.projection,
    fanInRouting: false,
    copyFanOutRouting: false
  });
  const sourceEntityByAtom = new Map(input.source.atoms.map((atom) =>
    [atom.id, atom.semanticEntityId] as const
  ));
  const targetEntityByAtom = new Map(input.target.atoms.map((atom) =>
    [atom.id, atom.semanticEntityId] as const
  ));
  const sourceEntityIds = new Set(fusion.sourceEntityIds);
  const sourceContributorTrackIds = rendererPlan.tracks.filter((track) =>
    sourceEntityIds.has(sourceEntityByAtom.get(track.sourceAtomId ?? "") ?? "")
  ).map(({ id }) => id);
  const targetResultTrackIds = rendererPlan.tracks.filter((track) =>
    targetEntityByAtom.get(track.targetAtomId ?? "") === fusion.targetEntityId
  ).map(({ id }) => id);
  if (
    sourceContributorTrackIds.length < fusion.sourceEntityIds.length ||
    targetResultTrackIds.length === 0 ||
    rendererPlan.tracks.some((track) =>
      !sourceContributorTrackIds.includes(track.id) &&
      !targetResultTrackIds.includes(track.id)
    )
  ) {
    throw new Error(
      "Closed-root realization did not classify its complete paint topology."
    );
  }
  return Object.freeze({
    kind: "closed-root-evaluation-motion-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    exemplar: input.exemplar,
    rendererPlan,
    fusion,
    sourceContributorTrackIds: Object.freeze(sourceContributorTrackIds) as
      readonly [string, ...string[]],
    targetResultTrackIds: Object.freeze(targetResultTrackIds) as readonly [
      string,
      ...string[]
    ],
    toJSON(): never {
      throw new Error("Closed-root motion plans cannot enter durable state.");
    }
  });
}

export function createKpClosedRootEvaluationTransitSession(input: {
  readonly exemplar: KpVerifiedClosedRootEvaluationExemplar;
  readonly endpoints: KpClosedRootEvaluationNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpClosedRootEvaluationTransitSession {
  const motion = compileKpClosedRootEvaluationMotion(input);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    motion.rendererPlan
  );
  let retired = false;
  return Object.freeze({
    kind: "closed-root-evaluation-transit-session" as const,
    lifecycle: "renderer-session" as const,
    motion,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired closed-root session.");
      }
      return canonical.session.apply(Math.max(0, Math.min(1, progress)));
    },
    retire(
      reason: "surface-disposed" | "measurement-invalidated" |
        "scene-replaced" = "surface-disposed"
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

function assertInput(input: {
  readonly exemplar: KpVerifiedClosedRootEvaluationExemplar;
  readonly endpoints: KpClosedRootEvaluationNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpVerifiedClosedRootEvaluationExemplar(input.exemplar) ||
    input.endpoints.exemplar !== input.exemplar) {
    throw new Error("Closed-root realization requires matching authority.");
  }
  if (input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage ||
    input.source.root === input.target.root) {
    throw new Error("Closed-root realization crossed endpoint ownership.");
  }
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

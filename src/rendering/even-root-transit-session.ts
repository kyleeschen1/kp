import type { KpVerifiedEvenRootSolveExemplar } from
  "../semantic/even-root-solve-exemplar.ts";
import {
  isKpVerifiedEvenRootSolveExemplar
} from "../semantic/even-root-solve-exemplar.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import type { KpNativeKatexRenderedSceneObservation } from
  "./native-katex-rendered-scene.ts";
import type { KpEvenRootNativeEndpointSet } from
  "./even-root-native-endpoints.ts";

export interface KpEvenRootVisibleToImplicitRoleTransfer {
  readonly kind: "visible-exponent-to-implicit-root-index";
  readonly sourceExponentEntityId: "source.exponent.two";
  readonly targetRootIndexEntityId: "radical.index.implicit-two";
  readonly paintIdentity: "not-a-glyph-identity";
}

export interface KpEvenRootTransitSession {
  readonly kind: "kp-even-root-transit-session";
  readonly lifecycle: "renderer-session";
  readonly transition: "inverse-power" | "root-value-evaluation";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly roleTransfer?: KpEvenRootVisibleToImplicitRoleTransfer | undefined;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated" | "scene-replaced"
  ) => void;
}

export function createKpEvenRootInversePowerTransitSession(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["inversePower"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpEvenRootTransitSession {
  assertExemplar(input.exemplar);
  const roleTransfer = Object.freeze({
    kind: "visible-exponent-to-implicit-root-index" as const,
    sourceExponentEntityId: input.exemplar.states[0].exponentEntityId,
    targetRootIndexEntityId: input.exemplar.states[1].rootIndexEntityId,
    // The target index is mathematically present but has no native glyph.
    // Calling this persistence would create duplicate or fabricated ink.
    paintIdentity: "not-a-glyph-identity" as const
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpEvenRootInversePowerTransitPlan(input)
  );
  return session("inverse-power", canonical, roleTransfer);
}

export function compileKpEvenRootInversePowerTransitPlan(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["inversePower"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}) {
  assertExemplar(input.exemplar);
  assertEndpointPair(input.endpoints, "state.even-root.source",
    "state.even-root.radical-branches");
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: inversePowerPaintRelations(input.exemplar),
    copyFanOutRouting: false,
    trackProjection: inversePowerTrackProjection(input.exemplar)
  });
}

export function createKpEvenRootEvaluationTransitSession(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["evaluation"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpEvenRootTransitSession {
  assertExemplar(input.exemplar);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpEvenRootEvaluationTransitPlan(input)
  );
  return session("root-value-evaluation", canonical);
}

export function compileKpEvenRootEvaluationTransitPlan(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["evaluation"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}) {
  assertExemplar(input.exemplar);
  assertEndpointPair(input.endpoints, "state.even-root.radical-branches",
    "state.even-root.evaluated-branches");
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: evaluationPaintRelations(input.exemplar),
    copyFanOutRouting: false,
    trackProjection: evaluationTrackProjection(input.exemplar)
  });
}

function inversePowerPaintRelations(
  exemplar: KpVerifiedEvenRootSolveExemplar
): readonly KpNativeKatexSemanticPaintRelation[] {
  const [source, radical] = exemplar.states;
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      oneToOne("subject", source.subjectEntityId, radical.subjectEntityId),
      oneToOne("relation", source.relationEntityId, radical.relationEntityId),
      oneToOne("radicand", source.rightEntityId, radical.radicandEntityId),
      introduction("plus-minus", radical.plusMinusEntityId),
      introduction("radical", radical.radicalOperatorEntityId)
    ]
  });
}

function evaluationPaintRelations(
  exemplar: KpVerifiedEvenRootSolveExemplar
): readonly KpNativeKatexSemanticPaintRelation[] {
  const [, radical, evaluated] = exemplar.states;
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      oneToOne("subject", radical.subjectEntityId, evaluated.subjectEntityId),
      oneToOne("relation", radical.relationEntityId, evaluated.relationEntityId),
      oneToOne(
        "plus-minus",
        radical.plusMinusEntityId,
        evaluated.plusMinusEntityId
      ),
      // Arithmetic authority relates the root to 3. Paint deliberately uses
      // eliminate/introduce so contributor ink meets at one knot without two
      // simultaneously legible expressions.
      removal("root-operator", radical.radicalOperatorEntityId),
      removal("radicand", radical.radicandEntityId),
      introduction("evaluated-value", evaluated.valueEntityId)
    ]
  });
}

function inversePowerTrackProjection(
  exemplar: KpVerifiedEvenRootSolveExemplar
) {
  const [sourceState, radicalState] = exemplar.states;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${exemplar.id}.inverse-power`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const radicalAtom = target.atoms.find((atom) =>
        atom.semanticEntityId === radicalState.radicalOperatorEntityId
      );
      if (radicalAtom === undefined) {
        throw new Error("Even-root transit requires measured native radical ink.");
      }
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from === sourceState.exponentEntityId) {
          const endRect = Object.freeze({
            ...track.endRect,
            left: radicalAtom.rect.left - track.endRect.width * 0.18,
            top: radicalAtom.rect.top - track.endRect.height * 0.12
          });
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            endRect,
            timingGroupId: `timing.${exemplar.id}.role-transfer`,
            sampleProgress: sampleWindow(0.12, 0.44),
            sampleOpacityProgress: sampleWindow(0.16, 0.44),
            sampleMaterialScale: (progress: number) =>
              lerp(1, 0.22, smoothstep(0.16, 0.44, progress))
          }));
        }
        if (
          to === radicalState.radicalOperatorEntityId ||
          to === radicalState.plusMinusEntityId
        ) {
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            timingGroupId: `timing.${exemplar.id}.branch-introduction`,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(0.34, 0.56),
            sampleMaterialScale: (progress: number) =>
              lerp(0.2, 1, smoothstep(0.34, 0.56, progress))
          }));
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(0.14, 0.62)
        });
      }));
    }
  });
}

function evaluationTrackProjection(
  exemplar: KpVerifiedEvenRootSolveExemplar
) {
  const [, radicalState, evaluatedState] = exemplar.states;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${exemplar.id}.root-evaluation`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const resultAtom = target.atoms.find((atom) =>
        atom.semanticEntityId === evaluatedState.valueEntityId
      );
      if (resultAtom === undefined) {
        throw new Error("Root evaluation requires measured result ink.");
      }
      const resultCenter = {
        x: resultAtom.rect.left + resultAtom.rect.width / 2,
        y: resultAtom.rect.top + resultAtom.rect.height / 2
      };
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (
          from === radicalState.radicalOperatorEntityId ||
          from === radicalState.radicandEntityId
        ) {
          const endRect = Object.freeze({
            ...track.endRect,
            left: resultCenter.x - track.endRect.width / 2,
            top: resultCenter.y - track.endRect.height / 2
          });
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            endRect,
            timingGroupId: `timing.${exemplar.id}.evaluation-knot`,
            sampleProgress: sampleWindow(0.18, 0.5),
            sampleOpacityProgress: sampleWindow(0.46, 0.52),
            sampleMaterialScale: (progress: number) =>
              lerp(1, 0.16, smoothstep(0.28, 0.5, progress))
          }));
        }
        if (to === evaluatedState.valueEntityId) {
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            timingGroupId: `timing.${exemplar.id}.evaluation-knot`,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(0.5, 0.58),
            sampleMaterialScale: (progress: number) =>
              lerp(0.16, 1, smoothstep(0.5, 0.72, progress))
          }));
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(0.12, 0.72)
        });
      }));
    }
  });
}

function session(
  transition: KpEvenRootTransitSession["transition"],
  canonical: KpCanonicalNativeKatexSceneSession,
  roleTransfer?: KpEvenRootVisibleToImplicitRoleTransfer
): KpEvenRootTransitSession {
  let retired = false;
  return Object.freeze({
    kind: "kp-even-root-transit-session" as const,
    lifecycle: "renderer-session" as const,
    transition,
    canonical,
    ...(roleTransfer === undefined ? {} : { roleTransfer }),
    apply(progress: number) {
      if (retired) throw new Error("Cannot apply a retired even-root session.");
      return canonical.session.apply(bounded(progress));
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

function oneToOne(id: string, source: string, target: string) {
  return Object.freeze({
    id,
    kind: "one-to-one" as const,
    sourceEntityIds: [source],
    targetEntityIds: [target]
  });
}

function introduction(id: string, target: string) {
  return Object.freeze({
    id,
    kind: "introduction" as const,
    sourceEntityIds: [],
    targetEntityIds: [target]
  });
}

function removal(id: string, source: string) {
  return Object.freeze({
    id,
    kind: "removal" as const,
    sourceEntityIds: [source],
    targetEntityIds: []
  });
}

function entityByAtom(scene: KpNativeKatexRenderedSceneObservation) {
  return new Map(scene.atoms.map((atom) => [atom.id, atom.semanticEntityId]));
}

function sampleWindow(start: number, end: number) {
  return (progress: number): number => smoothstep(start, end, progress);
}

function smoothstep(start: number, end: number, value: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const t = (value - start) / (end - start);
  return t * t * (3 - 2 * t);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function bounded(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function assertExemplar(exemplar: KpVerifiedEvenRootSolveExemplar): void {
  if (!isKpVerifiedEvenRootSolveExemplar(exemplar)) {
    throw new Error("Even-root transit requires a verified exemplar.");
  }
}

function assertEndpointPair(
  endpoints: Readonly<{
    readonly source: { readonly stateId: string };
    readonly target: { readonly stateId: string };
  }>,
  sourceStateId: string,
  targetStateId: string
): void {
  if (
    endpoints.source.stateId !== sourceStateId ||
    endpoints.target.stateId !== targetStateId
  ) {
    throw new Error(
      `Even-root transit expected ${sourceStateId} -> ${targetStateId}.`
    );
  }
}

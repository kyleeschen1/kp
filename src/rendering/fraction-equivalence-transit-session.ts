import {
  compileKpFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan
} from "../animation/fraction-equivalence-presentation-plan.ts";
import {
  kpCanonicalFractionEquivalence,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import {
  projectKpNativeKatexSemanticPaintRelations
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import type { KpNativeKatexRenderedSceneObservation } from
  "./native-katex-rendered-scene.ts";

export interface KpFractionEquivalenceTransitSession {
  readonly kind: "kp-fraction-equivalence-transit-session";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function createKpFractionEquivalenceTransitSession(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly semantic?: KpVerifiedFractionEquivalence | undefined;
}): KpFractionEquivalenceTransitSession {
  if (
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error(
      "Fraction-equivalence transit requires one shared measured stage."
    );
  }
  const semantic = input.semantic ?? kpCanonicalFractionEquivalence;
  const presentation = semantic === kpCanonicalFractionEquivalence
    ? kpCanonicalFractionEquivalencePresentationPlan
    : compileKpFractionEquivalencePresentationPlan(semantic);
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: [{
      id: "fraction-equivalence.division",
      kind: "one-to-one",
      sourceEntityIds: [
        presentation.structureContinuity.sourceDivisionEntityId
      ],
      targetEntityIds: [
        presentation.structureContinuity.targetDivisionEntityId
      ]
    }, ...presentation.operandTransfers.map((transfer) => ({
      id: transfer.correspondenceId,
      kind: "one-to-one" as const,
      sourceEntityIds: [transfer.sourceEntityId],
      targetEntityIds: [transfer.targetEntityId]
    })), {
      id: presentation.factorTransfer.correspondenceId,
      kind: "one-to-many",
      sourceEntityIds: [presentation.factorTransfer.sourceEntityId],
      targetEntityIds: [...presentation.factorTransfer.targetEntityIds]
    }]
  });
  const plan = compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations,
    copyFanOutRouting: true,
    endpointDwellFraction: 0
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(plan);
  let retired = false;
  return Object.freeze({
    kind: "kp-fraction-equivalence-transit-session" as const,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error(
          "Cannot apply a retired fraction-equivalence transit session."
        );
      }
      return canonical.session.apply(bounded(progress));
    },
    retire() {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason: "surface-disposed",
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Fraction-equivalence transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

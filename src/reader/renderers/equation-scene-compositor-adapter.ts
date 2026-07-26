import {
  createKpCanonicalNativeKatexSceneSession,
  type KpNativeKatexRendererSession,
  type KpNativeKatexSemanticPaintRelation
} from "../../rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "../../rendering/native-katex-rendered-scene.ts";
import type {
  KpReaderEquationMaterialPlan,
  KpReaderEquationTransitionMaterialPlan
} from "./equation-material-plan.ts";
import type {
  KpReaderEquationRenderPlan,
  KpReaderEquationTransitionPlan
} from "./equation-render-plan.ts";
import {
  auditKpNativeKatexChoreographyFidelity
} from "../../rendering/native-katex-choreography-fidelity.ts";

export function createKpReaderEquationSceneCompositorSession(input: {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
  readonly motionMode?: "continuous" | "essential" | "checkpoint" | undefined;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexRendererSession {
  const { renderTransition, materialTransition } = resolveTransitionPair(input);
  const relations = projectReaderRelations({
    renderTransition,
    materialTransition
  });
  if (input.source.stage !== input.target.stage) {
    throw new Error("Reader equation compositor endpoints must share one stage.");
  }
  const canonical = createKpCanonicalNativeKatexSceneSession({
    source: input.source,
    target: input.target,
    relations,
    ...(renderTransition.structuralSuccession === undefined
      ? {}
      : {
          structuralSuccession: renderTransition.structuralSuccession,
          structuralMotion:
            input.motionMode === undefined ||
            input.motionMode === "continuous"
              ? "full"
              : "checkpoint"
        })
  });
  if (renderTransition.structuralSuccession !== undefined) {
    const reducedMotion =
      input.motionMode !== undefined && input.motionMode !== "continuous";
    const fidelity = auditKpNativeKatexChoreographyFidelity({
      intent: renderTransition.structuralSuccession,
      strategy: reducedMotion
        ? {
            kind: "checkpoint-settlement",
            actPhaseIds: renderTransition.structuralSuccession.actPhaseIds,
            reason: "reduced-motion"
          }
        : {
            kind: "solid-mask-succession",
            actPhaseIds: renderTransition.structuralSuccession.actPhaseIds
          },
      reconciliation: canonical.reconciliation,
      tracks: canonical.session.tracks
    });
    if (!fidelity.passed) {
      throw new Error(
        `Reader structural succession failed fidelity: ${
          fidelity.issues.map(({ code }) => code).join(", ")
        }`
      );
    }
    input.source.stage.dataset["kpNativeKatexChoreographyFidelity"] =
      "passed";
  }
  return canonical.session;
}

function resolveTransitionPair(input: {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
}): {
  readonly renderTransition: KpReaderEquationTransitionPlan;
  readonly materialTransition: KpReaderEquationTransitionMaterialPlan;
} {
  if (input.materialPlan.renderPlanId !== input.renderPlan.id) {
    throw new Error(
      `Material plan ${input.materialPlan.id} does not belong to ${input.renderPlan.id}.`
    );
  }
  if (input.materialPlan.direction !== input.renderPlan.direction) {
    throw new Error("Reader equation compositor plans disagree on direction.");
  }
  const renderTransition = input.renderPlan.transitions.find(
    ({ id }) => id === input.transitionId
  );
  const materialTransition = input.materialPlan.transitions.find(
    ({ transitionId }) => transitionId === input.transitionId
  );
  if (renderTransition === undefined || materialTransition === undefined) {
    throw new Error(
      `Reader equation compositor is missing transition ${input.transitionId}.`
    );
  }
  return { renderTransition, materialTransition };
}

function projectReaderRelations(input: {
  readonly renderTransition: KpReaderEquationTransitionPlan;
  readonly materialTransition: KpReaderEquationTransitionMaterialPlan;
}): readonly KpNativeKatexSemanticPaintRelation[] {
  const relationById = new Map(
    input.renderTransition.relations.map((relation) => [
      relation.recordId,
      relation
    ])
  );
  const anchorsById = new Map(
    input.materialTransition.anchors.map((anchor) => [anchor.id, anchor])
  );
  return Object.freeze(input.materialTransition.owners.flatMap((owner) => {
    const canonical = relationById.get(owner.relationRecordId);
    if (canonical === undefined) {
      throw new Error(
        `Material owner ${owner.id} has no canonical correspondence record.`
      );
    }
    const sourceEntityIds = owner.sourceAnchorIds.map((anchorId) => {
      const anchor = anchorsById.get(anchorId);
      if (anchor === undefined || anchor.side !== "source") {
        throw new Error(`Material owner ${owner.id} has an invalid source anchor.`);
      }
      return anchor.selectorId;
    });
    const targetEntityIds = owner.targetAnchorIds.map((anchorId) => {
      const anchor = anchorsById.get(anchorId);
      if (anchor === undefined || anchor.side !== "target") {
        throw new Error(`Material owner ${owner.id} has an invalid target anchor.`);
      }
      return anchor.selectorId;
    });
    if (
      !sameValues(sourceEntityIds, canonical.sourceSelectorIds) ||
      !sameValues(targetEntityIds, canonical.targetSelectorIds)
    ) {
      throw new Error(
        `Material owner ${owner.id} diverges from canonical correspondence.`
      );
    }
    if (sourceEntityIds.length === 0 || targetEntityIds.length === 0) return [];
    const relation =
      sourceEntityIds.length > 1 && targetEntityIds.length === 1
        ? "merge" as const
        : sourceEntityIds.length === 1 && targetEntityIds.length > 1
          ? "split" as const
          : sourceEntityIds.length === 1 && targetEntityIds.length === 1
            ? "persist" as const
            : undefined;
    if (relation === undefined) {
      throw new Error(
        `Material owner ${owner.id} has unsupported many-to-many paint lineage.`
      );
    }
    return [Object.freeze({
      id: `reader-paint.${owner.relationRecordId}`,
      relation,
      sourceEntityIds: Object.freeze(sourceEntityIds),
      targetEntityIds: Object.freeze(targetEntityIds)
    })];
  }));
}

function sameValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

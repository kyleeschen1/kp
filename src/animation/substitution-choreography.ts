import {
  compileKpExecutableMotifComposition,
  type KpExecutableMotifComposition
} from "../rendering/executable-motif-grammar.ts";
import type {
  KpSemanticScene,
  KpSemanticSceneTransition
} from "../semantic/semantic-scene-protocol.ts";

export const kpSubstitutionPhaseIds = [
  "establish-value-source",
  "transmit-substitution-value",
  "replace-substitution-occupant",
  "settle-substitution-replacement"
] as const;

export type KpSubstitutionPhaseId = (typeof kpSubstitutionPhaseIds)[number];

export interface KpSubstitutionChoreographyPlan {
  readonly kind: "substitution-choreography";
  readonly id: string;
  readonly sourceSceneId: string;
  readonly targetSceneId: string;
  readonly valueEntityId: string;
  readonly replacedEntityId: string;
  readonly replacementEntityId: string;
  readonly transferLineageEdgeId: string;
  readonly replacementLifecycleRecordId: string;
  readonly operationComposition: KpExecutableMotifComposition;
  readonly phaseIds: readonly KpSubstitutionPhaseId[];
}

export interface KpSubstitutionChoreographyFrame {
  readonly kind: "substitution-choreography-frame";
  readonly planId: string;
  readonly progress: number;
  readonly valueSource: {
    readonly entityId: string;
    readonly opacity: number;
    readonly emphasis: number;
  };
  readonly transfer: {
    readonly entityId: string;
    readonly lineageEdgeId: string;
    readonly opacity: number;
    readonly pathProgress: number;
    readonly scale: number;
  };
  readonly replaced: {
    readonly entityId: string;
    readonly opacity: number;
    readonly scale: number;
  };
  readonly replacement: {
    readonly entityId: string;
    readonly opacity: number;
    readonly scale: number;
  };
  readonly salienceTransfer: number;
  readonly phases: Readonly<Record<KpSubstitutionPhaseId, number>>;
}

export function compileKpSubstitutionChoreography(input: {
  readonly id: string;
  readonly source: KpSemanticScene;
  readonly target: KpSemanticScene;
  readonly transition: KpSemanticSceneTransition;
  readonly valueEntityId: string;
  readonly replacedEntityId: string;
  readonly replacementEntityId: string;
}): KpSubstitutionChoreographyPlan {
  requireSceneTransition(input.source, input.target, input.transition);
  requireEntity(input.source, input.valueEntityId, "substitution value");
  requireEntity(input.source, input.replacedEntityId, "replaced occupant");
  requireEntity(input.target, input.replacementEntityId, "replacement");
  if (input.valueEntityId === input.replacedEntityId) {
    throw new Error("Substitution value and replaced occupant must be distinct entities.");
  }

  const transfer = input.transition.lineageGraph.edges.find((edge) =>
    edge.sourceEntityIds.includes(input.valueEntityId) &&
    edge.targetEntityIds.includes(input.replacementEntityId) &&
    ["persist", "copy", "split"].includes(edge.relation)
  );
  if (transfer === undefined) {
    throw new Error(
      `Substitution ${input.id} has no value lineage from ${input.valueEntityId} to ${input.replacementEntityId}.`
    );
  }
  const removal = input.transition.lineageGraph.edges.find((edge) =>
    edge.relation === "removal" && edge.sourceEntityIds.includes(input.replacedEntityId)
  );
  if (removal === undefined) {
    throw new Error(
      `Substitution ${input.id} does not remove replaced occupant ${input.replacedEntityId}.`
    );
  }
  const replacementLifecycle = input.transition.correspondenceMap.records.find((record) =>
    record.targetSelectorIds.includes(input.replacementEntityId)
  );
  if (replacementLifecycle === undefined) {
    throw new Error(
      `Substitution ${input.id} has no correspondence lifecycle for ${input.replacementEntityId}.`
    );
  }

  return {
    kind: "substitution-choreography",
    id: input.id,
    sourceSceneId: input.source.id,
    targetSceneId: input.target.id,
    valueEntityId: input.valueEntityId,
    replacedEntityId: input.replacedEntityId,
    replacementEntityId: input.replacementEntityId,
    transferLineageEdgeId: transfer.id,
    replacementLifecycleRecordId: replacementLifecycle.id,
    operationComposition: compileKpExecutableMotifComposition([
      "kp.core.persist",
      "kp.core.substitute"
    ]),
    phaseIds: [...kpSubstitutionPhaseIds]
  };
}

export function sampleKpSubstitutionChoreography(input: {
  readonly plan: KpSubstitutionChoreographyPlan;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpSubstitutionChoreographyFrame {
  const requestedProgress = clamp01(input.progress);
  const p = input.direction === "rewind" ? 1 - requestedProgress : requestedProgress;
  const phases: Readonly<Record<KpSubstitutionPhaseId, number>> = {
    "establish-value-source": phaseProgress(p, 0, 0.2),
    "transmit-substitution-value": phaseProgress(p, 0.14, 0.68),
    "replace-substitution-occupant": phaseProgress(p, 0.62, 0.84),
    "settle-substitution-replacement": phaseProgress(p, 0.8, 1)
  };
  const transmission = phases["transmit-substitution-value"];
  const replacement = phases["replace-substitution-occupant"];
  const settle = phases["settle-substitution-replacement"];
  const transferOpacity = Math.sin(Math.PI * transmission) * (1 - settle);

  return {
    kind: "substitution-choreography-frame",
    planId: input.plan.id,
    progress: p,
    valueSource: {
      entityId: input.plan.valueEntityId,
      opacity: 1 - settle,
      emphasis: Math.sin(Math.PI * phases["establish-value-source"])
    },
    transfer: {
      entityId: input.plan.valueEntityId,
      lineageEdgeId: input.plan.transferLineageEdgeId,
      opacity: transferOpacity,
      pathProgress: transmission,
      scale: 0.82 + 0.18 * Math.sin(Math.PI * transmission)
    },
    replaced: {
      entityId: input.plan.replacedEntityId,
      opacity: 1 - replacement,
      scale: 1 - 0.18 * replacement
    },
    replacement: {
      entityId: input.plan.replacementEntityId,
      opacity: replacement,
      scale: 0.82 + 0.18 * replacement
    },
    salienceTransfer: replacement,
    phases
  };
}

function requireSceneTransition(
  source: KpSemanticScene,
  target: KpSemanticScene,
  transition: KpSemanticSceneTransition
): void {
  if (transition.sourceSceneId !== source.id || transition.targetSceneId !== target.id) {
    throw new Error(
      `Scene transition ${transition.id} does not connect ${source.id} to ${target.id}.`
    );
  }
}

function requireEntity(scene: KpSemanticScene, entityId: string, role: string): void {
  if (!scene.registry.entities.some((entity) => entity.id === entityId)) {
    throw new Error(`Scene ${scene.id} is missing ${role} entity ${entityId}.`);
  }
}

function phaseProgress(progress: number, start: number, end: number): number {
  const local = clamp01((progress - start) / (end - start));
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}

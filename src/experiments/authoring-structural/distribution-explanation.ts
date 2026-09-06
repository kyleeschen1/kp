import { createKpAuthoredDistributionModel } from "./distribution-model.ts";
import { prepareKpAuthoredDistributionOperation } from "./distribution-operation.ts";
import { defineKpAuthoredDistributionFamily } from "./distribution-family.ts";
import { assembleKpSemanticStateExplanation, bindKpSemanticStateExplanationMember } from "../../semantic-state/authoring-explanation-assembly.ts";
import { createKpSemanticStateQuerySession } from "../../semantic-state/authoring-query-session.ts";
import { createKpInTransitionSemanticStateCompositionAddress, createKpSettledSemanticStateCompositionAddress } from "../../semantic-state/state-family-composition-address.ts";
import type { KpSemanticProgress } from "../../semantic-state/semantic-progress.ts";

export function createKpAuthoredDistributionExplanation(namespace = "lesson.authoring-structural.distribution") {
  const authored = createKpAuthoredDistributionModel(namespace);
  const receipt = prepareKpAuthoredDistributionOperation({ authored, snapshot: authored.model.initial });
  const definition = defineKpAuthoredDistributionFamily(receipt);
  const member = bindKpSemanticStateExplanationMember({ name: "distribute", sourceId: "authoring.distribution.member",
    definition, application: definition.prepareApplication({ applicationId: "distribute",
      sourceId: "authoring.distribution.application", parameters: { operation: "distribute" } }) });
  const explanation = assembleKpSemanticStateExplanation({ model: authored.model, localId: "distribution",
    sourceId: "authoring.distribution.explanation", root: member.member, members: [member] });
  const at = (progress: KpSemanticProgress) => createKpInTransitionSemanticStateCompositionAddress({
    handles: explanation.handles, target: explanation.handles.root, progress });
  const before = createKpSettledSemanticStateCompositionAddress({ handles: explanation.handles,
    boundary: explanation.handles.composition.before });
  const after = createKpSettledSemanticStateCompositionAddress({ handles: explanation.handles,
    boundary: explanation.handles.composition.after });
  return Object.freeze({ authored, receipt, explanation, at, before, after,
    createSession: () => createKpSemanticStateQuerySession(explanation, { cacheCapacity: 2 }) });
}

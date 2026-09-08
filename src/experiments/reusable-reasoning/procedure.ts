import { createSemanticTransformationRef } from "../../semantic/animation.ts";
import { createEditableSemanticTransformationTree, createSemanticTransformationLeaf,
  createSemanticTransformationSequence } from "../../semantic/transformation-composition.ts";
import { requireKpReasoningEvidence, freezeKpReasoningOwnedProjection, type KpReasoningEvidence } from "./evidence.ts";
import { bindKpReasoningFormula } from "./formula.ts";
import { pinKpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";

/** The canonical trace owns handoffs; the existing tree only groups their reading. */
export function composeKpReasoningProcedure(evidence: KpReasoningEvidence) {
  requireKpReasoningEvidence(evidence);
  const formula = bindKpReasoningFormula(evidence);
  const { steps } = evidence;
  if (steps.length < 1 || steps.length > 4) throw new KpReasoningRepairGap(
    "kp.reasoning.procedure-scope", "$.reason.operationIds",
    "Select a prefix of the four verified distribute-normalize-evaluate steps; later solving is outside this exemplar.");
  for (const [index, step] of steps.entries()) {
    if (step.sourceStateId !== evidence.states[index]!.stateId
      || step.targetStateId !== evidence.states[index + 1]!.stateId
      || (index > 0 && steps[index - 1]!.targetStateId !== step.sourceStateId)) {
      throw new KpReasoningRepairGap("kp.reasoning.procedure-handoff",
        `$.reason.operationIds[${index}]`,
        "Retain the verified adjacent source-to-target handoff; do not skip normalization or reorder steps.");
    }
  }
  const leaves = steps.map(step => createSemanticTransformationLeaf(createSemanticTransformationRef({
    id: step.id, kind: step.transformType,
    sourceObjectIds: [step.sourceStateId], targetObjectIds: [step.targetStateId],
    preserves: [], summary: "Semantic authority is retained in this revision's verified operation evidence."
  })));
  const children = leaves.length === 1 ? leaves : [
    leaves[0]!,
    createSemanticTransformationSequence({
      id: `${evidence.source.reason.id}.normalize-evaluate`,
      label: "Normalize, then evaluate the constant", children: leaves.slice(1)
    })
  ];
  const tree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationSequence({
      id: evidence.source.reason.id, label: evidence.source.reason.title, children
    })
  });
  const procedure = Object.freeze({
    revisionId: evidence.revisionId, tree, formula,
    source: pinKpReasoningReference(evidence, "state", steps[0]!.sourceStateId),
    target: pinKpReasoningReference(evidence, "state", steps.at(-1)!.targetStateId),
    checkpoints: Object.freeze(evidence.states.slice(0, steps.length + 1)
      .map(state => pinKpReasoningReference(evidence, "state", state.stateId))),
    operations: Object.freeze(steps.map(step => Object.freeze({
      reference: pinKpReasoningReference(evidence, "operation", step.id),
      source: pinKpReasoningReference(evidence, "state", step.sourceStateId),
      target: pinKpReasoningReference(evidence, "state", step.targetStateId),
      evidenceIds: step.authorityIds
    })))
  });
  freezeKpReasoningOwnedProjection(procedure);
  return procedure;
}

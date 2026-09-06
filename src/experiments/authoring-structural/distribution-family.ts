import { defineKpSemanticStateModelFamily } from "../../semantic-state/authoring-explanation-assembly.ts";
import { kpStateFamilyParameters } from "../../semantic-state/state-family-definition.ts";
import { declareKpSemanticStateDiscreteTransition } from "../../semantic-state/state-family-transition.ts";
import { createKpSemanticProgress } from "../../semantic-state/semantic-progress.ts";
import { readKpAuthoredDistributionOperation, KpAuthoredDistributionOperationError } from "./distribution-operation.ts";

export function defineKpAuthoredDistributionFamily(receipt: Parameters<typeof readKpAuthoredDistributionOperation>[0]) {
  const operation = readKpAuthoredDistributionOperation(receipt);
  const family = defineKpSemanticStateModelFamily(operation.model, {
    id: operation.transformation.id, sourceId: operation.operationId,
    parameters: kpStateFamilyParameters<{ operation: "distribute" }>(),
    // Moving paint is not a fractional equation AST. Keep source truth until
    // settlement; the canonical compositor separately owns continuous motion.
    transitions: builder => [builder.discrete(declareKpSemanticStateDiscreteTransition({
      id: "equation.distribute", sourceId: operation.operationId,
      target: operation.model.handles.refs.equation,
      changePoints: [{ id: "settled", at: createKpSemanticProgress(1n, 1n), valueSourceId: operation.target.id }]
    }), ({ after }) => after)],
    author(parameters, state) {
      if (parameters.operation !== "distribute") throw new KpAuthoredDistributionOperationError(
        "kp.authoring.structural-operation-gap", "This family only applies verified distribution.");
      state.equation.update(previous => {
        if (JSON.stringify(previous) !== JSON.stringify(operation.source)) throw new KpAuthoredDistributionOperationError(
          "kp.authoring.structural-source-gap", "The distribution source changed before publication.");
        return operation.target;
      });
    }
  });
  // Preserve exact receipt pins at every family application entrance, including
  // the prepared-application path used by explanation endpoint assembly.
  return Object.freeze({ ...family,
    apply(...args: Parameters<typeof family.apply>) {
      operation.selection.assertCurrent(args[0]);
      return family.apply(...args);
    },
    applyPreparedApplication(...args: Parameters<typeof family.applyPreparedApplication>) {
      operation.selection.assertCurrent(args[0]);
      return family.applyPreparedApplication(...args);
    },
    reparameterize(...args: Parameters<typeof family.reparameterize>) {
      operation.selection.assertCurrent(args[0].commit.before);
      return family.reparameterize(...args);
    }
  });
}

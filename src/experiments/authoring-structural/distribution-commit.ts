import type { KpAggregateSemanticSnapshot } from "../../semantic-state/aggregate-snapshot.ts";
import { defineKpSemanticStateTransform } from "../../semantic-state/authoring-state-transform.ts";
import { pinKpSemanticSlotVersion } from "../../semantic-state/pinned-recovery.ts";
import { readKpAuthoredDistributionOperation, KpAuthoredDistributionOperationError } from "./distribution-operation.ts";

export function applyKpAuthoredDistributionOperation(
  receipt: Parameters<typeof readKpAuthoredDistributionOperation>[0],
  input: { readonly before: KpAggregateSemanticSnapshot; readonly applicationId: string }
) {
  const operation = readKpAuthoredDistributionOperation(receipt);
  operation.selection.assertCurrent(input.before);
  const { model } = operation;
  // Mathematical authority is checked before entering the ordinary atomic
  // transaction. A state update itself never certifies a structural rewrite.
  const definition = defineKpSemanticStateTransform({
    compiled: model.compiled, handles: model.handles, id: operation.transformation.id,
    author(state) {
      state.equation.update(previous => {
        if (JSON.stringify(previous) !== JSON.stringify(operation.source)) {
          throw new KpAuthoredDistributionOperationError("kp.authoring.structural-source-gap",
            "The distribution source changed before publication.");
        }
        return operation.target;
      });
    }
  });
  const { commit } = definition.apply(input.before, input.applicationId);
  return Object.freeze({ commit, operation,
    source: pinKpSemanticSlotVersion(commit.before, model.handles.refs.equation.slotId),
    target: pinKpSemanticSlotVersion(commit.after, model.handles.refs.equation.slotId)
  });
}

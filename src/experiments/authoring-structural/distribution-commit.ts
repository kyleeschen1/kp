import type { KpAggregateSemanticSnapshot } from "../../semantic-state/aggregate-snapshot.ts";
import { defineKpAuthoredDistributionFamily } from "./distribution-family.ts";
import { pinKpSemanticSlotVersion } from "../../semantic-state/pinned-recovery.ts";
import { readKpAuthoredDistributionOperation } from "./distribution-operation.ts";

export function applyKpAuthoredDistributionOperation(
  receipt: Parameters<typeof readKpAuthoredDistributionOperation>[0],
  input: { readonly before: KpAggregateSemanticSnapshot; readonly applicationId: string }
) {
  const operation = readKpAuthoredDistributionOperation(receipt);
  operation.selection.assertCurrent(input.before);
  const { model } = operation;
  // Mathematical authority is checked before entering the ordinary atomic
  // transaction. A state update itself never certifies a structural rewrite.
  const definition = defineKpAuthoredDistributionFamily(receipt);
  const { commit } = definition.apply(input.before, { applicationId: input.applicationId,
    sourceId: operation.operationId, parameters: { operation: "distribute" } });
  return Object.freeze({ commit, operation,
    source: pinKpSemanticSlotVersion(commit.before, model.handles.refs.equation.slotId),
    target: pinKpSemanticSlotVersion(commit.after, model.handles.refs.equation.slotId)
  });
}

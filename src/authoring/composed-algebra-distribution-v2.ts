import { assertKpCheckedComposedAlgebraPrefixV2, type KpCheckedComposedAlgebraPrefixV2 } from "./composed-algebra-prefix-v2.ts";
import { normalizeKpComposedAlgebraEndpointsV2 } from "./composed-algebra-normalizer-v2.ts";
import { verifyKpComposedGroupPartition, KpComposedGroupPartitionError } from "../semantic/composed-algebra-group-partition.ts";
import { verifyKpComposedDistribution, KpComposedDistributionError } from "../semantic/composed-algebra-distribution.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";

export function checkKpComposedAlgebraDistributionV2(checked: KpCheckedComposedAlgebraPrefixV2) {
  assertKpCheckedComposedAlgebraPrefixV2(checked);
  const evaluation = checked.prefix.chain.steps[1], group = evaluation.preservedContext;
  if (group.kind !== "sum" || group.terms.length !== 2)
    throw new KpComposedAlgebraRepair("unsupported-shape", "$.states[3].latex", "Distribute over the unchanged binary sum.");
  const endpoints = normalizeKpComposedAlgebraEndpointsV2(checked.source);
  try {
    const partition = verifyKpComposedGroupPartition({ evaluation, groupId: group.id,
      memberIds: [group.terms[0]!.id, group.terms[1]!.id] });
    return verifyKpComposedDistribution({ partition, target: endpoints[3].structured });
  } catch (error) {
    if (error instanceof KpComposedGroupPartitionError || error instanceof KpComposedDistributionError)
      throw new KpComposedAlgebraRepair(error.code, "$.states[3].latex", error.message);
    throw error;
  }
}

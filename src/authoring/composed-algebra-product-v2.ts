import { assertKpCheckedComposedAlgebraPrefixV2, type KpCheckedComposedAlgebraPrefixV2 } from "./composed-algebra-prefix-v2.ts";
import { normalizeKpComposedAlgebraEndpointsV2 } from "./composed-algebra-normalizer-v2.ts";
import { checkKpComposedAlgebraDistributionV2 } from "./composed-algebra-distribution-v2.ts";
import { verifyKpComposedProductEvaluation } from "../semantic/composed-algebra-product-evaluation.ts";
import { KpComposedEvaluationError } from "../semantic/composed-algebra-evaluation.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";

export function checkKpComposedAlgebraProductV2(checked: KpCheckedComposedAlgebraPrefixV2) {
  assertKpCheckedComposedAlgebraPrefixV2(checked);
  const endpoints = normalizeKpComposedAlgebraEndpointsV2(checked.source);
  if (endpoints.length !== 5) throw new KpComposedAlgebraRepair("unsupported-shape", "$.states", "Final product evaluation requires a fifth endpoint.");
  const distribution = checkKpComposedAlgebraDistributionV2(checked);
  try { return verifyKpComposedProductEvaluation({ distribution, target: endpoints[4].structured }); }
  catch (error) {
    if (error instanceof KpComposedEvaluationError) throw new KpComposedAlgebraRepair(error.code, "$.states[4].latex", error.message);
    throw error;
  }
}

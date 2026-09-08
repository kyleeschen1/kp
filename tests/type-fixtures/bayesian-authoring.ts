import { BinaryJointModel } from "../../domains/probability/binary-joint-model.ts";
import { checkBayesDraft, createBayesDraft, type PreparedBayesDraft } from "../../src/experiments/bayesian-reasoning/draft.ts";
import { createUrnBayesDraft } from "../../src/experiments/bayesian-reasoning/urn-source.ts";
import type { BayesDisclosure } from "../../src/experiments/bayesian-reasoning/extraction.ts";

for (const source of [createBayesDraft(), createUrnBayesDraft()]) {
  const result = checkBayesDraft(JSON.stringify(source));
  if (result.status === "compiled") {
    const draft: PreparedBayesDraft = result.draft;
    const exact: bigint = draft.tree.query.value.numerator;
    void exact;
    // @ts-expect-error Compiled joint truth is immutable.
    draft.model.sourceId = "mutated";
  } else {
    const path: string = result.diagnostic.path; void path;
    // @ts-expect-error A repair cannot expose a partially compiled revision.
    result.draft;
  }
}
// @ts-expect-error Domain authority cannot be constructed outside its validator.
new BinaryJointModel();
// @ts-expect-error A reason view cannot omit its pinned parent return context.
const orphan: BayesDisclosure = { view: "reason" };
void orphan;

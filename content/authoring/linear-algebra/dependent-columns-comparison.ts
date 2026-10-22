import { dependentColumns } from "./dependent-columns.ts";
import { compareInputs } from "../../../src/math/matrix-input-comparison.ts";
import { defineComparison } from "../../../src/experiments/matrix-column-combinations/comparison-source.ts";

const relation = compareInputs(dependentColumns.product);
if (relation.kind !== "lost-difference") throw new Error("This explanation requires a nonzero lost input difference.");

export const comparison = defineComparison({
  relation,
  title: "What the matrix cannot distinguish",
  introduction: "Both inputs stay in view. Follow their difference to see why the output cannot tell them apart.",
  beats: [
    { id: "compare", text: "Two different inputs, the same output. What changed between the inputs—and why did that change disappear?", targets: [relation.inputs.before.id, relation.inputs.after.id, relation.outputs.before.id, relation.outputs.after.id] },
    { id: "subtract", text: "Subtract the first input from the second. These are copies of the same input entries above.", targets: [relation.inputs.before.id, relation.inputs.after.id] },
    { id: "difference", text: "The change is (2, −1): increase the first weight by 2 and decrease the second by 1. The input really did change.", targets: [relation.inputDifference.id] },
    { id: "contributions", text: "An increase of 2 adds twice A’s first column. A decrease of 1 subtracts its second column.", targets: [relation.inputDifference.id, ...relation.combination.terms.map(term => term.vector.id)] },
    { id: "opposites", text: "The changes are equal and opposite: (2, 4) and (−2, −4). Predict what remains when we add them.", targets: relation.combination.terms.flatMap(term => term.entries.map(entry => entry.id)) },
    { id: "zero", text: "Nothing remains. For a linear map, the output change is the map applied to the input change. Here that change maps to zero, so the two outputs agree.", targets: [relation.image.result.id, relation.outputs.before.id, relation.outputs.after.id] }
  ],
  conclusion: "The second column of A is twice its first. Adding 2 to the first input coordinate and subtracting 1 from the second therefore cancels at the output. This nonzero change belongs to the kernel: the set of input vectors mapped to zero.",
  question: "If we make the same change once more, from (5, −2) to (7, −3), what will the output be?",
  answer: "Still (1, 2). We added another (2, −1), whose two contributions cancel. This works because of the relation between A’s columns, not because every input change disappears."
});

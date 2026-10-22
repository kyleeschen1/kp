import * as M from "../../../src/math/authoring/matrices.ts";
import { compareInputs } from "../../../src/math/matrix-input-comparison.ts";
import { defineComparison } from "../../../src/experiments/matrix-column-combinations/comparison-source.ts";

const A = M.matrix("distinguished-inputs.A", [[1, 2], [2, 5]]);
const inputs = M.matrix("distinguished-inputs.inputs", [[3, 5], [-1, -2]]);
const relation = compareInputs(M.product({ id: "distinguished-inputs.product", left: A, right: inputs }));
if (relation.kind !== "distinguished-inputs") throw new Error("This explanation requires different outputs.");

export const comparison = defineComparison({
  relation,
  title: "When the difference survives",
  introduction: "Keep the same two inputs, but change the bottom-right entry of the previous matrix from 4 to 5. Does the same input change still disappear?",
  beats: [
    { id: "compare", text: "The inputs are still (3, −1) and (5, −2). This time their outputs differ. Follow the input change to find out why.", targets: [relation.inputs.before.id, relation.inputs.after.id, relation.outputs.before.id, relation.outputs.after.id] },
    { id: "subtract", text: "Subtract the first input from the second. Changing the map did not change these inputs.", targets: [relation.inputs.before.id, relation.inputs.after.id] },
    { id: "difference", text: "The change is still (2, −1): increase the first weight by 2 and decrease the second by 1.", targets: [relation.inputDifference.id] },
    { id: "contributions", text: "Twice the first column now competes with a different second column: (2, 5), not (2, 4). Will the contributions cancel completely?", targets: [relation.inputDifference.id, ...relation.combination.terms.map(term => term.vector.id)] },
    { id: "partial-cancellation", text: "The contributions are (2, 4) and (−2, −5). The first entries cancel, but the second entries leave −1.", targets: relation.combination.terms.flatMap(term => term.entries.map(entry => entry.id)) },
    { id: "output-change", text: "The output change is (0, −1). Its first coordinate is zero, but the vector is not: the outputs above differ by exactly this amount.", targets: [relation.image.result.id, relation.outputs.before.id, relation.outputs.after.id] }
  ],
  conclusion: "This map detects the input change (2, −1): its contributions no longer cancel completely. One zero output coordinate does not mean the whole change disappeared. This comparison establishes what happens to this particular difference; a claim about every possible input difference needs a further argument.",
  question: "Make the same input change again, from (5, −2) to (7, −3). Starting from output (1, 0), what output do you predict?",
  answer: "The output changes by (0, −1) again, giving (1, −1). Linearity makes the effect of this input change repeat; it does not make the effect zero."
});

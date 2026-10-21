import * as M from "../../../src/math/authoring/matrices.ts";
import type { ColumnReading } from "../../../src/experiments/matrix-column-combinations/model.ts";

const A = M.matrix("dependent-columns.A", [[1, 2], [2, 4]]);
const B = M.matrix("dependent-columns.B", [[3, 5], [-1, -2]]);

export const dependentColumns = Object.freeze({
  id: "dependent-columns",
  product: M.product({ id: "dependent-columns.AB", left: A, right: B }),
  reading: {
    title: "Information can disappear without a zero column",
    introduction: "The columns of B are two inputs: (3, −1) and (5, −2). Neither column of A is zero, so both input coordinates contribute. But A’s second column, (2, 4), is twice its first, (1, 2). Watch how different weights can still produce the same sum.",
    cues: [{
      initial: "Start with the first input, (3, −1). Its coordinates are the weights for A’s two columns.",
      columns: "The columns are (1, 2) and (2, 4). The second is twice the first; it supplies no independent direction.",
      weights: "Use 3 copies of the first column and −1 times the second. A negative weight reverses a contribution’s sign.",
      distribute: "Multiply every entry in each column by its weight. Neither contribution vanishes.",
      scaled: "The contributions are (3, 6) and (−2, −4). They partly cancel when added.",
      sum: "Add entry by entry: 3 + (−2) = 1 and 6 + (−4) = 2. The result is (1, 2).",
      placed: "Now compare the second input. Its weights differ, but the extra positive and negative contributions will cancel each other."
    }, {
      initial: "The second input is (5, −2): the first weight increased by 2 and the second decreased by 1.",
      columns: "A is unchanged: (2, 4) is still twice (1, 2). That relation makes the two weight changes compensate.",
      weights: "Use 5 copies of the first column and −2 times the second. Compare these weights with 3 and −1.",
      distribute: "Both weights reach every entry. Relative to the first input, we add 2(1, 2) and subtract (2, 4).",
      scaled: "The contributions are now (5, 10) and (−4, −8). Each changed, but their changes cancel exactly.",
      sum: "Add entry by entry: 5 + (−4) = 1 and 10 + (−8) = 2. Again the result is (1, 2).",
      placed: "Different inputs, equal outputs. The map cannot distinguish a change of (2, −1) in its input."
    }],
    conclusion: [
      "The two calculations use nonzero contributions throughout: (3, 6) + (−2, −4) and (5, 10) + (−4, −8). Both sums are (1, 2). Information loss does not require a zero column.",
      "The second column is twice the first. For any input (x, y), the output is x(1, 2) + y(2, 4) = (x + 2y)(1, 2). The map retains the combined weight x + 2y, rather than the two weights separately. This relationship between the columns is called linear dependence.",
      "Increasing x by 2 and decreasing y by 1 leaves x + 2y unchanged: the added 2(1, 2) cancels the subtracted (2, 4). So every input can be changed by (2, −1) without changing its output. The output alone cannot recover the original input; reverse playback is not a mathematical inverse."
    ],
    question: {
      prompt: "Without replaying, where do (7, −3) and (7, −2) go? Which shares the output above, and why?",
      answer: "For (7, −3), the combined weight is 7 + 2(−3) = 1, giving (1, 2). For (7, −2), it is 7 + 2(−2) = 3, giving (3, 6). Some changes cancel; changing an input arbitrarily does not preserve its output."
    }
  } satisfies ColumnReading
});

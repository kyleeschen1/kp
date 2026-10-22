import { dependentColumns } from "./dependent-columns.ts";
import { walk } from "../../../src/experiments/matrix-column-combinations/walk.ts";

// The argument chooses stops and returns. All intervening motion belongs to the
// existing column-combination presentation, including its native endpoints.
export const dependentColumnsWalk = walk(dependentColumns.product, dependentColumns.reading, [
  { id: "whole", column: 0, at: "initial", text: "Two different inputs: (3, −1) and (5, −2). Can this matrix distinguish them? Start with the first." },
  { id: "first-weights", column: 0, at: "weights", text: "The first input supplies weights 3 and −1. They multiply the two columns of A." },
  { id: "first-contributions", column: 0, at: "scaled", text: "Pause here: (3, 6) and (−2, −4) are the two contributions. Both are nonzero. What will their sum be?" },
  { id: "first-result", column: 0, at: "placed", text: "The first result is (1, 2). Keep that result in mind as we return to the original equation." },
  { id: "return", column: 0, at: "initial", text: "Rewind the explanation to the original equation. This undoes the display, not the mathematical map. Next, inspect the second input." },
  { id: "second-weights", column: 1, at: "weights", text: "Now the weights are 5 and −2. Compared with the first input, one weight increased by 2 and the other decreased by 1." },
  { id: "second-contributions", column: 1, at: "scaled", text: "The contributions changed to (5, 10) and (−4, −8). Their changes cancel: 2 times A’s first column is exactly its second column." },
  { id: "same-result", column: 1, at: "placed", text: "Again, (1, 2). The two different inputs produced the same output because A’s columns are dependent. The output cannot tell us which input we used." }
]);

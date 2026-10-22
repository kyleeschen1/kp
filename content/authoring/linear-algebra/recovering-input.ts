import { defineArgument, text, math, inspect, question } from "../../../src/experiments/matrix-column-combinations/argument.ts";
import { columnExampleFromProduct, numberOf } from "../../../src/experiments/matrix-column-combinations/model.ts";
import type { KpScalarValue } from "../../../src/math/typed-semantic-math.ts";
import { dependentColumns } from "./dependent-columns.ts";
import { comparison as lost } from "./dependent-columns-comparison.ts";
import { comparison as distinguished } from "./distinguished-inputs-comparison.ts";

const vector = (entries: readonly KpScalarValue[]) => String.raw`\begin{bmatrix}${entries.map(numberOf).join(String.raw`\\`)}\end{bmatrix}`;
const matrix = (rows: readonly (readonly KpScalarValue[])[]) => String.raw`\begin{bmatrix}${rows.map(row => row.map(numberOf).join("&")).join(String.raw`\\`)}\end{bmatrix}`;
const { product, inputs, outputs, inputDifference, combination } = lost.relation;
const c1 = vector(product.leftParts.column(0).entries), c2 = vector(product.leftParts.column(1).entries);
const delta = vector(inputDifference.rows.map(row => row[0]!));

// The general argument below is authored algebra, not a solver certificate.
// Pin its premise to the actual displayed map so a changed source cannot retain
// the old retained-weight claim. Numerical illustrations use the product owner.
if (product.left.rows.some((row, i) => numberOf(row[0]!) !== i + 1 || numberOf(row[1]!) !== 2 * (i + 1)))
  throw new Error("The recovery argument requires A = [[1,2],[2,4]]. Revise its algebra when changing the map.");

export const recoveringInput = defineArgument({
  id: "recovering-input",
  title: "What can an output tell you about its input?",
  introduction: "A matrix can combine two input coordinates into an output without keeping enough information to recover them separately. Let’s find exactly what survives in one example.",
  sections: [
    { id: "what-survives", title: "The output keeps a combined weight", blocks: [
      text("Start with a pair of real numbers, x and y. To apply A, use x as the weight of its first column and y as the weight of its second, then add. You only need scalar multiplication and vector addition for this reading."),
      math(`A=${matrix(product.left.rows)}`),
      math(String.raw`A\begin{bmatrix}x\\y\end{bmatrix}=x${c1}+y${c2}`),
      text("The second column is twice the first. So y copies of the second contribute exactly as much as 2y copies of the first. Both contributions lie along the same direction; their combined weight is x + 2y."),
      math(String.raw`x${c1}+y${c2}=(x+2y)${c1}`),
      text("This tells us what the map remembers: the sum x + 2y. The output does not keep a separate record of how much each coordinate contributed."),
      inspect({ id: "column-weights", label: "Inspect how the input coordinates weight the columns", kind: "columns",
        context: "Here the two example inputs, (3, −1) and (5, −2), are stored as the columns of a matrix B. Follow B’s first column: its coordinates supply the two weights, and the sum becomes the first column of AB.",
        scene: columnExampleFromProduct(dependentColumns.product, 0, dependentColumns.reading) })
    ] },
    { id: "same-output", title: "Different inputs can leave the same record", blocks: [
      text("For (3, −1), the combined weight is 3 − 2 = 1. For (5, −2), it is 5 − 4 = 1. Both therefore produce the same output, although their individual contributions differ."),
      math(`A${vector(inputs.before.entries)}=${vector(outputs.before.entries)},\\qquad A${vector(inputs.after.entries)}=${vector(outputs.after.entries)}`),
      text("What changed between those inputs? The first coordinate increased by 2 and the second decreased by 1. The extra twice-first-column contribution is cancelled by removing one second column."),
      math(`A${delta}=2${c1}-${c2}=${vector(combination.result.entries)}`),
      text("Call the original input u and this change d. Because matrix multiplication distributes over addition, the effect of the change can be calculated on its own. Adding d to any input adds zero to its output. That is why the equality above is structural, rather than a numerical accident."),
      math(String.raw`A(u+d)=Au+Ad,\qquad d=${delta},\quad Ad=\mathbf{0}`),
      inspect({ id: "lost-change", label: "Inspect why this nonzero input change disappears", kind: "comparison", source: lost,
        context: "The two inputs are labelled u and v. Their mappings stay above the working line as we subtract the inputs and follow the change through A." })
    ] },
    { id: "recover-a-relation", title: "You can recover a relation, but not a unique input", blocks: [
      text("Now suppose someone gives you only the output (1, 2). Since every output is (x + 2y) times (1, 2), you know that x + 2y must equal 1. That is useful information—but it is only one condition on two unknowns."),
      math(String.raw`x+2y=1\quad\Longleftrightarrow\quad x=1-2y`),
      text("Choose any real value t for y; x is then forced to be 1 − 2t. Every input in this family produces the given output. Conversely, any input producing (1, 2) must satisfy that same equation, so the family contains all of them."),
      math(String.raw`\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}1-2t\\t\end{bmatrix},\qquad t\in\mathbb{R}`),
      text("The inputs we compared are the choices t = −1 and t = −2. There are infinitely many others. In a system of equations, this is what a free variable means: the output constrains how the variables relate without determining each one separately."),
      question("Which of (7, −3) and (7, −2) also produces (1, 2)? Decide from the combined weight, without opening another calculation.",
        "(7, −3) does: 7 + 2(−3) = 1. For (7, −2), the weight is 3, so its output is (3, 6). Information loss does not mean that every input has the same output."),
      text("There is a second restriction: every possible output has its second coordinate twice its first. An output such as (1, 3) is impossible for this A. Depending on the requested output, this map gives either no solution or infinitely many—not a unique solution.")
    ] },
    { id: "a-different-map", title: "The same change need not disappear in another map", blocks: [
      text("Change just the bottom-right entry of A from 4 to 5. The columns no longer cancel when we add twice the first and subtract the second. Keep the very same input change so we can isolate what the map changed."),
      math(`\\widetilde A=${matrix(distinguished.relation.product.left.rows)},\\qquad \\widetilde A${delta}=${vector(distinguished.relation.combination.result.entries)}`),
      text("The first output coordinate still agrees, but the second changes by −1. A zero coordinate is not a zero vector. This calculation shows that the new map detects this particular change; showing that it distinguishes every pair would require a further argument."),
      inspect({ id: "surviving-change", label: "Inspect the same input change in the altered map", kind: "comparison", source: distinguished,
        context: "This inspection labels the altered map A. Its bottom-right entry is 5; the inputs u and v are unchanged. Follow their difference to see which output coordinate changes." }),
      text("A nonzero input change that maps to zero is a lost direction. The collection of all inputs mapped to zero is called the kernel. The useful question behind the name is: which changes could have happened to the input without leaving any trace in the output?")
    ] }
  ]
});

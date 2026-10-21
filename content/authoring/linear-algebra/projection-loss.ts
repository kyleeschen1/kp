import * as M from "../../../src/math/authoring/matrices.ts";
import type { ColumnReading } from "../../../src/experiments/matrix-column-combinations/model.ts";

const A = M.matrix("projection-loss.A", [[1, 0], [0, 0]]);
const B = M.matrix("projection-loss.B", [[3, 3], [2, -1]]);

const cues = (column: "first" | "second", y: string) => ({
  initial: `The ${column} column of B is the input vector (3, ${y}). Follow what A does to it.`,
  columns: "Read A by columns: the first coordinate will weight (1, 0); the second will weight (0, 0).",
  weights: `The input supplies the weights: 3 for the first column and ${y} for the second.`,
  distribute: "Each weight multiplies every entry of its column. Follow the second weight into the two zeros.",
  scaled: `${y} times (0, 0) is (0, 0). The second coordinate contributes nothing to this output.`,
  sum: "Add the contributions: (3, 0) plus (0, 0) gives (3, 0).",
  placed: `This is the ${column} result column. Compare the other input: its second coordinate differs, but its output is also (3, 0).`
});

export const projectionLoss = Object.freeze({
  id: "projection-loss",
  product: M.product({ id: "projection-loss.AB", left: A, right: B }),
  reading: {
    title: "Two different inputs, one output",
    introduction: "The columns of B are two input vectors: (3, 2) and (3, −1). Multiplying by A acts on each separately. A result column is a weighted sum of A’s columns, using that input’s coordinates as the weights. Follow each contribution to see why these different inputs become indistinguishable.",
    cues: [cues("first", "2"), cues("second", "−1")],
    conclusion: [
      "Both calculations end at (3, 0). The inputs agree in their first coordinate; their differing second coordinates multiply A’s zero column. That is exactly where the distinction stops affecting the output.",
      "The same reasoning works for any input: its first coordinate weights the first column, and its second coordinate weights zero. This map is a projection onto the horizontal axis. It preserves the first coordinate and discards the second, whatever their values.",
      "Knowing the output (3, 0) cannot tell you which second coordinate the input had. There is no unique inverse for this map. Reversing the animation can show the original input only because the player has kept it; reverse playback is not a mathematical inverse."
    ],
    question: {
      prompt: "Without replaying, where would (3, 7) and (4, 2) go? Explain why only one shares the output above.",
      answer: "They go to (3, 0) and (4, 0). Changing only the second coordinate leaves the output unchanged; changing the first coordinate changes the surviving contribution. This map loses some distinctions, not all of them."
    }
  } satisfies ColumnReading
});

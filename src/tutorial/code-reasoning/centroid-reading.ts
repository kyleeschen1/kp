import type { KpCentroidExtractionState } from "../../semantic/centroid-extraction-model.ts";

/** Editorial explanations reference the existing native checkpoints. They do
 * not infer token correspondence or supply another motion timeline. */
export const centroidReading = [
  { id: "original", title: "Follow the whole calculation",
    cue: "Start with the sum, the loop, and the division together. The caller needs the resulting average, stored in `cx`.",
    question: "Why extract all three parts?",
    detail: "The division needs both the completed sum and the length of the same array. Moving only the division would leave the repeated accumulation in each caller. The reusable unit is the procedure that takes one array, visits its values, and produces its average.\n\nHere `xs` supplies the input, `sx` carries the local work, and `cx` receives the answer. Keep those three roles in view as the boundary moves." },
  { id: "extracted", title: "Keep the input and answer connected",
    cue: "The sum and loop now live in `mean`. The caller passes `xs`; `return` carries the division's result back to `cx`.",
    question: "What crosses the new boundary?",
    detail: "The input enters through the helper's parameter. The sum and loop belong inside that helper, because they exist to calculate this one answer. The caller keeps the assignment that tells us what the answer means.\n\n`return` does not create another calculation: it makes the existing division's value available to the caller. This view shows how the source is reorganized, not the order in which a running program executes its instructions." },
  { id: "generalized", title: "Make the names local to the procedure",
    cue: "Inside the helper, `xs`, `sx`, and `x` become `vs`, `s`, and `v`. The caller still supplies `xs` and names its answer `cx`.",
    question: "Does the second call share the sum?",
    detail: "No. Each call starts a fresh local `s` at zero. `mean(xs)` and `mean(ys)` share the procedure, while their inputs and local work remain separate. The parameter name describes the helper's role, rather than one coordinate direction.\n\nThe loop visits the supplied values in the same order and performs the same additions and division. The larger centroid calculation can now say what it means: average each coordinate. You can still recover the mechanics by inspecting this helper." }
] as const satisfies readonly { id: KpCentroidExtractionState["id"]; title: string; cue: string; question: string; detail: string }[];

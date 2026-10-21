import instruction from "../../tutorial/kinetic-figure-typescript-focus-card/typescript-instruction.generated.json" with { type: "json" };

export function createCodeReasoningSource() {
  return { title: "One decision, two callers", statement: "The two callers can share a named threshold decision.",
    explanation: "Name the helper, move the decision, then replace each caller. Check behavior at the declared threshold cases.",
    sourceRevisionId: "free-shipping.before.v1", targetRevisionId: "free-shipping.after.v1",
    stageIds: instruction.score.beats.map(beat => beat.stageId) };
}

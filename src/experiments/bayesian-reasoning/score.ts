import type { BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { requireBinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { encodeKpHtmlText as escape } from "../../rendering/html-output-encoding.ts";

export function createBayesScore(trace: BinaryProbabilityTrace) {
  requireBinaryProbabilityTrace(trace);
  const [a, b] = trace.model.events;
  const initial = trace.states[2]!;
  if (initial.kind !== "tree") throw new Error("Bayes score requires the bounded tree trace.");
  const first = initial.tree.first === 0 ? "A" : "B", second = initial.tree.second === 0 ? "A" : "B";
  const passages = [
    ["Start with the whole population", `Let A mean “${a.label}” and B mean “${b.label}”. The model specifies four disjoint joint outcomes. We will ask: among B, how common is A?`],
    ["Split on the first event", `Split the population into ${first} and not ${first}. Each first branch is a marginal probability—not an assumption that the events are independent.`],
    ["Complete the joint tree", `Split each branch into ${second} and not ${second}. Multiply along a path to obtain a joint probability. Each leaf names one outcome in the same population.`],
    ["Collapse to the evidence", `Gather A ∩ B and not A ∩ B. Their sum is P(B): the denominator we need. Gathering has not yet changed the reference population.`],
    ["Condition: among B, how many are A?", `Now restrict the reference population to B. P(A | B) is the joint mass P(A ∩ B) divided by P(B). The ink evaluation reduces this exact ratio.`],
    ["Return to the whole population", `Restore the original population before changing the tree order. The conditional answer remains valid; we have changed which population we are inspecting.`],
    ["Flip the question, not the facts", `Branch on ${second} first, then ${first}. The same joint outcomes have new tree positions. P(A | B) ${second === "B" ? "is now" : "was previously"} a branch label. This refactor does not reverse causation.`]
  ];
  return Object.freeze(trace.states.map((state, index) => Object.freeze({ id: state.id, slug: state.id.split(".").at(-1)!,
    title: passages[index]![0]!, html: `<p>${escape(passages[index]![1]!)}</p>`, progress: index / (trace.states.length - 1) })));
}

import { assertKpComposedAlgebraPresentationV2, type KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import { projectKpStructuredScalarLatex } from "../../semantic/structured-scalar-latex.ts";

const brand = Symbol("composed-algebra-subexplanation");
const issued = new WeakSet<object>();
export interface KpComposedAlgebraSubexplanation {
  readonly [brand]: true;
  readonly parent: KpComposedAlgebraPresentationV2;
  readonly kind: "collect" | "distribute";
  readonly question: string;
  readonly setup: string;
  readonly answer: string;
  readonly range: readonly [number, number];
  readonly sourceId: string;
  readonly revisionId: string;
  readonly references: readonly { readonly sourceId: string; readonly revisionId: string; readonly id: string }[];
}
/** Editorial windows reference the existing checked explanation. They do not
 * create operations, copy an animation, or establish a general intuition ontology. */
export function projectComposedAlgebraSubexplanations(draft: KpComposedAlgebraPresentationV2): readonly KpComposedAlgebraSubexplanation[] {
  assertKpComposedAlgebraPresentationV2(draft);
  const source = draft.checked.source, group = projectKpStructuredScalarLatex(draft.checked.chain.steps[0].factor, "display");
  const count = draft.checked.chain.steps[1].result.value;
  const definitions = [
    { kind: "collect" as const, range: [0, 2] as const, question: "Why can we combine the counts of a repeated group?",
      setup: `Read ${group} as one whole quantity. The integers multiplying it count copies of that same quantity.`,
      answer: `Add the counts, not the contents of the group. The unchanged group is counted ${count} times. No division is needed, even if the group equals zero.` },
    { kind: "distribute" as const, range: [2, source.states.length - 1] as const, question: "Where does every contribution go when we expand?",
      setup: `Begin with ${count} copies of the whole group ${group}. Each copy contains both terms inside the parentheses.`,
      answer: `Each term receives the same count, ${count}. Expanding changes the grouping, not the total contribution.` +
        (draft.checked.chain.extent === "evaluated" ? " Evaluating a constant product leaves the other contribution intact." : " Both distributed contributions remain explicit.") }
  ];
  return Object.freeze(definitions.map(definition => {
    const [start, end] = definition.range;
    const ids = [...source.states.slice(start, end + 1).map(state => state.id), ...draft.animation.transformations.slice(start, end).map(step => step.id)];
    const reference: KpComposedAlgebraSubexplanation = Object.freeze({ [brand]: true as const, parent: draft, ...definition,
      range: Object.freeze(definition.range), sourceId: source.id, revisionId: draft.revisionId,
      references: Object.freeze(ids.map(id => Object.freeze({ sourceId: source.id, revisionId: draft.revisionId, id }))) });
    issued.add(reference);
    return reference;
  }));
}
export function assertComposedAlgebraSubexplanation(reference: unknown, draft: KpComposedAlgebraPresentationV2): asserts reference is KpComposedAlgebraSubexplanation {
  assertKpComposedAlgebraPresentationV2(draft);
  if (!reference || typeof reference !== "object" || !issued.has(reference) || (reference as KpComposedAlgebraSubexplanation).parent !== draft)
    throw new TypeError("Use an issued sub-explanation from this exact prepared source revision.");
}

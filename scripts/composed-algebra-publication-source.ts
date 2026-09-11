import { checkKpComposedAlgebraDraft } from "../src/authoring/composed-algebra-session.ts";
import { checkKpComposedAlgebraDraftV2 } from "../src/authoring/composed-algebra-session-v2.ts";
import { projectComposedAlgebraReading, projectComposedAlgebraReadingV2 } from "../src/experiments/composed-algebra/readings.ts";
import { projectComposedAlgebraPrompts, projectComposedAlgebraPromptsV2 } from "../src/experiments/composed-algebra/practice.ts";
import { projectComposedAlgebraSubexplanations } from "../src/experiments/composed-algebra/subexplanations.ts";

function v1(text: string) {
  const result = checkKpComposedAlgebraDraft(text);
  if (result.status !== "compiled") throw new Error(`${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`);
  const draft = result.draft;
  return { draft, full: projectComposedAlgebraReading(draft, "full"), compact: projectComposedAlgebraReading(draft, "compact"),
    prompts: projectComposedAlgebraPrompts(draft), questions: [], version: "1" };
}
function v2(text: string) {
  const result = checkKpComposedAlgebraDraftV2(text);
  if (result.status !== "compiled") throw new Error(`${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`);
  const draft = result.draft;
  return { draft, full: projectComposedAlgebraReadingV2(draft, "full"), compact: projectComposedAlgebraReadingV2(draft, "compact"),
    prompts: projectComposedAlgebraPromptsV2(draft), version: "2",
    questions: projectComposedAlgebraSubexplanations(draft).map(ref => ({ kind: ref.kind, question: ref.question, setup: ref.setup, answer: ref.answer,
      revisionId: ref.revisionId, references: ref.references, states: draft.checked.source.states.slice(ref.range[0], ref.range[1] + 1),
      prompts: projectComposedAlgebraPromptsV2(draft, ref).map(p => ({ kind: p.kind, card: p.card, answerLatex: p.answerLatex, answerExplanation: p.answerExplanation })) })) };
}
type Prepared = ReturnType<typeof v1> | ReturnType<typeof v2>;
const compilers = new Map<string, (text: string) => Prepared>([["kp.composed-algebra-source.v1", v1], ["kp.composed-algebra-source.v2", v2]]);
export function prepareComposedAlgebraPublicationSource(text: string): Prepared {
  if (text.length > 20_000) throw new Error("Keep source below 20,000 characters.");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("Provide valid composed algebra JSON."); }
  const schema = value && typeof value === "object" && "schemaVersion" in value ? value.schemaVersion : undefined;
  const compiler = typeof schema === "string" ? compilers.get(schema) : undefined;
  if (!compiler) throw new Error("Select a registered composed algebra source version; no publication fallback is available.");
  // Version selection chooses a checker, never grants semantic authority.
  return compiler(text);
}

import { type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { marginalProbability } from "../../../domains/probability/binary-probability-queries.ts";
import { projectBayesTraceContext } from "./context-facts.ts";
import { formatBayesMass as mass } from "./tree-svg.ts";
import { createBayesDisplayUnits } from "./display-units.ts";
import { readBayesEditorialSource, type BayesEditorialText, type BayesEditorialPrompt, type BayesEditorialFactName } from "./editorial-source.ts";

export function projectBayesEditorialFacts(trace: BinaryProbabilityTrace): Readonly<Record<BayesEditorialFactName, string>> {
  const context = projectBayesTraceContext(trace), model = trace.model, display = createBayesDisplayUnits(model);
  const [tt, tf, ft, ff] = model.outcomes;
  const flagged = marginalProbability(model, { eventId: model.events[1].id, occurs: true });
  return Object.freeze({ "event.a": model.events[0].label, "event.not-a": model.events[0].complementLabel,
    "event.b": model.events[1].label, "event.not-b": model.events[1].complementLabel,
    prior: mass(marginalProbability(model, { eventId: model.events[0].id, occurs: true }).mass),
    "joint.tt": mass(tt.mass), "joint.tf": mass(tf.mass), "joint.ft": mass(ft.mass), "joint.ff": mass(ff.mass),
    numerator: context.facts.numerator, denominator: context.facts.denominator, posterior: context.facts.posterior,
    population: String(display.unit), "count.tt": String(display.count(tt.mass)), "count.tf": String(display.count(tf.mass)),
    "count.ft": String(display.count(ft.mass)), "count.ff": String(display.count(ff.mass)), "count.flagged": String(display.count(flagged.mass)) });
}

/** Resolve only literal text and an enumerated fact vocabulary. This binds prose
 * to verified references; it does not certify the prose's pedagogical claims. */
export function bindBayesEditorial(trace: BinaryProbabilityTrace, value: unknown) {
  const facts = projectBayesEditorialFacts(trace), source = readBayesEditorialSource(value);
  source.passages.forEach((passage, index) => {
    if (passage.stateId !== trace.states[index]?.id) throw new ProbabilityRepairGap("probability.reference",
      `$.editorial.passages[${index}].stateId`, "Reference this model's seven existing states exactly once, in semantic order.");
  });
  const text = (parts: BayesEditorialText) => parts.map(part => typeof part === "string" ? part : facts[part.fact]).join("");
  const prompt = (value: BayesEditorialPrompt) => Object.freeze({ title: value.title, body: text(value.body) });
  return Object.freeze({ source, title: source.title, setup: text(source.setup),
    passages: Object.freeze(source.passages.map(passage => Object.freeze({ stateId: passage.stateId, title: passage.title, body: text(passage.body) }))),
    readings: Object.freeze({ full: Object.freeze(source.readings.full.map(text)), compact: Object.freeze(source.readings.compact.map(text)) }),
    denominator: text(source.denominator), prompts: Object.freeze({ prediction: prompt(source.prompts.prediction), reconstruction: prompt(source.prompts.reconstruction) }) });
}
export type BoundBayesEditorial = ReturnType<typeof bindBayesEditorial>;

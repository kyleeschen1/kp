import { type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { marginalProbability, conditionalProbability, PositiveProbabilityPopulation } from "../../../domains/probability/binary-probability-queries.ts";
import { projectBayesTraceContext } from "./context-facts.ts";
import { formatBayesMass as mass } from "./tree-svg.ts";
import { createBayesDisplayUnits } from "./display-units.ts";
import { readBayesEditorialSource, type BayesEditorialText, type BayesEditorialPrompt, type BayesEditorialFactName } from "./editorial-source.ts";

export function projectBayesEditorialFacts(trace: BinaryProbabilityTrace): Readonly<Record<BayesEditorialFactName, string | undefined>> {
  const context = projectBayesTraceContext(trace), model = trace.model, display = createBayesDisplayUnits(model);
  const [tt, tf, ft, ff] = model.outcomes;
  const flagged = marginalProbability(model, { eventId: model.events[1].id, occurs: true });
  // An absent starting group has no conditional rate. Reject only an authored
  // request for that rate; do not outlaw valid zero-support joint models.
  const rate = (occurs: boolean) => {
    const population = PositiveProbabilityPopulation.from(model, { eventId: model.events[0].id, occurs });
    return population.status === "repair-gap" ? undefined
      : mass(conditionalProbability(model, { eventId: model.events[1].id, occurs: true }, population.population).value);
  };
  return Object.freeze({ "event.a": model.events[0].label, "event.not-a": model.events[0].complementLabel,
    "event.b": model.events[1].label, "event.not-b": model.events[1].complementLabel,
    prior: mass(marginalProbability(model, { eventId: model.events[0].id, occurs: true }).mass),
    "likelihood.a": rate(true), "likelihood.not-a": rate(false),
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
  const text = (parts: BayesEditorialText, path: string) => parts.map((part, index) => {
    if (typeof part === "string") return part;
    const fact = facts[part.fact];
    if (fact === undefined) throw new ProbabilityRepairGap("probability.reference", `${path}[${index}].fact`,
      "This conditional rate requires a positive starting population. Remove the reference or supply a model where that group exists.");
    return fact;
  }).join("");
  const prompt = (value: BayesEditorialPrompt, kind: "prediction" | "reconstruction") => Object.freeze({ title: value.title,
    body: text(value.body, `$.editorial.prompts.${kind}.body`) });
  const reading = (mode: "full" | "compact") => Object.freeze(source.readings[mode].map((parts, index) => text(parts, `$.editorial.readings.${mode}[${index}]`)));
  return Object.freeze({ source, title: source.title, setup: text(source.setup, "$.editorial.setup"),
    passages: Object.freeze(source.passages.map((passage, index) => Object.freeze({ stateId: passage.stateId, title: passage.title,
      body: text(passage.body, `$.editorial.passages[${index}].body`) }))),
    readings: Object.freeze({ full: reading("full"), compact: reading("compact") }),
    denominator: text(source.denominator, "$.editorial.denominator"), prompts: Object.freeze({ prediction: prompt(source.prompts.prediction, "prediction"),
      reconstruction: prompt(source.prompts.reconstruction, "reconstruction") }) });
}
export type BoundBayesEditorial = ReturnType<typeof bindBayesEditorial>;

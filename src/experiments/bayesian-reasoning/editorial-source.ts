import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";

export const bayesEditorialFactNames = [
  "event.a", "event.not-a", "event.b", "event.not-b", "prior", "likelihood.a", "likelihood.not-a",
  "joint.tt", "joint.tf", "joint.ft", "joint.ff", "numerator", "denominator", "posterior",
  "population", "count.tt", "count.tf", "count.ft", "count.ff", "count.flagged"
] as const;
export type BayesEditorialFactName = typeof bayesEditorialFactNames[number];
export type BayesEditorialText = readonly (string | { readonly fact: BayesEditorialFactName })[];
export interface BayesEditorialPassage {
  readonly stateId: string;
  readonly title: string;
  readonly body: BayesEditorialText;
}
export interface BayesEditorialPrompt {
  readonly title: string;
  readonly body: BayesEditorialText;
}
export interface BayesEditorialSource {
  readonly title: string;
  readonly setup: BayesEditorialText;
  readonly passages: readonly BayesEditorialPassage[];
  readonly readings: { readonly full: readonly BayesEditorialText[]; readonly compact: readonly BayesEditorialText[] };
  readonly denominator: BayesEditorialText;
  readonly prompts: { readonly prediction: BayesEditorialPrompt; readonly reconstruction: BayesEditorialPrompt };
}
type Teaching = { readonly firstEventId: string; readonly detailLevel: "complete" | "key-steps" };
export type BayesSourceEnvelope =
  | { readonly schemaVersion: "kp.bayes-source.v1"; readonly model: unknown; readonly teaching: Teaching; readonly editorial?: never }
  | { readonly schemaVersion: "kp.bayes-source.v2"; readonly model: unknown; readonly teaching: Teaching; readonly editorial: BayesEditorialSource };

function gap(path: string, expected: string): never { throw new ProbabilityRepairGap("probability.source", path, expected); }
function object(value: unknown, names: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) gap(path, "Provide an object.");
  const record = value as Record<string, unknown>;
  const extra = Object.keys(record).find(key => !names.includes(key));
  if (extra) gap(`${path}.${extra}`, "Unsupported author field. Author prose and explicit facts, not answers, geometry, timing or proof.");
  if (names.some(key => !Object.hasOwn(record, key))) gap(path, `Provide exactly: ${names.join(", ")}.`);
  return record;
}
function text(value: unknown, path: string, limit = 1000): string {
  if (typeof value !== "string" || !value.trim() || value.length > limit)
    gap(path, `Provide nonblank literal text of at most ${limit} characters.`);
  return value;
}
function array(value: unknown, path: string, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum)
    gap(path, `Provide between 1 and ${maximum} items.`);
  return value;
}
function isFact(value: unknown): value is BayesEditorialFactName {
  return bayesEditorialFactNames.some(name => name === value);
}
function inline(value: unknown, path: string): BayesEditorialText {
  return Object.freeze(array(value, path, 32).map((part, index) => {
    const at = `${path}[${index}]`;
    if (typeof part === "string") return text(part, at);
    const node = object(part, ["fact"], at), fact = node["fact"];
    if (!isFact(fact)) gap(`${at}.fact`, `Select an existing fact: ${bayesEditorialFactNames.join(", ")}.`);
    return Object.freeze({ fact });
  }));
}
function prompt(value: unknown, path: string): BayesEditorialPrompt {
  const record = object(value, ["title", "body"], path);
  return Object.freeze({ title: text(record["title"], `${path}.title`, 120), body: inline(record["body"], `${path}.body`) });
}
export function readBayesEditorialSource(value: unknown): BayesEditorialSource {
  const at = "$.editorial", record = object(value, ["title", "setup", "passages", "readings", "denominator", "prompts"], at);
  const passages = array(record["passages"], `${at}.passages`, 7);
  if (passages.length !== 7) gap(`${at}.passages`, "Provide one passage for each of the seven existing semantic stops.");
  const readings = object(record["readings"], ["full", "compact"], `${at}.readings`);
  const prompts = object(record["prompts"], ["prediction", "reconstruction"], `${at}.prompts`);
  const paragraph = (mode: "full" | "compact") => Object.freeze(array(readings[mode], `${at}.readings.${mode}`, 12)
    .map((item, index) => inline(item, `${at}.readings.${mode}[${index}]`)));
  return Object.freeze({ title: text(record["title"], `${at}.title`, 160), setup: inline(record["setup"], `${at}.setup`),
    passages: Object.freeze(passages.map((item, index) => {
      const path = `${at}.passages[${index}]`, passage = object(item, ["stateId", "title", "body"], path);
      return Object.freeze({ stateId: text(passage["stateId"], `${path}.stateId`, 320),
        title: text(passage["title"], `${path}.title`, 120), body: inline(passage["body"], `${path}.body`) });
    })),
    readings: Object.freeze({ full: paragraph("full"), compact: paragraph("compact") }),
    denominator: inline(record["denominator"], `${at}.denominator`),
    prompts: Object.freeze({ prediction: prompt(prompts["prediction"], `${at}.prompts.prediction`),
      reconstruction: prompt(prompts["reconstruction"], `${at}.prompts.reconstruction`) }) });
}

/** Syntax is not a prepared model: the domain compiler must still validate model,
 * trace references and every fact before this source can acquire Apply authority. */
export function readBayesSourceEnvelope(value: unknown): BayesSourceEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) gap("$", "Provide an object.");
  const version = (value as Record<string, unknown>)["schemaVersion"];
  if (version !== "kp.bayes-source.v1" && version !== "kp.bayes-source.v2")
    gap("$.schemaVersion", "Use kp.bayes-source.v1 or kp.bayes-source.v2.");
  const record = object(value, version === "kp.bayes-source.v1" ? ["schemaVersion", "model", "teaching"]
    : ["schemaVersion", "model", "teaching", "editorial"], "$");
  const teaching = object(record["teaching"], ["firstEventId", "detailLevel"], "$.teaching");
  const detailLevel = teaching["detailLevel"];
  if (detailLevel !== "complete" && detailLevel !== "key-steps") gap("$.teaching.detailLevel", "Choose complete or key-steps.");
  const base = { model: record["model"], teaching: Object.freeze({
    firstEventId: text(teaching["firstEventId"], "$.teaching.firstEventId", 160), detailLevel }) };
  if (version === "kp.bayes-source.v1") return Object.freeze({ ...base, schemaVersion: version });
  return Object.freeze({ ...base, schemaVersion: version, editorial: readBayesEditorialSource(record["editorial"]) });
}

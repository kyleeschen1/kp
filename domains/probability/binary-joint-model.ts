import { addKpRationals, createKpRational, equalKpRationals, multiplyKpRationals, subtractKpRationals,
  type KpNormalizedRational } from "../math/exact-rational.ts";

export type BinaryAxis = 0 | 1;
export type BinaryOutcomeKey = "tt" | "tf" | "ft" | "ff";
export interface ProbabilityEvent {
  readonly id: string;
  readonly label: string;
  readonly complementLabel: string;
}
export interface BinaryOutcome {
  readonly key: BinaryOutcomeKey;
  readonly id: string;
  readonly values: readonly [boolean, boolean];
  readonly mass: KpNormalizedRational;
}
export interface ProbabilityRepairDiagnostic {
  readonly code: "probability.source" | "probability.mass" | "probability.total" | "probability.reference" | "probability.undefined-condition";
  readonly path: string;
  readonly expected: string;
}
export class ProbabilityRepairGap extends Error {
  readonly diagnostic: ProbabilityRepairDiagnostic;
  constructor(code: ProbabilityRepairDiagnostic["code"], path: string, expected: string) {
    super(`${path}: ${expected}`);
    this.diagnostic = Object.freeze({ code, path, expected });
  }
}

const one = createKpRational(1n);
const issued = new WeakSet<BinaryJointModel>();
const authority = Symbol("validated binary joint distribution");

/** Four disjoint outcomes are the truth. A tree order is a downstream view. */
export class BinaryJointModel {
  readonly sourceId: string;
  readonly events: readonly [ProbabilityEvent, ProbabilityEvent];
  readonly outcomes: readonly [BinaryOutcome, BinaryOutcome, BinaryOutcome, BinaryOutcome];
  #validated = true;
  private constructor(token: symbol, sourceId: string, events: readonly [ProbabilityEvent, ProbabilityEvent],
    masses: readonly [KpNormalizedRational, KpNormalizedRational, KpNormalizedRational, KpNormalizedRational]) {
    if (token !== authority) throw new ProbabilityRepairGap("probability.source", "$", "Use the validated source constructor.");
    this.sourceId = sourceId;
    this.events = Object.freeze(events);
    const outcome = (key: BinaryOutcomeKey, a: boolean, b: boolean, mass: KpNormalizedRational): BinaryOutcome =>
      Object.freeze({ key, id: `${sourceId}.outcome.${key}`, values: Object.freeze([a, b] as const), mass });
    this.outcomes = Object.freeze([outcome("tt", true, true, masses[0]), outcome("tf", true, false, masses[1]),
      outcome("ft", false, true, masses[2]), outcome("ff", false, false, masses[3])]);
    issued.add(this);
    Object.freeze(this);
  }
  static require(model: BinaryJointModel): void {
    if (!issued.has(model) || !model.#validated) throw new ProbabilityRepairGap("probability.source", "$", "Use a validated probability model, not serialized evidence.");
  }
  static from(value: unknown): BinaryJointModel {
    const source = record(value, "$"), kind = source["kind"];
    if (kind !== "joint-masses" && kind !== "prior-likelihoods") gap("$.kind", "Use joint-masses or prior-likelihoods.");
    keys(source, kind === "joint-masses" ? ["kind", "sourceId", "events", "masses"] : ["kind", "sourceId", "events", "prior", "likelihoods"], "$");
    const sourceId = identifier(source["sourceId"], "$.sourceId");
    const rawEvents = tuple(source["events"], 2, "$.events");
    const event = (value: unknown, index: number): ProbabilityEvent => {
      const path = `$.events[${index}]`, input = record(value, path);
      keys(input, ["id", "label", "complementLabel"], path);
      return Object.freeze({ id: identifier(input["id"], `${path}.id`), label: text(input["label"], `${path}.label`),
        complementLabel: text(input["complementLabel"], `${path}.complementLabel`) });
    };
    const events = [event(rawEvents[0], 0), event(rawEvents[1], 1)] as const;
    if (events[0].id === events[1].id) gap("$.events", "Use two distinct event identities.");
    let masses: readonly [KpNormalizedRational, KpNormalizedRational, KpNormalizedRational, KpNormalizedRational];
    if (kind === "joint-masses") {
      const raw = tuple(source["masses"], 4, "$.masses");
      masses = [mass(raw[0], "$.masses[0]"), mass(raw[1], "$.masses[1]"), mass(raw[2], "$.masses[2]"), mass(raw[3], "$.masses[3]")];
    } else {
      const prior = mass(source["prior"], "$.prior"), raw = tuple(source["likelihoods"], 2, "$.likelihoods");
      const yes = mass(raw[0], "$.likelihoods[0]"), no = mass(raw[1], "$.likelihoods[1]");
      masses = [multiplyKpRationals(prior, yes), multiplyKpRationals(prior, subtractKpRationals(one, yes)),
        multiplyKpRationals(subtractKpRationals(one, prior), no), multiplyKpRationals(subtractKpRationals(one, prior), subtractKpRationals(one, no))];
    }
    if (!equalKpRationals(masses.reduce(addKpRationals), one))
      throw new ProbabilityRepairGap("probability.total", "$.masses", "Four disjoint joint masses must sum exactly to one; no automatic rescaling.");
    return new BinaryJointModel(authority, sourceId, events, masses);
  }
}

export function parseBinaryJointSource(json: string): BinaryJointModel {
  if (json.length > 100_000) gap("$", "Keep the probability source under 100,000 characters.");
  try { return BinaryJointModel.from(JSON.parse(json)); }
  catch (error) { if (error instanceof SyntaxError) gap("$", "Provide valid JSON."); throw error; }
}

export function createFlaggedTicketSource() {
  return { kind: "joint-masses", sourceId: "probability.flagged-ticket.v1",
    events: [{ id: "urgent", label: "Urgent", complementLabel: "Not urgent" },
      { id: "flagged", label: "Flagged", complementLabel: "Not flagged" }],
    masses: ["16/100", "4/100", "8/100", "72/100"] };
}

function gap(path: string, expected: string): never { throw new ProbabilityRepairGap("probability.source", path, expected); }
function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) gap(path, "Provide an object.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, expected: readonly string[], path: string): void {
  if (Object.keys(value).some(key => !expected.includes(key)) || expected.some(key => !Object.hasOwn(value, key)))
    gap(path, `Provide exactly: ${expected.join(", ")}.`);
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 160) gap(path, "Provide nonempty text of at most 160 characters.");
  return value;
}
function identifier(value: unknown, path: string): string {
  const result = text(value, path);
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(result)) gap(path, "Use an explicit stable alphanumeric identity.");
  return result;
}
function tuple(value: unknown, length: number, path: string): readonly unknown[] {
  if (!Array.isArray(value) || value.length !== length) gap(path, `Provide exactly ${length} entries.`);
  return value;
}
function mass(value: unknown, path: string): KpNormalizedRational {
  // Bound integer parsing before BigInt/GCD work; JSON decimals never become approximate truth.
  if (typeof value !== "string" || !/^[0-9]{1,18}\/[1-9][0-9]{0,17}$/.test(value))
    throw new ProbabilityRepairGap("probability.mass", path, "Use an exact nonnegative n/d string, positive denominator, at most 18 digits per integer.");
  const [n, d] = value.split("/");
  const result = createKpRational(BigInt(n!), BigInt(d!));
  if (result.numerator > result.denominator) throw new ProbabilityRepairGap("probability.mass", path, "A probability must be at most one.");
  return result;
}

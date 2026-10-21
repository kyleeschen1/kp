import { inspectAuthorSourceLimits } from "../author-source-limits.ts";

export type ColumnBeatId = "initial" | "columns" | "weights" | "distribute" | "scaled" | "sum" | "placed";
export interface ColumnReading {
  readonly title: string;
  readonly introduction: string;
  readonly cues: readonly [Readonly<Record<ColumnBeatId, string>>, Readonly<Record<ColumnBeatId, string>>];
  readonly conclusion: readonly string[];
  readonly question: { readonly prompt: string; readonly answer: string };
}
type Pair = readonly [number, number];
export interface Source {
  readonly schemaVersion: "kp.matrix-columns.v1";
  readonly id: string;
  readonly left: readonly [Pair, Pair];
  readonly right: readonly [Pair, Pair];
  readonly reading: ColumnReading;
}

export class Repair extends Error {
  readonly code: string;
  readonly path: string;
  readonly expected: string;
  constructor(code: string, path: string, expected: string) {
    super(`${code} at ${path}: ${expected}`); this.code = code; this.path = path; this.expected = expected;
  }
}
const fail = (path: string, expected: string): never => { throw new Repair("matrix.source", path, expected); };

function record(value: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return fail(path, "Use a plain source object.");
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== "string" || !keys.includes(key) || !("value" in descriptor) || !descriptor.enumerable)
      fail(`${path}.${String(key)}`, "Use only the declared source fields, without accessors or executable content.");
  }
  for (const key of keys) if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, "Supply this required field.");
  return value as Record<string, unknown>;
}
function array(value: unknown, path: string, minimum: number, maximum = minimum): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length < minimum || value.length > maximum)
    return fail(path, `Supply ${minimum === maximum ? minimum : `${minimum} to ${maximum}`} entries in a plain array.`);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== "string" || (key !== "length" && (!/^(0|[1-9]\d*)$/.test(key) || !descriptor.enumerable)) || !("value" in descriptor))
      fail(path, "Use dense data arrays without extra fields or accessors.");
  }
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) fail(`${path}[${i}]`, "Supply this array entry.");
  return value;
}
function text(value: unknown, path: string, maximum = 4000): string {
  if (typeof value !== "string" || !value.trim() || value.length > maximum)
    return fail(path, `Supply nonblank editorial text of at most ${maximum} characters.`);
  return value;
}
function matrix(value: unknown, path: string): Source["left"] {
  const rows = array(value, path, 2);
  const row = (value: unknown, path: string): Pair => {
    const entries = array(value, path, 2);
    const scalar = (value: unknown, index: number) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return fail(`${path}[${index}]`, "Supply a finite numerical coefficient.");
      return Object.is(value, -0) ? 0 : value;
    };
    return Object.freeze([scalar(entries[0], 0), scalar(entries[1], 1)] as const);
  };
  return Object.freeze([row(rows[0], `${path}[0]`), row(rows[1], `${path}[1]`)] as const);
}
function cue(value: unknown, path: string): Readonly<Record<ColumnBeatId, string>> {
  const fields = record(value, path, ["initial", "columns", "weights", "distribute", "scaled", "sum", "placed"]);
  const read = (key: ColumnBeatId) => text(fields[key], `${path}.${key}`, 2000);
  return Object.freeze({ initial: read("initial"), columns: read("columns"), weights: read("weights"),
    distribute: read("distribute"), scaled: read("scaled"), sum: read("sum"), placed: read("placed") });
}

/** Plain data only; mathematics is derived separately by the existing domain. */
export function read(value: unknown): Source {
  const root = record(value, "$", ["schemaVersion", "id", "left", "right", "reading"]);
  if (root["schemaVersion"] !== "kp.matrix-columns.v1") fail("$.schemaVersion", "Use kp.matrix-columns.v1.");
  const id = text(root["id"], "$.id", 64);
  if (!/^[a-z][a-z0-9-]*$/.test(id)) fail("$.id", "Use a lowercase letter followed by lowercase letters, digits or hyphens.");
  const reading = record(root["reading"], "$.reading", ["title", "introduction", "cues", "conclusion", "question"]);
  const cues = array(reading["cues"], "$.reading.cues", 2);
  const question = record(reading["question"], "$.reading.question", ["prompt", "answer"]);
  return Object.freeze({ schemaVersion: "kp.matrix-columns.v1", id,
    left: matrix(root["left"], "$.left"), right: matrix(root["right"], "$.right"),
    reading: Object.freeze({ title: text(reading["title"], "$.reading.title", 160),
      introduction: text(reading["introduction"], "$.reading.introduction"),
      cues: Object.freeze([cue(cues[0], "$.reading.cues[0]"), cue(cues[1], "$.reading.cues[1]")] as const),
      conclusion: Object.freeze(array(reading["conclusion"], "$.reading.conclusion", 1, 12).map((p, i) => text(p, `$.reading.conclusion[${i}]`))),
      question: Object.freeze({ prompt: text(question["prompt"], "$.reading.question.prompt"), answer: text(question["answer"], "$.reading.question.answer") }) }) });
}
export function parse(json: string): Source {
  const limit = inspectAuthorSourceLimits(json);
  if (limit) throw new Repair(limit.diagnostic.code, limit.diagnostic.path, limit.diagnostic.expected);
  let value: unknown;
  try { value = JSON.parse(json); }
  catch { throw new Repair("matrix.json", "$", "Provide valid JSON."); }
  return read(value);
}

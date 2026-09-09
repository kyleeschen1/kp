export type KpCommonFactorRepairCode =
  | "source" | "unsupported-syntax" | "ambiguous-notation" | "undeclared-symbol"
  | "unsupported-shape" | "invalid-factorization" | "missing-authority" | "unsupported-presentation";

export class KpCommonFactorRepair extends Error {
  readonly code: KpCommonFactorRepairCode;
  readonly path: string;
  constructor(code: KpCommonFactorRepairCode, path: string, expected: string) {
    super(expected); this.name = "KpCommonFactorRepair"; this.code = code; this.path = path;
  }
}

export interface KpCommonFactorState {
  readonly id: string;
  readonly latex: string;
  readonly narration: string;
}

/** Authored syntax and editorial intent only. No evidence, geometry or timing
 * field can turn a requested equality into verified mathematical authority. */
export interface KpCommonFactorSource {
  readonly schemaVersion: "kp.common-factor-source.v1";
  readonly id: string;
  readonly symbols: readonly string[];
  readonly domain: "real-scalars";
  readonly states: readonly [KpCommonFactorState, KpCommonFactorState];
  readonly editorial: Readonly<{ title: string; setup: string; summary: string }>;
}

export function readKpCommonFactorSource(value: unknown): KpCommonFactorSource {
  const root = record(value, "$", ["schemaVersion", "id", "symbols", "domain", "states", "editorial"]);
  if (root["schemaVersion"] !== "kp.common-factor-source.v1" || root["domain"] !== "real-scalars")
    throw new KpCommonFactorRepair("source", "$", "Use common-factor source v1 with an explicit real-scalars domain.");
  if (!Array.isArray(root["symbols"]) || root["symbols"].length > 12)
    throw new KpCommonFactorRepair("source", "$.symbols", "Declare at most twelve single-letter scalar symbols.");
  const symbols = root["symbols"].map((symbol: unknown, index: number) => {
    if (typeof symbol !== "string" || !/^[a-zA-Z]$/.test(symbol))
      throw new KpCommonFactorRepair("source", `$.symbols[${index}]`, "Declare one Latin letter per real scalar; functions and multi-letter identifiers are unsupported.");
    return symbol;
  });
  if (new Set(symbols).size !== symbols.length)
    throw new KpCommonFactorRepair("source", "$.symbols", "Do not repeat symbol declarations.");
  if (!Array.isArray(root["states"]) || root["states"].length !== 2)
    throw new KpCommonFactorRepair("source", "$.states", "Supply exactly two endpoints for one factoring step.");
  const state = (value: unknown, index: number): KpCommonFactorState => {
    const path = `$.states[${index}]`, item = record(value, path, ["id", "latex", "narration"]);
    return Object.freeze({ id: identifier(item["id"], `${path}.id`), latex: text(item["latex"], `${path}.latex`, 512),
      narration: text(item["narration"], `${path}.narration`, 2000) });
  };
  const before = state(root["states"][0], 0), after = state(root["states"][1], 1);
  if (before.id === after.id) throw new KpCommonFactorRepair("source", "$.states[1].id", "Endpoints require distinct occurrence identities.");
  const editorial = record(root["editorial"], "$.editorial", ["title", "setup", "summary"]);
  return Object.freeze({ schemaVersion: "kp.common-factor-source.v1", id: identifier(root["id"], "$.id"),
    domain: "real-scalars", symbols: Object.freeze(symbols), states: Object.freeze([before, after] as const),
    editorial: Object.freeze({ title: text(editorial["title"], "$.editorial.title", 200),
      setup: text(editorial["setup"], "$.editorial.setup", 2000), summary: text(editorial["summary"], "$.editorial.summary", 2000) }) });
}

export function parseKpCommonFactorSource(json: string): KpCommonFactorSource {
  if (json.length > 20_000) throw new KpCommonFactorRepair("source", "$", "Keep source below 20,000 characters.");
  let value: unknown;
  try { value = JSON.parse(json); }
  catch { throw new KpCommonFactorRepair("source", "$", "Provide valid JSON."); }
  return readKpCommonFactorSource(value);
}

function record(value: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype)
    throw new KpCommonFactorRepair("source", path, "Provide a plain source object.");
  const result = value as Record<string, unknown>;
  for (const key of Object.keys(result)) if (!keys.includes(key))
    throw new KpCommonFactorRepair("source", `${path}.${key}`, "Unknown field; source cannot author proof, presentation or runtime state.");
  for (const key of keys) if (!Object.hasOwn(result, key))
    throw new KpCommonFactorRepair("source", `${path}.${key}`, "Required source field is missing.");
  return result;
}

function text(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new KpCommonFactorRepair("source", path, `Provide nonempty text of at most ${max} characters.`);
  return value;
}
function identifier(value: unknown, path: string): string {
  const id = text(value, path, 120);
  if (!/^[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z0-9.-]+$/.test(id))
    throw new KpCommonFactorRepair("source", path, "Use a namespaced stable ID.");
  return id;
}

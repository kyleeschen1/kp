export type KpComposedAlgebraRepairCode =
  | "source" | "unsupported-syntax" | "ambiguous-notation" | "undeclared-symbol"
  | "unsupported-shape" | "invalid-factorization" | "invalid-evaluation"
  | "disconnected-chain" | "missing-authority" | "unsupported-presentation";

export class KpComposedAlgebraRepair extends Error {
  readonly code: KpComposedAlgebraRepairCode;
  readonly path: string;
  readonly expected: string;
  constructor(code: KpComposedAlgebraRepairCode, path: string, expected: string) {
    super(expected); this.name = "KpComposedAlgebraRepair";
    this.code = code; this.path = path; this.expected = expected;
  }
}

export interface KpComposedAlgebraState {
  readonly id: string;
  readonly latex: string;
  readonly narration: string;
}

/** One bounded task: factor, then evaluate its coefficient sum. The tuple
 * describes authored endpoints; neither shape nor operation names mint proof. */
export interface KpComposedAlgebraSource {
  readonly schemaVersion: "kp.composed-algebra-source.v1";
  readonly id: string;
  readonly domain: "real-scalars";
  readonly symbols: readonly string[];
  readonly states: readonly [KpComposedAlgebraState, KpComposedAlgebraState, KpComposedAlgebraState];
  readonly editorial: Readonly<{ title: string; setup: string; summary: string }>;
}

export function readKpComposedAlgebraSource(value: unknown): KpComposedAlgebraSource {
  const root = record(value, "$", ["schemaVersion", "id", "domain", "symbols", "states", "editorial"]);
  if (root["schemaVersion"] !== "kp.composed-algebra-source.v1" || root["domain"] !== "real-scalars")
    fail("$", "Use composed-algebra source v1 with explicitly declared real scalars.");
  const declarations = root["symbols"];
  if (!Array.isArray(declarations) || declarations.length > 12) fail("$.symbols", "Declare at most twelve single Latin letters.");
  const symbols: string[] = [];
  for (const symbol of declarations) {
    if (typeof symbol !== "string" || !/^[A-Za-z]$/.test(symbol)) fail("$.symbols", "Declare only single Latin letters.");
    if (symbols.includes(symbol)) fail("$.symbols", "Do not repeat a declaration.");
    symbols.push(symbol);
  }
  const states = root["states"];
  if (!Array.isArray(states) || states.length !== 3) fail("$.states", "Supply exactly three states: expanded, factored, evaluated.");
  const state = (value: unknown, index: number): KpComposedAlgebraState => {
    const path = `$.states[${index}]`, item = record(value, path, ["id", "latex", "narration"]);
    return Object.freeze({ id: identifier(item["id"], `${path}.id`),
      latex: text(item["latex"], `${path}.latex`, 512), narration: text(item["narration"], `${path}.narration`, 2000) });
  };
  const before = state(states[0], 0), middle = state(states[1], 1), after = state(states[2], 2);
  if (new Set([before.id, middle.id, after.id]).size !== 3) fail("$.states", "Use three distinct stable state IDs.");
  const editorial = record(root["editorial"], "$.editorial", ["title", "setup", "summary"]);
  return Object.freeze({ schemaVersion: "kp.composed-algebra-source.v1", id: identifier(root["id"], "$.id"),
    domain: "real-scalars", symbols: Object.freeze(symbols), states: Object.freeze([before, middle, after] as const),
    editorial: Object.freeze({ title: text(editorial["title"], "$.editorial.title", 200),
      setup: text(editorial["setup"], "$.editorial.setup", 2000), summary: text(editorial["summary"], "$.editorial.summary", 2000) }) });
}

export function parseKpComposedAlgebraSource(json: string): KpComposedAlgebraSource {
  if (json.length > 20_000) fail("$", "Keep source below 20,000 characters.");
  let value: unknown;
  try { value = JSON.parse(json); } catch { return fail("$", "Provide valid JSON."); }
  return readKpComposedAlgebraSource(value);
}

function record(value: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype)
    fail(path, "Provide a plain source object.");
  // Serialized source owns data, never executable getters or hidden authority.
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== "string" || !keys.includes(key) || !descriptor.enumerable || !("value" in descriptor))
      fail(path, "Source fields must be declared plain data; proof and presentation fields are forbidden.");
  }
  for (const key of keys) if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, "Required source field is missing.");
  return value as Record<string, unknown>;
}
function text(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(path, `Provide nonempty text of at most ${max} characters.`);
  return value;
}
function identifier(value: unknown, path: string): string {
  const id = text(value, path, 120);
  if (!/^[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z0-9.-]+$/.test(id)) fail(path, "Use a namespaced stable ID.");
  return id;
}
function fail(path: string, expected: string): never { throw new KpComposedAlgebraRepair("source", path, expected); }

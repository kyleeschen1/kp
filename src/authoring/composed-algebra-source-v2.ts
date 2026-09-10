import { KpComposedAlgebraRepair, readKpComposedAlgebraSource, readKpComposedAlgebraState,
  readKpComposedAlgebraDataRecord, type KpComposedAlgebraSource, type KpComposedAlgebraState } from "./composed-algebra-source.ts";

type Prefix = KpComposedAlgebraSource["states"];
export type KpComposedAlgebraExtendedStates =
  | readonly [...Prefix, KpComposedAlgebraState]
  | readonly [...Prefix, KpComposedAlgebraState, KpComposedAlgebraState];

/** Bounded authored data, not proof: collect, evaluate the count, distribute,
 * optionally evaluate a constant product. The existing v1 contract stays exact. */
export interface KpComposedAlgebraSourceV2 extends Omit<KpComposedAlgebraSource, "schemaVersion" | "states"> {
  readonly schemaVersion: "kp.composed-algebra-source.v2";
  readonly states: KpComposedAlgebraExtendedStates;
}

export function readKpComposedAlgebraSourceV2(value: unknown): KpComposedAlgebraSourceV2 {
  const root = readKpComposedAlgebraDataRecord(value, "$", ["schemaVersion", "id", "domain", "symbols", "states", "editorial"]);
  if (root["schemaVersion"] !== "kp.composed-algebra-source.v2") fail("$", "Use composed-algebra source v2 for this bounded extension.");
  const raw = root["states"];
  if (!Array.isArray(raw) || (raw.length !== 4 && raw.length !== 5))
    fail("$.states", "Supply four or five states: factor, evaluate the count, distribute, optionally evaluate a constant product.");
  // A direct API caller must not execute an accessor while checking source data.
  for (const key of Reflect.ownKeys(raw)) {
    const descriptor = Object.getOwnPropertyDescriptor(raw, key)!;
    if (typeof key !== "string" || (key !== "length" && !/^[0-4]$/.test(key)) || !("value" in descriptor))
      fail("$.states", "Supply a dense plain-data state array without executable or hidden fields.");
  }
  if (Object.getPrototypeOf(raw) !== Array.prototype || Array.from({ length: raw.length }, (_, i) => i).some(i => !Object.hasOwn(raw, i)))
    fail("$.states", "Supply a dense plain-data state array.");
  const prefix = readKpComposedAlgebraSource({ ...root, schemaVersion: "kp.composed-algebra-source.v1", states: raw.slice(0, 3) });
  const fourth = readKpComposedAlgebraState(raw[3], 3);
  const states: KpComposedAlgebraExtendedStates = raw.length === 4
    ? Object.freeze([...prefix.states, fourth] as const)
    : Object.freeze([...prefix.states, fourth, readKpComposedAlgebraState(raw[4], 4)] as const);
  if (new Set(states.map(state => state.id)).size !== states.length) fail("$.states", "Every state needs a distinct stable ID.");
  return Object.freeze({ ...prefix, schemaVersion: "kp.composed-algebra-source.v2", states });
}

export function parseKpComposedAlgebraSourceV2(json: string): KpComposedAlgebraSourceV2 {
  if (json.length > 20_000) fail("$", "Keep source below 20,000 characters.");
  let value: unknown;
  try { value = JSON.parse(json); } catch { return fail("$", "Provide valid JSON."); }
  return readKpComposedAlgebraSourceV2(value);
}

function fail(path: string, expected: string): never { throw new KpComposedAlgebraRepair("source", path, expected); }

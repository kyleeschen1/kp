import { sha256 } from "../kernel/sha256.ts";

export class AffineCollectionRepair extends Error {
  readonly code = "unsupported-affine-collection";
  readonly path: string;
  constructor(path: string, message: string) { super(message); this.path = path; this.name = "AffineCollectionRepair"; }
}
const brand = Symbol("affine-collection-derivation");
const issued = new WeakSet<object>();
export interface AffineCollectionSource {
  readonly symbol: string;
  readonly left: Readonly<{ coefficient: number; constant: number }>;
  readonly right: Readonly<{ coefficient: number; constant: number }>;
}

/** Bounded two-affine-products source. Safe integer inputs make every derived
 * arithmetic value exact; operation owners still verify the actual trees. */
export function deriveAffineCollection(value: unknown) {
  const input = record(value, "$", ["symbol", "left", "right"]);
  const x = input["symbol"];
  if (typeof x !== "string" || !/^[A-Za-z]$/.test(x)) throw new AffineCollectionRepair("$.symbol", "Declare one Latin-letter real scalar.");
  const left = record(input["left"], "$.left", ["coefficient", "constant"]);
  const right = record(input["right"], "$.right", ["coefficient", "constant"]);
  const a = integer(left["coefficient"], "$.left.coefficient", 2, 9);
  const b = integer(left["constant"], "$.left.constant", 1, 9);
  const c = integer(right["coefficient"], "$.right.coefficient", 2, 9);
  const d = integer(right["constant"], "$.right.constant", -9, -1);
  const p = a * b, q = c * d, coefficient = a + c, constant = p + q;
  if (constant === 0) throw new AffineCollectionRepair("$.right.constant", "Zero-result simplification is outside this bounded presentation.");
  const source: AffineCollectionSource = Object.freeze({ symbol: x,
    left: Object.freeze({ coefficient: a, constant: b }), right: Object.freeze({ coefficient: c, constant: d }) });
  const result = Object.freeze({ [brand]: true as const, source, a, b, c, d, p, q, coefficient, constant, x,
    revision: `sha256:${sha256(JSON.stringify(source))}`,
    isDefault: a === 3 && b === 2 && c === 2 && d === -1 && x === "x",
    latex: Object.freeze([
      `${a}(${x} + ${b}) + ${c}(${x} - ${-d})`,
      `${a}${x} + ${a} \\cdot ${b} + ${c}${x} + ${c} \\cdot (${d})`,
      `${a}${x} + ${p} + ${c}${x} - ${-q}`,
      `(${a}${x} + ${c}${x}) + (${p} - ${-q})`,
      `(${a} + ${c})${x} + (${p} - ${-q})`,
      `${coefficient}${x} ${constant < 0 ? "-" : "+"} ${Math.abs(constant)}`
    ]) });
  issued.add(result);
  return result;
}
export type AffineCollectionDerivation = ReturnType<typeof deriveAffineCollection>;
export const defaultAffineCollection = deriveAffineCollection({ symbol: "x", left: { coefficient: 3, constant: 2 }, right: { coefficient: 2, constant: -1 } });
export function assertAffineCollection(value: AffineCollectionDerivation): void {
  if (!issued.has(value)) throw new AffineCollectionRepair("$", "Use a validated affine derivation, not copied or serialized proof.");
}
export function affineCollectionEnvelope(d: AffineCollectionDerivation) {
  assertAffineCollection(d);
  return { schemaVersion: "kp.affine-collection.v1", source: d.source, revision: d.revision };
}
export function readAffineCollectionEnvelope(value: unknown): AffineCollectionDerivation {
  const data = record(value, "$", ["schemaVersion", "source", "revision"]);
  const d = deriveAffineCollection(data["source"]);
  if (data["schemaVersion"] !== "kp.affine-collection.v1" || data["revision"] !== d.revision)
    throw new AffineCollectionRepair("$.revision", "Source revision does not match the compiled affine derivation.");
  return d;
}
function record(value: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype)
    throw new AffineCollectionRepair(path, "Use a plain source record.");
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)))
    throw new AffineCollectionRepair(path, `Expected exactly: ${keys.join(", ")}.`);
  for (const key of keys) if (!("value" in Object.getOwnPropertyDescriptor(value, key)!))
    throw new AffineCollectionRepair(path, "Source contains data, not accessors.");
  return value as Record<string, unknown>;
}
function integer(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max)
    throw new AffineCollectionRepair(path, `Use an integer from ${min} through ${max}.`);
  return value;
}

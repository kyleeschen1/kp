import { createKpSemanticAssetObject, type CreateKpSemanticAssetObjectInput,
  type KpSemanticAssetObject } from "./asset.ts";

/** Plain semantic data, not renderer handles or executable model instances.
 * Interfaces and tuples retain their shape; functions become uninhabitable. */
export type KpImmutableSemanticData<T> =
  T extends string | number | boolean | bigint | null | undefined ? T :
  T extends (...args: never[]) => unknown ? never :
  T extends object ? { readonly [K in keyof T]: KpImmutableSemanticData<T[K]> } : never;

declare const issuedImmutableAsset: unique symbol;
export type KpImmutableSemanticAssetObject<T> = KpSemanticAssetObject<unknown extends T ? unknown : KpImmutableSemanticData<T>> & {
  readonly [issuedImmutableAsset]: true;
};
const issued = new WeakSet<object>();

export class KpSemanticDataRepairGap extends TypeError {
  readonly kind = "semantic-data-repair-gap";
  readonly code: "unsupported" | "cycle" | "limit";
  readonly path: string;
  constructor(code: KpSemanticDataRepairGap["code"], path: string, message: string) {
    super(`${path}: ${message}`); this.name = "KpSemanticDataRepairGap";
    this.code = code; this.path = path;
  }
}

/** Copy before issuance: freezing an author's aliased input is neither ownership
 * nor a safe way to make a semantic identity immutable. Domain truth is still
 * checked by its domain authority; this factory certifies data ownership only. */
export function createKpImmutableSemanticAssetObject<T>(
  input: CreateKpSemanticAssetObjectInput<T> & { readonly value: KpImmutableSemanticData<T> }
): KpImmutableSemanticAssetObject<T> {
  // The checker preserves values and shapes, rejecting unsupported data rather
  // than coercing it through JSON or freezing a live renderer/model handle.
  const captured = copySemanticData(input) as CreateKpSemanticAssetObjectInput<T>;
  const result = createKpSemanticAssetObject(captured);
  freezeOwned(result);
  issued.add(result);
  return result as KpImmutableSemanticAssetObject<T>;
}

export function isKpImmutableSemanticAssetObject(value: unknown): value is KpImmutableSemanticAssetObject<unknown> {
  return typeof value === "object" && value !== null && issued.has(value);
}

function copySemanticData(input: unknown): unknown {
  const copies = new Map<object, object>(), active = new Set<object>();
  let count = 0;
  const visit = (value: unknown, path: string, depth: number): unknown => {
    if (depth > 100 || ++count > 100000) throw new KpSemanticDataRepairGap("limit", path, "Semantic data exceeds the bounded depth/node limit.");
    if (value === null || value === undefined || typeof value === "string" || typeof value === "boolean" || typeof value === "bigint") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "object") throw new KpSemanticDataRepairGap("unsupported", path, "Use finite plain data, not functions, symbols or nonfinite numbers.");
    if (active.has(value)) throw new KpSemanticDataRepairGap("cycle", path, "Cyclic semantic data needs an explicit stable reference.");
    const previous = copies.get(value); if (previous) return previous;
    const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
    if (prototype !== (array ? Array.prototype : Object.prototype) && !(prototype === null && !array)) {
      throw new KpSemanticDataRepairGap("unsupported", path, "Use plain records/arrays, not class instances or runtime handles.");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    const copy: object = array ? [] : Object.create(prototype);
    copies.set(value, copy); active.add(value);
    for (const key of keys) {
      if (array && key === "length") continue;
      if (typeof key !== "string") throw new KpSemanticDataRepairGap("unsupported", path, "Symbol keys are not semantic data fields.");
      const descriptor = descriptors[key]!;
      const nextPath = `${path}.${key}`;
      if (!("value" in descriptor) || !descriptor.enumerable) throw new KpSemanticDataRepairGap("unsupported", nextPath, "Use enumerable data fields, not accessors or hidden state.");
      if (array && !/^(0|[1-9]\d*)$/.test(key)) throw new KpSemanticDataRepairGap("unsupported", nextPath, "Array data must use dense indexed elements.");
      // Defining data properties preserves a literal __proto__ field without
      // invoking the Object prototype setter or changing the clone's prototype.
      Object.defineProperty(copy, key, { value: visit(descriptor.value, nextPath, depth + 1), enumerable: true, configurable: true, writable: true });
    }
    if (array && keys.length - 1 !== value.length) throw new KpSemanticDataRepairGap("unsupported", path, "Sparse arrays require explicit values.");
    active.delete(value);
    return Object.freeze(copy);
  };
  return visit(input, "$", 0);
}

function freezeOwned(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.values(value).forEach(freezeOwned);
  Object.freeze(value);
}

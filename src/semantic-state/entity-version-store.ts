import {
  createKpSemanticStateIdentityScope,
  type KpAppliedTransformationId,
  type KpSemanticEntityId,
  type KpSemanticVersionId,
  type KpSemanticStateIdentityScope
} from "./identity.ts";

export type KpPersistentSemanticScalar =
  | null
  | boolean
  | string
  | number
  | bigint;

export type KpPersistentSemanticValue =
  | KpPersistentSemanticScalar
  | readonly KpPersistentSemanticValue[]
  | { readonly [key: string]: KpPersistentSemanticValue };

export type KpDeepReadonly<Value> =
  Value extends KpPersistentSemanticScalar
    ? Value
    : Value extends readonly (infer Item)[]
      ? readonly KpDeepReadonly<Item>[]
      : Value extends object
        ? { readonly [Key in keyof Value]: KpDeepReadonly<Value[Key]> }
        : never;

export interface KpInitialVersionProvenance {
  readonly kind: "initial";
  readonly sourceId: string;
}

export interface KpSuccessorVersionProvenance {
  readonly kind: "successor";
  readonly previousVersionId: KpSemanticVersionId;
  readonly transformationId: KpAppliedTransformationId;
}

export type KpEntityVersionProvenance =
  | KpInitialVersionProvenance
  | KpSuccessorVersionProvenance;

export interface KpSemanticEntityVersion<
  Value extends KpPersistentSemanticValue
> {
  readonly id: KpSemanticVersionId;
  readonly entityId: KpSemanticEntityId;
  readonly ordinal: number;
  readonly value: KpDeepReadonly<Value>;
  readonly provenance: KpEntityVersionProvenance;
}

export interface KpSemanticEntityVersionStore<
  Value extends KpPersistentSemanticValue
> {
  readonly schemaVersion: "kp.semantic-entity-version-store.v1";
  readonly kind: "semantic-entity-version-store";
  readonly namespace: string;
  readonly entityId: KpSemanticEntityId;
  readonly versions: readonly KpSemanticEntityVersion<Value>[];
  readonly versionIndex: Readonly<Record<string, number>>;
  readonly latestVersionId: KpSemanticVersionId;
}

export interface KpCreateSemanticEntityVersionStoreInput<
  Value extends KpPersistentSemanticValue
> {
  readonly identities: KpSemanticStateIdentityScope;
  readonly entityId: KpSemanticEntityId;
  readonly value: Value;
  readonly sourceId: string;
}

export interface KpAppendSemanticEntityVersionInput<
  Value extends KpPersistentSemanticValue
> {
  readonly value: Value;
  readonly transformationId: KpAppliedTransformationId;
}

export function createKpSemanticEntityVersionStore<
  Value extends KpPersistentSemanticValue
>(
  input: KpCreateSemanticEntityVersionStoreInput<Value>
): KpSemanticEntityVersionStore<Value> {
  const sourceId = requireSourceId(input.sourceId);
  const version = freezeVersion<Value>({
    id: input.identities.version(input.entityId, 0),
    entityId: input.entityId,
    ordinal: 0,
    value: cloneAndFreezePersistentSemanticValue(input.value),
    provenance: Object.freeze({ kind: "initial", sourceId })
  });

  return freezeStore({
    schemaVersion: "kp.semantic-entity-version-store.v1",
    kind: "semantic-entity-version-store",
    namespace: input.identities.namespace,
    entityId: input.entityId,
    versions: Object.freeze([version]),
    versionIndex: Object.freeze({ [version.id]: 0 }),
    latestVersionId: version.id
  });
}

export function appendKpSemanticEntityVersion<
  Value extends KpPersistentSemanticValue
>(
  store: KpSemanticEntityVersionStore<Value>,
  input: KpAppendSemanticEntityVersionInput<Value>
): KpSemanticEntityVersionStore<Value> {
  assertAppliedTransformationScope(store, input.transformationId);
  const identities = createKpSemanticStateIdentityScope(store.namespace);
  const ordinal = store.versions.length;
  const version = freezeVersion<Value>({
    id: identities.version(store.entityId, ordinal),
    entityId: store.entityId,
    ordinal,
    value: cloneAndFreezePersistentSemanticValue(input.value),
    provenance: Object.freeze({
      kind: "successor",
      previousVersionId: store.latestVersionId,
      transformationId: input.transformationId
    })
  });

  return freezeStore({
    ...store,
    versions: Object.freeze([...store.versions, version]),
    versionIndex: Object.freeze({
      ...store.versionIndex,
      [version.id]: ordinal
    }),
    latestVersionId: version.id
  });
}

export function readKpSemanticEntityVersion<
  Value extends KpPersistentSemanticValue
>(
  store: KpSemanticEntityVersionStore<Value>,
  versionId: KpSemanticVersionId
): KpSemanticEntityVersion<Value> {
  const ordinal = store.versionIndex[versionId];
  const version = ordinal === undefined ? undefined : store.versions[ordinal];
  if (version === undefined || version.id !== versionId) {
    throw new Error(
      `Semantic version ${JSON.stringify(versionId)} does not belong to entity ${JSON.stringify(store.entityId)}.`
    );
  }
  return version;
}

export function readLatestKpSemanticEntityVersion<
  Value extends KpPersistentSemanticValue
>(
  store: KpSemanticEntityVersionStore<Value>
): KpSemanticEntityVersion<Value> {
  return readKpSemanticEntityVersion(store, store.latestVersionId);
}

function requireSourceId(value: string): string {
  if (value.trim().length === 0) {
    throw new Error("An initial semantic entity version requires a source id.");
  }
  return value;
}

function assertAppliedTransformationScope(
  store: KpSemanticEntityVersionStore<KpPersistentSemanticValue>,
  transformationId: KpAppliedTransformationId
): void {
  const prefix = `kp-state/${store.namespace}/transformation/`;
  if (
    !transformationId.startsWith(prefix) ||
    !transformationId.includes("/application/")
  ) {
    throw new Error(
      `Applied transformation ${JSON.stringify(transformationId)} does not belong to entity scope ${JSON.stringify(store.namespace)}.`
    );
  }
}

function cloneAndFreezePersistentSemanticValue<
  Value extends KpPersistentSemanticValue
>(value: Value): KpDeepReadonly<Value> {
  return clonePersistentValue(value, new WeakSet(), "value") as
    KpDeepReadonly<Value>;
}

function clonePersistentValue(
  value: KpPersistentSemanticValue,
  ancestors: WeakSet<object>,
  path: string
): KpPersistentSemanticValue {
  if (value === null || typeof value === "string" ||
      typeof value === "boolean" || typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Persistent semantic ${path} must contain finite numbers.`);
    }
    return value;
  }
  if (typeof value !== "object") {
    throw new Error(
      `Persistent semantic ${path} must contain structural data, not ${typeof value}.`
    );
  }
  if (ancestors.has(value)) {
    throw new Error(`Persistent semantic ${path} may not contain a cycle.`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return Object.freeze(value.map((item, index) =>
        clonePersistentValue(item, ancestors, `${path}[${index}]`)
      ));
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        `Persistent semantic ${path} must be a plain record, not ${prototype?.constructor?.name ?? "an unknown prototype"}.`
      );
    }

    const clone = Object.create(prototype) as Record<
      string,
      KpPersistentSemanticValue
    >;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") {
        throw new Error(`Persistent semantic ${path} may not use symbol keys.`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) {
        throw new Error(
          `Persistent semantic ${path}.${key} must be a data property.`
        );
      }
      Object.defineProperty(clone, key, {
        value: clonePersistentValue(
          descriptor.value as KpPersistentSemanticValue,
          ancestors,
          `${path}.${key}`
        ),
        enumerable: descriptor.enumerable ?? false,
        configurable: false,
        writable: false
      });
    }
    return Object.freeze(clone);
  } finally {
    ancestors.delete(value);
  }
}

function freezeVersion<Value extends KpPersistentSemanticValue>(
  version: KpSemanticEntityVersion<Value>
): KpSemanticEntityVersion<Value> {
  return Object.freeze(version);
}

function freezeStore<Value extends KpPersistentSemanticValue>(
  store: KpSemanticEntityVersionStore<Value>
): KpSemanticEntityVersionStore<Value> {
  return Object.freeze(store);
}

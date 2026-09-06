import {
  cloneAndFreezeKpPersistentSemanticValue,
  type KpPersistentSemanticScalar,
  type KpPersistentSemanticValue
} from "./entity-version-store.ts";

declare const kpSemanticStateDescriptorValue: unique symbol;

// One homomorphic map preserves readonly arrays and tuples as well as objects;
// a separate array branch repeats recursive compiler work on structural values.
export type KpSemanticStateDataShape<Value> =
  Value extends (...args: never[]) => unknown
    ? never
    : Value extends KpPersistentSemanticScalar
    ? Value
    : Value extends object
      ? { readonly [Key in keyof Value]:
          KpSemanticStateDataShape<Value[Key]> }
      : never;

export type KpSemanticStateReadonlyValue<Value> =
  KpSemanticStateDataShape<Value>;

interface KpSemanticStateTypedDescriptor<Value> {
  readonly [kpSemanticStateDescriptorValue]?: Value;
}

export interface KpSemanticStateValueDescriptor<Value>
  extends KpSemanticStateTypedDescriptor<Value> {
  readonly schemaVersion: "kp.semantic-state-schema-node.v1";
  readonly kind: "required-value";
  readonly initialValue: Value;
}

export interface KpSemanticStateOptionalDescriptor<Value>
  extends KpSemanticStateTypedDescriptor<Value> {
  readonly schemaVersion: "kp.semantic-state-schema-node.v1";
  readonly kind: "optional-value";
}

export interface KpSemanticStateDerivedDescriptor<Value>
  extends KpSemanticStateTypedDescriptor<Value> {
  readonly schemaVersion: "kp.semantic-state-schema-node.v1";
  readonly kind: "derived-value";
}

export type KpSemanticStateLeafDescriptor<Value = unknown> =
  | KpSemanticStateValueDescriptor<Value>
  | KpSemanticStateOptionalDescriptor<Value>
  | KpSemanticStateDerivedDescriptor<Value>;

export type KpSemanticStateSchemaNode =
  | KpSemanticStateLeafDescriptor
  | KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>;

export type KpSemanticStateMemberMap = Readonly<
  Record<string, KpSemanticStateSchemaNode>
>;

export interface KpSemanticStateGroupDescriptor<
  Members extends KpSemanticStateMemberMap
> {
  readonly schemaVersion: "kp.semantic-state-schema-node.v1";
  readonly kind: "group";
  readonly members: Members;
}

export type KpSemanticStateDescriptorValue<
  Descriptor extends KpSemanticStateSchemaNode
> = Descriptor extends KpSemanticStateLeafDescriptor<infer Value>
  ? Value
  : Descriptor extends KpSemanticStateGroupDescriptor<infer Members>
    ? { readonly [Key in keyof Members]:
        KpSemanticStateDescriptorValue<Members[Key]> }
    : never;

export function kpStateValue<Value>(
  initialValue: Value & NoInfer<KpSemanticStateDataShape<Value>>
): KpSemanticStateValueDescriptor<KpSemanticStateReadonlyValue<Value>> {
  // The recursive input type preserves named domain interfaces for authors;
  // this internal cast only bridges that shape to the kernel's index signature.
  const frozen = cloneAndFreezeKpPersistentSemanticValue(
    initialValue as KpPersistentSemanticValue
  ) as KpSemanticStateReadonlyValue<Value>;
  return Object.freeze<KpSemanticStateValueDescriptor<
    KpSemanticStateReadonlyValue<Value>
  >>({
    schemaVersion: "kp.semantic-state-schema-node.v1",
    kind: "required-value",
    initialValue: frozen
  });
}

export function kpStateOptional<Value>():
  KpSemanticStateOptionalDescriptor<KpSemanticStateReadonlyValue<Value>> {
  return Object.freeze<KpSemanticStateOptionalDescriptor<
    KpSemanticStateReadonlyValue<Value>
  >>({
    schemaVersion: "kp.semantic-state-schema-node.v1",
    kind: "optional-value"
  });
}

export function kpStateDerived<Value>():
  KpSemanticStateDerivedDescriptor<KpSemanticStateReadonlyValue<Value>> {
  return Object.freeze<KpSemanticStateDerivedDescriptor<
    KpSemanticStateReadonlyValue<Value>
  >>({
    schemaVersion: "kp.semantic-state-schema-node.v1",
    kind: "derived-value"
  });
}

export function kpStateGroup<const Members extends KpSemanticStateMemberMap>(
  members: Members
): KpSemanticStateGroupDescriptor<Members> {
  if (Object.keys(members).length === 0) {
    throw new Error("A semantic state schema group requires at least one member.");
  }
  return Object.freeze<KpSemanticStateGroupDescriptor<Members>>({
    schemaVersion: "kp.semantic-state-schema-node.v1",
    kind: "group",
    members: Object.freeze({ ...members })
  });
}

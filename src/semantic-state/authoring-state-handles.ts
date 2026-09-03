import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import {
  encodeKpSemanticStatePathSegment,
  type KpCompiledSemanticStateLeaf,
  type KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateLeafDescriptor,
  KpSemanticStateMemberMap,
  KpSemanticStateSchemaNode
} from "./authoring-schema.ts";
import { readKpSemanticEntityVersion } from "./entity-version-store.ts";
import type {
  KpAggregateSnapshotId,
  KpSemanticSlotId
} from "./identity.ts";

declare const kpSemanticStateHandleValue: unique symbol;

export type KpSemanticStateViewErrorCode =
  | "foreign-snapshot"
  | "snapshot-schema-mismatch";

export class KpSemanticStateViewError extends Error {
  readonly code: KpSemanticStateViewErrorCode;

  constructor(code: KpSemanticStateViewErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticStateViewError";
    this.code = code;
  }
}

export interface KpSemanticStateLeafHandle<
  Value,
  DescriptorKind extends KpSemanticStateLeafDescriptor["kind"]
> {
  readonly schemaVersion: "kp.semantic-state-leaf-handle.v1";
  readonly kind: "semantic-state-leaf-handle";
  readonly namespace: string;
  readonly descriptorKind: DescriptorKind;
  readonly path: readonly string[];
  readonly encodedPath: string;
  readonly slotId: KpSemanticSlotId;
  readonly [kpSemanticStateHandleValue]?: Value;
}

export interface KpPinnedSemanticStateLeafHandle<
  Value,
  DescriptorKind extends KpSemanticStateLeafDescriptor["kind"]
> {
  readonly schemaVersion: "kp.pinned-semantic-state-leaf-handle.v1";
  readonly kind: "pinned-semantic-state-leaf-handle";
  readonly reference: KpSemanticStateLeafHandle<Value, DescriptorKind>;
  readonly snapshotId: KpAggregateSnapshotId;
  read(): Value;
}

type KpSemanticStateHandleNode<Node extends KpSemanticStateSchemaNode> =
  Node extends KpSemanticStateGroupDescriptor<infer Members>
    ? KpSemanticStateHandleMembers<Members>
    : Node extends KpSemanticStateLeafDescriptor<infer Value>
      ? KpSemanticStateLeafHandle<Value, Node["kind"]>
      : never;

type KpPinnedSemanticStateHandleNode<Node extends KpSemanticStateSchemaNode> =
  Node extends KpSemanticStateGroupDescriptor<infer Members>
    ? KpPinnedSemanticStateHandleMembers<Members>
    : Node extends KpSemanticStateLeafDescriptor<infer Value>
      ? KpPinnedSemanticStateLeafHandle<Value, Node["kind"]>
      : never;

export type KpSemanticStateHandleMembers<
  Members extends KpSemanticStateMemberMap
> = { readonly [Key in keyof Members]:
  KpSemanticStateHandleNode<Members[Key]> };

export type KpPinnedSemanticStateHandleMembers<
  Members extends KpSemanticStateMemberMap
> = { readonly [Key in keyof Members]:
  KpPinnedSemanticStateHandleNode<Members[Key]> };

export type KpSemanticStateHandleTree<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpSemanticStateHandleMembers<Root["members"]>;

export type KpPinnedSemanticStateHandleTree<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpPinnedSemanticStateHandleMembers<Root["members"]>;

export interface KpSemanticStateHandleSet<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-handle-set.v1";
  readonly kind: "semantic-state-handle-set";
  readonly refs: KpSemanticStateHandleTree<Root>;
  pin(
    snapshot: KpAggregateSemanticSnapshot
  ): KpPinnedSemanticStateHandleTree<Root>;
}

export function createKpSemanticStateHandleSet<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>
): KpSemanticStateHandleSet<Root> {
  const leafByEncodedPath = new Map(
    compiled.leaves.map((leaf) => [leaf.encodedPath, leaf])
  );
  const referenceByEncodedPath = new Map<
    string,
    KpSemanticStateLeafHandle<unknown, KpSemanticStateLeafDescriptor["kind"]>
  >();
  const refs = buildHandleTree(compiled.root, [], (leaf) => {
    const reference = Object.freeze({
      schemaVersion: "kp.semantic-state-leaf-handle.v1" as const,
      kind: "semantic-state-leaf-handle" as const,
      namespace: compiled.namespace,
      descriptorKind: leaf.descriptor.kind,
      path: leaf.path,
      encodedPath: leaf.encodedPath,
      slotId: leaf.identities.slotId
    });
    referenceByEncodedPath.set(leaf.encodedPath, reference);
    return reference;
  }, leafByEncodedPath) as KpSemanticStateHandleTree<Root>;

  return Object.freeze({
    schemaVersion: "kp.semantic-state-handle-set.v1",
    kind: "semantic-state-handle-set",
    refs,
    pin(snapshot: KpAggregateSemanticSnapshot) {
      assertSnapshotMatchesSchema(compiled, snapshot);
      return buildHandleTree(compiled.root, [], (leaf) => {
        const reference = referenceByEncodedPath.get(leaf.encodedPath);
        if (reference === undefined) {
          throw new Error(
            `Semantic state handle reference ${JSON.stringify(leaf.path)} was not compiled.`
          );
        }
        return Object.freeze({
          schemaVersion: "kp.pinned-semantic-state-leaf-handle.v1" as const,
          kind: "pinned-semantic-state-leaf-handle" as const,
          reference,
          snapshotId: snapshot.id,
          read() {
            const binding = readKpSemanticSlotBinding(
              snapshot,
              reference.slotId
            );
            const store = readKpSnapshotEntityStore(snapshot, binding.entityId);
            return readKpSemanticEntityVersion(store, binding.versionId).value;
          }
        });
      }, leafByEncodedPath) as KpPinnedSemanticStateHandleTree<Root>;
    }
  });
}

function buildHandleTree(
  group: KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  path: readonly string[],
  createLeaf: (leaf: KpCompiledSemanticStateLeaf) => unknown,
  leafByEncodedPath: ReadonlyMap<string, KpCompiledSemanticStateLeaf>
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const memberName of Object.keys(group.members).sort(compareStrings)) {
    const memberPath = [...path, memberName];
    const node = group.members[memberName];
    if (node?.kind === "group") {
      result[memberName] = buildHandleTree(
        node,
        memberPath,
        createLeaf,
        leafByEncodedPath
      );
      continue;
    }
    const encodedPath = memberPath
      .map(encodeKpSemanticStatePathSegment)
      .join(".");
    const leaf = leafByEncodedPath.get(encodedPath);
    if (leaf === undefined) {
      throw new Error(
        `Semantic state schema leaf ${JSON.stringify(memberPath)} was not compiled.`
      );
    }
    result[memberName] = createLeaf(leaf);
  }
  return Object.freeze(result);
}

function assertSnapshotMatchesSchema<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>,
  snapshot: KpAggregateSemanticSnapshot
): void {
  if (snapshot.namespace !== compiled.namespace) {
    throw new KpSemanticStateViewError(
      "foreign-snapshot",
      `Semantic state schema ${JSON.stringify(compiled.namespace)} cannot pin snapshot ${JSON.stringify(snapshot.id)} from ${JSON.stringify(snapshot.namespace)}.`
    );
  }
  const expectedRequired = compiled.leaves
    .filter((leaf) => leaf.descriptor.kind !== "optional-value")
    .map((leaf) => leaf.identities.slotId)
    .sort(compareStrings);
  const expectedOptional = compiled.leaves
    .filter((leaf) => leaf.descriptor.kind === "optional-value")
    .map((leaf) => leaf.identities.slotId)
    .sort(compareStrings);
  const actualRequired = [...snapshot.requiredSlotIds].sort(compareStrings);
  const actualOptional = [...snapshot.optionalSlotIds].sort(compareStrings);
  if (!sameStrings(expectedRequired, actualRequired) ||
      !sameStrings(expectedOptional, actualOptional)) {
    throw new KpSemanticStateViewError(
      "snapshot-schema-mismatch",
      `Semantic snapshot ${JSON.stringify(snapshot.id)} does not declare the exact slots compiled for this handle set.`
    );
  }
  for (const leaf of compiled.leaves) {
    const slotId = leaf.identities.slotId;
    const hasBinding = snapshot.bindingIndex[slotId] !== undefined;
    const hasAbsence = snapshot.absenceIndex[slotId] !== undefined;
    const hasDerivedBinding = snapshot.derivedBindingIndex[slotId] !== undefined;
    const matchesDescriptor = leaf.descriptor.kind === "required-value"
      ? hasBinding
      : leaf.descriptor.kind === "optional-value"
        ? hasBinding || hasAbsence
        : hasDerivedBinding;
    if (!matchesDescriptor) {
      throw new KpSemanticStateViewError(
        "snapshot-schema-mismatch",
        `Semantic snapshot ${JSON.stringify(snapshot.id)} gives slot ${JSON.stringify(slotId)} a state incompatible with its ${leaf.descriptor.kind} descriptor.`
      );
    }
  }
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

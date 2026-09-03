import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import type {
  KpCompiledSemanticStateLeaf,
  KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpPinnedSemanticStateHandleTree,
  KpSemanticStateHandleSet,
  KpSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import type {
  KpSemanticStateDerivedDescriptor,
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap,
  KpSemanticStateOptionalDescriptor,
  KpSemanticStateValueDescriptor,
  KpSemanticStateSchemaNode
} from "./authoring-schema.ts";
import type { KpPersistentSemanticValue } from "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticEntityId,
  KpTransformationDefinitionId
} from "./identity.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError,
  type KpSemanticTransaction,
  type KpSemanticTransactionCommit,
  type KpSemanticTransactionScope
} from "./transaction.ts";

const kpSemanticStateOperationScope = Symbol(
  "kp.semantic-state-operation.scope"
);

export type KpSemanticStateTransformErrorCode =
  | "empty-transform"
  | "foreign-operation-handle"
  | "invalid-bind-source"
  | "unsupported-callback-result";

export class KpSemanticStateTransformError extends Error {
  readonly code: KpSemanticStateTransformErrorCode;

  constructor(code: KpSemanticStateTransformErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticStateTransformError";
    this.code = code;
  }
}

export interface KpSemanticStateOperationLeafHandle<Value> {
  readonly reference: KpSemanticStateLeafHandle<Value>;
  read(): Value;
}

export interface KpSemanticStateBindableOperationLeafHandle<Value> {
  readonly writable: true;
  readonly reference: KpSemanticStateLeafHandle<Value>;
}

export interface KpSemanticStateWritableOperationLeafHandle<Value>
  extends KpSemanticStateOperationLeafHandle<Value> {
  readonly writable: true;
  update(update: (previous: Value) => Value): void;
  bind(source: KpSemanticStateBindableOperationLeafHandle<NoInfer<Value>>): void;
  bindCopy(
    source: KpSemanticStateBindableOperationLeafHandle<NoInfer<Value>>
  ): void;
}

export interface KpSemanticStateOptionalOperationLeafHandle<Value>
  extends KpSemanticStateWritableOperationLeafHandle<Value> {
  introduce(value: Value): void;
  remove(): void;
}

type KpSemanticStateOperationNode<Node extends KpSemanticStateSchemaNode> =
  Node extends KpSemanticStateGroupDescriptor<infer Members>
    ? KpSemanticStateOperationMembersInternal<Members>
    : Node extends KpSemanticStateValueDescriptor<infer Value>
      ? KpSemanticStateWritableOperationLeafHandle<Value>
      : Node extends KpSemanticStateOptionalDescriptor<infer Value>
        ? KpSemanticStateOptionalOperationLeafHandle<Value>
        : Node extends KpSemanticStateDerivedDescriptor<infer Value>
          ? KpSemanticStateOperationLeafHandle<Value>
          : never;

type KpSemanticStateOperationMembersInternal<
  Members extends KpSemanticStateMemberMap
> = { readonly [Key in keyof Members]:
  KpSemanticStateOperationNode<Members[Key]> };

export interface KpSemanticStateTransformApplication<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-transform-application.v1";
  readonly kind: "semantic-state-transform-application";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly commit: KpSemanticTransactionCommit;
  readonly before: KpPinnedSemanticStateHandleTree<Root>;
  readonly after: KpPinnedSemanticStateHandleTree<Root>;
}

export interface KpSemanticStateTransformDefinition<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-transform-definition.v1";
  readonly kind: "semantic-state-transform-definition";
  readonly id: KpTransformationDefinitionId;
  readonly localId: string;
  apply(
    before: KpAggregateSemanticSnapshot,
    applicationId: string
  ): KpSemanticStateTransformApplication<Root>;
}

export function defineKpSemanticStateTransform<
  const Members extends KpSemanticStateMemberMap
>(input: {
  readonly compiled: KpCompiledSemanticStateSchema<
    KpSemanticStateGroupDescriptor<Members>
  >;
  readonly handles: KpSemanticStateHandleSet<
    KpSemanticStateGroupDescriptor<Members>
  >;
  readonly id: string;
  readonly author: (
    state: KpSemanticStateOperationMembersInternal<Members>
  ) => void;
}): KpSemanticStateTransformDefinition<
  KpSemanticStateGroupDescriptor<Members>
> {
  const definitionId = input.compiled.identityScope.transformation(input.id);
  const leafByEncodedPath = new Map<string, KpCompiledSemanticStateLeaf>(
    input.compiled.leaves.map((leaf) => [leaf.encodedPath, leaf])
  );
  return Object.freeze<KpSemanticStateTransformDefinition<
    KpSemanticStateGroupDescriptor<Members>
  >>({
    schemaVersion: "kp.semantic-state-transform-definition.v1",
    kind: "semantic-state-transform-definition",
    id: definitionId,
    localId: input.id,
    apply(before: KpAggregateSemanticSnapshot, applicationId: string) {
      input.handles.pin(before);
      const transformationId = input.compiled.identityScope
        .appliedTransformation(definitionId, applicationId);
      const transaction = beginKpSemanticTransaction({
        identities: input.compiled.identityScope,
        before,
        transformationId
      });
      const state = createOperationTree(
        input.handles.refs,
        transaction,
        leafByEncodedPath,
        (leaf, operation) => input.compiled.identityScope.entity(
          operation === "copy"
            ? `${leaf.encodedPath}.from.${input.id}.${applicationId}`
            : `${leaf.encodedPath}.introduced-by.${input.id}.${applicationId}`
        )
      ) as KpSemanticStateOperationMembersInternal<Members>;

      try {
        const callbackResult = input.author(state);
        if (callbackResult !== undefined) {
          throw new KpSemanticStateTransformError(
            "unsupported-callback-result",
            `Semantic state transform ${JSON.stringify(input.id)} must be synchronous and return no value.`
          );
        }
        const commit = transaction.commit(transaction.scope);
        return Object.freeze<KpSemanticStateTransformApplication<
          KpSemanticStateGroupDescriptor<Members>
        >>({
          schemaVersion: "kp.semantic-state-transform-application.v1" as const,
          kind: "semantic-state-transform-application" as const,
          definitionId,
          transformationId,
          commit,
          before: input.handles.pin(commit.before),
          after: input.handles.pin(commit.after)
        });
      } catch (error) {
        abortIfOpen(transaction);
        if (error instanceof KpSemanticTransactionError &&
            error.code === "no-staged-writes") {
          throw new KpSemanticStateTransformError(
            "empty-transform",
            `Semantic state transform ${JSON.stringify(input.id)} staged no semantic change.`
          );
        }
        throw error;
      }
    }
  });
}

function createOperationTree(
  refs: Readonly<Record<string, unknown>>,
  transaction: KpSemanticTransaction,
  leafByEncodedPath: ReadonlyMap<string, KpCompiledSemanticStateLeaf>,
  operationEntityId: (
    leaf: KpCompiledSemanticStateLeaf,
    operation: "copy" | "introduce"
  ) => KpSemanticEntityId
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(refs).sort(compareStrings)) {
    const value = refs[key];
    if (isLeafReference(value)) {
      const leaf = leafByEncodedPath.get(value.encodedPath);
      if (leaf === undefined) {
        throw new Error(
          `Semantic state operation handle ${JSON.stringify(value.path)} was not compiled.`
        );
      }
      const handle: Record<string, unknown> = {
        schemaVersion: "kp.semantic-state-operation-leaf-handle.v1" as const,
        kind: "semantic-state-operation-leaf-handle" as const,
        writable: value.descriptorKind !== "derived-value",
        reference: value,
        [kpSemanticStateOperationScope]: transaction.scope,
        read() {
          return transaction.read(transaction.scope, value.slotId).version.value;
        }
      };
      if (value.descriptorKind !== "derived-value") {
        handle["update"] = (
          update: (
            previous: KpPersistentSemanticValue
          ) => KpPersistentSemanticValue
        ) => {
          transaction.update(transaction.scope, {
            id: leaf.identities.operationIds.update,
            sourceId: leaf.identities.operationIds.update,
            revisionId: "update",
            slotId: value.slotId,
            update
          });
        };
        handle["bind"] = (source: unknown) => {
          assertOperationSource(source, transaction.scope);
          transaction.bind(transaction.scope, {
            id: leaf.identities.operationIds.bind,
            sourceId: leaf.identities.operationIds.bind,
            sourceSlotId: source.reference.slotId,
            targetSlotId: value.slotId
          });
        };
        handle["bindCopy"] = (source: unknown) => {
          assertOperationSource(source, transaction.scope);
          transaction.bindCopy(transaction.scope, {
            id: leaf.identities.operationIds.bindCopy,
            sourceId: leaf.identities.operationIds.bindCopy,
            sourceSlotId: source.reference.slotId,
            targetSlotId: value.slotId,
            newEntityId: operationEntityId(leaf, "copy")
          });
        };
        if (value.descriptorKind === "optional-value") {
          handle["introduce"] = (introduced: KpPersistentSemanticValue) => {
            transaction.introduce(transaction.scope, {
              id: leaf.identities.operationIds.introduce,
              sourceId: leaf.identities.operationIds.introduce,
              slotId: value.slotId,
              newEntityId: operationEntityId(leaf, "introduce"),
              value: introduced
            });
          };
          handle["remove"] = () => {
            transaction.remove(transaction.scope, {
              id: leaf.identities.operationIds.remove,
              sourceId: leaf.identities.operationIds.remove,
              slotId: value.slotId
            });
          };
        }
      }
      result[key] = Object.freeze(handle);
    } else if (value !== null && typeof value === "object") {
      result[key] = createOperationTree(
        value as Readonly<Record<string, unknown>>,
        transaction,
        leafByEncodedPath,
        operationEntityId
      );
    } else {
      throw new Error(`Semantic state handle tree member ${JSON.stringify(key)} is invalid.`);
    }
  }
  return Object.freeze(result);
}

function assertOperationSource(
  value: unknown,
  scope: KpSemanticTransactionScope
): asserts value is KpSemanticStateBindableOperationLeafHandle<
  KpPersistentSemanticValue
> {
  if (value === null || typeof value !== "object" ||
      (value as { readonly kind?: unknown }).kind !==
        "semantic-state-operation-leaf-handle" ||
      (value as { readonly [kpSemanticStateOperationScope]?: unknown })[
        kpSemanticStateOperationScope
      ] !== scope) {
    throw new KpSemanticStateTransformError(
      "foreign-operation-handle",
      "Semantic state bind sources must come from the current transform application."
    );
  }
  const descriptorKind = (
    value as { readonly reference?: { readonly descriptorKind?: unknown } }
  ).reference?.descriptorKind;
  if (descriptorKind !== "required-value" &&
      descriptorKind !== "optional-value") {
    throw new KpSemanticStateTransformError(
      "invalid-bind-source",
      "Semantic state bind sources must be writable value handles."
    );
  }
}

function isLeafReference(
  value: unknown
): value is KpSemanticStateLeafHandle<unknown> {
  return value !== null && typeof value === "object" &&
    (value as { readonly kind?: unknown }).kind ===
      "semantic-state-leaf-handle";
}

function abortIfOpen(transaction: KpSemanticTransaction): void {
  try {
    transaction.abort(transaction.scope);
  } catch (error) {
    if (!(error instanceof KpSemanticTransactionError) ||
        error.code !== "scope-expired") {
      throw error;
    }
  }
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

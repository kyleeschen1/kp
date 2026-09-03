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
  KpSemanticStateLeafDescriptor,
  KpSemanticStateMemberMap,
  KpSemanticStateOptionalDescriptor,
  KpSemanticStateValueDescriptor,
  KpSemanticStateSchemaNode
} from "./authoring-schema.ts";
import type { KpPersistentSemanticValue } from "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpTransformationDefinitionId
} from "./identity.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError,
  type KpSemanticTransaction,
  type KpSemanticTransactionCommit,
  type KpSemanticTransactionScope
} from "./transaction.ts";

declare const kpSemanticStateOperationValue: unique symbol;
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

export interface KpSemanticStateOperationLeafHandle<
  Value,
  DescriptorKind extends KpSemanticStateLeafDescriptor["kind"]
> {
  readonly schemaVersion: "kp.semantic-state-operation-leaf-handle.v1";
  readonly kind: "semantic-state-operation-leaf-handle";
  readonly reference: KpSemanticStateLeafHandle<Value, DescriptorKind>;
  readonly [kpSemanticStateOperationValue]?: (value: Value) => Value;
  read(): Value;
}

export type KpSemanticStateBindableOperationLeafHandle<Value> =
  KpSemanticStateOperationLeafHandle<
    Value,
    "required-value" | "optional-value"
  >;

export interface KpSemanticStateWritableOperationLeafHandle<
  Value,
  DescriptorKind extends "required-value" | "optional-value"
> extends KpSemanticStateOperationLeafHandle<Value, DescriptorKind> {
  update(update: (previous: Value) => Value): void;
  bind(source: KpSemanticStateBindableOperationLeafHandle<NoInfer<Value>>): void;
}

type KpSemanticStateOperationNode<Node extends KpSemanticStateSchemaNode> =
  Node extends KpSemanticStateGroupDescriptor<infer Members>
    ? KpSemanticStateOperationMembers<Members>
    : Node extends KpSemanticStateValueDescriptor<infer Value>
      ? KpSemanticStateWritableOperationLeafHandle<Value, "required-value">
      : Node extends KpSemanticStateOptionalDescriptor<infer Value>
        ? KpSemanticStateWritableOperationLeafHandle<Value, "optional-value">
        : Node extends KpSemanticStateDerivedDescriptor<infer Value>
          ? KpSemanticStateOperationLeafHandle<Value, "derived-value">
          : never;

export type KpSemanticStateOperationMembers<
  Members extends KpSemanticStateMemberMap
> = { readonly [Key in keyof Members]:
  KpSemanticStateOperationNode<Members[Key]> };

export type KpSemanticStateOperationTree<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpSemanticStateOperationMembers<Root["members"]>;

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
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly compiled: KpCompiledSemanticStateSchema<Root>;
  readonly handles: KpSemanticStateHandleSet<Root>;
  readonly id: string;
  readonly author: (state: KpSemanticStateOperationTree<Root>) => void;
}): KpSemanticStateTransformDefinition<Root> {
  const definitionId = input.compiled.identityScope.transformation(input.id);
  const leafByEncodedPath = new Map(
    input.compiled.leaves.map((leaf) => [leaf.encodedPath, leaf])
  );
  return Object.freeze({
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
        leafByEncodedPath
      ) as KpSemanticStateOperationTree<Root>;

      try {
        const callbackResult = input.author(state);
        if (callbackResult !== undefined) {
          throw new KpSemanticStateTransformError(
            "unsupported-callback-result",
            `Semantic state transform ${JSON.stringify(input.id)} must be synchronous and return no value.`
          );
        }
        const commit = transaction.commit(transaction.scope);
        return Object.freeze({
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
  leafByEncodedPath: ReadonlyMap<string, KpCompiledSemanticStateLeaf>
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
      }
      result[key] = Object.freeze(handle);
    } else if (value !== null && typeof value === "object") {
      result[key] = createOperationTree(
        value as Readonly<Record<string, unknown>>,
        transaction,
        leafByEncodedPath
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
): value is KpSemanticStateLeafHandle<
  unknown,
  KpSemanticStateLeafDescriptor["kind"]
> {
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

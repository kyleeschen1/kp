import type {
  KpCompiledSemanticStateLeaf,
  KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpDerivedSemanticStateLeafHandle,
  KpSemanticStateLeafHandle
} from "./authoring-state-handles.ts";
import {
  createKpSemanticDerivedBindingDeclaration,
  type KpSemanticDerivedBindingDeclaration
} from "./derived-binding.ts";
import type { KpSemanticDerivationId } from "./identity.ts";

export type KpSemanticStateDependencyTuple =
  readonly KpSemanticStateLeafHandle<unknown>[];

export type KpSemanticStateDependencyValues<
  Dependencies extends KpSemanticStateDependencyTuple
> = { readonly [Index in keyof Dependencies]:
  Dependencies[Index] extends KpSemanticStateLeafHandle<infer Value>
    ? Value
    : never };

export interface KpSemanticStateDerivationDefinitionSource {
  readonly schemaVersion: "kp.semantic-state-derivation-definition.v1";
  readonly kind: "semantic-state-derivation-definition";
  readonly declaration: KpSemanticDerivedBindingDeclaration;
}

export interface KpSemanticStateDerivationDefinition<
  Result,
  Dependencies extends KpSemanticStateDependencyTuple
> extends KpSemanticStateDerivationDefinitionSource {
  readonly id: KpSemanticDerivationId;
  readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  readonly dependencies: Dependencies;
  compute(values: KpSemanticStateDependencyValues<Dependencies>): Result;
}

export function defineKpSemanticStateDerivation<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const Result,
  const Dependencies extends KpSemanticStateDependencyTuple
>(input: {
  readonly compiled: KpCompiledSemanticStateSchema<Root>;
  readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  readonly dependencies: Dependencies;
  readonly compute: (
    values: KpSemanticStateDependencyValues<Dependencies>
  ) => Result;
}): KpSemanticStateDerivationDefinition<Result, Dependencies> {
  const target = requireCompiledLeaf(input.compiled, input.target);
  if (target.descriptor.kind !== "derived-value") {
    throw new Error(
      `Semantic state derivation target ${JSON.stringify(input.target.path)} is not a derived leaf.`
    );
  }
  const dependencies = Object.freeze([...input.dependencies]) as unknown as
    Dependencies;
  for (const dependency of dependencies) {
    requireCompiledLeaf(input.compiled, dependency);
  }
  const declaration = createKpSemanticDerivedBindingDeclaration({
    identities: input.compiled.identityScope,
    derivationId: target.identities.derivationId,
    slotId: target.identities.slotId,
    dependencySlotIds: dependencies.map(dependency => dependency.slotId),
    sourceId: target.identities.sourceIds.derivation
  });

  // The declaration is durable semantic data; the closure stays definition-local.
  return Object.freeze<KpSemanticStateDerivationDefinition<
    Result,
    Dependencies
  >>({
    schemaVersion: "kp.semantic-state-derivation-definition.v1",
    kind: "semantic-state-derivation-definition",
    id: declaration.derivationId,
    target: input.target,
    dependencies,
    declaration,
    compute: input.compute
  });
}

function requireCompiledLeaf<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>,
  handle: KpSemanticStateLeafHandle<unknown>
): KpCompiledSemanticStateLeaf {
  if (handle.namespace !== compiled.namespace) {
    throw new Error(
      `Semantic state derivation handle ${JSON.stringify(handle.path)} belongs to ${JSON.stringify(handle.namespace)}, not ${JSON.stringify(compiled.namespace)}.`
    );
  }
  const leaf = compiled.leaves[compiled.leafIndex[handle.encodedPath] ?? -1];
  if (leaf === undefined || leaf.identities.slotId !== handle.slotId) {
    throw new Error(
      `Semantic state derivation handle ${JSON.stringify(handle.path)} was not compiled by the supplied schema.`
    );
  }
  return leaf;
}

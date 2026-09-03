import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence,
  type KpAggregateSemanticSnapshot,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import type {
  KpCompiledSemanticStateLeaf,
  KpCompiledSemanticStateSchema
} from "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateDerivationDefinitionSource
} from "./authoring-derived-definition.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  createKpSemanticDerivedBindingDeclaration,
  type KpSemanticDerivedBindingDeclaration
} from "./derived-binding.ts";
import {
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue,
  type KpSemanticEntityVersionStore
} from "./entity-version-store.ts";
import type { KpSemanticSlotId } from "./identity.ts";

export type KpSemanticStateMaterializationErrorCode =
  | "duplicate-derived-plan"
  | "foreign-derived-dependency"
  | "invalid-derived-target"
  | "missing-derived-plan";

export class KpSemanticStateMaterializationError extends Error {
  readonly code: KpSemanticStateMaterializationErrorCode;
  readonly slotId?: KpSemanticSlotId;

  constructor(input: {
    readonly code: KpSemanticStateMaterializationErrorCode;
    readonly message: string;
    readonly slotId?: KpSemanticSlotId;
  }) {
    super(input.message);
    this.name = "KpSemanticStateMaterializationError";
    this.code = input.code;
    if (input.slotId !== undefined) this.slotId = input.slotId;
  }
}

/** Internal bridge filled by the typed derivation definition layer in s13. */
export interface KpInitialSemanticStateDerivationPlan {
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencySlotIds: readonly KpSemanticSlotId[];
}

export function materializeKpSemanticStateInitialSnapshot<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>,
  input: {
    readonly derived?: readonly KpInitialSemanticStateDerivationPlan[];
    readonly derivations?: readonly KpSemanticStateDerivationDefinitionSource[];
  } = {}
): KpAggregateSemanticSnapshot {
  const requiredSlotIds: KpSemanticSlotId[] = [];
  const optionalSlotIds: KpSemanticSlotId[] = [];
  const bindings: KpSemanticSlotBinding[] = [];
  const entityStores: KpSemanticEntityVersionStore<
    KpPersistentSemanticValue
  >[] = [];

  for (const leaf of compiled.leaves) {
    if (leaf.descriptor.kind === "optional-value") {
      optionalSlotIds.push(leaf.identities.slotId);
      continue;
    }
    requiredSlotIds.push(leaf.identities.slotId);
    if (leaf.descriptor.kind === "derived-value") continue;

    const store = createKpSemanticEntityVersionStore({
      identities: compiled.identityScope,
      entityId: leaf.identities.initialEntityId,
      // Descriptor construction already validated this exact persistent shape.
      value: leaf.descriptor.initialValue as KpPersistentSemanticValue,
      sourceId: leaf.identities.sourceIds.initialValue
    });
    entityStores.push(store);
    bindings.push(Object.freeze({
      slotId: leaf.identities.slotId,
      entityId: store.entityId,
      versionId: store.latestVersionId
    }));
  }

  const derivedBindings = compileInitialDerivations(
    compiled,
    [
      ...(input.derived ?? []),
      ...(input.derivations ?? []).map(definition => ({
        targetSlotId: definition.declaration.slotId,
        dependencySlotIds: definition.declaration.dependencies
          .map(dependency => dependency.slotId)
      }))
    ]
  );
  const absences = compiled.leaves
    .filter((leaf) => leaf.descriptor.kind === "optional-value")
    .map((leaf) => createKpSemanticSlotAbsence({
      slotId: leaf.identities.slotId,
      reason: "not-introduced",
      sourceId: leaf.identities.sourceIds.initialAbsence
    }));

  return createKpAggregateSemanticSnapshot({
    identities: compiled.identityScope,
    snapshotId: compiled.identityScope.initialSnapshot(),
    requiredSlotIds,
    optionalSlotIds,
    bindings,
    absences,
    derivedBindings,
    entityStores
  });
}

function compileInitialDerivations<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  compiled: KpCompiledSemanticStateSchema<Root>,
  plans: readonly KpInitialSemanticStateDerivationPlan[]
): readonly KpSemanticDerivedBindingDeclaration[] {
  const leafBySlot = new Map<KpSemanticSlotId, KpCompiledSemanticStateLeaf>(
    compiled.leaves.map((leaf) => [leaf.identities.slotId, leaf])
  );
  const planByTarget = new Map<
    KpSemanticSlotId,
    KpInitialSemanticStateDerivationPlan
  >();
  for (const plan of plans) {
    const target = leafBySlot.get(plan.targetSlotId);
    if (target?.descriptor.kind !== "derived-value") {
      throw new KpSemanticStateMaterializationError({
        code: "invalid-derived-target",
        slotId: plan.targetSlotId,
        message: `Initial derivation target ${JSON.stringify(plan.targetSlotId)} is not a derived leaf in schema ${JSON.stringify(compiled.namespace)}.`
      });
    }
    if (planByTarget.has(plan.targetSlotId)) {
      throw new KpSemanticStateMaterializationError({
        code: "duplicate-derived-plan",
        slotId: plan.targetSlotId,
        message: `Initial derivation target ${JSON.stringify(plan.targetSlotId)} has more than one plan.`
      });
    }
    for (const dependencySlotId of plan.dependencySlotIds) {
      if (!leafBySlot.has(dependencySlotId)) {
        throw new KpSemanticStateMaterializationError({
          code: "foreign-derived-dependency",
          slotId: dependencySlotId,
          message: `Initial derivation dependency ${JSON.stringify(dependencySlotId)} is not declared by schema ${JSON.stringify(compiled.namespace)}.`
        });
      }
    }
    planByTarget.set(plan.targetSlotId, plan);
  }

  return Object.freeze(compiled.leaves
    .filter((leaf) => leaf.descriptor.kind === "derived-value")
    .map((leaf) => {
      const plan = planByTarget.get(leaf.identities.slotId);
      if (plan === undefined) {
        throw new KpSemanticStateMaterializationError({
          code: "missing-derived-plan",
          slotId: leaf.identities.slotId,
          message: `Derived schema leaf ${JSON.stringify(leaf.path)} requires an initial dependency plan.`
        });
      }
      return createKpSemanticDerivedBindingDeclaration({
        identities: compiled.identityScope,
        derivationId: leaf.identities.derivationId,
        slotId: leaf.identities.slotId,
        dependencySlotIds: plan.dependencySlotIds,
        sourceId: leaf.identities.sourceIds.derivation
      });
    }));
}

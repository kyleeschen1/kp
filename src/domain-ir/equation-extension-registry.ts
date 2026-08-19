import type { KpMotifSchema } from "./equation-motif-invocation.ts";
import type {
  KpFamilyId,
  KpMotifId,
  KpOperationKind,
  KpRecipeId,
  KpRendererCapabilityId
} from "./equation-motion-vocabulary.ts";

export type KpEquationRegistryKind =
  | "semantic-operations"
  | "recipes"
  | "motifs"
  | "renderer-capabilities"
  | "families";

export interface KpEquationOperationRegistration {
  readonly id: KpOperationKind;
  readonly familyId: KpFamilyId;
  readonly recipeIds: readonly KpRecipeId[];
  /** Exact laws or domain operations licensed by this compiler operation. */
  readonly semanticAuthorityIds: readonly string[];
  /**
   * A lower-level registry operation may share one author-facing identity with
   * a richer governed declaration. The owning pack declares that relationship
   * so authoring registries do not grow a central alias switch.
   */
  readonly canonicalAuthoringOperationId?: string | undefined;
  readonly plannerSummary?: string | undefined;
}

export interface KpEquationRecipeRegistration {
  readonly id: KpRecipeId;
  readonly familyId: KpFamilyId;
  readonly operationKinds: readonly KpOperationKind[];
  readonly motifUses: readonly KpEquationRecipeMotifUse[];
  readonly dependencyRecipeIds: readonly KpRecipeId[];
  readonly causalGrammarIds: readonly string[];
}

export interface KpEquationRecipeMotifUse {
  readonly id: string;
  readonly motifId: KpMotifId;
  readonly roleIds: readonly string[];
}

export interface KpEquationMotifRegistration {
  readonly id: KpMotifId;
  readonly familyId: KpFamilyId;
  readonly schema: KpMotifSchema;
}

export interface KpEquationRendererCapabilityRegistration {
  readonly id: KpRendererCapabilityId;
  readonly motifIds: readonly KpMotifId[];
}

export interface KpEquationFamilyRegistration {
  readonly id: KpFamilyId;
  readonly disposition: KpEquationFamilyDisposition;
  readonly operationKindIds: readonly KpOperationKind[];
  readonly recipeIds: readonly KpRecipeId[];
  readonly motifIds: readonly KpMotifId[];
  readonly rendererCapabilityIds: readonly KpRendererCapabilityId[];
}

export type KpEquationFamilyDisposition =
  | "active"
  | "deferred"
  | "static-only"
  | "unsupported"
  | "retirement-candidate";

export interface KpImmutableEquationRegistry<
  Kind extends KpEquationRegistryKind,
  Id extends string,
  Entry extends { readonly id: Id }
> {
  readonly schemaVersion: "kp.immutable-equation-registry.v1";
  readonly kind: Kind;
  readonly ids: readonly Id[];
  readonly entries: readonly Entry[];
  readonly byId: Readonly<Record<string, Entry>>;
}

export interface KpClosedDispatchRegistry<
  Id extends string,
  Entry extends { readonly id: Id }
> {
  readonly schemaVersion: "kp.closed-dispatch-registry.v1";
  readonly label: string;
  readonly ids: readonly Id[];
  readonly entries: readonly Entry[];
  readonly byId: Readonly<Record<string, Entry>>;
}

export type KpEquationOperationRegistry = KpImmutableEquationRegistry<
  "semantic-operations",
  KpOperationKind,
  KpEquationOperationRegistration
>;

export type KpEquationRecipeRegistry = KpImmutableEquationRegistry<
  "recipes",
  KpRecipeId,
  KpEquationRecipeRegistration
>;

export type KpEquationMotifRegistry = KpImmutableEquationRegistry<
  "motifs",
  KpMotifId,
  KpEquationMotifRegistration
>;

export type KpEquationRendererCapabilityRegistry = KpImmutableEquationRegistry<
  "renderer-capabilities",
  KpRendererCapabilityId,
  KpEquationRendererCapabilityRegistration
>;

export type KpEquationFamilyRegistry = KpImmutableEquationRegistry<
  "families",
  KpFamilyId,
  KpEquationFamilyRegistration
>;

export interface KpEquationExtensionPack {
  readonly schemaVersion: "kp.equation-extension-pack.v1";
  readonly kind: "equation-extension-pack";
  readonly id: string;
  readonly operations: KpEquationOperationRegistry;
  readonly recipes: KpEquationRecipeRegistry;
  readonly motifs: KpEquationMotifRegistry;
  readonly rendererCapabilities: KpEquationRendererCapabilityRegistry;
  readonly families: KpEquationFamilyRegistry;
}

export function createKpEquationOperationRegistry(
  entries: readonly KpEquationOperationRegistration[]
): KpEquationOperationRegistry {
  return createRegistry(
    "semantic-operations",
    entries.map((entry) => Object.freeze({
      ...entry,
      recipeIds: freezeIds(entry.recipeIds),
      semanticAuthorityIds: freezeIds(entry.semanticAuthorityIds)
    }))
  );
}

export function createKpEquationRecipeRegistry(
  entries: readonly KpEquationRecipeRegistration[]
): KpEquationRecipeRegistry {
  return createRegistry(
    "recipes",
    entries.map((entry) => Object.freeze({
      ...entry,
      operationKinds: freezeIds(entry.operationKinds),
      motifUses: Object.freeze(entry.motifUses.map((use) => Object.freeze({
        ...use,
        roleIds: freezeIds(use.roleIds)
      }))),
      dependencyRecipeIds: freezeIds(entry.dependencyRecipeIds),
      causalGrammarIds: freezeIds(entry.causalGrammarIds)
    }))
  );
}

export function createKpEquationMotifRegistry(
  entries: readonly KpEquationMotifRegistration[]
): KpEquationMotifRegistry {
  return createRegistry(
    "motifs",
    entries.map((entry) => Object.freeze({ ...entry }))
  );
}

export function createKpEquationRendererCapabilityRegistry(
  entries: readonly KpEquationRendererCapabilityRegistration[]
): KpEquationRendererCapabilityRegistry {
  return createRegistry(
    "renderer-capabilities",
    entries.map((entry) => Object.freeze({
      ...entry,
      motifIds: freezeIds(entry.motifIds)
    }))
  );
}

export function createKpEquationFamilyRegistry(
  entries: readonly KpEquationFamilyRegistration[]
): KpEquationFamilyRegistry {
  return createRegistry(
    "families",
    entries.map((entry) => Object.freeze({
      ...entry,
      operationKindIds: freezeIds(entry.operationKindIds),
      recipeIds: freezeIds(entry.recipeIds),
      motifIds: freezeIds(entry.motifIds),
      rendererCapabilityIds: freezeIds(entry.rendererCapabilityIds)
    }))
  );
}

export function composeKpEquationExtensionPack(input: {
  readonly id: string;
  readonly operations: KpEquationOperationRegistry;
  readonly recipes: KpEquationRecipeRegistry;
  readonly motifs: KpEquationMotifRegistry;
  readonly rendererCapabilities: KpEquationRendererCapabilityRegistry;
  readonly families: KpEquationFamilyRegistry;
}): KpEquationExtensionPack {
  if (input.id.trim() === "") {
    throw new Error("Equation extension pack requires a non-empty id.");
  }
  return Object.freeze({
    schemaVersion: "kp.equation-extension-pack.v1" as const,
    kind: "equation-extension-pack" as const,
    ...input
  });
}

export function getKpEquationRegistryEntry<
  Kind extends KpEquationRegistryKind,
  Id extends string,
  Entry extends { readonly id: Id }
>(
  registry: KpImmutableEquationRegistry<Kind, Id, Entry>,
  id: Id
): Entry | undefined {
  return registry.byId[id];
}

export function createKpClosedDispatchRegistry<
  Id extends string,
  Entry extends { readonly id: Id }
>(
  label: string,
  inputEntries: readonly Entry[]
): KpClosedDispatchRegistry<Id, Entry> {
  if (label.trim() === "") {
    throw new Error("Closed dispatch registry requires a non-empty label.");
  }
  const ids = inputEntries.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} dispatch ids must be unique.`);
  }
  const entries = Object.freeze([...inputEntries]);
  const byId = Object.freeze(Object.fromEntries(
    entries.map((entry) => [entry.id, entry])
  )) as Readonly<Record<string, Entry>>;
  return Object.freeze({
    schemaVersion: "kp.closed-dispatch-registry.v1" as const,
    label,
    ids: Object.freeze(ids),
    entries,
    byId
  });
}

export function requireKpClosedDispatchEntry<
  Id extends string,
  Entry extends { readonly id: Id }
>(
  registry: KpClosedDispatchRegistry<Id, Entry>,
  id: Id
): Entry {
  const entry = registry.byId[id];
  if (entry === undefined) {
    throw new Error(`Unknown ${registry.label} dispatch id ${id}.`);
  }
  return entry;
}

function createRegistry<
  const Kind extends KpEquationRegistryKind,
  Id extends string,
  Entry extends { readonly id: Id }
>(kind: Kind, inputEntries: readonly Entry[]): KpImmutableEquationRegistry<Kind, Id, Entry> {
  const ids = inputEntries.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Equation ${kind} registry ids must be unique.`);
  }
  const entries = Object.freeze([...inputEntries]);
  const byId = Object.freeze(Object.fromEntries(
    entries.map((entry) => [entry.id, entry])
  )) as Readonly<Record<string, Entry>>;
  return Object.freeze({
    schemaVersion: "kp.immutable-equation-registry.v1" as const,
    kind,
    ids: Object.freeze(ids),
    entries,
    byId
  });
}

function freezeIds<Id extends string>(ids: readonly Id[]): readonly Id[] {
  return Object.freeze([...ids]);
}

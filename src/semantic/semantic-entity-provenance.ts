export type KpSemanticEntityProvenance =
  | {
      readonly kind: "parsed";
      readonly sourceId: string;
      readonly sourceKind: "latex" | "text" | "code";
      readonly startOffset: number;
      readonly endOffset: number;
      readonly revisionId?: string | undefined;
    }
  | {
      readonly kind: "inferred";
      readonly sourceEntityIds: readonly string[];
      readonly methodId: string;
    }
  | {
      readonly kind: "authored";
      readonly sourceId: string;
      readonly authorId?: string | undefined;
    }
  | {
      readonly kind: "pedagogical";
      readonly sourceEntityIds: readonly string[];
      readonly rationale: string;
    };

export interface KpSemanticEntity {
  readonly id: string;
  readonly kind: "semantic-entity";
  readonly semanticKind: string;
  readonly label: string;
  readonly parentId?: string | undefined;
  readonly provenance: KpSemanticEntityProvenance;
}

export interface KpSemanticDisplayFragment {
  readonly id: string;
  readonly kind: "semantic-display-fragment";
  readonly semanticEntityId: string;
  readonly fragmentRole: "primary" | "copy" | "annotation";
  readonly ordinal: number;
}

export interface KpSemanticEntityRegistry {
  readonly kind: "semantic-entity-registry";
  readonly entities: readonly KpSemanticEntity[];
  readonly displayFragments: readonly KpSemanticDisplayFragment[];
}

export function createKpSemanticEntity(input: {
  readonly id: string;
  readonly semanticKind: string;
  readonly label: string;
  readonly parentId?: string | undefined;
  readonly provenance: KpSemanticEntityProvenance;
}): KpSemanticEntity {
  assertNonEmpty(input.id, "Semantic entity id");
  assertNonEmpty(input.semanticKind, `Semantic entity ${input.id} kind`);
  assertNonEmpty(input.label, `Semantic entity ${input.id} label`);
  validateProvenance(input.id, input.provenance);
  return {
    id: input.id,
    kind: "semantic-entity",
    semanticKind: input.semanticKind,
    label: input.label,
    ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
    provenance: copyProvenance(input.provenance)
  };
}

export function createKpSemanticDisplayFragment(input: {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly fragmentRole: KpSemanticDisplayFragment["fragmentRole"];
  readonly ordinal: number;
}): KpSemanticDisplayFragment {
  assertNonEmpty(input.id, "Semantic display fragment id");
  assertNonEmpty(input.semanticEntityId, `Semantic display fragment ${input.id} entity id`);
  if (!Number.isInteger(input.ordinal) || input.ordinal < 0) {
    throw new Error(`Semantic display fragment ${input.id} ordinal must be a non-negative integer.`);
  }
  return { ...input, kind: "semantic-display-fragment" };
}

export function createKpSemanticEntityRegistry(input: {
  readonly entities: readonly KpSemanticEntity[];
  readonly displayFragments?: readonly KpSemanticDisplayFragment[] | undefined;
}): KpSemanticEntityRegistry {
  const entityIds = uniqueIds(input.entities, "semantic entity");
  input.entities.forEach((entity) => {
    if (entity.parentId !== undefined && !entityIds.has(entity.parentId)) {
      throw new Error(`Semantic entity ${entity.id} references missing parent ${entity.parentId}.`);
    }
    provenanceEntityIds(entity.provenance).forEach((sourceId) => {
      if (!entityIds.has(sourceId)) {
        throw new Error(`Semantic entity ${entity.id} provenance references missing entity ${sourceId}.`);
      }
    });
    assertNoParentCycle(entity, input.entities);
  });
  const fragments = input.displayFragments ?? [];
  uniqueIds(fragments, "semantic display fragment");
  fragments.forEach((fragment) => {
    if (!entityIds.has(fragment.semanticEntityId)) {
      throw new Error(
        `Semantic display fragment ${fragment.id} references missing entity ${fragment.semanticEntityId}.`
      );
    }
  });
  return {
    kind: "semantic-entity-registry",
    entities: input.entities.map((entity) => ({
      ...entity,
      provenance: copyProvenance(entity.provenance)
    })),
    displayFragments: fragments.map((fragment) => ({ ...fragment }))
  };
}

export function listKpSemanticEntityFragments(
  registry: KpSemanticEntityRegistry,
  entityId: string
): readonly KpSemanticDisplayFragment[] {
  return registry.displayFragments.filter((fragment) => fragment.semanticEntityId === entityId);
}

function validateProvenance(entityId: string, provenance: KpSemanticEntityProvenance): void {
  switch (provenance.kind) {
    case "parsed":
      assertNonEmpty(provenance.sourceId, `Parsed semantic entity ${entityId} source id`);
      if (
        !Number.isInteger(provenance.startOffset) ||
        !Number.isInteger(provenance.endOffset) ||
        provenance.startOffset < 0 ||
        provenance.endOffset <= provenance.startOffset
      ) {
        throw new Error(`Parsed semantic entity ${entityId} must name a non-empty source span.`);
      }
      return;
    case "inferred":
      assertNonEmpty(provenance.methodId, `Inferred semantic entity ${entityId} method id`);
      if (provenance.sourceEntityIds.length === 0) {
        throw new Error(`Inferred semantic entity ${entityId} requires source entities.`);
      }
      return;
    case "authored":
      assertNonEmpty(provenance.sourceId, `Authored semantic entity ${entityId} source id`);
      return;
    case "pedagogical":
      assertNonEmpty(provenance.rationale, `Pedagogical semantic entity ${entityId} rationale`);
      return;
  }
}

function provenanceEntityIds(provenance: KpSemanticEntityProvenance): readonly string[] {
  return provenance.kind === "inferred" || provenance.kind === "pedagogical"
    ? provenance.sourceEntityIds
    : [];
}

function copyProvenance(provenance: KpSemanticEntityProvenance): KpSemanticEntityProvenance {
  return provenance.kind === "inferred" || provenance.kind === "pedagogical"
    ? { ...provenance, sourceEntityIds: [...provenance.sourceEntityIds] }
    : { ...provenance };
}

function uniqueIds(
  values: readonly { readonly id: string }[],
  label: string
): ReadonlySet<string> {
  const ids = new Set<string>();
  values.forEach((value) => {
    if (ids.has(value.id)) throw new Error(`Duplicate ${label} ${value.id}.`);
    ids.add(value.id);
  });
  return ids;
}

function assertNoParentCycle(
  entity: KpSemanticEntity,
  entities: readonly KpSemanticEntity[]
): void {
  const seen = new Set([entity.id]);
  let parentId = entity.parentId;
  while (parentId !== undefined) {
    if (seen.has(parentId)) throw new Error(`Semantic entity ${entity.id} has a parent cycle.`);
    seen.add(parentId);
    parentId = entities.find((candidate) => candidate.id === parentId)?.parentId;
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}

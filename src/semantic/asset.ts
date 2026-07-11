export type KpAssetMetadataValue = string | number | boolean;

export interface KpAssetDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly path: string;
  readonly message: string;
}

export type KpAssetProvenanceKind =
  | "authored"
  | "derived"
  | "transformed"
  | "imported";

export interface KpAssetProvenance {
  readonly kind: KpAssetProvenanceKind;
  readonly sourceIds: readonly string[];
  readonly transformationId?: string | undefined;
  readonly portId?: string | undefined;
  readonly summary?: string | undefined;
  readonly diagnostics?: readonly KpAssetDiagnostic[] | undefined;
}

export interface KpAssetSelector {
  readonly id: string;
  readonly objectId: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSemanticAssetObject<TValue = unknown> {
  readonly id: string;
  readonly kind: "semantic-object";
  readonly objectType: string;
  readonly title: string;
  readonly value: TValue;
  readonly selectors: readonly KpAssetSelector[];
  readonly provenance?: KpAssetProvenance | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAssetBundle {
  readonly id: string;
  readonly title: string;
  readonly version: 1;
  readonly objects: readonly KpSemanticAssetObject[];
}

export interface KpAssetValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type CreateKpAssetSelectorInput =
  Omit<KpAssetSelector, "objectId">;

export interface CreateKpSemanticAssetObjectInput<TValue = unknown> {
  readonly id: string;
  readonly objectType: string;
  readonly title: string;
  readonly value: TValue;
  readonly selectors?: readonly CreateKpAssetSelectorInput[] | undefined;
  readonly provenance?: KpAssetProvenance | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface CreateKpAssetBundleInput {
  readonly id: string;
  readonly title: string;
  readonly objects?: readonly KpSemanticAssetObject[] | undefined;
}

export function createKpSemanticAssetObject<TValue>(
  input: CreateKpSemanticAssetObjectInput<TValue>
): KpSemanticAssetObject<TValue> {
  assertNonEmpty(input.id, "Semantic asset object id");
  assertNonEmpty(input.objectType, `Semantic asset object ${input.id} objectType`);
  assertNonEmpty(input.title, `Semantic asset object ${input.id} title`);

  return {
    id: input.id,
    kind: "semantic-object",
    objectType: input.objectType,
    title: input.title,
    value: input.value,
    selectors: (input.selectors ?? []).map((selector) =>
      createKpAssetSelector(input.id, selector)
    ),
    ...(input.provenance === undefined
      ? {}
      : { provenance: copyKpAssetProvenance(input.provenance) }),
    ...(input.metadata === undefined ? {} : { metadata: { ...input.metadata } })
  };
}

export function createKpAssetBundle(
  input: CreateKpAssetBundleInput
): KpAssetBundle {
  assertNonEmpty(input.id, "Asset bundle id");
  assertNonEmpty(input.title, `Asset bundle ${input.id} title`);

  return {
    id: input.id,
    title: input.title,
    version: 1,
    objects: [...(input.objects ?? [])]
  };
}

export function validateKpAssetBundle(
  bundle: KpAssetBundle
): readonly KpAssetValidationIssue[] {
  const issues: KpAssetValidationIssue[] = [];
  const objectIds = new Set<string>();
  const selectorIds = new Set<string>();

  bundle.objects.forEach((object, objectIndex) => {
    const objectPath = `objects[${objectIndex}]`;

    if (objectIds.has(object.id)) {
      issues.push({
        path: `${objectPath}.id`,
        message: `Duplicate asset object id: ${object.id}.`
      });
    } else {
      objectIds.add(object.id);
    }

    object.selectors.forEach((selector, selectorIndex) => {
      const selectorPath = `${objectPath}.selectors[${selectorIndex}]`;

      if (selector.objectId !== object.id) {
        issues.push({
          path: `${selectorPath}.objectId`,
          message: `Selector ${selector.id} must reference containing object ${object.id}.`
        });
      }

      if (selectorIds.has(selector.id)) {
        issues.push({
          path: `${selectorPath}.id`,
          message: `Duplicate asset selector id: ${selector.id}.`
        });
      } else {
        selectorIds.add(selector.id);
      }
    });
  });

  return issues;
}

export function findKpAssetSelector(
  bundle: KpAssetBundle,
  selectorId: string
): KpAssetSelector | undefined {
  for (const object of bundle.objects) {
    const selector = object.selectors.find((candidate) => candidate.id === selectorId);

    if (selector !== undefined) {
      return selector;
    }
  }

  return undefined;
}

function createKpAssetSelector(
  objectId: string,
  input: CreateKpAssetSelectorInput
): KpAssetSelector {
  assertNonEmpty(input.id, `Asset selector for ${objectId} id`);
  assertNonEmpty(input.kind, `Asset selector ${input.id} kind`);

  return {
    id: input.id,
    objectId,
    kind: input.kind,
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    ...(input.metadata === undefined ? {} : { metadata: { ...input.metadata } })
  };
}

function copyKpAssetProvenance(
  provenance: KpAssetProvenance
): KpAssetProvenance {
  return {
    kind: provenance.kind,
    sourceIds: [...provenance.sourceIds],
    ...(provenance.transformationId === undefined
      ? {}
      : { transformationId: provenance.transformationId }),
    ...(provenance.portId === undefined ? {} : { portId: provenance.portId }),
    ...(provenance.summary === undefined ? {} : { summary: provenance.summary }),
    ...(provenance.diagnostics === undefined
      ? {}
      : {
          diagnostics: provenance.diagnostics.map((diagnostic) => ({
            ...diagnostic
          }))
        })
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

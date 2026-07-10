export type SelectorCorrespondenceRelationId =
  | "identity"
  | "role-change"
  | "introduction"
  | "removal"
  | "cancelation"
  | "fan-in"
  | "fan-out"
  | "artifact"
  | "focus";

export type SelectorCorrespondenceEndpointShape =
  | "one-to-one"
  | "target-only"
  | "source-only"
  | "source-group"
  | "many-to-one"
  | "one-to-many"
  | "artifact"
  | "annotation";

export type SelectorCorrespondenceIdentityEffect =
  | "preserves-identity"
  | "introduces-value"
  | "removes-value"
  | "removes-through-cancelation"
  | "derives-value"
  | "visual-only";

export interface SelectorCorrespondenceRelationDefinition {
  readonly id: SelectorCorrespondenceRelationId;
  readonly endpointShape: SelectorCorrespondenceEndpointShape;
  readonly identityEffect: SelectorCorrespondenceIdentityEffect;
  readonly summary: string;
}

export interface SelectorCorrespondenceRecord {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly summary: string;
}

export interface CorrespondenceMap {
  readonly id: string;
  readonly records: readonly SelectorCorrespondenceRecord[];
}

export const selectorCorrespondenceRelations: readonly SelectorCorrespondenceRelationDefinition[] = [
  {
    id: "identity",
    endpointShape: "one-to-one",
    identityEffect: "preserves-identity",
    summary: "A source selector and target selector represent the same semantic value."
  },
  {
    id: "role-change",
    endpointShape: "one-to-one",
    identityEffect: "preserves-identity",
    summary:
      "A selector preserves identity while moving into a new visual role such as script, numerator, denominator, or wrapper context."
  },
  {
    id: "introduction",
    endpointShape: "target-only",
    identityEffect: "introduces-value",
    summary: "A target selector is introduced by the transformation."
  },
  {
    id: "removal",
    endpointShape: "source-only",
    identityEffect: "removes-value",
    summary: "A source selector exits without a target selector."
  },
  {
    id: "cancelation",
    endpointShape: "source-group",
    identityEffect: "removes-through-cancelation",
    summary: "A source selector is removed because it cancels with another selector."
  },
  {
    id: "fan-in",
    endpointShape: "many-to-one",
    identityEffect: "derives-value",
    summary:
      "Multiple source selectors derive a target selector without preserving individual identity."
  },
  {
    id: "fan-out",
    endpointShape: "one-to-many",
    identityEffect: "derives-value",
    summary:
      "One source selector derives multiple target selectors without making each target the same identity."
  },
  {
    id: "artifact",
    endpointShape: "artifact",
    identityEffect: "visual-only",
    summary:
      "A rendered delimiter, fraction bar, radical, bracket, accent, or overlay belongs to a semantic selector but has no separate semantic identity."
  },
  {
    id: "focus",
    endpointShape: "annotation",
    identityEffect: "visual-only",
    summary: "A semantic-preserving visual emphasis or annotation relation."
  }
];

export const selectorCorrespondenceRelationIds =
  selectorCorrespondenceRelations.map((relation) => relation.id);

export function findSelectorCorrespondenceRelation(
  id: SelectorCorrespondenceRelationId
): SelectorCorrespondenceRelationDefinition {
  const relation = selectorCorrespondenceRelations.find(
    (candidate) => candidate.id === id
  );

  if (relation === undefined) {
    throw new Error(`Unknown selector correspondence relation: ${id}`);
  }

  return relation;
}

export function cloneCorrespondenceMap(map: CorrespondenceMap): CorrespondenceMap {
  return {
    id: map.id,
    records: map.records.map((record) => ({
      id: record.id,
      relation: record.relation,
      sourceSelectorIds: [...record.sourceSelectorIds],
      targetSelectorIds: [...record.targetSelectorIds],
      summary: record.summary
    }))
  };
}

export function composeCorrespondenceMapsSequence(
  id: string,
  maps: readonly CorrespondenceMap[]
): CorrespondenceMap {
  validateCompositionInput(id, maps);

  return maps.slice(1).reduce(
    (currentMap, nextMap) => composeTwoCorrespondenceMaps(id, currentMap, nextMap),
    cloneCorrespondenceMap(maps[0]!)
  );
}

export function composeCorrespondenceMapsParallel(
  id: string,
  maps: readonly CorrespondenceMap[]
): CorrespondenceMap {
  validateCompositionInput(id, maps);

  return {
    id,
    records: maps.flatMap((map) =>
      map.records.map((record) => cloneRecordWithId(record, `${map.id}.${record.id}`))
    )
  };
}

function composeTwoCorrespondenceMaps(
  id: string,
  firstMap: CorrespondenceMap,
  secondMap: CorrespondenceMap
): CorrespondenceMap {
  const matchedSecondRecordIds = new Set<string>();
  const records = firstMap.records.flatMap((firstRecord) => {
    const matchingSecondRecords = secondMap.records.filter((secondRecord) =>
      selectorsOverlap(firstRecord.targetSelectorIds, secondRecord.sourceSelectorIds)
    );

    if (matchingSecondRecords.length === 0) {
      return [cloneRecordWithId(firstRecord, firstRecord.id)];
    }

    return matchingSecondRecords.map((secondRecord) => {
      matchedSecondRecordIds.add(secondRecord.id);

      return composeCorrespondenceRecords(firstMap, firstRecord, secondMap, secondRecord);
    });
  });
  const introducedRecords = secondMap.records
    .filter(
      (secondRecord) =>
        secondRecord.sourceSelectorIds.length === 0 &&
        !matchedSecondRecordIds.has(secondRecord.id)
    )
    .map((record) => cloneRecordWithId(record, `${secondMap.id}.${record.id}`));

  return {
    id,
    records: [...records, ...introducedRecords]
  };
}

function composeCorrespondenceRecords(
  firstMap: CorrespondenceMap,
  firstRecord: SelectorCorrespondenceRecord,
  secondMap: CorrespondenceMap,
  secondRecord: SelectorCorrespondenceRecord
): SelectorCorrespondenceRecord {
  return {
    id: `${firstMap.id}.${firstRecord.id}__${secondMap.id}.${secondRecord.id}`,
    relation: composeCorrespondenceRelation(firstRecord, secondRecord),
    sourceSelectorIds: [...firstRecord.sourceSelectorIds],
    targetSelectorIds: [...secondRecord.targetSelectorIds],
    summary: `${firstRecord.summary}; ${secondRecord.summary}`
  };
}

function composeCorrespondenceRelation(
  firstRecord: SelectorCorrespondenceRecord,
  secondRecord: SelectorCorrespondenceRecord
): SelectorCorrespondenceRelationId {
  if (firstRecord.sourceSelectorIds.length === 0) {
    return firstRecord.relation;
  }

  if (secondRecord.targetSelectorIds.length === 0) {
    return secondRecord.relation;
  }

  if (firstRecord.relation === "identity") {
    return secondRecord.relation;
  }

  if (secondRecord.relation === "identity") {
    return firstRecord.relation;
  }

  if (firstRecord.relation === secondRecord.relation) {
    return firstRecord.relation;
  }

  if (
    firstRecord.relation === "role-change" ||
    secondRecord.relation === "role-change"
  ) {
    return "role-change";
  }

  return "fan-in";
}

function cloneRecordWithId(
  record: SelectorCorrespondenceRecord,
  id: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: record.relation,
    sourceSelectorIds: [...record.sourceSelectorIds],
    targetSelectorIds: [...record.targetSelectorIds],
    summary: record.summary
  };
}

function selectorsOverlap(
  left: readonly string[],
  right: readonly string[]
): boolean {
  const rightSelectors = new Set(right);

  return left.some((selector) => rightSelectors.has(selector));
}

function validateCompositionInput(
  id: string,
  maps: readonly CorrespondenceMap[]
): void {
  if (maps.length === 0) {
    throw new Error(
      `Correspondence map composition ${id} requires at least one correspondence map.`
    );
  }
}

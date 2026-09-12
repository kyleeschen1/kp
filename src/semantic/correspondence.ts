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

export interface CorrespondenceMapValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface CorrespondenceLifecycleExpectation {
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}

export interface SelectorCorrespondencePlaybackRecord {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly fromSelectorIds: readonly string[];
  readonly toSelectorIds: readonly string[];
  readonly summary: string;
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

export function validateCorrespondenceMap(
  map: CorrespondenceMap,
  lifecycle?: CorrespondenceLifecycleExpectation
): readonly CorrespondenceMapValidationIssue[] {
  const issues: CorrespondenceMapValidationIssue[] = [];
  const recordIds = new Set<string>();

  if (map.id.trim().length === 0) {
    issues.push({ path: "id", message: "Correspondence map id must not be empty." });
  }

  map.records.forEach((record, index) => {
    const path = `records[${index}]`;
    if (record.id.trim().length === 0) {
      issues.push({ path: `${path}.id`, message: "Correspondence record id must not be empty." });
    } else if (recordIds.has(record.id)) {
      issues.push({
        path: `${path}.id`,
        message: `Correspondence map ${map.id} repeats record id ${record.id}.`
      });
    }
    recordIds.add(record.id);

    // Multiplicity means distinct semantic endpoints, not the same selector
    // repeated to satisfy a fan-in/fan-out length check.
    for (const field of ["sourceSelectorIds", "targetSelectorIds"] as const) {
      const seen = new Set<string>();
      record[field].forEach((selectorId, selectorIndex) => {
        if (!selectorId.trim() || seen.has(selectorId)) issues.push({
          path: `${path}.${field}[${selectorIndex}]`,
          message: `Correspondence record ${record.id} requires nonempty, distinct ${field}.`
        });
        seen.add(selectorId);
      });
    }

    if (!recordHasExpectedEndpointShape(record)) {
      const definition = findSelectorCorrespondenceRelation(record.relation);
      issues.push({
        path,
        message:
          `Correspondence record ${record.id} relation ${record.relation} requires endpoint shape ${definition.endpointShape}; received ${record.sourceSelectorIds.length} source and ${record.targetSelectorIds.length} target selector(s).`
      });
    }
  });

  if (lifecycle !== undefined) {
    issues.push(...validateTotalLifecycle(map, lifecycle));
  }

  return issues;
}

export function projectCorrespondenceMapForPlayback(
  map: CorrespondenceMap,
  direction: "forward" | "backward"
): readonly SelectorCorrespondencePlaybackRecord[] {
  return map.records.map((record) => ({
    id: record.id,
    relation: record.relation,
    fromSelectorIds: [
      ...(direction === "forward" ? record.sourceSelectorIds : record.targetSelectorIds)
    ],
    toSelectorIds: [
      ...(direction === "forward" ? record.targetSelectorIds : record.sourceSelectorIds)
    ],
    summary: record.summary
  }));
}

export function checkCorrespondenceMapRewindLaw(
  map: CorrespondenceMap
): readonly CorrespondenceMapValidationIssue[] {
  const forward = projectCorrespondenceMapForPlayback(map, "forward");
  const backward = projectCorrespondenceMapForPlayback(map, "backward");

  return forward.flatMap((record, index) => {
    const reverseRecord = backward[index];
    if (
      reverseRecord !== undefined &&
      stringArraysEqual(record.fromSelectorIds, reverseRecord.toSelectorIds) &&
      stringArraysEqual(record.toSelectorIds, reverseRecord.fromSelectorIds)
    ) {
      return [];
    }
    return [{
      path: `records[${index}]`,
      message: `Correspondence record ${record.id} does not mirror its endpoints for backward playback.`
    }];
  });
}

export function composeCorrespondenceMapsSequence(
  id: string,
  maps: readonly CorrespondenceMap[]
): CorrespondenceMap {
  validateCompositionInput(id, maps);

  const result = maps.slice(1).reduce(
    (currentMap, nextMap) => requireCompositionMap(composeTwoCorrespondenceMaps(id, currentMap, nextMap), "unsupported-result"),
    cloneCorrespondenceMap(maps[0]!)
  );
  return requireCompositionMap({ ...result, id }, "unsupported-result");
}

export function composeCorrespondenceMapsParallel(
  id: string,
  maps: readonly CorrespondenceMap[]
): CorrespondenceMap {
  validateCompositionInput(id, maps);

  return requireCompositionMap({
    id,
    records: maps.flatMap((map) =>
      map.records.map((record) => cloneRecordWithId(record, `${map.id}.${record.id}`))
    )
  }, "unsupported-result");
}

export class KpCorrespondenceCompositionRepairGap extends Error {
  readonly code: "malformed-input" | "unsupported-result";
  readonly path: string;
  constructor(code: KpCorrespondenceCompositionRepairGap["code"], path: string, message: string) {
    super(message); this.name = "KpCorrespondenceCompositionRepairGap";
    this.code = code; this.path = path;
  }
}

function requireCompositionMap(map: CorrespondenceMap, code: KpCorrespondenceCompositionRepairGap["code"]): CorrespondenceMap {
  const issue = validateCorrespondenceMap(map)[0];
  if (issue) throw new KpCorrespondenceCompositionRepairGap(code, issue.path, issue.message);
  return map;
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
    // Material introduced and retired entirely inside the sequence has no
    // composite boundary endpoint. Its intermediate life remains in the input
    // trace, not an invalid zero-to-zero boundary correspondence.
    records: [...records, ...introducedRecords].filter(record =>
      record.sourceSelectorIds.length + record.targetSelectorIds.length > 0)
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
  if (id.trim().length === 0) throw new KpCorrespondenceCompositionRepairGap("malformed-input", "id", "Composition id must not be empty.");
  if (maps.length === 0) {
    throw new Error(
      `Correspondence map composition ${id} requires at least one correspondence map.`
    );
  }
  // This is a partial correspondence utility, not a universal categorical
  // composition proof. Reject unsupported results instead of inventing a law.
  maps.forEach(map => requireCompositionMap(map, "malformed-input"));
}

function recordHasExpectedEndpointShape(
  record: SelectorCorrespondenceRecord
): boolean {
  const sourceCount = record.sourceSelectorIds.length;
  const targetCount = record.targetSelectorIds.length;
  switch (record.relation) {
    case "identity":
    case "role-change":
      return sourceCount === 1 && targetCount === 1;
    case "introduction":
      return sourceCount === 0 && targetCount >= 1;
    case "removal":
    case "cancelation":
      return sourceCount >= 1 && targetCount === 0;
    case "fan-in":
      return sourceCount >= 2 && targetCount === 1;
    case "fan-out":
      return sourceCount === 1 && targetCount >= 2;
    case "artifact":
    case "focus":
      return sourceCount + targetCount >= 1;
  }
}

function validateTotalLifecycle(
  map: CorrespondenceMap,
  expectation: CorrespondenceLifecycleExpectation
): readonly CorrespondenceMapValidationIssue[] {
  const semanticRecords = map.records.filter(
    (record) => record.relation !== "artifact" && record.relation !== "focus"
  );
  return [
    ...selectorLifecycleIssues(
      map,
      "source",
      expectation.sourceSelectorIds,
      semanticRecords.flatMap((record) => record.sourceSelectorIds)
    ),
    ...selectorLifecycleIssues(
      map,
      "target",
      expectation.targetSelectorIds,
      semanticRecords.flatMap((record) => record.targetSelectorIds)
    )
  ];
}

function selectorLifecycleIssues(
  map: CorrespondenceMap,
  side: "source" | "target",
  expectedSelectorIds: readonly string[],
  coveredSelectorIds: readonly string[]
): readonly CorrespondenceMapValidationIssue[] {
  const issues: CorrespondenceMapValidationIssue[] = [];
  const coverage = new Map<string, number>();
  coveredSelectorIds.forEach((selectorId) => {
    coverage.set(selectorId, (coverage.get(selectorId) ?? 0) + 1);
  });

  expectedSelectorIds.forEach((selectorId, index) => {
    const count = coverage.get(selectorId) ?? 0;
    if (count === 0) {
      issues.push({
        path: `lifecycle.${side}SelectorIds[${index}]`,
        message: `Correspondence map ${map.id} leaves ${side} selector ${selectorId} without a semantic lifecycle relation.`
      });
    } else if (count > 1) {
      issues.push({
        path: `lifecycle.${side}SelectorIds[${index}]`,
        message: `Correspondence map ${map.id} assigns ${side} selector ${selectorId} to ${count} semantic lifecycle relations.`
      });
    }
  });

  // The endpoint expectation can intentionally name semantic selectors only;
  // structural artifacts remain closure-checked by the IR and may still have
  // explicit introduction/removal records without becoming semantic material.

  return issues;
}

function stringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

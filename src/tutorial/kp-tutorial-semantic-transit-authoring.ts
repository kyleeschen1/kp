export interface KpTutorialTextReferenceAuthoring {
  readonly schemaVersion: "kp.tutorial.text-reference.v1";
  readonly id: string;
  readonly passageId: string;
}

export interface KpTutorialStageObjectAuthoring {
  readonly schemaVersion: "kp.tutorial.stage-object.v1";
  readonly id: string;
  readonly stageId: string;
}

export interface KpTutorialSemanticTransitAuthoring {
  readonly schemaVersion: "kp.tutorial.semantic-transit.v1";
  readonly id: string;
  readonly sourceReferenceId: string;
  readonly destinationObjectId: string;
}

export interface KpTutorialSemanticTransitAuthoringBundle {
  readonly schemaVersion: "kp.tutorial.semantic-transit-authoring.v1";
  readonly textReferences: readonly KpTutorialTextReferenceAuthoring[];
  readonly stageObjects: readonly KpTutorialStageObjectAuthoring[];
  readonly transits: readonly KpTutorialSemanticTransitAuthoring[];
}

export function defineKpTutorialTextReference(input: {
  readonly id: string;
  readonly passageId: string;
}): KpTutorialTextReferenceAuthoring {
  return Object.freeze({
    schemaVersion: "kp.tutorial.text-reference.v1",
    id: slug(input.id, "Text reference id"),
    passageId: slug(input.passageId, "Text reference passage id")
  });
}

export function defineKpTutorialStageObject(input: {
  readonly id: string;
  readonly stageId: string;
}): KpTutorialStageObjectAuthoring {
  return Object.freeze({
    schemaVersion: "kp.tutorial.stage-object.v1",
    id: slug(input.id, "Stage object id"),
    stageId: slug(input.stageId, "Stage id")
  });
}

export function defineKpTutorialSemanticTransit(input: {
  readonly id: string;
  readonly sourceReferenceId: string;
  readonly destinationObjectId: string;
}): KpTutorialSemanticTransitAuthoring {
  return Object.freeze({
    schemaVersion: "kp.tutorial.semantic-transit.v1",
    id: slug(input.id, "Semantic transit id"),
    sourceReferenceId: slug(
      input.sourceReferenceId,
      "Semantic transit source reference id"
    ),
    destinationObjectId: slug(
      input.destinationObjectId,
      "Semantic transit destination object id"
    )
  });
}

export function compileKpTutorialSemanticTransitAuthoring(input: {
  readonly textReferences: readonly KpTutorialTextReferenceAuthoring[];
  readonly stageObjects: readonly KpTutorialStageObjectAuthoring[];
  readonly transits: readonly KpTutorialSemanticTransitAuthoring[];
  readonly passageIds: readonly string[];
  readonly stageIds: readonly string[];
}): KpTutorialSemanticTransitAuthoringBundle {
  const textReferences = uniqueById(input.textReferences, "text reference");
  const stageObjects = uniqueById(input.stageObjects, "stage object");
  const transits = uniqueById(input.transits, "semantic transit");
  const passageIds = new Set(input.passageIds.map((id) =>
    slug(id, "Known passage id")
  ));
  const stageIds = new Set(input.stageIds.map((id) =>
    slug(id, "Known stage id")
  ));
  for (const reference of textReferences) {
    if (!passageIds.has(reference.passageId)) {
      throw new Error(
        `Text reference ${reference.id} names unknown passage ${reference.passageId}.`
      );
    }
  }
  for (const object of stageObjects) {
    if (!stageIds.has(object.stageId)) {
      throw new Error(
        `Stage object ${object.id} names unknown stage ${object.stageId}.`
      );
    }
  }
  const referencesById = new Map(textReferences.map((record) => [
    record.id,
    record
  ]));
  const objectsById = new Map(stageObjects.map((record) => [record.id, record]));
  for (const transit of transits) {
    if (!referencesById.has(transit.sourceReferenceId)) {
      throw new Error(
        `Semantic transit ${transit.id} names unknown text reference ` +
        `${transit.sourceReferenceId}.`
      );
    }
    if (!objectsById.has(transit.destinationObjectId)) {
      throw new Error(
        `Semantic transit ${transit.id} names unknown stage object ` +
        `${transit.destinationObjectId}.`
      );
    }
  }
  return Object.freeze({
    schemaVersion: "kp.tutorial.semantic-transit-authoring.v1",
    textReferences,
    stageObjects,
    transits
  });
}

function uniqueById<RecordType extends { readonly id: string }>(
  records: readonly RecordType[],
  label: string
): readonly RecordType[] {
  const ids = new Set<string>();
  for (const record of records) {
    slug(record.id, `${label} id`);
    if (ids.has(record.id)) throw new Error(`Duplicate ${label} id: ${record.id}`);
    ids.add(record.id);
  }
  return Object.freeze([...records]);
}

function slug(value: string, label: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} must be a lowercase semantic slug.`);
  }
  return value;
}

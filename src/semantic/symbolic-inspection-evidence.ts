import { validateKpAssetBundle, type KpAssetBundle } from "./asset.ts";
import { normalizeKpSemanticTransformationCorrespondence, validateKpSemanticTransformation, type KpSemanticTransformation } from "./asset-transformation.ts";
import type { KpSymbolicInspectionCheck, KpSymbolicInspectionEvidence } from "./symbolic-inspection-types.ts";

export class KpSymbolicInspectionGap extends Error {
  readonly kind = "symbolic-inspection-gap";
  readonly path: string;
  constructor(path: string, message: string) { super(`${path}: ${message}`); this.path = path; }
}

export interface KpSymbolicInspectionInput {
  readonly assetId: string;
  readonly sourceRevision: string;
  readonly targetRevision: string;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}

export function projectKpSymbolicInspectionEvidence(input: KpSymbolicInspectionInput): KpSymbolicInspectionEvidence {
  for (const key of ["assetId", "sourceRevision", "targetRevision"] as const) {
    if (!input[key].trim()) throw new KpSymbolicInspectionGap(key, "An explicit artifact/revision reference is required.");
  }
  if (input.sourceRevision === input.targetRevision) throw new KpSymbolicInspectionGap("targetRevision", "A transformation requires distinct source and target revisions.");
  const transformation = input.transformation;
  for (const key of ["id", "title", "transformType"] as const) {
    if (!transformation[key].trim()) throw new KpSymbolicInspectionGap(key, "Transformation metadata must be explicit.");
  }
  for (const side of ["source", "target"] as const) {
    const ids = transformation[`${side}ObjectIds`];
    if (!ids.length || new Set(ids).size !== ids.length) throw new KpSymbolicInspectionGap(side, "Endpoint objects must be nonempty and unique.");
  }
  const issues = [...validateKpAssetBundle(input.bundle), ...validateKpSemanticTransformation(transformation, input.bundle)];
  if (issues[0]) throw new KpSymbolicInspectionGap(issues[0].path, issues[0].message);
  const map = normalizeKpSemanticTransformationCorrespondence(transformation);
  // A selector existing elsewhere in the bundle does not put it on this edge.
  for (const side of ["source", "target"] as const) {
    const objects = transformation[`${side}ObjectIds`];
    const allowed = new Set(input.bundle.objects.filter(object => objects.includes(object.id)).flatMap(object => object.selectors.map(selector => selector.id)));
    for (const record of map.records) for (const id of record[`${side}SelectorIds`]) {
      if (!allowed.has(id)) throw new KpSymbolicInspectionGap(`correspondence.${record.id}.${side}`, `Selector ${id} is outside this transformation endpoint.`);
    }
  }
  const checks: KpSymbolicInspectionCheck[] = [
    { status: "checked", scope: "reference-and-lifecycle", owner: "validateKpSemanticTransformation" },
    ...(transformation.lawRefs ?? []).map(law => ({ status: "declared" as const, scope: "law" as const, law: Object.freeze({ ...law }) })),
    ...(transformation.assumptions ?? []).map(statement => ({ status: "unknown" as const, scope: "assumption" as const, statement }))
  ];
  return Object.freeze({
    schemaVersion: "kp.symbolic-inspection.v1",
    assetId: input.assetId, sourceRevision: input.sourceRevision, targetRevision: input.targetRevision,
    transformationId: transformation.id, title: transformation.title, operation: transformation.transformType,
    ...(transformation.definitionId ? { definitionId: transformation.definitionId } : {}),
    sourceObjectIds: Object.freeze([...transformation.sourceObjectIds]),
    targetObjectIds: Object.freeze([...transformation.targetObjectIds]),
    checks: Object.freeze(checks.map(check => Object.freeze(check))),
    correspondence: Object.freeze(map.records.map(record => Object.freeze({ ...record,
      sourceSelectorIds: Object.freeze([...record.sourceSelectorIds]),
      targetSelectorIds: Object.freeze([...record.targetSelectorIds]) })))
  });
}

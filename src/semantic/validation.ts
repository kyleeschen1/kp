import type { KpDocument, KpSemanticObject } from "./document.ts";
import {
  GRAPH_3D_SURFACE_QUALITY_IDS,
  GRAPH_3D_VIEW_MODE_IDS
} from "./graph.ts";
import { sourceFileLines } from "./source-file.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateKpDocument(document: KpDocument): readonly ValidationIssue[] {
  const objectsById = new Map(document.objects.map((object) => [object.id, object]));

  return document.objects.flatMap((object, index) =>
    validateObject(object, `objects[${index}]`, objectsById)
  );
}

function validateObject(
  object: KpSemanticObject,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  switch (object.type) {
    case "animation-intent":
      return validateAnimationIntent(object, path, objectsById);
    case "axis-2d":
      return validateAxisObject(object, path, objectsById);
    case "axis-3d":
      return validateAxis3DObject(object, path, objectsById);
    case "curve-2d":
      return validateCurveObject(object, path, objectsById);
    case "curve-3d":
      return validateCurve3DObject(object, path, objectsById);
    case "expression":
      return validateExpressionObject(object, path);
    case "graph-2d":
      return validateGraphObject(object, path, objectsById);
    case "graph-3d":
      return validateGraph3DObject(object, path, objectsById);
    case "latex-comparison":
      return validateLatexComparisonObject(object, path, objectsById);
    case "latex-form":
      return validateLatexFormObject(object, path);
    case "linear-map":
      return validateLinearMapObject(object, path, objectsById);
    case "matrix":
      return validateMatrixObject(object, path);
    case "source-file":
      return validateSourceFileObject(object, path);
    case "surface-3d":
      return validateSurface3DObject(object, path, objectsById);
  }
}

function validateGraphObject(
  object: Extract<KpSemanticObject, { type: "graph-2d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.xDomain`, object.xDomain, `Graph ${object.id} xDomain`));
  issues.push(...validateDomain(`${path}.yDomain`, object.yDomain, `Graph ${object.id} yDomain`));

  const xAxis = objectsById.get(object.xAxisId);
  if (xAxis?.type !== "axis-2d" || xAxis.orientation !== "x") {
    issues.push({
      path: `${path}.xAxisId`,
      message: `Graph ${object.id} references missing x-axis ${object.xAxisId}.`
    });
  }

  const yAxis = objectsById.get(object.yAxisId);
  if (yAxis?.type !== "axis-2d" || yAxis.orientation !== "y") {
    issues.push({
      path: `${path}.yAxisId`,
      message: `Graph ${object.id} references missing y-axis ${object.yAxisId}.`
    });
  }

  return issues;
}

function validateExpressionObject(
  object: Extract<KpSemanticObject, { type: "expression" }>,
  path: string
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (object.label.trim().length === 0) {
    issues.push({
      path: `${path}.label`,
      message: `Expression ${object.id} label must not be empty.`
    });
  }

  if (object.variables.some((variableName) => variableName.trim().length === 0)) {
    issues.push({
      path: `${path}.variables`,
      message: `Expression ${object.id} variables must not be empty.`
    });
  }

  return issues;
}

function validateLinearMapObject(
  object: Extract<KpSemanticObject, { type: "linear-map" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sourceMatrix = objectsById.get(object.sourceMatrixId);

  if (sourceMatrix?.type !== "matrix") {
    issues.push({
      path: `${path}.sourceMatrixId`,
      message: `Linear map ${object.id} references missing matrix ${object.sourceMatrixId}.`
    });
  }

  if (object.rows.length !== object.codomainDimension) {
    issues.push({
      path: `${path}.codomainDimension`,
      message: `Linear map ${object.id} codomainDimension must match its row count.`
    });
  }

  const domainDimension = object.rows[0]?.length ?? 0;

  if (object.domainDimension !== domainDimension) {
    issues.push({
      path: `${path}.domainDimension`,
      message: `Linear map ${object.id} domainDimension must match its column count.`
    });
  }

  if (object.rows.some((row) => row.length !== domainDimension)) {
    issues.push({
      path: `${path}.rows`,
      message: `Linear map ${object.id} rows must be rectangular.`
    });
  }

  return issues;
}

function validateGraph3DObject(
  object: Extract<KpSemanticObject, { type: "graph-3d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.xDomain`, object.xDomain, `Graph ${object.id} xDomain`));
  issues.push(...validateDomain(`${path}.yDomain`, object.yDomain, `Graph ${object.id} yDomain`));
  issues.push(...validateDomain(`${path}.zDomain`, object.zDomain, `Graph ${object.id} zDomain`));

  const xAxis = objectsById.get(object.xAxisId);
  if (xAxis?.type !== "axis-3d" || xAxis.orientation !== "x") {
    issues.push({
      path: `${path}.xAxisId`,
      message: `Graph ${object.id} references missing x-axis ${object.xAxisId}.`
    });
  }

  const yAxis = objectsById.get(object.yAxisId);
  if (yAxis?.type !== "axis-3d" || yAxis.orientation !== "y") {
    issues.push({
      path: `${path}.yAxisId`,
      message: `Graph ${object.id} references missing y-axis ${object.yAxisId}.`
    });
  }

  const zAxis = objectsById.get(object.zAxisId);
  if (zAxis?.type !== "axis-3d" || zAxis.orientation !== "z") {
    issues.push({
      path: `${path}.zAxisId`,
      message: `Graph ${object.id} references missing z-axis ${object.zAxisId}.`
    });
  }

  if (
    !GRAPH_3D_SURFACE_QUALITY_IDS.includes(
      object.surfaceQuality as typeof GRAPH_3D_SURFACE_QUALITY_IDS[number]
    )
  ) {
    issues.push({
      path: `${path}.surfaceQuality`,
      message: `Graph ${object.id} surfaceQuality must be interactive, balanced, or high.`
    });
  }

  if (
    !GRAPH_3D_VIEW_MODE_IDS.includes(
      object.viewMode as typeof GRAPH_3D_VIEW_MODE_IDS[number]
    )
  ) {
    issues.push({
      path: `${path}.viewMode`,
      message: `Graph ${object.id} viewMode must be 3d or xy.`
    });
  }

  return issues;
}

function validateAnimationIntent(
  object: Extract<KpSemanticObject, { type: "animation-intent" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const target = objectsById.get(object.targetId);

  if (target?.type !== object.targetType) {
    issues.push({
      path: `${path}.targetId`,
      message: `Animation ${object.id} references missing surface ${object.targetId}.`
    });
  } else if (
    object.property === "saddle.denominator" &&
    target.parameterization?.kind !== "saddle"
  ) {
    issues.push({
      path: `${path}.property`,
      message: `Animation ${object.id} target ${object.targetId} is not a parameterized saddle.`
    });
  }

  if (!Number.isFinite(object.durationMs) || object.durationMs <= 0) {
    issues.push({
      path: `${path}.durationMs`,
      message: `Animation ${object.id} durationMs must be positive.`
    });
  }

  if (!Number.isFinite(object.from) || object.from <= 0) {
    issues.push({
      path: `${path}.from`,
      message: `Animation ${object.id} from must be positive.`
    });
  }

  if (!Number.isFinite(object.to) || object.to <= 0) {
    issues.push({
      path: `${path}.to`,
      message: `Animation ${object.id} to must be positive.`
    });
  }

  return issues;
}

function validateAxisObject(
  object: Extract<KpSemanticObject, { type: "axis-2d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.domain`, object.domain, `Axis ${object.id} domain`));

  if (objectsById.get(object.graphId)?.type !== "graph-2d") {
    issues.push({
      path: `${path}.graphId`,
      message: `Axis ${object.id} references missing graph ${object.graphId}.`
    });
  }

  if (!Number.isFinite(object.tickStep) || object.tickStep <= 0) {
    issues.push({
      path: `${path}.tickStep`,
      message: `Axis ${object.id} tickStep must be positive.`
    });
  }

  return issues;
}

function validateAxis3DObject(
  object: Extract<KpSemanticObject, { type: "axis-3d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.domain`, object.domain, `Axis ${object.id} domain`));

  if (objectsById.get(object.graphId)?.type !== "graph-3d") {
    issues.push({
      path: `${path}.graphId`,
      message: `Axis ${object.id} references missing graph ${object.graphId}.`
    });
  }

  if (!Number.isFinite(object.tickStep) || object.tickStep <= 0) {
    issues.push({
      path: `${path}.tickStep`,
      message: `Axis ${object.id} tickStep must be positive.`
    });
  }

  return issues;
}

function validateCurveObject(
  object: Extract<KpSemanticObject, { type: "curve-2d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.xDomain`, object.xDomain, `Curve ${object.id} xDomain`));

  if (objectsById.get(object.graphId)?.type !== "graph-2d") {
    issues.push({
      path: `${path}.graphId`,
      message: `Curve ${object.id} references missing graph ${object.graphId}.`
    });
  }

  if (!Number.isInteger(object.sampleCount) || object.sampleCount < 2) {
    issues.push({
      path: `${path}.sampleCount`,
      message: `Curve ${object.id} sampleCount must be an integer of at least 2.`
    });
  }

  return issues;
}

function validateCurve3DObject(
  object: Extract<KpSemanticObject, { type: "curve-3d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.tDomain`, object.tDomain, `Curve ${object.id} tDomain`));

  if (objectsById.get(object.graphId)?.type !== "graph-3d") {
    issues.push({
      path: `${path}.graphId`,
      message: `Curve ${object.id} references missing graph ${object.graphId}.`
    });
  }

  if (!Number.isInteger(object.sampleCount) || object.sampleCount < 2) {
    issues.push({
      path: `${path}.sampleCount`,
      message: `Curve ${object.id} sampleCount must be an integer of at least 2.`
    });
  }

  return issues;
}

function validateSurface3DObject(
  object: Extract<KpSemanticObject, { type: "surface-3d" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateDomain(`${path}.xDomain`, object.xDomain, `Surface ${object.id} xDomain`));
  issues.push(...validateDomain(`${path}.yDomain`, object.yDomain, `Surface ${object.id} yDomain`));

  if (objectsById.get(object.graphId)?.type !== "graph-3d") {
    issues.push({
      path: `${path}.graphId`,
      message: `Surface ${object.id} references missing graph ${object.graphId}.`
    });
  }

  issues.push(
    ...validateSampleCount(
      `${path}.xSampleCount`,
      object.xSampleCount,
      `Surface ${object.id} xSampleCount`
    )
  );
  issues.push(
    ...validateSampleCount(
      `${path}.ySampleCount`,
      object.ySampleCount,
      `Surface ${object.id} ySampleCount`
    )
  );

  return issues;
}

function validateLatexComparisonObject(
  object: Extract<KpSemanticObject, { type: "latex-comparison" }>,
  path: string,
  objectsById: ReadonlyMap<string, KpSemanticObject>
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (object.formIds.length < 2) {
    issues.push({
      path: `${path}.formIds`,
      message: `LaTeX comparison ${object.id} must reference at least two formulas.`
    });
  }

  object.formIds.forEach((formId, index) => {
    if (objectsById.get(formId)?.type !== "latex-form") {
      issues.push({
        path: `${path}.formIds[${index}]`,
        message: `LaTeX comparison ${object.id} references missing formula ${formId}.`
      });
    }
  });

  return issues;
}

function validateLatexFormObject(
  object: Extract<KpSemanticObject, { type: "latex-form" }>,
  path: string
): readonly ValidationIssue[] {
  if (object.latex.trim().length === 0) {
    return [
      {
        path: `${path}.latex`,
        message: `LaTeX form ${object.id} must not be empty.`
      }
    ];
  }

  return [];
}

function validateMatrixObject(
  object: Extract<KpSemanticObject, { type: "matrix" }>,
  path: string
): readonly ValidationIssue[] {
  if (object.rows.length === 0) {
    return [
      {
        path: `${path}.rows`,
        message: `Matrix ${object.id} must have at least one row.`
      }
    ];
  }

  const columnCount = object.rows[0]?.length ?? 0;

  if (columnCount === 0) {
    return [
      {
        path: `${path}.rows`,
        message: `Matrix ${object.id} must have at least one column.`
      }
    ];
  }

  if (object.rows.some((row) => row.length !== columnCount)) {
    return [
      {
        path: `${path}.rows`,
        message: `Matrix ${object.id} must be rectangular.`
      }
    ];
  }

  return [];
}

function validateSourceFileObject(
  object: Extract<KpSemanticObject, { type: "source-file" }>,
  path: string
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (object.label.trim().length === 0) {
    issues.push({
      path: `${path}.label`,
      message: `SourceFile ${object.id} label must not be empty.`
    });
  }

  if (object.language.trim().length === 0) {
    issues.push({
      path: `${path}.language`,
      message: `SourceFile ${object.id} language must not be empty.`
    });
  }

  if (object.sourceText.trim().length === 0) {
    issues.push({
      path: `${path}.sourceText`,
      message: `SourceFile ${object.id} source text must not be empty.`
    });
  }

  if (object.lineCount !== sourceFileLines(object).length) {
    issues.push({
      path: `${path}.lineCount`,
      message: `SourceFile ${object.id} lineCount must match source text.`
    });
  }

  if (object.path !== undefined && object.path.trim().length === 0) {
    issues.push({
      path: `${path}.path`,
      message: `SourceFile ${object.id} path must not be empty.`
    });
  }

  if (
    object.revisionId !== undefined &&
    object.revisionId.trim().length === 0
  ) {
    issues.push({
      path: `${path}.revisionId`,
      message: `SourceFile ${object.id} revisionId must not be empty.`
    });
  }

  return issues;
}

function validateSampleCount(
  path: string,
  value: number,
  label: string
): readonly ValidationIssue[] {
  if (!Number.isInteger(value) || value < 2) {
    return [
      {
        path,
        message: `${label} must be an integer of at least 2.`
      }
    ];
  }

  return [];
}

function validateDomain(
  path: string,
  domain: readonly [number, number],
  label: string
): readonly ValidationIssue[] {
  if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) {
    return [
      {
        path,
        message: `${label} values must be finite.`
      }
    ];
  }

  if (domain[0] >= domain[1]) {
    return [
      {
        path,
        message: `${label} must increase from min to max.`
      }
    ];
  }

  return [];
}

import type { KpDocument, KpSemanticObject } from "./document.ts";

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
    case "axis-2d":
      return validateAxisObject(object, path, objectsById);
    case "curve-2d":
      return validateCurveObject(object, path, objectsById);
    case "graph-2d":
      return validateGraphObject(object, path, objectsById);
    case "matrix":
      return validateMatrixObject(object, path);
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

import type { KpDocument, KpSemanticObject } from "./document.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateKpDocument(document: KpDocument): readonly ValidationIssue[] {
  return document.objects.flatMap((object, index) =>
    validateObject(object, `objects[${index}]`)
  );
}

function validateObject(
  object: KpSemanticObject,
  path: string
): readonly ValidationIssue[] {
  switch (object.type) {
    case "matrix":
      return validateMatrixObject(object, path);
  }
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

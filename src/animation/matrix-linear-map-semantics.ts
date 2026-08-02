import type { KpAnimationAsset } from "./asset.ts";
import { createMatrixObject, type MatrixObject } from "../semantic/matrix.ts";
import {
  deriveLinearMapFromMatrix,
  type LinearMapObject,
  type MatrixLinearMapDerivation
} from "../semantic/linear-map.ts";

export interface KpStandardBasisObject {
  readonly id: string;
  readonly type: "basis";
  readonly label: string;
  readonly dimension: number;
  readonly vectors: readonly (readonly number[])[];
  readonly coordinateSpace: "domain" | "codomain";
}

export interface KpMappedBasisVector {
  readonly id: string;
  readonly type: "mapped-basis-vector";
  readonly basisVectorIndex: number;
  readonly sourceCoordinates: readonly number[];
  readonly targetCoordinates: readonly number[];
  readonly sourceMatrixColumnIndex: number;
}

export interface KpMatrixLinearMapSemantics {
  readonly matrix: MatrixObject;
  readonly linearMap: LinearMapObject;
  readonly derivation: MatrixLinearMapDerivation["record"];
  readonly domainBasis: KpStandardBasisObject;
  readonly codomainBasis: KpStandardBasisObject;
  readonly mappedBasisVectors: readonly KpMappedBasisVector[];
  readonly inputCoordinates: readonly number[];
  readonly outputCoordinates: readonly number[];
  readonly rowMeaning: "output-coordinate-functionals";
  readonly columnMeaning: "mapped-domain-basis-vectors";
}

/**
 * Makes the row/column seam explicit: rows calculate output coordinates while
 * columns describe the geometric images of the chosen domain basis vectors.
 */
export function deriveKpMatrixLinearMapSemantics(
  animation: KpAnimationAsset
): KpMatrixLinearMapSemantics {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "multiplyMatrixVector"
  );
  if (transformation === undefined) {
    throw new Error(`Animation ${animation.id} has no matrix-vector transformation.`);
  }
  const source = animation.bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  const target = animation.bundle.objects.find(
    (object) => object.id === transformation.targetObjectIds[0]
  );
  const matrixRows = numericMatrix(source?.value, "matrixRows");
  const inputCoordinates = numericArray(source?.value, "vector");
  const outputCoordinates = numericArray(target?.value, "result");
  const domainDimension = matrixRows[0]?.length ?? 0;
  const codomainDimension = matrixRows.length;
  const prefix = transformation.id;
  const domainBasis = standardBasis(
    `${prefix}.basis.domain.standard`,
    "Domain standard basis",
    domainDimension,
    "domain"
  );
  const codomainBasis = standardBasis(
    `${prefix}.basis.codomain.standard`,
    "Codomain standard basis",
    codomainDimension,
    "codomain"
  );
  const matrix = createMatrixObject({
    id: `${prefix}.matrix`,
    label: "A",
    rows: matrixRows
  });
  const { object: linearMap, record: derivation } = deriveLinearMapFromMatrix(
    matrix,
    {
      id: `${prefix}.linear-map`,
      label: "T_A",
      domainBasisId: domainBasis.id,
      codomainBasisId: codomainBasis.id
    }
  );
  const mappedBasisVectors = Array.from(
    { length: domainDimension },
    (_, columnIndex): KpMappedBasisVector => ({
      id: `${linearMap.id}.basis-image.${columnIndex}`,
      type: "mapped-basis-vector",
      basisVectorIndex: columnIndex,
      sourceCoordinates: domainBasis.vectors[columnIndex]!,
      targetCoordinates: matrixRows.map((row) => row[columnIndex]!),
      sourceMatrixColumnIndex: columnIndex
    })
  );
  return {
    matrix,
    linearMap,
    derivation,
    domainBasis,
    codomainBasis,
    mappedBasisVectors,
    inputCoordinates,
    outputCoordinates,
    rowMeaning: "output-coordinate-functionals",
    columnMeaning: "mapped-domain-basis-vectors"
  };
}

function standardBasis(
  id: string,
  label: string,
  dimension: number,
  coordinateSpace: KpStandardBasisObject["coordinateSpace"]
): KpStandardBasisObject {
  return {
    id,
    type: "basis",
    label,
    dimension,
    vectors: Array.from({ length: dimension }, (_, rowIndex) =>
      Array.from({ length: dimension }, (_, columnIndex) =>
        rowIndex === columnIndex ? 1 : 0
      )
    ),
    coordinateSpace
  };
}

function numericMatrix(
  value: unknown,
  key: string
): readonly (readonly number[])[] {
  const candidate = recordValue(value, key);
  if (
    !Array.isArray(candidate) ||
    candidate.length === 0 ||
    !candidate.every((row) =>
      Array.isArray(row) &&
      row.length === candidate[0]!.length &&
      row.every((entry) => typeof entry === "number")
    )
  ) {
    throw new Error(`Matrix linear-map semantics require rectangular ${key}.`);
  }
  return candidate as readonly (readonly number[])[];
}

function numericArray(value: unknown, key: string): readonly number[] {
  const candidate = recordValue(value, key);
  if (
    !Array.isArray(candidate) ||
    !candidate.every((entry) => typeof entry === "number")
  ) {
    throw new Error(`Matrix linear-map semantics require numeric ${key}.`);
  }
  return candidate as readonly number[];
}

function recordValue(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

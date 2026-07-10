import {
  createSemanticDerivationRecord,
  explainSemanticDeriveCapability,
  type SemanticDerivationRecord
} from "./derive-protocols.ts";
import {
  createMatrixObject,
  type MatrixObject
} from "./matrix.ts";

export interface LinearMapObject {
  id: string;
  type: "linear-map";
  label: string;
  sourceMatrixId: string;
  rows: MatrixObject["rows"];
  domainDimension: number;
  codomainDimension: number;
  domainBasisId: string;
  codomainBasisId: string;
}

export interface DeriveLinearMapFromMatrixOptions {
  readonly id?: string;
  readonly label?: string;
  readonly domainBasisId?: string;
  readonly codomainBasisId?: string;
}

export interface MatrixLinearMapDerivation {
  readonly object: LinearMapObject;
  readonly record: SemanticDerivationRecord;
}

export function deriveLinearMapFromMatrix(
  matrix: MatrixObject,
  options: DeriveLinearMapFromMatrixOptions = {}
): MatrixLinearMapDerivation {
  const domainDimension = matrix.rows[0]?.length ?? 0;
  const codomainDimension = matrix.rows.length;
  const object: LinearMapObject = {
    id: options.id ?? `${matrix.id}.linear-map`,
    type: "linear-map",
    label: options.label ?? `${matrix.label} as linear map`,
    sourceMatrixId: matrix.id,
    rows: matrix.rows,
    domainDimension,
    codomainDimension,
    domainBasisId: options.domainBasisId ?? "basis.domain.standard",
    codomainBasisId: options.codomainBasisId ?? "basis.codomain.standard"
  };
  const descriptor = explainSemanticDeriveCapability("matrix.linear-map");
  const record = createSemanticDerivationRecord({
    id: `derive.${matrix.id}.linear-map`,
    descriptor,
    sourceObjectId: matrix.id,
    targetObjectId: object.id,
    sourceSelectors: matrixEntrySelectors(matrix),
    targetSelectors: [
      "map",
      `basis.domain:${object.domainBasisId}`,
      `basis.codomain:${object.codomainBasisId}`
    ],
    assumptions: [
      `domain basis ${object.domainBasisId}`,
      `codomain basis ${object.codomainBasisId}`
    ]
  });

  return { object, record };
}

export function linearMapToMatrixObject(linearMap: LinearMapObject): MatrixObject {
  return createMatrixObject({
    id: `${linearMap.id}.matrix`,
    label: linearMap.label,
    rows: linearMap.rows
  });
}

function matrixEntrySelectors(matrix: MatrixObject): readonly string[] {
  return matrix.rows.flatMap((row, rowIndex) =>
    row.map((_, columnIndex) => `entry[${rowIndex},${columnIndex}]`)
  );
}

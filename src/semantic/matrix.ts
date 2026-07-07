export interface MatrixObject {
  id: string;
  type: "matrix";
  label: string;
  rows: readonly (readonly number[])[];
}

interface CreateMatrixObjectInput {
  id: string;
  label: string;
  rows: readonly (readonly number[])[];
}

interface IdentityMatrixInput {
  id: string;
  label: string;
  size: number;
}

export function createMatrixObject(input: CreateMatrixObjectInput): MatrixObject {
  return {
    id: input.id,
    type: "matrix",
    label: input.label,
    rows: input.rows
  };
}

export function identityMatrix(input: IdentityMatrixInput): MatrixObject {
  return createMatrixObject({
    id: input.id,
    label: input.label,
    rows: Array.from({ length: input.size }, (_, rowIndex) =>
      Array.from({ length: input.size }, (_, columnIndex) =>
        rowIndex === columnIndex ? 1 : 0
      )
    )
  });
}

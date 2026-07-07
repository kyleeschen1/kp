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

export function createMatrixObject(input: CreateMatrixObjectInput): MatrixObject {
  return {
    id: input.id,
    type: "matrix",
    label: input.label,
    rows: input.rows
  };
}

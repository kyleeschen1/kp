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
  validateMatrixRows(input.id, input.rows);

  return {
    id: input.id,
    type: "matrix",
    label: input.label,
    rows: input.rows
  };
}

export function identityMatrix(input: IdentityMatrixInput): MatrixObject {
  if (!Number.isInteger(input.size) || input.size < 1) {
    throw new Error(
      `Identity matrix ${input.id} size must be a positive integer.`
    );
  }

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

function validateMatrixRows(
  id: string,
  rows: readonly (readonly number[])[]
): void {
  if (rows.length === 0) {
    throw new Error(`Matrix ${id} must have at least one row.`);
  }

  const columnCount = rows[0]?.length ?? 0;

  if (columnCount === 0) {
    throw new Error(`Matrix ${id} must have at least one column.`);
  }

  if (rows.some((row) => row.length !== columnCount)) {
    throw new Error(`Matrix ${id} must be rectangular.`);
  }
}

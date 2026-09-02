import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import {
  add,
  compileExpression,
  differentiate,
  expressionToLatex,
  multiply,
  variable,
  type MathExpression,
  type NumericScope
} from "./expression.ts";

export interface KpScalarType {
  readonly kind: "scalar";
}

export interface KpVectorType<Size extends number = number> {
  readonly kind: "vector";
  readonly size: Size;
}

export interface KpMatrixType<
  Rows extends number = number,
  Columns extends number = number
> {
  readonly kind: "matrix";
  readonly rows: Rows;
  readonly columns: Columns;
}

export type KpMathValueType =
  | KpScalarType
  | KpVectorType
  | KpMatrixType;

export interface KpFunctionType<
  Inputs extends readonly KpMathValueType[] = readonly KpMathValueType[],
  Output extends KpMathValueType = KpMathValueType
> {
  readonly kind: "function";
  readonly inputs: Inputs;
  readonly output: Output;
}

export type KpMathProvenance =
  | Readonly<{
      kind: "authored";
      sourceId: string;
    }>
  | Readonly<{
      kind: "parsed";
      sourceId: string;
      startOffset: number;
      endOffset: number;
      revisionId?: string | undefined;
    }>
  | Readonly<{
      kind: "derived";
      sourceIds: readonly string[];
      methodId: string;
    }>;

interface KpTypedMathValueBase<Type extends KpMathValueType> {
  readonly id: string;
  readonly type: Type;
  readonly provenance: KpMathProvenance;
}

export interface KpScalarExpression
  extends KpTypedMathValueBase<KpScalarType> {
  readonly kind: "scalar-expression";
  readonly expression: MathExpression;
}

export interface KpScalarParameter<Name extends string = string>
  extends KpTypedMathValueBase<KpScalarType> {
  readonly kind: "scalar-parameter";
  readonly name: Name;
  readonly expression: MathExpression;
}

export type KpScalarValue = KpScalarExpression | KpScalarParameter;

export interface KpTypedVector<
  Size extends number = number,
  Entries extends readonly KpScalarValue[] = readonly KpScalarValue[]
> extends KpTypedMathValueBase<KpVectorType<Size>> {
  readonly kind: "typed-vector";
  readonly size: Size;
  readonly entries: Entries;
}

export interface KpTypedMatrix<
  Rows extends number = number,
  Columns extends number = number
> extends KpTypedMathValueBase<KpMatrixType<Rows, Columns>> {
  readonly kind: "typed-matrix";
  readonly rowCount: Rows;
  readonly columnCount: Columns;
  readonly rows: readonly (readonly KpScalarValue[])[];
  /** Basis authority is present only when a matrix was projected from a map. */
  readonly representation?: KpTypedMatrixRepresentationRef | undefined;
}

export interface KpTypedMatrixRepresentationRef {
  readonly kind: "matrix-representation-ref";
  readonly id: string;
  readonly sourceMapId: string;
  readonly domainSpaceId: string;
  readonly codomainSpaceId: string;
  readonly domainBasisId: string;
  readonly codomainBasisId: string;
}

export type KpTypedMathValue =
  | KpScalarValue
  | KpTypedVector
  | KpTypedMatrix;

type ParameterTypes<
  Parameters extends readonly KpScalarParameter[]
> = Readonly<{
  [Index in keyof Parameters]: Parameters[Index]["type"];
}>;

export interface KpTypedFunction<
  Parameters extends readonly KpScalarParameter[] =
    readonly KpScalarParameter[],
  Output extends KpTypedMathValue = KpTypedMathValue
> {
  readonly id: string;
  readonly kind: "typed-function";
  readonly name: string;
  readonly parameters: Parameters;
  readonly output: Output;
  readonly type: KpFunctionType<ParameterTypes<Parameters>, Output["type"]>;
  readonly provenance: KpMathProvenance;
}

export function isKpTypedVectorFunction<
  Parameters extends readonly KpScalarParameter[]
>(
  value: KpTypedFunction<Parameters, KpTypedMathValue>
): value is KpTypedFunction<Parameters, KpTypedVector> {
  return value.output.kind === "typed-vector";
}

export interface KpTypedEquation<
  Left extends KpScalarValue = KpScalarValue,
  Right extends KpScalarValue = KpScalarValue
> {
  readonly id: string;
  readonly kind: "typed-equation";
  readonly relation: "equals";
  readonly left: Left;
  readonly right: Right;
  readonly provenance: KpMathProvenance;
}

export type KpDerivativeMatrixKind = "jacobian" | "hessian";

export interface KpDerivativeMatrix<
  Kind extends KpDerivativeMatrixKind = KpDerivativeMatrixKind,
  Rows extends number = number,
  Columns extends number = number
> {
  readonly id: string;
  readonly kind: "derivative-matrix";
  readonly derivativeKind: Kind;
  readonly sourceFunctionId: string;
  readonly sourceFunctionName: string;
  readonly parameterNames: readonly string[];
  readonly matrix: KpTypedMatrix<Rows, Columns>;
  readonly rowLabels: readonly string[];
  readonly columnLabels: readonly string[];
  readonly symmetric: boolean;
  readonly compactEntityId: string;
  readonly macro: Readonly<{
    id: `kp.math.macro.${Kind}.v1`;
    version: 1;
    argumentIds: readonly string[];
  }>;
  readonly correspondenceMap: CorrespondenceMap;
  readonly provenance: KpMathProvenance;
}

type NonEmptyScalarRow = readonly [KpScalarValue, ...KpScalarValue[]];
type NonEmptyMatrixRows = readonly [
  NonEmptyScalarRow,
  ...NonEmptyScalarRow[]
];

type RowsWithLength<
  Rows extends NonEmptyMatrixRows,
  Columns extends number
> = Readonly<{
  [Index in keyof Rows]: Rows[Index] extends readonly KpScalarValue[]
    ? Rows[Index]["length"] extends Columns
      ? Columns extends Rows[Index]["length"]
        ? Rows[Index]
        : never
      : never
    : never;
}>;

export function createKpScalarParameter<const Name extends string>(input: {
  readonly id: string;
  readonly name: Name;
  readonly provenance?: KpMathProvenance | undefined;
}): KpScalarParameter<Name> {
  requireText(input.id, "Scalar parameter id");
  requireText(input.name, `Scalar parameter ${input.id} name`);
  return deepFreeze({
    id: input.id,
    kind: "scalar-parameter" as const,
    name: input.name,
    type: scalarType(),
    expression: variable(input.name),
    provenance: input.provenance ?? authored(input.id)
  });
}

export function createKpScalarExpression(input: {
  readonly id: string;
  readonly expression: MathExpression;
  readonly provenance?: KpMathProvenance | undefined;
}): KpScalarExpression {
  requireText(input.id, "Scalar expression id");
  return deepFreeze({
    id: input.id,
    kind: "scalar-expression" as const,
    type: scalarType(),
    expression: input.expression,
    provenance: input.provenance ?? authored(input.id)
  });
}

export function createKpTypedVector<
  const Entries extends readonly [KpScalarValue, ...KpScalarValue[]]
>(input: {
  readonly id: string;
  readonly entries: Entries;
  readonly provenance?: KpMathProvenance | undefined;
}): KpTypedVector<Entries["length"], Entries> {
  requireText(input.id, "Typed vector id");
  requireUniqueIds(input.entries, `Typed vector ${input.id} entries`);
  const size = input.entries.length as Entries["length"];
  return createVectorValue(
    input.id,
    size,
    input.entries,
    input.provenance ?? authored(input.id)
  );
}

/** Runtime parsers can verify a non-empty vector, but cannot invent a literal size. */
export function createKpTypedVectorFromEntries(input: {
  readonly id: string;
  readonly entries: readonly KpScalarValue[];
  readonly provenance?: KpMathProvenance | undefined;
}): KpTypedVector {
  requireText(input.id, "Typed vector id");
  if (input.entries.length === 0) {
    throw new Error(`Typed vector ${input.id} requires at least one entry.`);
  }
  requireUniqueIds(input.entries, `Typed vector ${input.id} entries`);
  return createVectorValue(
    input.id,
    input.entries.length,
    input.entries,
    input.provenance ?? authored(input.id)
  );
}

function createVectorValue<
  Size extends number,
  Entries extends readonly KpScalarValue[]
>(
  id: string,
  size: Size,
  entries: Entries,
  provenance: KpMathProvenance
): KpTypedVector<Size, Entries> {
  return deepFreeze({
    id,
    kind: "typed-vector" as const,
    size,
    entries,
    type: { kind: "vector" as const, size },
    provenance
  });
}

export function createKpTypedMatrix<
  const Rows extends NonEmptyMatrixRows
>(input: {
  readonly id: string;
  readonly rows: Rows & RowsWithLength<Rows, Rows[0]["length"]>;
  readonly provenance?: KpMathProvenance | undefined;
  readonly representation?: KpTypedMatrixRepresentationRef | undefined;
}): KpTypedMatrix<Rows["length"], Rows[0]["length"]> {
  requireText(input.id, "Typed matrix id");
  const columnCount = input.rows[0].length as Rows[0]["length"];
  if (input.rows.some((row) => row.length !== columnCount)) {
    throw new Error(`Typed matrix ${input.id} must be rectangular.`);
  }
  const entries = input.rows.flatMap((row) => [...row]) as
    readonly KpScalarValue[];
  requireUniqueIds(entries, `Typed matrix ${input.id} entries`);
  return createMatrixValue(
    input.id,
    input.rows.length as Rows["length"],
    columnCount,
    input.rows,
    input.provenance ?? authored(input.id),
    input.representation
  );
}

/** Runtime parsers preserve verified dimensions as existential number values. */
export function createKpTypedMatrixFromRows(input: {
  readonly id: string;
  readonly rows: readonly (readonly KpScalarValue[])[];
  readonly provenance?: KpMathProvenance | undefined;
  readonly representation?: KpTypedMatrixRepresentationRef | undefined;
}): KpTypedMatrix {
  requireText(input.id, "Typed matrix id");
  const firstRow = input.rows[0];
  if (firstRow === undefined || firstRow.length === 0) {
    throw new Error(`Typed matrix ${input.id} requires at least one entry.`);
  }
  if (input.rows.some((row) => row.length !== firstRow.length)) {
    throw new Error(`Typed matrix ${input.id} must be rectangular.`);
  }
  requireUniqueIds(
    input.rows.flatMap((row) => [...row]),
    `Typed matrix ${input.id} entries`
  );
  return createMatrixValue(
    input.id,
    input.rows.length,
    firstRow.length,
    input.rows,
    input.provenance ?? authored(input.id),
    input.representation
  );
}

export function defineKpTypedFunction<
  const Parameters extends readonly KpScalarParameter[],
  const Output extends KpTypedMathValue
>(input: {
  readonly id: string;
  readonly name: string;
  readonly parameters: Parameters;
  readonly output: Output;
  readonly provenance?: KpMathProvenance | undefined;
}): KpTypedFunction<Parameters, Output> {
  requireText(input.id, "Typed function id");
  requireText(input.name, `Typed function ${input.id} name`);
  if (input.parameters.length === 0) {
    throw new Error(`Typed function ${input.id} requires parameters.`);
  }
  requireUniqueIds(input.parameters, `Typed function ${input.id} parameters`);
  const parameterNames = input.parameters.map(({ name }) => name);
  if (new Set(parameterNames).size !== parameterNames.length) {
    throw new Error(`Typed function ${input.id} repeats a parameter name.`);
  }
  const allowedNames = new Set(parameterNames);
  scalarValuesIn(input.output).forEach((value) => {
    collectVariableNames(value.expression).forEach((name) => {
      if (!allowedNames.has(name)) {
        throw new Error(`Typed function ${input.id} has free variable ${name}.`);
      }
    });
  });
  const inputs = input.parameters.map(({ type }) => type) as
    unknown as ParameterTypes<Parameters>;
  return deepFreeze({
    id: input.id,
    kind: "typed-function" as const,
    name: input.name,
    parameters: input.parameters,
    output: input.output,
    type: {
      kind: "function" as const,
      inputs,
      output: input.output.type
    },
    provenance: input.provenance ?? authored(input.id)
  });
}

export function createKpTypedEquation<
  const Left extends KpScalarValue,
  const Right extends KpScalarValue
>(input: {
  readonly id: string;
  readonly left: Left;
  readonly right: Right;
  readonly provenance?: KpMathProvenance | undefined;
}): KpTypedEquation<Left, Right> {
  requireText(input.id, "Typed equation id");
  if (input.left.id === input.right.id) {
    throw new Error(`Typed equation ${input.id} requires distinct side identities.`);
  }
  return deepFreeze({
    id: input.id,
    kind: "typed-equation" as const,
    relation: "equals" as const,
    left: input.left,
    right: input.right,
    provenance: input.provenance ?? authored(input.id)
  });
}

export function rebuildKpTypedMatrix<Rows extends number, Columns extends number>(
  input: {
    readonly source: KpTypedMatrix<Rows, Columns>;
    readonly rows: readonly (readonly KpScalarValue[])[];
    readonly provenance?: KpMathProvenance | undefined;
  }
): KpTypedMatrix<Rows, Columns> {
  if (input.rows.length !== input.source.rowCount) {
    throw new Error(
      `Typed matrix ${input.source.id} rewrite requires ${input.source.rowCount} rows.`
    );
  }
  if (input.rows.some((row) => row.length !== input.source.columnCount)) {
    throw new Error(
      `Typed matrix ${input.source.id} rewrite requires ` +
      `${input.source.columnCount} columns.`
    );
  }
  requireUniqueIds(input.rows.flatMap((row) => [...row]),
    `Typed matrix ${input.source.id} rewritten entries`);
  return createMatrixValue(
    input.source.id,
    input.source.rowCount,
    input.source.columnCount,
    input.rows,
    input.provenance ?? input.source.provenance,
    input.source.representation
  );
}

export function composeKpFunctionSignatures<
  const Inner extends KpFunctionType,
  const Output extends KpMathValueType
>(
  inner: Inner,
  outer: KpFunctionType<readonly [Inner["output"]], Output>
): KpFunctionType<Inner["inputs"], Output> {
  const actualInput = outer.inputs[0];
  if (actualInput === undefined || !sameMathType(inner.output, actualInput)) {
    throw new Error("Function signature composition has incompatible intermediate types.");
  }
  return deepFreeze({
    kind: "function" as const,
    inputs: inner.inputs,
    output: outer.output
  });
}

export function multiplyKpTypedMatrices<
  const Left extends KpTypedMatrix,
  const Columns extends number
>(input: {
  readonly id: string;
  readonly left: Left;
  readonly right: KpTypedMatrix<Left["columnCount"], Columns>;
}): KpTypedMatrix<Left["rowCount"], Columns> {
  requireText(input.id, "Matrix product id");
  if (input.left.columnCount !== input.right.rowCount) {
    throw new Error(
      `Matrix product ${input.id} requires ${input.left.columnCount} right rows; ` +
      `received ${input.right.rowCount}.`
    );
  }
  const rows = input.left.rows.map((leftRow, rowIndex) =>
    Array.from({ length: input.right.columnCount }, (_, columnIndex) => {
      const products = leftRow.map((leftEntry, innerIndex) => {
        const rightEntry = input.right.rows[innerIndex]?.[columnIndex];
        if (rightEntry === undefined) {
          throw new Error(`Matrix product ${input.id} is missing an inner entry.`);
        }
        return multiply(leftEntry.expression, rightEntry.expression);
      });
      return createKpScalarExpression({
        id: `${input.id}.entry.${rowIndex}.${columnIndex}`,
        expression: add(...products),
        provenance: derived(
          [...leftRow.map(({ id }) => id), ...input.right.rows.map(
            (row) => row[columnIndex]!.id
          )],
          "kp.math.matrix-multiply.v1"
        )
      });
    })
  );
  return createMatrixValue(
    input.id,
    input.left.rowCount,
    input.right.columnCount as Columns,
    rows,
    derived([input.left.id, input.right.id], "kp.math.matrix-multiply.v1")
  );
}

export function deriveKpJacobian<
  const Parameters extends readonly KpScalarParameter[],
  const Size extends number,
  const Entries extends readonly KpScalarValue[]
>(input: {
  readonly id: string;
  readonly source: KpTypedFunction<
    Parameters,
    KpTypedVector<Size, Entries>
  >;
}): KpDerivativeMatrix<"jacobian", Size, Parameters["length"]> {
  const parameterNames = input.source.parameters.map(({ name }) => name);
  const rows = input.source.output.entries.map((entry, rowIndex) =>
    input.source.parameters.map((parameter, columnIndex) =>
      derivativeEntry({
        id: `${input.id}.entry.${rowIndex}.${columnIndex}`,
        source: entry,
        parameter
      })
    )
  );
  const matrix = createMatrixValue(
    `${input.id}.matrix`,
    input.source.output.size,
    input.source.parameters.length as Parameters["length"],
    rows,
    derived([input.source.id], "kp.math.jacobian.expand.v1")
  );
  return derivativeMatrix({
    id: input.id,
    derivativeKind: "jacobian",
    source: input.source,
    matrix,
    rowLabels: input.source.output.entries.map(
      (_, index) => `${input.source.name}_{${index + 1}}`
    ),
    columnLabels: parameterNames,
    symmetric: false,
    summary: "Expanding the Jacobian derives one partial derivative per matrix entry."
  });
}

export function deriveKpHessian<
  const Parameters extends readonly KpScalarParameter[]
>(input: {
  readonly id: string;
  readonly source: KpTypedFunction<Parameters, KpScalarValue>;
}): KpDerivativeMatrix<
  "hessian",
  Parameters["length"],
  Parameters["length"]
> {
  const rows = input.source.parameters.map((rowParameter, rowIndex) =>
    input.source.parameters.map((columnParameter, columnIndex) =>
      createKpScalarExpression({
        id: `${input.id}.entry.${rowIndex}.${columnIndex}`,
        expression: differentiate(
          differentiate(input.source.output.expression, rowParameter.name),
          columnParameter.name
        ),
        provenance: derived(
          [input.source.output.id, rowParameter.id, columnParameter.id],
          "kp.math.hessian.entry.v1"
        )
      })
    )
  );
  const size = input.source.parameters.length as Parameters["length"];
  const matrix = createMatrixValue(
    `${input.id}.matrix`,
    size,
    size,
    rows,
    derived([input.source.id], "kp.math.hessian.expand.v1")
  );
  const parameterNames = input.source.parameters.map(({ name }) => name);
  return derivativeMatrix({
    id: input.id,
    derivativeKind: "hessian",
    source: input.source,
    matrix,
    rowLabels: parameterNames,
    columnLabels: parameterNames,
    symmetric: true,
    summary: "Expanding the Hessian derives one second partial derivative per matrix entry."
  });
}

export function evaluateKpTypedMatrix(
  matrix: KpTypedMatrix,
  scope: NumericScope
): readonly (readonly number[])[] {
  return matrix.rows.map((row) =>
    row.map((entry) => compileExpression(entry.expression)(scope))
  );
}

export function projectKpDerivativeMatrixToLatex(
  derivative: KpDerivativeMatrix,
  form: "compact" | "expanded"
): string {
  const operator = derivative.derivativeKind === "jacobian" ? "J" : "H";
  const compact = `${operator}_{${derivative.sourceFunctionName}}` +
    `(${derivative.parameterNames.join(", ")})`;
  return form === "compact"
    ? compact
    : `${compact} = ${matrixBodyToLatex(derivative.matrix)}`;
}

export function projectKpTypedMathToLatex(
  value: KpTypedMathValue | KpTypedFunction | KpTypedEquation |
    KpDerivativeMatrix
): string {
  switch (value.kind) {
    case "scalar-expression":
    case "scalar-parameter":
      return expressionToLatex(value.expression);
    case "typed-vector":
      return vectorBodyToLatex(value);
    case "typed-matrix":
      return matrixBodyToLatex(value);
    case "typed-function":
      return `${value.name}(${value.parameters.map(({ name }) => name).join(", ")}) = ` +
        projectKpTypedMathToLatex(value.output);
    case "typed-equation":
      return `${expressionToLatex(value.left.expression)} = ` +
        expressionToLatex(value.right.expression);
    case "derivative-matrix":
      return projectKpDerivativeMatrixToLatex(value, "expanded");
  }
}

function derivativeEntry(input: {
  readonly id: string;
  readonly source: KpScalarValue;
  readonly parameter: KpScalarParameter;
}): KpScalarExpression {
  return createKpScalarExpression({
    id: input.id,
    expression: differentiate(input.source.expression, input.parameter.name),
    provenance: derived(
      [input.source.id, input.parameter.id],
      "kp.math.jacobian.entry.v1"
    )
  });
}

function derivativeMatrix<
  Kind extends KpDerivativeMatrixKind,
  Rows extends number,
  Columns extends number,
  Parameters extends readonly KpScalarParameter[],
  Output extends KpTypedMathValue
>(input: {
  readonly id: string;
  readonly derivativeKind: Kind;
  readonly source: KpTypedFunction<Parameters, Output>;
  readonly matrix: KpTypedMatrix<Rows, Columns>;
  readonly rowLabels: readonly string[];
  readonly columnLabels: readonly string[];
  readonly symmetric: boolean;
  readonly summary: string;
}): KpDerivativeMatrix<Kind, Rows, Columns> {
  requireText(input.id, `${input.derivativeKind} id`);
  const compactEntityId = `${input.id}.compact`;
  return deepFreeze({
    id: input.id,
    kind: "derivative-matrix" as const,
    derivativeKind: input.derivativeKind,
    sourceFunctionId: input.source.id,
    sourceFunctionName: input.source.name,
    parameterNames: input.source.parameters.map(({ name }) => name),
    matrix: input.matrix,
    rowLabels: input.rowLabels,
    columnLabels: input.columnLabels,
    symmetric: input.symmetric,
    compactEntityId,
    macro: {
      id: `kp.math.macro.${input.derivativeKind}.v1` as const,
      version: 1 as const,
      argumentIds: [input.source.id]
    },
    correspondenceMap: {
      id: `${input.id}.correspondence`,
      records: [{
        id: `${input.id}.expansion`,
        relation: "fan-out" as const,
        sourceSelectorIds: [compactEntityId],
        targetSelectorIds: input.matrix.rows.flatMap((row) =>
          row.map(({ id }) => id)
        ),
        summary: input.summary
      }]
    },
    provenance: derived([input.source.id],
      `kp.math.${input.derivativeKind}.macro.v1`)
  });
}

function createMatrixValue<Rows extends number, Columns extends number>(
  id: string,
  rowCount: Rows,
  columnCount: Columns,
  rows: readonly (readonly KpScalarValue[])[],
  provenance: KpMathProvenance,
  representation?: KpTypedMatrixRepresentationRef | undefined
): KpTypedMatrix<Rows, Columns> {
  return deepFreeze({
    id,
    kind: "typed-matrix" as const,
    rowCount,
    columnCount,
    rows,
    type: {
      kind: "matrix" as const,
      rows: rowCount,
      columns: columnCount
    },
    provenance,
    ...(representation === undefined ? {} : { representation })
  });
}

function scalarValuesIn(value: KpTypedMathValue): readonly KpScalarValue[] {
  switch (value.kind) {
    case "scalar-expression":
    case "scalar-parameter":
      return [value];
    case "typed-vector":
      return value.entries;
    case "typed-matrix":
      return value.rows.flat();
  }
}

function collectVariableNames(
  expression: MathExpression,
  names = new Set<string>()
): ReadonlySet<string> {
  switch (expression.kind) {
    case "constant":
      return names;
    case "variable":
      names.add(expression.name);
      return names;
    case "add":
      expression.terms.forEach((term) => collectVariableNames(term, names));
      return names;
    case "multiply":
      expression.factors.forEach((factor) => collectVariableNames(factor, names));
      return names;
    case "divide":
      collectVariableNames(expression.numerator, names);
      collectVariableNames(expression.denominator, names);
      return names;
    case "power":
      return collectVariableNames(expression.base, names);
    case "negate":
    case "sin":
    case "cos":
      return collectVariableNames(expression.value, names);
  }
}

function vectorBodyToLatex(vector: KpTypedVector): string {
  return `\\begin{bmatrix}${vector.entries.map((entry) =>
    expressionToLatex(entry.expression)
  ).join(" \\\\ ")}\\end{bmatrix}`;
}

function matrixBodyToLatex(matrix: KpTypedMatrix): string {
  return `\\begin{bmatrix}${matrix.rows.map((row) => row.map((entry) =>
    expressionToLatex(entry.expression)
  ).join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

function sameMathType(left: KpMathValueType, right: KpMathValueType): boolean {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "scalar":
      return true;
    case "vector":
      return right.kind === "vector" && left.size === right.size;
    case "matrix":
      return right.kind === "matrix" && left.rows === right.rows &&
        left.columns === right.columns;
  }
}

function scalarType(): KpScalarType {
  return { kind: "scalar" };
}

function authored(sourceId: string): KpMathProvenance {
  return { kind: "authored", sourceId };
}

function derived(
  sourceIds: readonly string[],
  methodId: string
): KpMathProvenance {
  return { kind: "derived", sourceIds, methodId };
}

function requireUniqueIds(
  values: readonly { readonly id: string }[],
  label: string
): void {
  const ids = new Set<string>();
  values.forEach(({ id }) => {
    requireText(id, `${label} id`);
    if (ids.has(id)) throw new Error(`${label} repeat ${id}.`);
    ids.add(id);
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

import type { MathExpression } from "./expression.ts";
import { LatexParseError } from "./latex-parser.ts";
import { parseLatexMathExpression } from "./latex-to-expression.ts";
import {
  createKpScalarExpression,
  createKpTypedEquation,
  createKpTypedMatrixFromRows,
  createKpTypedVectorFromEntries,
  defineKpTypedFunction,
  type KpMathProvenance,
  type KpScalarParameter,
  type KpScalarValue,
  type KpTypedEquation,
  type KpTypedFunction,
  type KpTypedMathValue
} from "./typed-semantic-math.ts";

export type KpTypedLatexDiagnosticCode =
  | "typed-latex.shape"
  | "typed-latex.signature"
  | "typed-latex.unknown-symbol"
  | "typed-latex.unsupported-syntax";

export interface KpTypedLatexRepairDiagnostic {
  readonly code: KpTypedLatexDiagnosticCode;
  readonly path: string;
  readonly message: string;
  readonly repair: string;
  readonly offset?: number | undefined;
  readonly expected?: string | undefined;
}

export interface KpTypedLatexSourceSpan {
  readonly entityId: string;
  readonly sourceId: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export type KpTypedLatexElaborationResult<Value> =
  | Readonly<{
      status: "elaborated";
      value: Value;
      sourceSpans: readonly KpTypedLatexSourceSpan[];
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly [
        KpTypedLatexRepairDiagnostic,
        ...KpTypedLatexRepairDiagnostic[]
      ];
    }>;

type KpTypedLatexRepairResult = Extract<
  KpTypedLatexElaborationResult<never>,
  { status: "repair-required" }
>;

interface KpTypedLatexSourceInput {
  readonly id: string;
  readonly sourceId: string;
  readonly revisionId?: string | undefined;
  readonly latex: string;
}

export function elaborateKpTypedLatexEquation(input: KpTypedLatexSourceInput & {
  readonly symbols: readonly KpScalarParameter[];
}): KpTypedLatexElaborationResult<KpTypedEquation> {
  const split = splitEquation(input.latex);
  if (split.status === "repair-required") return split;

  try {
    const leftExpression = parseLatexMathExpression(split.left.text);
    const rightExpression = parseLatexMathExpression(split.right.text);
    const unknown = unknownSymbols(
      [leftExpression, rightExpression],
      input.symbols.map(({ name }) => name)
    );
    if (unknown.length > 0) {
      return repair({
        code: "typed-latex.unknown-symbol",
        path: "equation",
        message: `Equation uses undeclared symbol${unknown.length === 1 ? "" : "s"} ` +
          `${unknown.join(", ")}.`,
        repair: "Declare every scalar symbol in the equation environment."
      });
    }

    const left = createParsedScalar({
      id: `${input.id}.left`,
      expression: leftExpression,
      source: input,
      span: split.left
    });
    const right = createParsedScalar({
      id: `${input.id}.right`,
      expression: rightExpression,
      source: input,
      span: split.right
    });
    const value = createKpTypedEquation({
      id: input.id,
      left,
      right,
      provenance: parsedProvenance(input, 0, input.latex.length)
    });
    return elaborated(value, [
      sourceSpan(left.id, input.sourceId, split.left),
      sourceSpan(right.id, input.sourceId, split.right)
    ]);
  } catch (error) {
    return parserRepair(error, "equation", 0);
  }
}

export function elaborateKpTypedLatexFunction<
  const Parameters extends readonly KpScalarParameter[]
>(input: KpTypedLatexSourceInput & {
  readonly parameters: Parameters;
}): KpTypedLatexElaborationResult<
  KpTypedFunction<Parameters, KpTypedMathValue>
> {
  const split = splitEquation(input.latex);
  if (split.status === "repair-required") return split;
  const signature = parseFunctionSignature(split.left.text);
  if (signature === undefined) {
    return repair({
      code: "typed-latex.signature",
      path: "function.signature",
      message: "Expected a function declaration such as f(x, y) = ... .",
      repair: "Use a simple function name and comma-separated scalar parameters.",
      offset: split.left.startOffset
    });
  }
  const declaredNames = input.parameters.map(({ name }) => name);
  if (!sameStrings(signature.parameterNames, declaredNames)) {
    return repair({
      code: "typed-latex.signature",
      path: "function.signature.parameters",
      message: `LaTeX declares (${signature.parameterNames.join(", ")}) but the ` +
        `typed environment declares (${declaredNames.join(", ")}).`,
      repair: "Make the LaTeX parameter order match the typed parameter tuple.",
      offset: split.left.startOffset
    });
  }

  try {
    const parsedOutput = parseFunctionOutput({
      id: `${input.id}.output`,
      source: input,
      span: split.right
    });
    const unknown = unknownSymbols(
      scalarExpressionsIn(parsedOutput.value),
      declaredNames
    );
    if (unknown.length > 0) {
      return repair({
        code: "typed-latex.unknown-symbol",
        path: "function.output",
        message: `Function output uses undeclared symbol${unknown.length === 1 ? "" : "s"} ` +
          `${unknown.join(", ")}.`,
        repair: "Declare every free scalar in the function parameter tuple."
      });
    }
    const value = defineKpTypedFunction({
      id: input.id,
      name: signature.name,
      parameters: input.parameters,
      output: parsedOutput.value,
      provenance: parsedProvenance(input, 0, input.latex.length)
    });
    return elaborated(value, parsedOutput.sourceSpans);
  } catch (error) {
    return parserRepair(error, "function.output", split.right.startOffset);
  }
}

interface SourceSlice {
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

type SplitEquationResult =
  | Readonly<{
      status: "split";
      left: SourceSlice;
      right: SourceSlice;
    }>
  | KpTypedLatexRepairResult;

function splitEquation(latex: string): SplitEquationResult {
  let braceDepth = 0;
  let parenDepth = 0;
  const equals: number[] = [];
  for (let index = 0; index < latex.length; index += 1) {
    const character = latex[index];
    if (character === "{") braceDepth += 1;
    else if (character === "}") braceDepth -= 1;
    else if (character === "(") parenDepth += 1;
    else if (character === ")") parenDepth -= 1;
    else if (character === "=" && braceDepth === 0 && parenDepth === 0) {
      equals.push(index);
    }
  }
  if (equals.length !== 1 || equals[0] === undefined) {
    return repair({
      code: "typed-latex.unsupported-syntax",
      path: "equation",
      message: "Expected exactly one top-level equals sign.",
      repair: "Write one equation or function declaration per elaboration call."
    });
  }
  const equalOffset = equals[0];
  const left = trimmedSlice(latex, 0, equalOffset);
  const right = trimmedSlice(latex, equalOffset + 1, latex.length);
  if (left.text.length === 0 || right.text.length === 0) {
    return repair({
      code: "typed-latex.unsupported-syntax",
      path: "equation",
      message: "Both sides of the equals sign require an expression.",
      repair: "Supply a non-empty left and right side.",
      offset: equalOffset
    });
  }
  return { status: "split", left, right };
}

function parseFunctionSignature(text: string): Readonly<{
  name: string;
  parameterNames: readonly string[];
}> | undefined {
  const match = /^([A-Za-z][A-Za-z0-9_]*)\s*\(([^()]*)\)$/.exec(text.trim());
  if (match?.[1] === undefined || match[2] === undefined) return undefined;
  const parameterNames = match[2].split(",").map((name) => name.trim());
  if (parameterNames.length === 0 || parameterNames.some(
    (name) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(name)
  ) || new Set(parameterNames).size !== parameterNames.length) {
    return undefined;
  }
  return { name: match[1], parameterNames };
}

function parseFunctionOutput(input: {
  readonly id: string;
  readonly source: KpTypedLatexSourceInput;
  readonly span: SourceSlice;
}): Readonly<{
  value: KpTypedMathValue;
  sourceSpans: readonly KpTypedLatexSourceSpan[];
}> {
  const matrix = parseBmatrix(input.span);
  if (matrix === undefined) {
    const value = createParsedScalar({
      id: input.id,
      expression: parseLatexMathExpression(input.span.text),
      source: input.source,
      span: input.span
    });
    return {
      value,
      sourceSpans: [sourceSpan(value.id, input.source.sourceId, input.span)]
    };
  }
  const rows = matrix.rows.map((row, rowIndex) => row.map((cell, columnIndex) =>
    createParsedScalar({
      id: matrix.columnCount === 1
        ? `${input.id}.${rowIndex}`
        : `${input.id}.${rowIndex}.${columnIndex}`,
      expression: parseLatexMathExpression(cell.text),
      source: input.source,
      span: cell
    })
  ));
  const provenance = parsedProvenance(
    input.source,
    input.span.startOffset,
    input.span.endOffset
  );
  const value = matrix.columnCount === 1
    ? createKpTypedVectorFromEntries({
        id: input.id,
        entries: rows.map((row) => row[0]!),
        provenance
      })
    : createKpTypedMatrixFromRows({ id: input.id, rows, provenance });
  return {
    value,
    sourceSpans: matrix.rows.flat().map((cell, index) => sourceSpan(
      matrix.columnCount === 1
        ? `${input.id}.${index}`
        : `${input.id}.${Math.floor(index / matrix.columnCount)}.` +
          `${index % matrix.columnCount}`,
      input.source.sourceId,
      cell
    ))
  };
}

function parseBmatrix(span: SourceSlice): Readonly<{
  rows: readonly (readonly SourceSlice[])[];
  columnCount: number;
}> | undefined {
  const begin = "\\begin{bmatrix}";
  const end = "\\end{bmatrix}";
  if (!span.text.startsWith(begin) || !span.text.endsWith(end)) return undefined;
  const contentStart = span.startOffset + begin.length;
  const contentEnd = span.endOffset - end.length;
  const content = span.text.slice(begin.length, span.text.length - end.length);
  const rowSlices = splitDelimited(content, contentStart, "row");
  const rows = rowSlices.map((row) => splitDelimited(
    row.text,
    row.startOffset,
    "column"
  ));
  const columnCount = rows[0]?.length ?? 0;
  if (rows.length === 0 || columnCount === 0 || rows.some(
    (row) => row.length !== columnCount
  )) {
    throw new KpTypedLatexShapeError(
      "A bmatrix must be non-empty and rectangular.",
      contentStart
    );
  }
  if (rows.flat().some(({ text }) => text.length === 0)) {
    throw new KpTypedLatexShapeError("A bmatrix cannot contain empty cells.", contentEnd);
  }
  return { rows, columnCount };
}

function splitDelimited(
  content: string,
  baseOffset: number,
  kind: "row" | "column"
): readonly SourceSlice[] {
  let braceDepth = 0;
  let parenDepth = 0;
  let start = 0;
  const slices: SourceSlice[] = [];
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "{") braceDepth += 1;
    else if (character === "}") braceDepth -= 1;
    else if (character === "(") parenDepth += 1;
    else if (character === ")") parenDepth -= 1;
    const isSeparator = braceDepth === 0 && parenDepth === 0 && (
      kind === "column"
        ? character === "&"
        : character === "\\" && content[index + 1] === "\\"
    );
    if (!isSeparator) continue;
    slices.push(trimmedSlice(content, start, index, baseOffset));
    index += kind === "row" ? 1 : 0;
    start = index + 1;
  }
  slices.push(trimmedSlice(content, start, content.length, baseOffset));
  return slices;
}

function createParsedScalar(input: {
  readonly id: string;
  readonly expression: MathExpression;
  readonly source: KpTypedLatexSourceInput;
  readonly span: SourceSlice;
}): KpScalarValue {
  return createKpScalarExpression({
    id: input.id,
    expression: input.expression,
    provenance: parsedProvenance(
      input.source,
      input.span.startOffset,
      input.span.endOffset
    )
  });
}

function parsedProvenance(
  input: Pick<KpTypedLatexSourceInput, "sourceId" | "revisionId">,
  startOffset: number,
  endOffset: number
): KpMathProvenance {
  return {
    kind: "parsed",
    sourceId: input.sourceId,
    startOffset,
    endOffset,
    ...(input.revisionId === undefined ? {} : { revisionId: input.revisionId })
  };
}

function unknownSymbols(
  expressions: readonly MathExpression[],
  allowedNames: readonly string[]
): readonly string[] {
  const actual = new Set<string>();
  expressions.forEach((expression) => collectVariables(expression, actual));
  return [...actual].filter((name) => !allowedNames.includes(name)).sort();
}

function collectVariables(expression: MathExpression, names: Set<string>): void {
  switch (expression.kind) {
    case "constant":
      return;
    case "variable":
      names.add(expression.name);
      return;
    case "add":
      expression.terms.forEach((term) => collectVariables(term, names));
      return;
    case "multiply":
      expression.factors.forEach((factor) => collectVariables(factor, names));
      return;
    case "divide":
      collectVariables(expression.numerator, names);
      collectVariables(expression.denominator, names);
      return;
    case "power":
      collectVariables(expression.base, names);
      return;
    case "negate":
    case "sin":
    case "cos":
      collectVariables(expression.value, names);
      return;
  }
}

function scalarExpressionsIn(value: KpTypedMathValue): readonly MathExpression[] {
  switch (value.kind) {
    case "scalar-expression":
    case "scalar-parameter":
      return [value.expression];
    case "typed-vector":
      return value.entries.map(({ expression }) => expression);
    case "typed-matrix":
      return value.rows.flatMap((row) => row.map(({ expression }) => expression));
  }
}

function parserRepair<Value>(
  error: unknown,
  path: string,
  baseOffset: number
): KpTypedLatexElaborationResult<Value> {
  if (error instanceof KpTypedLatexShapeError) {
    return repair({
      code: "typed-latex.shape",
      path,
      message: error.message,
      repair: "Use a non-empty rectangular bmatrix.",
      offset: error.offset
    });
  }
  if (error instanceof LatexParseError) {
    return repair({
      code: "typed-latex.unsupported-syntax",
      path,
      message: error.message,
      repair: `Replace this expression with the supported subset (${error.expected}).`,
      offset: baseOffset + error.offset,
      expected: error.expected
    });
  }
  return repair({
    code: "typed-latex.unsupported-syntax",
    path,
    message: error instanceof Error ? error.message : "LaTeX elaboration failed.",
    repair: "Use scalar arithmetic, supported functions, or an exact bmatrix."
  });
}

function repair(
  diagnostic: KpTypedLatexRepairDiagnostic
): KpTypedLatexRepairResult {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([Object.freeze(diagnostic)]) as readonly [
      KpTypedLatexRepairDiagnostic
    ]
  });
}

function elaborated<Value>(
  value: Value,
  sourceSpans: readonly KpTypedLatexSourceSpan[]
): KpTypedLatexElaborationResult<Value> {
  return Object.freeze({
    status: "elaborated" as const,
    value,
    sourceSpans: Object.freeze([...sourceSpans]),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function sourceSpan(
  entityId: string,
  sourceId: string,
  span: Pick<SourceSlice, "startOffset" | "endOffset">
): KpTypedLatexSourceSpan {
  return Object.freeze({ entityId, sourceId, ...span });
}

function trimmedSlice(
  source: string,
  start: number,
  end: number,
  baseOffset = 0
): SourceSlice {
  while (start < end && /\s/.test(source[start]!)) start += 1;
  while (end > start && /\s/.test(source[end - 1]!)) end -= 1;
  return {
    text: source.slice(start, end),
    startOffset: baseOffset + start,
    endOffset: baseOffset + end
  };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every(
    (value, index) => value === right[index]
  );
}

class KpTypedLatexShapeError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(message);
    this.name = "KpTypedLatexShapeError";
    this.offset = offset;
  }
}

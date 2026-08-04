import type { KpLispCanonicalMaterialState } from
  "./lisp-s-expression-material-projection.ts";
import type {
  KpLispList,
  KpLispSemanticModel,
  KpLispSExpression
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispGeometryRect {
  readonly xEm: number;
  readonly yEm: number;
  readonly widthEm: number;
  readonly heightEm: number;
}

export interface KpLispResponsiveGeometry {
  readonly id: "responsive-geometry.lisp.lambda-application";
  readonly mode: "wide" | "phone";
  readonly fontSizePx: 20;
  readonly characterAdvanceEm: 0.64;
  readonly stage: KpLispGeometryRect & {
    readonly reserved: true;
  };
  readonly rows: readonly {
    readonly id: string;
    readonly sourceStart: number;
    readonly sourceEnd: number;
    readonly text: string;
    readonly indentColumns: number;
    readonly yEm: number;
  }[];
  readonly tokens: readonly {
    readonly materialId: string;
    readonly rowId: string;
    readonly rect: KpLispGeometryRect;
  }[];
  readonly expressions: readonly {
    readonly expressionId: string;
    readonly depth: number;
    readonly active: boolean;
    readonly paddingInlineEm: number;
    readonly paddingBlockEm: number;
    readonly rect: KpLispGeometryRect;
  }[];
}

const fontSizePx = 20 as const;
const characterAdvanceEm = 0.64 as const;
const reservedStageHeightEm = 12;
const wideThresholdPx = 560;
const phoneMaxColumns = 13;
const rowHeightEm = 1.2;
const rowStepEm = 2;

export function projectKpLispResponsiveGeometry(
  semantic: KpLispSemanticModel,
  state: KpLispCanonicalMaterialState,
  availableWidthPx: number,
  activeExpressionId: string | null
): KpLispResponsiveGeometry {
  if (!Number.isFinite(availableWidthPx) || availableWidthPx <= 0) {
    throw new Error("Lisp stage width must be a positive finite number.");
  }
  if (state.nativeCode !== semantic.sourceText) {
    throw new Error("Responsive source geometry requires the certified application state.");
  }
  const expressions = collectExpressions(semantic.root);
  if (activeExpressionId !== null &&
      !expressions.some(({ expression }) => expression.id === activeExpressionId)) {
    throw new Error(`Unknown active Lisp expression ${activeExpressionId}.`);
  }
  const mode = availableWidthPx >= wideThresholdPx ? "wide" : "phone";
  const stageWidthEm = round(availableWidthPx / fontSizePx);
  const rowInputs = mode === "wide"
    ? [{ sourceStart: 0, sourceEnd: semantic.sourceText.length, indentColumns: 0 }]
    : compilePhoneRows(semantic);
  const rowBlockHeight = (rowInputs.length - 1) * rowStepEm + rowHeightEm;
  const firstRowY = (reservedStageHeightEm - rowBlockHeight) / 2;
  const rows = rowInputs.map((row, index) => {
    const text = semantic.sourceText.slice(row.sourceStart, row.sourceEnd).trimEnd();
    const contentWidth = (row.indentColumns + text.length) * characterAdvanceEm;
    if (contentWidth > stageWidthEm) {
      throw new Error("Readable Lisp code cannot fit its reserved stage without shrinking.");
    }
    return Object.freeze({
      id: `row.${index}`,
      ...row,
      text,
      indentColumns: row.indentColumns,
      yEm: round(firstRowY + index * rowStepEm),
      xEm: round((stageWidthEm - contentWidth) / 2)
    });
  });
  const tokens = state.tokens.map((token) => {
    const row = rows.find(({ sourceStart, sourceEnd }) =>
      token.source.start >= sourceStart && token.source.end <= sourceEnd);
    if (row === undefined) {
      throw new Error(`Material ${token.id} crosses a syntax-aware row boundary.`);
    }
    return Object.freeze({
      materialId: token.id,
      rowId: row.id,
      rect: rect(
        row.xEm + (row.indentColumns + token.source.start - row.sourceStart) *
          characterAdvanceEm,
        row.yEm,
        token.lexeme.length * characterAdvanceEm,
        rowHeightEm
      )
    });
  });
  const expressionGeometry = expressions
    .filter(({ expression }) => expression.kind === "list")
    .map(({ expression, depth }) => projectExpressionGeometry(
      expression as KpLispList,
      depth,
      activeExpressionId,
      state,
      tokens
    ));

  return Object.freeze({
    id: "responsive-geometry.lisp.lambda-application",
    mode,
    fontSizePx,
    characterAdvanceEm,
    stage: Object.freeze({
      ...rect(0, 0, stageWidthEm, reservedStageHeightEm),
      reserved: true as const
    }),
    rows: Object.freeze(rows.map(({ xEm: _xEm, ...row }) => row)),
    tokens: Object.freeze(tokens),
    expressions: Object.freeze(expressionGeometry)
  });
}

interface ExpressionWithDepth {
  readonly expression: KpLispSExpression;
  readonly depth: number;
}

function collectExpressions(
  root: KpLispSExpression,
  depth = 0
): ExpressionWithDepth[] {
  return [
    { expression: root, depth },
    ...(root.kind === "list"
      ? root.children.flatMap((child) => collectExpressions(child, depth + 1))
      : [])
  ];
}

function compilePhoneRows(
  semantic: KpLispSemanticModel
): { sourceStart: number; sourceEnd: number; indentColumns: number }[] {
  const candidates = collectBreakCandidates(semantic.root)
    .filter((value) => value > 0 && value < semantic.sourceText.length)
    .sort((left, right) => left - right);
  const starts = [0];
  let cursor = 0;
  while (semantic.sourceText.slice(cursor).trimEnd().length > phoneMaxColumns) {
    const next = candidates.filter((value) =>
      value > cursor && value - cursor <= phoneMaxColumns).at(-1);
    if (next === undefined) {
      throw new Error("Lisp source has no safe phone break before the readable limit.");
    }
    starts.push(next);
    cursor = next;
  }
  if (semantic.root.kind === "list") {
    // Direct application arguments stay on distinct phone rows so their
    // binding motion has a stable lane even when the glyphs would barely fit.
    starts.push(...semantic.root.children.slice(1).map(({ source }) => source.start));
  }
  const orderedStarts = [...new Set(starts)].sort((left, right) => left - right);
  return orderedStarts.map((sourceStart, index) => ({
    sourceStart,
    sourceEnd: orderedStarts[index + 1] ?? semantic.sourceText.length,
    indentColumns: sourceStart === 0
      ? 0
      : expressionDepthAtSource(semantic.root, sourceStart)
  }));
}

function collectBreakCandidates(expression: KpLispSExpression): number[] {
  if (expression.kind === "atom") return [];
  return [
    ...expression.children.slice(1).map(({ source }) => source.start),
    ...expression.children.flatMap(collectBreakCandidates)
  ];
}

function expressionDepthAtSource(
  expression: KpLispSExpression,
  sourceStart: number,
  depth = 0
): number {
  if (expression.source.start === sourceStart) return depth;
  if (expression.kind === "list") {
    for (const child of expression.children) {
      if (child.source.start <= sourceStart && child.source.end > sourceStart) {
        return expressionDepthAtSource(child, sourceStart, depth + 1);
      }
    }
  }
  return depth;
}

function projectExpressionGeometry(
  expression: KpLispList,
  depth: number,
  activeExpressionId: string | null,
  state: KpLispCanonicalMaterialState,
  tokens: KpLispResponsiveGeometry["tokens"]
): KpLispResponsiveGeometry["expressions"][number] {
  const materialIds = new Set(state.tokens.filter(({ source }) =>
    source.start >= expression.source.start && source.end <= expression.source.end
  ).map(({ id }) => id));
  const members = tokens.filter(({ materialId }) => materialIds.has(materialId));
  if (members.length === 0) {
    throw new Error(`Lisp expression ${expression.id} has no projected material.`);
  }
  const active = expression.id === activeExpressionId;
  const paddingInlineEm = active ? 0.35 + depth * 0.12 : 0.12;
  const paddingBlockEm = active ? 0.25 + depth * 0.08 : 0.1;
  const left = Math.min(...members.map(({ rect }) => rect.xEm));
  const top = Math.min(...members.map(({ rect }) => rect.yEm));
  const right = Math.max(...members.map(({ rect }) => rect.xEm + rect.widthEm));
  const bottom = Math.max(...members.map(({ rect }) => rect.yEm + rect.heightEm));
  return Object.freeze({
    expressionId: expression.id,
    depth,
    active,
    paddingInlineEm: round(paddingInlineEm),
    paddingBlockEm: round(paddingBlockEm),
    rect: rect(
      left - paddingInlineEm,
      top - paddingBlockEm,
      right - left + paddingInlineEm * 2,
      bottom - top + paddingBlockEm * 2
    )
  });
}

function rect(
  xEm: number,
  yEm: number,
  widthEm: number,
  heightEm: number
): KpLispGeometryRect {
  return Object.freeze({
    xEm: round(xEm),
    yEm: round(yEm),
    widthEm: round(widthEm),
    heightEm: round(heightEm)
  });
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

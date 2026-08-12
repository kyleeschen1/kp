import type { KpSchemeFactorialTimelineSample } from
  "./scheme-factorial-timeline.ts";
import type {
  KpSchemeCheckpointProjection,
  KpSchemeSemanticCheckpoint
} from "../semantic/scheme-factorial-checkpoint-projector.ts";
import {
  collectKpSchemeSourceExpressions,
  type KpSchemeSourceDocument,
  type KpSchemeSourceExpression
} from "../semantic/scheme-factorial-source-model.ts";

export interface KpSchemeGeometryRect {
  readonly xEm: number;
  readonly yEm: number;
  readonly widthEm: number;
  readonly heightEm: number;
}

export interface KpSchemeResponsiveFrame {
  readonly schemaVersion: "kp.scheme-factorial-responsive-frame.v1";
  readonly mode: "wide" | "compact";
  readonly fontSizePx: 18;
  readonly characterAdvanceEm: 0.62;
  readonly stage: KpSchemeGeometryRect & { readonly reserved: true };
  readonly activeExpressionId: string | null;
  readonly activeOwnerExpressionId: string | null;
  readonly rows: readonly {
    readonly id: string;
    readonly tokenIds: readonly string[];
    readonly yEm: number;
  }[];
  readonly tokens: readonly {
    readonly id: string;
    readonly expressionId: string;
    readonly ownerExpressionId: string;
    readonly kind: "atom" | "open-paren" | "close-paren";
    readonly lexeme: string;
    readonly sourceStart: number;
    readonly rowId: string;
    readonly rect: KpSchemeGeometryRect;
  }[];
  readonly expressions: readonly {
    readonly expressionId: string;
    readonly depth: number;
    readonly active: boolean;
    readonly rect: KpSchemeGeometryRect;
  }[];
  readonly jostle: readonly {
    readonly materialId: string;
    readonly active: boolean;
    readonly xEm: number;
    readonly yEm: number;
  }[];
}

const fontSizePx = 18 as const;
const characterAdvanceEm = 0.62 as const;
const wideThresholdPx = 640;
const paddingInlineEm = 1.2;
const paddingBlockEm = 1.4;
const rowHeightEm = 1.35;
const rowStepEm = 1.7;
const maxJostleEm = 0.055;

/**
 * Reflows certified source material without changing its typography, then
 * derives restrained motion from the canonical playhead rather than state.
 */
export function projectKpSchemeFactorialResponsiveFrame(input: {
  readonly document: KpSchemeSourceDocument;
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly sample: KpSchemeFactorialTimelineSample;
  readonly availableWidthPx: number;
  readonly reducedMotion?: boolean | undefined;
}): KpSchemeResponsiveFrame {
  if (!Number.isFinite(input.availableWidthPx) || input.availableWidthPx < 220) {
    throw new Error("Scheme stage requires at least 220px of readable width.");
  }
  const mode = input.availableWidthPx >= wideThresholdPx ? "wide" : "compact";
  const stageWidthEm = round(input.availableWidthPx / fontSizePx);
  const maxColumns = Math.floor(
    (stageWidthEm - paddingInlineEm * 2) / characterAdvanceEm
  );
  const material = collectMaterial(input.document);
  const rowGroups = compileRows(input.document, material, mode, maxColumns);
  const contentHeight = (rowGroups.length - 1) * rowStepEm + rowHeightEm;
  const stageHeightEm = round(Math.max(mode === "wide" ? 13.5 : 17,
    contentHeight + paddingBlockEm * 2));
  const firstRowY = round((stageHeightEm - contentHeight) / 2);
  const rows = rowGroups.map((group, rowIndex) => Object.freeze({
    id: `scheme-factorial.row.${rowIndex}`,
    tokenIds: Object.freeze(group.map(({ id }) => id)),
    yEm: round(firstRowY + rowIndex * rowStepEm)
  }));
  const tokens = rowGroups.flatMap((group, rowIndex) => {
    const row = rows[rowIndex]!;
    const width = rowWidth(group);
    const left = round((stageWidthEm - width) / 2);
    let cursor = left;
    return group.map((token, tokenIndex) => {
      if (tokenIndex > 0) cursor += characterAdvanceEm;
      const widthEm = token.lexeme.length * characterAdvanceEm;
      const placement = Object.freeze({
        ...token,
        rowId: row.id,
        rect: rect(cursor, row.yEm, widthEm, rowHeightEm)
      });
      cursor += widthEm;
      return placement;
    });
  });
  const activeCheckpoint = checkpointForSample(input.checkpoints, input.sample);
  const activeOwnerExpressionId = ownerForExpression(
    material,
    activeCheckpoint.activeExpressionId
  );
  const expressions = expressionGeometry(
    input.document,
    tokens,
    activeOwnerExpressionId
  );
  const jostle = tokens.map((token) => {
    const active = token.kind === "atom" &&
      token.ownerExpressionId === activeOwnerExpressionId &&
      input.sample.phase === "motion" && input.reducedMotion !== true;
    const envelope = Math.sin(Math.PI * input.sample.localProgress);
    const phase = seedPhase(token.id);
    return Object.freeze({
      materialId: token.id,
      active,
      xEm: active
        ? round(maxJostleEm * envelope * Math.sin(
          input.sample.localProgress * Math.PI * 4 + phase
        ))
        : 0,
      yEm: active
        ? round(maxJostleEm * envelope * Math.cos(
          input.sample.localProgress * Math.PI * 6 + phase
        ))
        : 0
    });
  });
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-responsive-frame.v1",
    mode,
    fontSizePx,
    characterAdvanceEm,
    stage: Object.freeze({
      ...rect(0, 0, stageWidthEm, stageHeightEm),
      reserved: true as const
    }),
    activeExpressionId: activeCheckpoint.activeExpressionId,
    activeOwnerExpressionId,
    rows: Object.freeze(rows),
    tokens: Object.freeze(tokens),
    expressions: Object.freeze(expressions),
    jostle: Object.freeze(jostle)
  });
}

interface MaterialToken {
  readonly id: string;
  readonly expressionId: string;
  readonly ownerExpressionId: string;
  readonly kind: "atom" | "open-paren" | "close-paren";
  readonly lexeme: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
  readonly line: number;
}

function collectMaterial(document: KpSchemeSourceDocument): MaterialToken[] {
  const material: MaterialToken[] = [];
  const visit = (
    expression: KpSchemeSourceExpression,
    ownerExpressionId: string
  ): void => {
    if (expression.kind === "atom") {
      material.push(token(
        expression.id,
        expression.id,
        ownerExpressionId,
        "atom",
        expression.lexeme,
        expression.source.start,
        expression.source.end,
        document.sourceText
      ));
      return;
    }
    material.push(token(
      expression.delimiters.open.id,
      expression.id,
      expression.id,
      "open-paren",
      "(",
      expression.delimiters.open.source.start,
      expression.delimiters.open.source.end,
      document.sourceText
    ));
    expression.children.forEach((child) => visit(child, expression.id));
    material.push(token(
      expression.delimiters.close.id,
      expression.id,
      expression.id,
      "close-paren",
      ")",
      expression.delimiters.close.source.start,
      expression.delimiters.close.source.end,
      document.sourceText
    ));
  };
  document.forms.forEach((form) => visit(form, form.id));
  return material.sort((left, right) => left.sourceStart - right.sourceStart);
}

function token(
  id: string,
  expressionId: string,
  ownerExpressionId: string,
  kind: MaterialToken["kind"],
  lexeme: string,
  sourceStart: number,
  sourceEnd: number,
  sourceText: string
): MaterialToken {
  return Object.freeze({
    id,
    expressionId,
    ownerExpressionId,
    kind,
    lexeme,
    sourceStart,
    sourceEnd,
    line: sourceText.slice(0, sourceStart).split("\n").length - 1
  });
}

function compileRows(
  document: KpSchemeSourceDocument,
  material: readonly MaterialToken[],
  mode: KpSchemeResponsiveFrame["mode"],
  maxColumns: number
): MaterialToken[][] {
  const sourceLines = document.sourceText.split("\n");
  const groups = sourceLines.map((_line, line) =>
    material.filter((token) => token.line === line));
  if (mode === "wide") return groups;
  const rows: MaterialToken[][] = [];
  for (const group of groups) {
    let row: MaterialToken[] = [];
    let columns = 0;
    for (const item of group) {
      const required = item.lexeme.length + (row.length > 0 ? 1 : 0);
      if (row.length > 0 && columns + required > maxColumns) {
        rows.push(row);
        row = [];
        columns = 0;
      }
      if (item.lexeme.length > maxColumns) {
        throw new Error(`Scheme token ${item.lexeme} cannot fit without shrinking.`);
      }
      row.push(item);
      columns += item.lexeme.length + (row.length > 1 ? 1 : 0);
    }
    if (row.length > 0) rows.push(row);
  }
  return rows;
}

function rowWidth(group: readonly MaterialToken[]): number {
  return round((group.reduce((sum, item) => sum + item.lexeme.length, 0) +
    Math.max(0, group.length - 1)) * characterAdvanceEm);
}

function checkpointForSample(
  checkpoints: KpSchemeCheckpointProjection,
  sample: KpSchemeFactorialTimelineSample
): KpSchemeSemanticCheckpoint {
  const id = sample.phase === "motion"
    ? sample.toCheckpointId
    : sample.settledCheckpointId;
  const checkpoint = checkpoints.checkpoints.find((candidate) =>
    candidate.id === id);
  if (checkpoint === undefined) {
    throw new Error(`Scheme responsive frame cannot find checkpoint ${id}.`);
  }
  return checkpoint;
}

function ownerForExpression(
  material: readonly MaterialToken[],
  expressionId: string | null
): string | null {
  if (expressionId === null) return null;
  const token = material.find((candidate) =>
    candidate.expressionId === expressionId);
  return token?.ownerExpressionId ?? null;
}

function expressionGeometry(
  document: KpSchemeSourceDocument,
  tokens: KpSchemeResponsiveFrame["tokens"],
  activeExpressionId: string | null
): KpSchemeResponsiveFrame["expressions"] {
  return collectKpSchemeSourceExpressions(document).flatMap((expression) => {
    if (expression.kind !== "list") return [];
    const members = tokens.filter(({ sourceStart }) =>
      sourceStart >= expression.source.start && sourceStart < expression.source.end);
    if (members.length === 0) return [];
    const left = Math.min(...members.map(({ rect }) => rect.xEm));
    const top = Math.min(...members.map(({ rect }) => rect.yEm));
    const right = Math.max(...members.map(({ rect }) => rect.xEm + rect.widthEm));
    const bottom = Math.max(...members.map(({ rect }) => rect.yEm + rect.heightEm));
    return [Object.freeze({
      expressionId: expression.id,
      depth: expression.address.length - 1,
      active: expression.id === activeExpressionId,
      rect: rect(left - 0.12, top - 0.1, right - left + 0.24,
        bottom - top + 0.2)
    })];
  });
}

function seedPhase(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

function rect(
  xEm: number,
  yEm: number,
  widthEm: number,
  heightEm: number
): KpSchemeGeometryRect {
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

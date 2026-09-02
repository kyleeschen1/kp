import type {
  CorrespondenceMap,
  SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";
import {
  createKpTypedEquation,
  rebuildKpTypedMatrix,
  type KpMathProvenance,
  type KpScalarValue,
  type KpTypedEquation,
  type KpTypedMatrix
} from "./typed-semantic-math.ts";

export type KpSemanticOpticCardinality = "one" | "many";

export type KpSemanticOpticPathSegment =
  | Readonly<{
      kind: "field";
      name: string;
    }>
  | Readonly<{
      kind: "index";
      index: number;
    }>
  | Readonly<{
      kind: "slice";
      start: number;
      end: number;
    }>;

export interface KpSemanticOpticPath {
  readonly schemaVersion: "kp.semantic-optic-path.v1";
  readonly segments: readonly KpSemanticOpticPathSegment[];
}

export interface KpResolvedSemanticFocus<Focus> {
  readonly entityId: string;
  readonly path: string;
  readonly value: Focus;
}

export interface KpSemanticOptic<
  Root,
  Focus,
  Cardinality extends KpSemanticOpticCardinality
> {
  readonly schemaVersion: "kp.semantic-optic.v1";
  readonly id: string;
  readonly cardinality: Cardinality;
  readonly descriptor: KpSemanticOpticPath;
  readonly resolve: (root: Root) => readonly KpResolvedSemanticFocus<Focus>[];
  readonly replace: (root: Root, replacements: readonly Focus[]) => Root;
}

export type KpLens<Root, Focus> = KpSemanticOptic<Root, Focus, "one">;
export type KpTraversal<Root, Focus> = KpSemanticOptic<Root, Focus, "many">;

export interface KpSemanticSelection<
  Root,
  Focus,
  Cardinality extends KpSemanticOpticCardinality
> {
  readonly schemaVersion: "kp.semantic-selection.v1";
  readonly root: Root;
  readonly opticId: string;
  readonly cardinality: Cardinality;
  readonly descriptor: KpSemanticOpticPath;
  readonly refs: readonly KpResolvedSemanticFocus<Focus>[];
}

export interface KpSemanticRewriteOperation {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly authorityIds: readonly string[];
  readonly summary: string;
}

export interface KpSemanticRewriteResult<Root, Focus> {
  readonly schemaVersion: "kp.semantic-rewrite-result.v1";
  readonly value: Root;
  readonly sourceSelection: KpSemanticSelection<
    Root,
    Focus,
    KpSemanticOpticCardinality
  >;
  readonly targetRefs: readonly KpResolvedSemanticFocus<Focus>[];
  readonly transformation: Readonly<{
    id: string;
    authorityIds: readonly string[];
    sourceEntityIds: readonly string[];
    targetEntityIds: readonly string[];
  }>;
  readonly correspondenceMap: CorrespondenceMap;
}

export function createKpEquationOptics<
  Left extends KpScalarValue,
  Right extends KpScalarValue
>(
  _equation: KpTypedEquation<Left, Right>
): Readonly<{
  lhs: KpLens<KpTypedEquation<Left, Right>, Left>;
  rhs: KpLens<KpTypedEquation<Left, Right>, Right>;
}> {
  return Object.freeze({
    lhs: equationSideLens<Left, Right, "left">("left"),
    rhs: equationSideLens<Left, Right, "right">("right")
  });
}

export function createKpMatrixOptics<
  Rows extends number,
  Columns extends number
>(matrix: KpTypedMatrix<Rows, Columns>): Readonly<{
  entries: KpTraversal<KpTypedMatrix<Rows, Columns>, KpScalarValue>;
  entry: (
    rowIndex: number,
    columnIndex: number
  ) => KpLens<KpTypedMatrix<Rows, Columns>, KpScalarValue>;
  rows: Readonly<{
    slice: (
      start: number,
      end: number
    ) => KpTraversal<KpTypedMatrix<Rows, Columns>, KpScalarValue>;
  }>;
  cols: Readonly<{
    slice: (
      start: number,
      end: number
    ) => KpTraversal<KpTypedMatrix<Rows, Columns>, KpScalarValue>;
  }>;
}> {
  const entries = matrixTraversal<Rows, Columns>({
    id: "kp.math.matrix.entries.v1",
    descriptor: path([{ kind: "field", name: "entries" }]),
    select: () => true
  });
  return Object.freeze({
    entries,
    entry(rowIndex, columnIndex) {
      requireIndex(rowIndex, matrix.rowCount, "row");
      requireIndex(columnIndex, matrix.columnCount, "column");
      return matrixEntryLens(rowIndex, columnIndex);
    },
    rows: Object.freeze({
      slice(start: number, end: number) {
        requireSlice(start, end, matrix.rowCount, "row");
        return matrixTraversal<Rows, Columns>({
          id: `kp.math.matrix.rows.${start}-${end}.v1`,
          descriptor: path([
            { kind: "field", name: "rows" },
            { kind: "slice", start, end }
          ]),
          select: (rowIndex) => rowIndex >= start && rowIndex < end
        });
      }
    }),
    cols: Object.freeze({
      slice(start: number, end: number) {
        requireSlice(start, end, matrix.columnCount, "column");
        return matrixTraversal<Rows, Columns>({
          id: `kp.math.matrix.columns.${start}-${end}.v1`,
          descriptor: path([
            { kind: "field", name: "columns" },
            { kind: "slice", start, end }
          ]),
          select: (_rowIndex, columnIndex) =>
            columnIndex >= start && columnIndex < end
        });
      }
    })
  });
}

export function resolveKpSemanticSelection<
  Root,
  Focus,
  Cardinality extends KpSemanticOpticCardinality
>(
  root: Root,
  optic: KpSemanticOptic<Root, Focus, Cardinality>
): KpSemanticSelection<Root, Focus, Cardinality> {
  const refs = Object.freeze([...optic.resolve(root)]);
  if (optic.cardinality === "one" && refs.length !== 1) {
    throw new Error(
      `Semantic lens ${optic.id} resolved ${refs.length} entities instead of one.`
    );
  }
  if (refs.length === 0) {
    throw new Error(`Semantic optic ${optic.id} resolved no entities.`);
  }
  const entityIds = refs.map(({ entityId }) => entityId);
  if (new Set(entityIds).size !== entityIds.length) {
    throw new Error(`Semantic optic ${optic.id} resolved duplicate entities.`);
  }
  return deepFreeze({
    schemaVersion: "kp.semantic-selection.v1" as const,
    root,
    opticId: optic.id,
    cardinality: optic.cardinality,
    descriptor: optic.descriptor,
    refs
  });
}

export function transformKpSemanticSelection<
  Root,
  Focus,
  Cardinality extends KpSemanticOpticCardinality
>(input: {
  readonly root: Root;
  readonly optic: KpSemanticOptic<Root, Focus, Cardinality>;
  readonly operation: KpSemanticRewriteOperation;
  readonly transform: (
    focus: Focus,
    context: Readonly<{
      ordinal: number;
      entityId: string;
      path: string;
    }>
  ) => Focus;
}): KpSemanticRewriteResult<Root, Focus> {
  requireText(input.operation.id, "Semantic rewrite operation id");
  requireText(input.operation.summary, `Semantic rewrite ${input.operation.id} summary`);
  if (input.operation.authorityIds.length === 0) {
    throw new Error(`Semantic rewrite ${input.operation.id} requires authority.`);
  }
  const sourceSelection = resolveKpSemanticSelection(input.root, input.optic);
  const replacements = sourceSelection.refs.map((ref, ordinal) =>
    input.transform(ref.value, Object.freeze({
      ordinal,
      entityId: ref.entityId,
      path: ref.path
    }))
  );
  const value = input.optic.replace(input.root, replacements);
  const targetRefs = Object.freeze([...input.optic.resolve(value)]);
  if (targetRefs.length !== sourceSelection.refs.length) {
    throw new Error(
      `Semantic rewrite ${input.operation.id} changed optic cardinality from ` +
      `${sourceSelection.refs.length} to ${targetRefs.length}.`
    );
  }
  const correspondenceMap: CorrespondenceMap = deepFreeze({
    id: `${input.operation.id}.correspondence`,
    records: sourceSelection.refs.map((source, index) => {
      const target = targetRefs[index]!;
      return {
        id: `${input.operation.id}.correspondence.${index}`,
        relation: input.operation.relation,
        sourceSelectorIds: [source.entityId],
        targetSelectorIds: [target.entityId],
        summary: input.operation.summary
      };
    })
  });
  return deepFreeze({
    schemaVersion: "kp.semantic-rewrite-result.v1" as const,
    value,
    sourceSelection,
    targetRefs,
    transformation: {
      id: input.operation.id,
      authorityIds: input.operation.authorityIds,
      sourceEntityIds: sourceSelection.refs.map(({ entityId }) => entityId),
      targetEntityIds: targetRefs.map(({ entityId }) => entityId)
    },
    correspondenceMap
  });
}

function equationSideLens<
  Left extends KpScalarValue,
  Right extends KpScalarValue,
  Side extends "left" | "right"
>(side: Side): KpLens<
  KpTypedEquation<Left, Right>,
  Side extends "left" ? Left : Right
> {
  type Focus = Side extends "left" ? Left : Right;
  return deepFreeze({
    schemaVersion: "kp.semantic-optic.v1" as const,
    id: `kp.math.equation.${side === "left" ? "lhs" : "rhs"}.v1`,
    cardinality: "one" as const,
    descriptor: path([{ kind: "field", name: side }]),
    resolve(root: KpTypedEquation<Left, Right>) {
      const value = root[side] as Focus;
      return [{
        entityId: value.id,
        path: side,
        value
      }];
    },
    replace(root: KpTypedEquation<Left, Right>, replacements: readonly Focus[]) {
      const replacement = replacements[0];
      if (replacement === undefined || replacements.length !== 1) {
        throw new Error(`Equation ${side} lens requires exactly one replacement.`);
      }
      return createKpTypedEquation({
        id: root.id,
        left: (side === "left" ? replacement : root.left) as Left,
        right: (side === "right" ? replacement : root.right) as Right,
        provenance: root.provenance
      });
    }
  });
}

function matrixEntryLens<Rows extends number, Columns extends number>(
  rowIndex: number,
  columnIndex: number
): KpLens<KpTypedMatrix<Rows, Columns>, KpScalarValue> {
  return deepFreeze({
    schemaVersion: "kp.semantic-optic.v1" as const,
    id: `kp.math.matrix.entry.${rowIndex}.${columnIndex}.v1`,
    cardinality: "one" as const,
    descriptor: path([
      { kind: "field", name: "rows" },
      { kind: "index", index: rowIndex },
      { kind: "index", index: columnIndex }
    ]),
    resolve(root: KpTypedMatrix<Rows, Columns>) {
      requireIndex(rowIndex, root.rowCount, "row");
      requireIndex(columnIndex, root.columnCount, "column");
      const value = root.rows[rowIndex]?.[columnIndex];
      if (value === undefined) {
        throw new Error(`Matrix entry [${rowIndex}, ${columnIndex}] is missing.`);
      }
      return [matrixRef(value, rowIndex, columnIndex)];
    },
    replace(
      root: KpTypedMatrix<Rows, Columns>,
      replacements: readonly KpScalarValue[]
    ) {
      if (replacements.length !== 1 || replacements[0] === undefined) {
        throw new Error("Matrix entry lens requires exactly one replacement.");
      }
      return replaceMatrixRefs(root, [
        { rowIndex, columnIndex, value: replacements[0] }
      ]);
    }
  });
}

function matrixTraversal<Rows extends number, Columns extends number>(input: {
  readonly id: string;
  readonly descriptor: KpSemanticOpticPath;
  readonly select: (rowIndex: number, columnIndex: number) => boolean;
}): KpTraversal<KpTypedMatrix<Rows, Columns>, KpScalarValue> {
  return deepFreeze({
    schemaVersion: "kp.semantic-optic.v1" as const,
    id: input.id,
    cardinality: "many" as const,
    descriptor: input.descriptor,
    resolve(root: KpTypedMatrix<Rows, Columns>) {
      return root.rows.flatMap((row, rowIndex) =>
        row.flatMap((value, columnIndex) => input.select(rowIndex, columnIndex)
          ? [matrixRef(value, rowIndex, columnIndex)]
          : [])
      );
    },
    replace(
      root: KpTypedMatrix<Rows, Columns>,
      replacements: readonly KpScalarValue[]
    ) {
      const coordinates = root.rows.flatMap((row, rowIndex) =>
        row.flatMap((_value, columnIndex) => input.select(rowIndex, columnIndex)
          ? [{ rowIndex, columnIndex }]
          : [])
      );
      if (coordinates.length !== replacements.length) {
        throw new Error(
          `Matrix traversal ${input.id} requires ${coordinates.length} replacements.`
        );
      }
      return replaceMatrixRefs(root, coordinates.map((coordinate, index) => ({
        ...coordinate,
        value: replacements[index]!
      })));
    }
  });
}

function replaceMatrixRefs<Rows extends number, Columns extends number>(
  root: KpTypedMatrix<Rows, Columns>,
  replacements: readonly Readonly<{
    rowIndex: number;
    columnIndex: number;
    value: KpScalarValue;
  }>[]
): KpTypedMatrix<Rows, Columns> {
  const byCoordinate = new Map(replacements.map((replacement) => [
    `${replacement.rowIndex}:${replacement.columnIndex}`,
    replacement.value
  ]));
  return rebuildKpTypedMatrix({
    source: root,
    rows: root.rows.map((row, rowIndex) => row.map((value, columnIndex) =>
      byCoordinate.get(`${rowIndex}:${columnIndex}`) ?? value
    )),
    provenance: rewriteProvenance(root, replacements)
  });
}

function rewriteProvenance(
  root: KpTypedMatrix,
  replacements: readonly { readonly value: KpScalarValue }[]
): KpMathProvenance {
  return {
    kind: "derived",
    sourceIds: [root.id, ...replacements.map(({ value }) => value.id)],
    methodId: "kp.math.semantic-optic-rewrite.v1"
  };
}

function matrixRef(
  value: KpScalarValue,
  rowIndex: number,
  columnIndex: number
): KpResolvedSemanticFocus<KpScalarValue> {
  return {
    entityId: value.id,
    path: `rows[${rowIndex}][${columnIndex}]`,
    value
  };
}

function path(
  segments: readonly KpSemanticOpticPathSegment[]
): KpSemanticOpticPath {
  return deepFreeze({
    schemaVersion: "kp.semantic-optic-path.v1" as const,
    segments
  });
}

function requireIndex(index: number, size: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new Error(`Matrix ${label} ${index} is outside 0..${size - 1}.`);
  }
}

function requireSlice(
  start: number,
  end: number,
  size: number,
  label: string
): void {
  if (
    !Number.isInteger(start) || !Number.isInteger(end) ||
    start < 0 || end > size || start >= end
  ) {
    throw new Error(
      `Matrix ${label} traversal requires a non-empty slice inside 0..${size}.`
    );
  }
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

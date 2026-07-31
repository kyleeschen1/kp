import {
  certifyKpPlaceValueSemanticFoundation,
  isKpVerifiedPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../../architecture/place-value-addition-semantic-foundation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "./place-value-addition-visual-reference.ts";

declare const kpPlaceValueWrittenColumnProjectionBrand: unique symbol;

const sealedWrittenColumnProjections = new WeakSet<object>();

export type KpPlaceValueWrittenRow = string;

export type KpPlaceValueWrittenColumn = string;

export type KpPlaceValueWrittenCellRole =
  | "addend-digit"
  | "operator"
  | "carry-digit"
  | "result-digit";

export interface KpPlaceValueNativeCellRoot {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly role: KpPlaceValueWrittenCellRole;
  readonly row: KpPlaceValueWrittenRow;
  readonly column: KpPlaceValueWrittenColumn;
  readonly latex: string;
  readonly renderedLatex: string;
  readonly nativeHtmlAndMathml: string;
  readonly nativeOwner: "native-katex";
  readonly endpointOwnership: "same-root-native-dom";
  readonly mathStyle: "display" | "script";
  readonly visibility:
    | "established"
    | "trace-governed-carry"
    | "trace-governed-result";
}

export interface KpPlaceValueWrittenRuleRoot {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly row: KpPlaceValueWrittenRow;
  readonly fromColumn: KpPlaceValueWrittenColumn;
  readonly throughColumn: KpPlaceValueWrittenColumn;
  readonly nativeOwner: "semantic-grid-dom";
  readonly measurementAuthority: "native-painted-dom";
}

export interface KpPlaceValueWrittenColumnProjection {
  readonly schemaVersion:
    "kp.place-value-addition-written-column-projection.v1";
  readonly animationId: string;
  readonly traceId: string;
  readonly status: "ready-for-runtime-binding";
  readonly promotionStatus: "not-promoted";
  readonly rows: readonly KpPlaceValueWrittenRow[];
  readonly columns: readonly KpPlaceValueWrittenColumn[];
  readonly cells: readonly KpPlaceValueNativeCellRoot[];
  readonly underline: KpPlaceValueWrittenRuleRoot;
  readonly layoutContract: {
    readonly topologyOwner: "semantic-grid";
    readonly columnSizing: "native-max-content";
    readonly horizontalAlignment: "right-aligned-place-columns";
    readonly rowBaselinePolicy: "native-row-baseline";
    readonly measurementAuthority: "native-painted-dom";
    readonly endpointTransformPolicy: "none";
    readonly authoredCoordinates: false;
    readonly perDigitOffsets: false;
    readonly globalScaleFallback: false;
  };
  readonly accessibility: {
    readonly expression: string;
    readonly readingOrder: readonly string[];
  };
  readonly [kpPlaceValueWrittenColumnProjectionBrand]: true;
}

export function compileKpPlaceValueWrittenColumnProjection(
  foundation: KpVerifiedPlaceValueSemanticFoundation =
    certifyKpPlaceValueSemanticFoundation()
): KpPlaceValueWrittenColumnProjection {
  if (
    !isKpVerifiedPlaceValueSemanticFoundation(foundation) ||
    foundation.animationId !== reference.animationId ||
    foundation.trace.id !== "trace.place-value-addition.278-plus-156"
  ) {
    throw new Error(
      "Written-column projection requires the sealed place-value semantic foundation."
    );
  }

  return compileKpPlaceValueWrittenColumnProjectionSpec({
    animationId: foundation.animationId,
    traceId: foundation.trace.id,
    rows: reference.primaryStage.rows,
    columns: reference.primaryStage.columns,
    initialCells: reference.primaryStage.initialCells,
    carrySlots: reference.primaryStage.carrySlots,
    resultSlots: reference.primaryStage.resultSlots,
    underline: reference.primaryStage.underline,
    accessibility: {
      expression: "278 + 156 = 434",
      readingOrder: [
        "first-addend",
        "operator",
        "second-addend",
        "result"
      ]
    }
  });
}

export interface KpPlaceValueWrittenColumnProjectionSpec {
  readonly animationId: string;
  readonly traceId: string;
  readonly rows: readonly KpPlaceValueWrittenRow[];
  readonly columns: readonly KpPlaceValueWrittenColumn[];
  readonly initialCells: readonly {
    readonly id: string;
    readonly row: KpPlaceValueWrittenRow;
    readonly column: KpPlaceValueWrittenColumn;
    readonly latex: string;
  }[];
  readonly carrySlots: readonly {
    readonly id: string;
    readonly row: KpPlaceValueWrittenRow;
    readonly column: KpPlaceValueWrittenColumn;
    readonly latex: string;
  }[];
  readonly resultSlots: readonly {
    readonly id: string;
    readonly row: KpPlaceValueWrittenRow;
    readonly column: KpPlaceValueWrittenColumn;
    readonly latex: string;
  }[];
  readonly underline: {
    readonly id: string;
    readonly row: KpPlaceValueWrittenRow;
    readonly fromColumn: KpPlaceValueWrittenColumn;
    readonly throughColumn: KpPlaceValueWrittenColumn;
  };
  readonly accessibility: {
    readonly expression: string;
    readonly readingOrder: readonly string[];
  };
}

/**
 * Compiles a semantic grid without giving familiar decimal place labels any
 * layout authority. This is the reusable boundary for unequal widths and for
 * future positions with negative exponents; fixture adapters may still use
 * reader-friendly labels in their data.
 */
export function compileKpPlaceValueWrittenColumnProjectionSpec(
  spec: KpPlaceValueWrittenColumnProjectionSpec
): KpPlaceValueWrittenColumnProjection {
  assertProjectionSpec(spec);
  const established = spec.initialCells.map((cell) =>
    nativeCell({
      ...cell,
      role: cell.latex === "+" ? "operator" : "addend-digit",
      mathStyle: "display",
      visibility: "established"
    })
  );
  const carries = spec.carrySlots.map((cell) =>
    nativeCell({
      ...cell,
      role: "carry-digit",
      mathStyle: "script",
      visibility: "trace-governed-carry"
    })
  );
  const results = spec.resultSlots.map((cell) =>
    nativeCell({
      ...cell,
      role: "result-digit",
      mathStyle: "display",
      visibility: "trace-governed-result"
    })
  );
  const cells = Object.freeze([...established, ...carries, ...results]);
  assertCellTopology(cells, spec);

  const projection = Object.freeze({
    schemaVersion:
      "kp.place-value-addition-written-column-projection.v1" as const,
    animationId: spec.animationId,
    traceId: spec.traceId,
    status: "ready-for-runtime-binding" as const,
    promotionStatus: "not-promoted" as const,
    rows: Object.freeze([...spec.rows]),
    columns: Object.freeze([...spec.columns]),
    cells,
    underline: Object.freeze({
      id: spec.underline.id,
      semanticEntityId: spec.underline.id,
      row: spec.underline.row,
      fromColumn: spec.underline.fromColumn,
      throughColumn: spec.underline.throughColumn,
      nativeOwner: "semantic-grid-dom" as const,
      measurementAuthority: "native-painted-dom" as const
    }),
    // The compiler names only semantic slots. Browser layout and the existing
    // paint observer own geometry so a future glyph cannot acquire a special
    // offset, scale, or endpoint transform to paper over bad measurement.
    layoutContract: Object.freeze({
      topologyOwner: "semantic-grid" as const,
      columnSizing: "native-max-content" as const,
      horizontalAlignment: "right-aligned-place-columns" as const,
      rowBaselinePolicy: "native-row-baseline" as const,
      measurementAuthority: "native-painted-dom" as const,
      endpointTransformPolicy: "none" as const,
      authoredCoordinates: false as const,
      perDigitOffsets: false as const,
      globalScaleFallback: false as const
    }),
    accessibility: Object.freeze({
      expression: spec.accessibility.expression,
      readingOrder: Object.freeze([...spec.accessibility.readingOrder])
    })
  });
  sealedWrittenColumnProjections.add(projection);
  return projection as unknown as KpPlaceValueWrittenColumnProjection;
}

export function isKpPlaceValueWrittenColumnProjection(
  value: unknown
): value is KpPlaceValueWrittenColumnProjection {
  return typeof value === "object" &&
    value !== null &&
    sealedWrittenColumnProjections.has(value);
}

function nativeCell(input: {
  readonly id: string;
  readonly row: KpPlaceValueWrittenRow;
  readonly column: KpPlaceValueWrittenColumn;
  readonly latex: string;
  readonly role: KpPlaceValueWrittenCellRole;
  readonly mathStyle: "display" | "script";
  readonly visibility: KpPlaceValueNativeCellRoot["visibility"];
}): KpPlaceValueNativeCellRoot {
  if (input.latex.trim() !== input.latex || input.latex.length !== 1) {
    throw new Error(
      `Written-column cell ${input.id} must contain one unspaced native glyph.`
    );
  }
  const renderedLatex =
    input.mathStyle === "script"
      ? `\\scriptstyle{${input.latex}}`
      : input.latex;
  return Object.freeze({
    id: `native-root.${input.id}`,
    semanticEntityId: input.id,
    role: input.role,
    row: input.row,
    column: input.column,
    latex: input.latex,
    renderedLatex,
    nativeHtmlAndMathml: renderLatexToHtml(renderedLatex, {
      displayMode: false,
      output: "htmlAndMathml"
    }),
    nativeOwner: "native-katex",
    endpointOwnership: "same-root-native-dom",
    mathStyle: input.mathStyle,
    visibility: input.visibility
  });
}

function assertProjectionSpec(
  spec: KpPlaceValueWrittenColumnProjectionSpec
): void {
  if (
    spec.animationId.trim().length === 0 ||
    spec.traceId.trim().length === 0 ||
    spec.rows.length === 0 ||
    spec.columns.length < 2 ||
    new Set(spec.rows).size !== spec.rows.length ||
    new Set(spec.columns).size !== spec.columns.length ||
    !spec.rows.includes(spec.underline.row) ||
    !spec.columns.includes(spec.underline.fromColumn) ||
    !spec.columns.includes(spec.underline.throughColumn) ||
    spec.accessibility.expression.trim().length === 0
  ) {
    throw new Error(
      "Written-column projection requires one exact semantic grid."
    );
  }
  for (const cell of [
    ...spec.initialCells,
    ...spec.carrySlots,
    ...spec.resultSlots
  ]) {
    if (!spec.rows.includes(cell.row) || !spec.columns.includes(cell.column)) {
      throw new Error(`Written-column cell ${cell.id} is outside its grid.`);
    }
  }
}

function assertCellTopology(
  cells: readonly KpPlaceValueNativeCellRoot[],
  spec: KpPlaceValueWrittenColumnProjectionSpec
): void {
  const expectedIds = [
    ...spec.initialCells.map(({ id }) => id),
    ...spec.carrySlots.map(({ id }) => id),
    ...spec.resultSlots.map(({ id }) => id)
  ];
  if (
    cells.length !== expectedIds.length ||
    cells.some(({ semanticEntityId }, index) =>
      semanticEntityId !== expectedIds[index])
  ) {
    throw new Error(
      "Written-column projection must compile every canonical cell exactly once."
    );
  }
  if (new Set(cells.map(({ id }) => id)).size !== cells.length) {
    throw new Error("Written-column native root IDs must be unique.");
  }
}

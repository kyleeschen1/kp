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

export type KpPlaceValueWrittenRow =
  (typeof reference.primaryStage.rows)[number];

export type KpPlaceValueWrittenColumn =
  (typeof reference.primaryStage.columns)[number];

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
  readonly id: "rule.addition.underline";
  readonly semanticEntityId: "rule.addition.underline";
  readonly row: "underline";
  readonly fromColumn: "operator";
  readonly throughColumn: "ones";
  readonly nativeOwner: "semantic-grid-dom";
  readonly measurementAuthority: "native-painted-dom";
}

export interface KpPlaceValueWrittenColumnProjection {
  readonly schemaVersion:
    "kp.place-value-addition-written-column-projection.v1";
  readonly animationId: KpVerifiedPlaceValueSemanticFoundation["animationId"];
  readonly traceId: KpVerifiedPlaceValueSemanticFoundation["trace"]["id"];
  readonly status: "ready-for-runtime-binding";
  readonly promotionStatus: "not-promoted";
  readonly rows: typeof reference.primaryStage.rows;
  readonly columns: typeof reference.primaryStage.columns;
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
    readonly expression: "278 + 156 = 434";
    readonly readingOrder: readonly [
      "first-addend",
      "operator",
      "second-addend",
      "result"
    ];
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

  const established = reference.primaryStage.initialCells.map((cell) =>
    nativeCell({
      ...cell,
      role: cell.id === "operator.add" ? "operator" : "addend-digit",
      mathStyle: "display",
      visibility: "established"
    })
  );
  const carries = reference.primaryStage.carrySlots.map((cell) =>
    nativeCell({
      ...cell,
      role: "carry-digit",
      mathStyle: "script",
      visibility: "trace-governed-carry"
    })
  );
  const results = reference.primaryStage.resultSlots.map((cell) =>
    nativeCell({
      ...cell,
      role: "result-digit",
      mathStyle: "display",
      visibility: "trace-governed-result"
    })
  );
  const cells = Object.freeze([...established, ...carries, ...results]);
  assertCanonicalCellTopology(cells);

  const projection = Object.freeze({
    schemaVersion:
      "kp.place-value-addition-written-column-projection.v1" as const,
    animationId: foundation.animationId,
    traceId: foundation.trace.id,
    status: "ready-for-runtime-binding" as const,
    promotionStatus: "not-promoted" as const,
    rows: reference.primaryStage.rows,
    columns: reference.primaryStage.columns,
    cells,
    underline: Object.freeze({
      id: reference.primaryStage.underline.id,
      semanticEntityId: reference.primaryStage.underline.id,
      row: reference.primaryStage.underline.row,
      fromColumn: reference.primaryStage.underline.fromColumn,
      throughColumn: reference.primaryStage.underline.throughColumn,
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
      expression: "278 + 156 = 434" as const,
      readingOrder: Object.freeze([
        "first-addend",
        "operator",
        "second-addend",
        "result"
      ] as const)
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

function assertCanonicalCellTopology(
  cells: readonly KpPlaceValueNativeCellRoot[]
): void {
  const expectedIds = [
    ...reference.primaryStage.initialCells.map(({ id }) => id),
    ...reference.primaryStage.carrySlots.map(({ id }) => id),
    ...reference.primaryStage.resultSlots.map(({ id }) => id)
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

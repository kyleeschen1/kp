import {
  isKpPlaceValueWrittenColumnProjection,
  type KpPlaceValueNativeCellRoot,
  type KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";

export type KpPlaceValueWrittenEndpoint = "initial" | "settled";

export interface KpPlaceValueWrittenColumnDomProjection {
  readonly root: HTMLElement;
  readonly cellElements: ReadonlyMap<string, HTMLElement>;
  readonly endpoint: () => KpPlaceValueWrittenEndpoint;
  readonly setEndpoint: (endpoint: KpPlaceValueWrittenEndpoint) => void;
}

const styles = `
  [data-kp-place-value-written-projection] {
    box-sizing: border-box;
    display: grid;
    inline-size: 100%;
    min-inline-size: 0;
    place-items: center;
  }
  [data-kp-place-value-grid] {
    color: #172033;
    display: grid;
    font-size: 40px;
    column-gap: 0.22em;
    row-gap: 0.08em;
    inline-size: max-content;
    line-height: 1;
    place-items: baseline center;
  }
  [data-kp-place-value-native-root] {
    align-self: baseline;
    display: inline-block;
    justify-self: center;
    line-height: 1;
    min-inline-size: 0;
    white-space: nowrap;
  }
  [data-kp-place-value-native-root] > .katex {
    line-height: 1;
  }
  [data-kp-place-value-native-root][data-kp-visibility="hidden"] {
    visibility: hidden;
  }
  [data-kp-place-value-underline] {
    align-self: center;
    border-block-start: 0.055em solid currentColor;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 0;
  }
`;

/**
 * Stateless DOM projection: it lays out already-compiled native roots but owns
 * neither time nor motion. Keeping this adapter stateless lets the canonical
 * reader session hydrate the same nodes later instead of creating a second
 * renderer lifecycle for column addition.
 */
export function renderKpPlaceValueWrittenColumnElement(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly endpoint: KpPlaceValueWrittenEndpoint;
}): HTMLElement {
  return createKpPlaceValueWrittenColumnDomProjection(input).root;
}

export function createKpPlaceValueWrittenColumnDomProjection(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly endpoint: KpPlaceValueWrittenEndpoint;
}): KpPlaceValueWrittenColumnDomProjection {
  if (!isKpPlaceValueWrittenColumnProjection(input.projection)) {
    throw new Error(
      "Written-column DOM projection requires compiler-owned projection authority."
    );
  }
  const stage = input.document.createElement("section");
  stage.dataset["kpPlaceValueWrittenProjection"] = "";
  stage.dataset["kpPlaceValueEndpoint"] = input.endpoint;
  stage.setAttribute("role", "img");
  stage.setAttribute(
    "aria-label",
    input.projection.accessibility.expression
  );

  const style = input.document.createElement("style");
  style.dataset["kpPlaceValueWrittenStyles"] = "";
  style.textContent = `${styles}\n${projectionGridStyles(input.projection)}`;
  stage.append(style);

  const grid = input.document.createElement("div");
  grid.dataset["kpPlaceValueGrid"] = "";
  grid.setAttribute("aria-hidden", "true");
  const cellElements = new Map<string, HTMLElement>();
  for (const cell of input.projection.cells) {
    const element = renderCell(input, cell);
    grid.append(element);
    cellElements.set(cell.semanticEntityId, element);
  }

  const underline = input.document.createElement("span");
  underline.dataset["kpPlaceValueUnderline"] = "";
  underline.dataset["kpPlaceValueRow"] = input.projection.underline.row;
  underline.dataset["kpSemanticEntityId"] =
    input.projection.underline.semanticEntityId;
  underline.dataset["kpPresentationGroupId"] =
    input.projection.underline.semanticEntityId;
  grid.append(underline);
  stage.append(grid);
  let currentEndpoint = input.endpoint;
  const setEndpoint = (endpoint: KpPlaceValueWrittenEndpoint): void => {
    for (const cell of input.projection.cells) {
      cellElements.get(cell.semanticEntityId)!.dataset["kpVisibility"] =
        isVisible(cell, endpoint) ? "visible" : "hidden";
    }
    stage.dataset["kpPlaceValueEndpoint"] = endpoint;
    currentEndpoint = endpoint;
  };
  return Object.freeze({
    root: stage,
    cellElements,
    endpoint: () => currentEndpoint,
    setEndpoint
  });
}

function renderCell(
  input: {
    readonly document: Document;
    readonly projection: KpPlaceValueWrittenColumnProjection;
    readonly endpoint: KpPlaceValueWrittenEndpoint;
  },
  cell: KpPlaceValueNativeCellRoot
): HTMLElement {
  const root = input.document.createElement("span");
  root.id = cell.id;
  root.dataset["kpPlaceValueNativeRoot"] = "";
  root.dataset["kpSemanticEntityId"] = cell.semanticEntityId;
  root.dataset["kpPresentationGroupId"] = cell.semanticEntityId;
  root.dataset["kpPlaceValueRole"] = cell.role;
  root.dataset["kpPlaceValueRow"] = cell.row;
  root.dataset["kpPlaceValueColumn"] = cell.column;
  root.dataset["kpNativeOwner"] = cell.nativeOwner;
  root.dataset["kpEndpointOwnership"] = cell.endpointOwnership;
  root.dataset["kpVisibility"] =
    isVisible(cell, input.endpoint) ? "visible" : "hidden";
  root.innerHTML = cell.nativeHtmlAndMathml;
  return root;
}

function projectionGridStyles(
  projection: KpPlaceValueWrittenColumnProjection
): string {
  const tracks = (count: number) => Array.from(
    { length: count },
    () => "max-content"
  ).join(" ");
  const rows = projection.rows.map((row, index) =>
    `[data-kp-place-value-row="${cssAttributeValue(row)}"] { grid-row: ${index + 1}; }`
  );
  const columns = projection.columns.map((column, index) =>
    `[data-kp-place-value-column="${cssAttributeValue(column)}"] { grid-column: ${index + 1}; }`
  );
  const underlineStart = projection.columns.indexOf(
    projection.underline.fromColumn
  );
  const underlineEnd = projection.columns.indexOf(
    projection.underline.throughColumn
  );
  if (underlineStart < 0 || underlineEnd < underlineStart) {
    throw new Error("Written-column underline requires an ordered column span.");
  }
  // Keep semantic grid placement in stylesheet rules rather than inline
  // declarations. The compositor clones paint roots; layout-only inline style
  // would leak into those clones and corrupt their stage-relative geometry.
  return [
    `[data-kp-place-value-grid] { grid-template-columns: ${tracks(
      projection.columns.length
    )}; grid-template-rows: ${tracks(projection.rows.length)}; }`,
    ...rows,
    ...columns,
    `[data-kp-place-value-underline] { grid-column: ${underlineStart + 1} / ${underlineEnd + 2}; }`
  ].join("\n");
}

function cssAttributeValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function isVisible(
  cell: KpPlaceValueNativeCellRoot,
  endpoint: KpPlaceValueWrittenEndpoint
): boolean {
  return cell.visibility === "established" || endpoint === "settled";
}

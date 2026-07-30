import type {
  KpPlaceValueAdditionState
} from "../semantic/place-value-addition-trace.ts";
import {
  isKpPlaceValueBaseTenProjection,
  sampleKpPlaceValueBaseTenFrame,
  type KpPlaceValueBaseTenProjection
} from "./place-value-addition-base-ten-projection.ts";

const svgNamespace = "http://www.w3.org/2000/svg";

export interface KpPlaceValueBaseTenDomProjection {
  readonly root: SVGSVGElement;
  readonly blockElements: ReadonlyMap<string, SVGRectElement>;
  readonly stateId: () => KpPlaceValueAdditionState["id"];
  readonly setState: (stateId: KpPlaceValueAdditionState["id"]) => void;
}

export function createKpPlaceValueBaseTenDomProjection(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueBaseTenProjection;
  readonly initialStateId?: KpPlaceValueAdditionState["id"] | undefined;
}): KpPlaceValueBaseTenDomProjection {
  if (!isKpPlaceValueBaseTenProjection(input.projection)) {
    throw new Error(
      "Base-ten DOM projection requires compiler-owned projection authority."
    );
  }
  const root = input.document.createElementNS(svgNamespace, "svg");
  const { minX, minY, width, height } = input.projection.intrinsicViewBox;
  root.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  root.setAttribute("role", "img");
  root.setAttribute(
    "aria-label",
    "Base-ten blocks showing 434 as four hundreds, three tens, and four ones."
  );
  root.dataset["kpPlaceValueBaseTenProjection"] = "";
  root.style.cssText =
    "display:block;width:100%;max-width:360px;height:auto;overflow:visible";

  const style = input.document.createElementNS(svgNamespace, "style");
  style.textContent = `
    [data-kp-base-ten-block] {
      opacity: 1;
      stroke: #172033;
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    [data-kp-base-ten-provenance="first-addend"] { fill: #8cc8ff; }
    [data-kp-base-ten-provenance="second-addend"] { fill: #ffc37a; }
    [data-kp-base-ten-provenance$="-exchange"] { fill: #b7a4ff; }
    [data-kp-base-ten-visible="false"] { visibility: hidden; }
  `;
  root.append(style);

  const blockElements = new Map<string, SVGRectElement>();
  for (const block of input.projection.blocks) {
    const placement = input.projection.homePlacements.find(
      ({ blockId }) => blockId === block.id
    );
    if (placement === undefined) {
      throw new Error(`Base-ten DOM block ${block.id} lacks geometry.`);
    }
    const element = input.document.createElementNS(svgNamespace, "rect");
    element.dataset["kpBaseTenBlock"] = block.id;
    element.dataset["kpBaseTenDenomination"] = block.denomination;
    element.dataset["kpBaseTenProvenance"] = block.provenance;
    applyPlacement(element, placement);
    root.append(element);
    blockElements.set(block.id, element);
  }

  let currentStateId =
    input.initialStateId ?? input.projection.frames[0]!.stateId;
  const setState = (
    stateId: KpPlaceValueAdditionState["id"]
  ): void => {
    const frame = sampleKpPlaceValueBaseTenFrame(input.projection, stateId);
    const placements = new Map(
      frame.placements.map((placement) => [placement.blockId, placement])
    );
    for (const block of input.projection.blocks) {
      const element = blockElements.get(block.id)!;
      const placement = placements.get(block.id);
      const home = input.projection.homePlacements.find(
        ({ blockId }) => blockId === block.id
      )!;
      applyPlacement(element, placement ?? home);
      element.dataset["kpBaseTenVisible"] =
        placement === undefined ? "false" : "true";
    }
    currentStateId = stateId;
    root.dataset["kpPlaceValueStateId"] = stateId;
  };
  setState(currentStateId);

  return Object.freeze({
    root,
    blockElements,
    stateId: () => currentStateId,
    setState
  });
}

function applyPlacement(
  element: SVGRectElement,
  placement: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }
): void {
  element.setAttribute("x", String(placement.x));
  element.setAttribute("y", String(placement.y));
  element.setAttribute("width", String(placement.width));
  element.setAttribute("height", String(placement.height));
}

import type {
  KpPlaceValueAdditionState
} from "../semantic/place-value-addition-trace.ts";
import {
  isKpPlaceValueBaseTenProjection,
  type KpPlaceValueBaseTenExchange,
  type KpPlaceValueBaseTenPlacement,
  type KpPlaceValueBaseTenProjection
} from "./place-value-addition-base-ten-projection.ts";

const svgNamespace = "http://www.w3.org/2000/svg";

export interface KpPlaceValueBaseTenDomProjection {
  readonly root: SVGSVGElement;
  readonly blockElements: ReadonlyMap<string, SVGRectElement>;
  readonly stateId: () => KpPlaceValueAdditionState["id"];
  readonly setState: (stateId: KpPlaceValueAdditionState["id"]) => void;
  readonly applyExchange: (input: {
    readonly exchangeId: KpPlaceValueBaseTenExchange["id"];
    readonly progress: number;
    readonly transferOccurred: boolean;
  }) => KpPlaceValueBaseTenExchangeDomFrame;
}

export interface KpPlaceValueBaseTenExchangeDomFrame {
  readonly exchangeId: KpPlaceValueBaseTenExchange["id"];
  readonly progress: number;
  readonly transferOccurred: boolean;
  readonly sourceStateId: KpPlaceValueAdditionState["id"];
  readonly targetStateId: KpPlaceValueAdditionState["id"];
  readonly visibleBlockIds: readonly string[];
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

  const homePlacements = new Map(
    input.projection.homePlacements.map((placement) =>
      [placement.blockId, placement] as const
    )
  );
  const statePlacements = new Map(
    input.projection.frames.map((frame) => [
      frame.stateId,
      new Map(
        frame.placements.map((placement) =>
          [placement.blockId, placement] as const
        )
      )
    ] as const)
  );
  const blockElements = new Map<string, SVGRectElement>();
  const appliedPlacements = new Map<string, KpPlaceValueBaseTenPlacement>();
  const appliedVisibility = new Map<string, boolean>();
  for (const block of input.projection.blocks) {
    const placement = homePlacements.get(block.id);
    if (placement === undefined) {
      throw new Error(`Base-ten DOM block ${block.id} lacks geometry.`);
    }
    const element = input.document.createElementNS(svgNamespace, "rect");
    element.dataset["kpBaseTenBlock"] = block.id;
    element.dataset["kpBaseTenDenomination"] = block.denomination;
    element.dataset["kpBaseTenProvenance"] = block.provenance;
    applyPlacement(element, placement);
    appliedPlacements.set(block.id, placement);
    root.append(element);
    blockElements.set(block.id, element);
  }

  const initialStateId =
    input.initialStateId ?? input.projection.frames[0]!.stateId;
  let currentStateId:
    KpPlaceValueAdditionState["id"] | undefined;
  const setPlacement = (
    blockId: string,
    placement: KpPlaceValueBaseTenPlacement
  ): void => {
    const previous = appliedPlacements.get(blockId);
    if (previous === undefined) {
      applyPlacement(blockElements.get(blockId)!, placement);
      appliedPlacements.set(blockId, placement);
      return;
    }
    const element = blockElements.get(blockId)!;
    if (previous.x !== placement.x) {
      element.setAttribute("x", String(placement.x));
    }
    if (previous.y !== placement.y) {
      element.setAttribute("y", String(placement.y));
    }
    if (previous.width !== placement.width) {
      element.setAttribute("width", String(placement.width));
    }
    if (previous.height !== placement.height) {
      element.setAttribute("height", String(placement.height));
    }
    if (
      previous.x === placement.x &&
      previous.y === placement.y &&
      previous.width === placement.width &&
      previous.height === placement.height
    ) return;
    appliedPlacements.set(blockId, placement);
  };
  const setVisibility = (blockId: string, visible: boolean): void => {
    if (appliedVisibility.get(blockId) === visible) return;
    blockElements.get(blockId)!.dataset["kpBaseTenVisible"] =
      String(visible);
    appliedVisibility.set(blockId, visible);
  };
  const setState = (
    stateId: KpPlaceValueAdditionState["id"]
  ): void => {
    if (
      currentStateId === stateId &&
      root.dataset["kpBaseTenExchangeId"] === undefined
    ) return;
    const placements = statePlacements.get(stateId);
    if (placements === undefined) {
      throw new Error(`Unknown base-ten state ${stateId}.`);
    }
    for (const block of input.projection.blocks) {
      const placement = placements.get(block.id);
      const home = homePlacements.get(block.id)!;
      setPlacement(block.id, placement ?? home);
      setVisibility(block.id, placement !== undefined);
    }
    currentStateId = stateId;
    root.dataset["kpPlaceValueStateId"] = stateId;
    delete root.dataset["kpBaseTenExchangeId"];
    delete root.dataset["kpBaseTenExchangeProgress"];
    delete root.dataset["kpBaseTenExchangeTransferOccurred"];
  };
  const applyExchange = (
    transition: Parameters<
      KpPlaceValueBaseTenDomProjection["applyExchange"]
    >[0]
  ): KpPlaceValueBaseTenExchangeDomFrame => {
    if (
      !Number.isFinite(transition.progress) ||
      transition.progress < 0 ||
      transition.progress > 1
    ) {
      throw new Error("Base-ten exchange progress must be within zero and one.");
    }
    const exchange = input.projection.exchanges.find(
      ({ id }) => id === transition.exchangeId
    );
    if (exchange === undefined) {
      throw new Error(`Unknown base-ten exchange ${transition.exchangeId}.`);
    }
    const stateIds = exchangeStateIds(exchange.id);
    const sourcePlacements = statePlacements.get(stateIds.source);
    const targetPlacements = statePlacements.get(stateIds.target);
    if (sourcePlacements === undefined || targetPlacements === undefined) {
      throw new Error(
        `Base-ten exchange ${exchange.id} lacks compiled state geometry.`
      );
    }
    const produced = targetPlacements.get(exchange.producedBlockId);
    if (produced === undefined) {
      throw new Error(
        `Base-ten exchange ${exchange.id} lacks its produced placement.`
      );
    }
    const consumedIds = new Set(exchange.consumedBlockIds);
    const visibleBlockIds: string[] = [];
    const persistentProgress = smoothstep(transition.progress);
    const approachProgress = smoothstep(clampUnit(
      (transition.progress - 0.12) / 0.48
    ));
    for (const block of input.projection.blocks) {
      const sourcePlacement = sourcePlacements.get(block.id);
      const targetPlacement = targetPlacements.get(block.id);
      let placement: KpPlaceValueBaseTenPlacement | undefined;
      let visible = false;
      if (consumedIds.has(block.id)) {
        const index = exchange.consumedBlockIds.indexOf(block.id);
        if (sourcePlacement === undefined || index < 0) {
          throw new Error(
            `Base-ten exchange ${exchange.id} lacks consumed geometry ${block.id}.`
          );
        }
        const slice = Object.freeze({
          blockId: block.id,
          x:
            produced.x +
            produced.width * index / exchange.consumedBlockIds.length,
          y: produced.y,
          width: produced.width / exchange.consumedBlockIds.length,
          height: produced.height
        });
        placement = interpolatePlacement(
          sourcePlacement,
          slice,
          approachProgress
        );
        visible = !transition.transferOccurred;
      } else if (block.id === exchange.producedBlockId) {
        placement = produced;
        visible = transition.transferOccurred;
      } else if (
        sourcePlacement !== undefined &&
        targetPlacement !== undefined
      ) {
        placement = interpolatePlacement(
          sourcePlacement,
          targetPlacement,
          persistentProgress
        );
        visible = true;
      } else {
        placement = sourcePlacement ?? targetPlacement;
        visible = placement !== undefined &&
          (
            sourcePlacement !== undefined
              ? !transition.transferOccurred
              : transition.transferOccurred
          );
      }
      const home = homePlacements.get(block.id)!;
      setPlacement(block.id, placement ?? home);
      setVisibility(block.id, visible);
      if (visible) visibleBlockIds.push(block.id);
    }
    currentStateId =
      transition.progress === 1 ? stateIds.target : stateIds.source;
    root.dataset["kpPlaceValueStateId"] = currentStateId;
    root.dataset["kpBaseTenExchangeId"] = exchange.id;
    root.dataset["kpBaseTenExchangeProgress"] =
      String(transition.progress);
    root.dataset["kpBaseTenExchangeTransferOccurred"] =
      String(transition.transferOccurred);
    return Object.freeze({
      exchangeId: exchange.id,
      progress: transition.progress,
      transferOccurred: transition.transferOccurred,
      sourceStateId: stateIds.source,
      targetStateId: stateIds.target,
      visibleBlockIds: Object.freeze(visibleBlockIds)
    });
  };
  setState(initialStateId);

  return Object.freeze({
    root,
    blockElements,
    stateId: () => currentStateId!,
    setState,
    applyExchange
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

function exchangeStateIds(
  exchangeId: KpPlaceValueBaseTenExchange["id"]
): {
  readonly source: KpPlaceValueAdditionState["id"];
  readonly target: KpPlaceValueAdditionState["id"];
} {
  return exchangeId === "exchange.ones-to-tens"
    ? {
        source: "state.place-value.ones-evaluated",
        target: "state.place-value.ones-exchanged"
      }
    : {
        source: "state.place-value.tens-evaluated",
        target: "state.place-value.tens-exchanged"
      };
}

function interpolatePlacement(
  source: KpPlaceValueBaseTenPlacement,
  target: KpPlaceValueBaseTenPlacement,
  progress: number
): KpPlaceValueBaseTenPlacement {
  return Object.freeze({
    blockId: source.blockId,
    x: interpolate(source.x, target.x, progress),
    y: interpolate(source.y, target.y, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  });
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const bounded = clampUnit(value);
  return bounded * bounded * (3 - 2 * bounded);
}

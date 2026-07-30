import {
  createKpPlaceValueBaseTenDomProjection
} from "./place-value-addition-base-ten-dom.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";
import {
  isKpPlaceValueAdditionRuntimeFrame,
  isKpPlaceValueAdditionRuntimeSession,
  type KpPlaceValueAdditionRuntimeFrame,
  type KpPlaceValueAdditionRuntimeSession
} from "./place-value-addition-runtime.ts";

export interface KpPlaceValueAdditionSharedDom {
  readonly root: HTMLElement;
  readonly writtenRoot: HTMLElement;
  readonly baseTenRoot: SVGSVGElement;
  readonly apply: (frame: KpPlaceValueAdditionRuntimeFrame) => void;
}

export function createKpPlaceValueAdditionSharedDom(input: {
  readonly document: Document;
  readonly session: KpPlaceValueAdditionRuntimeSession;
  readonly initialFrame: KpPlaceValueAdditionRuntimeFrame;
}): KpPlaceValueAdditionSharedDom {
  if (
    !isKpPlaceValueAdditionRuntimeSession(input.session) ||
    !isKpPlaceValueAdditionRuntimeFrame(input.initialFrame) ||
    input.initialFrame.sessionId !== input.session.id
  ) {
    throw new Error(
      "Shared place-value DOM requires one sealed runtime session and frame."
    );
  }
  const root = input.document.createElement("section");
  root.dataset["kpPlaceValueSharedSession"] = input.session.rendererSessionId;
  root.style.cssText =
    "display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);" +
    "gap:24px;align-items:center;justify-items:center;width:100%";
  const written = createKpPlaceValueWrittenColumnDomProjection({
    document: input.document,
    projection: input.session.written,
    endpoint: "initial"
  });
  const baseTen = createKpPlaceValueBaseTenDomProjection({
    document: input.document,
    projection: input.session.baseTen,
    initialStateId: input.initialFrame.baseTen.stable.stateId
  });
  written.root.dataset["kpPlaceValueView"] = "written";
  baseTen.root.dataset["kpPlaceValueView"] = "base-ten";
  root.append(written.root, baseTen.root);

  const apply = (frame: KpPlaceValueAdditionRuntimeFrame): void => {
    if (
      !isKpPlaceValueAdditionRuntimeFrame(frame) ||
      frame.sessionId !== input.session.id ||
      frame.rendererSessionId !== input.session.rendererSessionId
    ) {
      throw new Error("Shared place-value DOM rejected a foreign frame.");
    }
    written.setEndpoint(
      frame.stableState.stage === "settled" ? "settled" : "initial"
    );
    baseTen.setState(frame.baseTen.stable.stateId);
    const visible = new Set(frame.responsive.visibleViews);
    written.root.style.display =
      visible.has("written") ? "grid" : "none";
    baseTen.root.style.display =
      visible.has("base-ten") ? "block" : "none";
    root.style.gridTemplateColumns =
      frame.responsive.mode === "wide-both"
        ? "minmax(0,1fr) minmax(0,1fr)"
        : "minmax(0,1fr)";
    root.dataset["kpPlaceValueClockSequence"] = String(frame.clock.sequence);
    root.dataset["kpPlaceValueClockDirection"] = frame.clock.direction;
    root.dataset["kpPlaceValueProgressPermille"] =
      String(frame.clock.progressPermille);
    root.dataset["kpPlaceValueBeatId"] = frame.beat.id;
  };
  apply(input.initialFrame);
  return Object.freeze({
    root,
    writtenRoot: written.root,
    baseTenRoot: baseTen.root,
    apply
  });
}

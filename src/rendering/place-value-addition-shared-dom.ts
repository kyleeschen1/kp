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
import {
  createKpPlaceValueOnesEvaluationDom
} from "./place-value-addition-ones-evaluation.ts";
import {
  createKpPlaceValueOnesExchangeDom
} from "./place-value-addition-ones-exchange.ts";

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
  const writtenHost = input.document.createElement("div");
  writtenHost.dataset["kpPlaceValueView"] = "written";
  writtenHost.style.cssText =
    "display:grid;position:relative;width:100%;place-items:center";
  const onesEvaluation = createKpPlaceValueOnesEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.onesEvaluation
  });
  onesEvaluation.root.style.display = "none";
  const onesExchange = createKpPlaceValueOnesExchangeDom({
    document: input.document,
    projection: input.session.written,
    exchange: input.session.onesExchange
  });
  onesExchange.root.style.display = "none";
  writtenHost.append(written.root, onesEvaluation.root, onesExchange.root);
  baseTen.root.dataset["kpPlaceValueView"] = "base-ten";
  root.append(writtenHost, baseTen.root);

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
    const visible = new Set(frame.responsive.visibleViews);
    const writtenVisible = visible.has("written");
    const baseTenVisible = visible.has("base-ten");
    const evaluatingOnes =
      frame.beat.id === "beat.place-value.evaluate-ones";
    const exchangingOnes =
      frame.beat.id === "beat.place-value.exchange-ones";
    // Until the tens choreography is installed in s17, retain the exact ones
    // endpoint natively instead of flashing back to the empty result row.
    const retainingOnesEndpoint =
      frame.beat.id === "beat.place-value.evaluate-tens";
    const onesActive =
      evaluatingOnes || exchangingOnes || retainingOnesEndpoint;
    writtenHost.style.display = writtenVisible ? "grid" : "none";
    written.root.style.display =
      writtenVisible && !onesActive ? "grid" : "none";
    onesEvaluation.root.style.display =
      writtenVisible && evaluatingOnes ? "grid" : "none";
    onesExchange.root.style.display =
      writtenVisible && (exchangingOnes || retainingOnesEndpoint)
        ? "grid"
        : "none";
    if (writtenVisible && evaluatingOnes) {
      onesEvaluation.apply(
        frame.beatProgress,
        frame.clock.direction
      );
    }
    const exchangeFrame =
      writtenVisible && (exchangingOnes || retainingOnesEndpoint)
        ? onesExchange.apply(
            exchangingOnes ? frame.beatProgress : 1,
            frame.clock.direction
          )
        : undefined;
    if (baseTenVisible) {
      if (exchangingOnes) {
        baseTen.applyExchange({
          exchangeId: "exchange.ones-to-tens",
          progress: frame.beatProgress,
          // Hidden views do no paint measurement. Both projections use the
          // canonical transfer boundary owned by the compiled exchange.
          transferOccurred:
            exchangeFrame?.transferOccurred ??
            frame.beatProgress >= input.session.onesExchange.transferProgress
        });
      } else {
        baseTen.setState(frame.baseTen.stable.stateId);
      }
    }
    baseTen.root.style.display =
      baseTenVisible ? "block" : "none";
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

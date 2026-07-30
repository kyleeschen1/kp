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
  createKpPlaceValueHundredsEvaluationDom,
  createKpPlaceValueOnesEvaluationDom,
  createKpPlaceValueTensEvaluationDom
} from "./place-value-addition-ones-evaluation.ts";
import {
  createKpPlaceValueOnesExchangeDom,
  createKpPlaceValueTensExchangeDom
} from "./place-value-addition-ones-exchange.ts";
import {
  createKpPlaceValueNativeSettlementDom
} from "./place-value-addition-native-settlement.ts";

export interface KpPlaceValueAdditionSharedDom {
  readonly root: HTMLElement;
  readonly writtenRoot: HTMLElement;
  readonly baseTenRoot: SVGSVGElement;
  readonly prepareNativeScenes: () => void;
  readonly apply: (frame: KpPlaceValueAdditionRuntimeFrame) => void;
  readonly dispose: () => void;
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
  const tensEvaluation = createKpPlaceValueTensEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.tensEvaluation
  });
  tensEvaluation.root.style.display = "none";
  const tensExchange = createKpPlaceValueTensExchangeDom({
    document: input.document,
    projection: input.session.written,
    exchange: input.session.tensExchange
  });
  tensExchange.root.style.display = "none";
  const hundredsEvaluation = createKpPlaceValueHundredsEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.hundredsEvaluation
  });
  hundredsEvaluation.root.style.display = "none";
  const nativeSettlement = createKpPlaceValueNativeSettlementDom({
    document: input.document,
    projection: input.session.written,
    settlement: input.session.nativeSettlement
  });
  nativeSettlement.root.style.display = "none";
  writtenHost.append(
    written.root,
    onesEvaluation.root,
    onesExchange.root,
    tensEvaluation.root,
    tensExchange.root,
    hundredsEvaluation.root,
    nativeSettlement.root
  );
  baseTen.root.dataset["kpPlaceValueView"] = "base-ten";
  root.append(writtenHost, baseTen.root);
  let disposed = false;
  let nativeScenesPrepared = false;

  const prepareNativeScenes = (): void => {
    if (disposed) {
      throw new Error("Shared place-value DOM is disposed.");
    }
    if (nativeScenesPrepared) return;
    if (!root.isConnected) {
      throw new Error(
        "Shared place-value native scenes require a connected surface."
      );
    }
    for (const scene of [
      onesEvaluation,
      onesExchange,
      tensEvaluation,
      tensExchange,
      hundredsEvaluation
    ]) {
      const previous = {
        display: scene.root.style.display,
        visibility: scene.root.style.visibility,
        position: scene.root.style.position,
        inset: scene.root.style.inset,
        pointerEvents: scene.root.style.pointerEvents
      };
      try {
        // Direct seeks may activate a beat that has never painted. Measure its
        // connected native geometry at lazy mount so first-frame scheduling
        // never observes a just-unhidden, browser-dependent layout.
        scene.root.style.display = "grid";
        // This synchronous preflight finishes before the browser can paint;
        // `visibility:hidden` cannot be used because paint geometry correctly
        // excludes hidden native atoms.
        scene.root.style.visibility = "visible";
        scene.root.style.position = "absolute";
        scene.root.style.inset = "0";
        scene.root.style.pointerEvents = "none";
        void scene.root.offsetWidth;
        scene.prepare();
      } finally {
        scene.root.style.display = previous.display;
        scene.root.style.visibility = previous.visibility;
        scene.root.style.position = previous.position;
        scene.root.style.inset = previous.inset;
        scene.root.style.pointerEvents = previous.pointerEvents;
      }
    }
    nativeScenesPrepared = true;
  };

  const apply = (frame: KpPlaceValueAdditionRuntimeFrame): void => {
    if (disposed) {
      throw new Error("Shared place-value DOM is disposed.");
    }
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
    const evaluatingTens =
      frame.beat.id === "beat.place-value.evaluate-tens";
    const exchangingTens =
      frame.beat.id === "beat.place-value.exchange-tens";
    const evaluatingHundreds =
      frame.beat.id === "beat.place-value.evaluate-hundreds";
    const settling =
      frame.beat.id === "beat.place-value.settle";
    const motionActive =
      evaluatingOnes ||
      exchangingOnes ||
      evaluatingTens ||
      exchangingTens ||
      evaluatingHundreds ||
      settling;
    writtenHost.style.display = writtenVisible ? "grid" : "none";
    written.root.style.display =
      writtenVisible && !motionActive ? "grid" : "none";
    onesEvaluation.root.style.display =
      writtenVisible && evaluatingOnes ? "grid" : "none";
    onesExchange.root.style.display =
      writtenVisible && exchangingOnes ? "grid" : "none";
    tensEvaluation.root.style.display =
      writtenVisible && evaluatingTens ? "grid" : "none";
    tensExchange.root.style.display =
      writtenVisible && exchangingTens ? "grid" : "none";
    hundredsEvaluation.root.style.display =
      writtenVisible && evaluatingHundreds ? "grid" : "none";
    nativeSettlement.root.style.display =
      writtenVisible && settling ? "grid" : "none";
    if (writtenVisible && evaluatingOnes) {
      onesEvaluation.apply(
        frame.beatProgress,
        frame.clock.direction
      );
    }
    const exchangeFrame =
      writtenVisible && exchangingOnes
        ? onesExchange.apply(frame.beatProgress, frame.clock.direction)
        : undefined;
    if (writtenVisible && evaluatingTens) {
      tensEvaluation.apply(frame.beatProgress, frame.clock.direction);
    }
    const tensExchangeFrame =
      writtenVisible && exchangingTens
        ? tensExchange.apply(frame.beatProgress, frame.clock.direction)
        : undefined;
    if (writtenVisible && evaluatingHundreds) {
      hundredsEvaluation.apply(
        frame.beatProgress,
        frame.clock.direction
      );
    }
    if (writtenVisible && settling) {
      nativeSettlement.apply(
        frame.beatProgress,
        frame.clock.direction
      );
    }
    if (baseTenVisible) {
      if (exchangingOnes) {
        baseTen.applyExchange({
          exchangeId: input.session.onesExchange.baseTenExchangeId,
          progress: frame.beatProgress,
          // Hidden views do no paint measurement. Both projections use the
          // canonical transfer boundary owned by the compiled exchange.
          transferOccurred:
            exchangeFrame?.transferOccurred ??
            frame.beatProgress >= input.session.onesExchange.transferProgress
        });
      } else if (exchangingTens) {
        baseTen.applyExchange({
          exchangeId: input.session.tensExchange.baseTenExchangeId,
          progress: frame.beatProgress,
          transferOccurred:
            tensExchangeFrame?.transferOccurred ??
            frame.beatProgress >= input.session.tensExchange.transferProgress
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
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    // These native-scene projections may own paint observers even though the
    // written and base-ten endpoint DOM is otherwise stateless.
    onesEvaluation.dispose();
    onesExchange.dispose();
    tensEvaluation.dispose();
    tensExchange.dispose();
    hundredsEvaluation.dispose();
    nativeSettlement.dispose();
    root.remove();
  };
  return Object.freeze({
    root,
    writtenRoot: written.root,
    baseTenRoot: baseTen.root,
    prepareNativeScenes,
    apply,
    dispose
  });
}

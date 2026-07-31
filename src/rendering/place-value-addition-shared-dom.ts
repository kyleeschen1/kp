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
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpPlaceValueOnesWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";
import {
  isKpPlaceValuePersistentWorkspaceConformance
} from "../animation/place-value-addition-persistent-workspace.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";

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
    input.initialFrame.sessionId !== input.session.id ||
    !isKpPlaceValuePersistentWorkspaceConformance(
      input.session.persistentWorkspace
    )
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
  writtenHost.dataset["kpPlaceValueWrittenComposite"] =
    "persistent-scaffold-with-motion-overlay";
  writtenHost.style.cssText =
    "display:grid;position:relative;width:100%;place-items:center";
  const onesEvaluation = createKpPlaceValueOnesEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.onesEvaluation
  });
  configurePersistentWrittenOverlay(onesEvaluation.root);
  const onesExchange = createKpPlaceValueOnesExchangeDom({
    document: input.document,
    projection: input.session.written,
    exchange: input.session.onesExchange
  });
  configurePersistentWrittenOverlay(onesExchange.root);
  const tensEvaluation = createKpPlaceValueTensEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.tensEvaluation
  });
  configurePersistentWrittenOverlay(tensEvaluation.root);
  const tensExchange = createKpPlaceValueTensExchangeDom({
    document: input.document,
    projection: input.session.written,
    exchange: input.session.tensExchange
  });
  configurePersistentWrittenOverlay(tensExchange.root);
  const hundredsEvaluation = createKpPlaceValueHundredsEvaluationDom({
    document: input.document,
    projection: input.session.written,
    evaluation: input.session.hundredsEvaluation
  });
  configurePersistentWrittenOverlay(hundredsEvaluation.root);
  const nativeSettlement = createKpPlaceValueNativeSettlementDom({
    document: input.document,
    projection: input.session.written,
    settlement: input.session.nativeSettlement
  });
  configurePersistentWrittenOverlay(nativeSettlement.root);
  writtenHost.append(
    written.root,
    onesEvaluation.root,
    onesExchange.root,
    tensEvaluation.root,
    tensExchange.root,
    hundredsEvaluation.root,
    nativeSettlement.root
  );
  written.root.dataset["kpPlaceValueWrittenOwnership"] =
    "persistent-documentary";
  written.root.dataset["kpPersistentWorkspaceConformance"] =
    input.session.persistentWorkspace.traceId;
  markPersistentWrittenRoles(written);
  baseTen.root.dataset["kpPlaceValueView"] = "base-ten";
  root.append(writtenHost, baseTen.root);
  let disposed = false;
  let nativeScenesPrepared = false;
  const onesEvaluationBeat = requireReferenceBeat(
    input.session.persistentWorkspace.plan.onesOperation.evaluationBeatId
  );
  const onesExchangeBeat = requireReferenceBeat(
    input.session.persistentWorkspace.plan.onesOperation.exchangeBeatId
  );

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
    writtenHost.style.display = writtenVisible ? "grid" : "none";
    written.root.style.display =
      writtenVisible ? "grid" : "none";
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
    if (writtenVisible) {
      applyPersistentOnesDocumentaryState({
        written,
        evaluationProgress: normalizedPermilleProgress(
          frame.clock.progressPermille,
          onesEvaluationBeat.startPermille,
          onesEvaluationBeat.endPermille
        ),
        outputOwnership:
          frame.clock.progressPermille >= onesExchangeBeat.endPermille
            ? "native-endpoint"
            : "transit"
      });
    }
    if (writtenVisible && evaluatingOnes) {
      onesEvaluation.apply(
        frame.beatProgress,
        frame.clock.direction
      );
      applyPersistentContributionClearance({
        stage: writtenHost,
        written,
        overlay: onesEvaluation.root,
        ownership: input.session.onesEvaluation.writtenOwnership
      });
      certifyPersistentContributionContacts({
        written,
        overlay: onesEvaluation.root
      });
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
            exchangeFrame?.semanticTransferOccurred ??
            frame.beatProgress >= input.session.onesExchange.transferProgress
        });
      } else if (exchangingTens) {
        baseTen.applyExchange({
          exchangeId: input.session.tensExchange.baseTenExchangeId,
          progress: frame.beatProgress,
          transferOccurred:
            tensExchangeFrame?.semanticTransferOccurred ??
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

function configurePersistentWrittenOverlay(root: HTMLElement): void {
  root.style.cssText +=
    ";display:none;position:absolute;inset:0;pointer-events:none";
  root.dataset["kpPlaceValueWrittenOverlay"] = "motion-proxies-only";
}

function markPersistentWrittenRoles(
  written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >
): void {
  for (const id of ["digit.first.ones", "digit.second.ones"] as const) {
    const element = written.cellElements.get(id)!;
    element.dataset["kpPlaceValueWrittenRole"] =
      "persistent-written-cell";
    element.dataset["kpEquationPaintOwnerId"] =
      `persistent-written:${id}`;
  }
  const plus = written.cellElements.get("operator.add")!;
  plus.dataset["kpPlaceValueWrittenRole"] = "stationary-operator";
  const underline = written.root.querySelector<HTMLElement>(
    "[data-kp-place-value-underline]"
  );
  if (underline === null) {
    throw new Error("Persistent written scaffold lacks its underline.");
  }
  underline.dataset["kpPlaceValueWrittenRole"] = "stationary-operator";
  for (const id of ["result.ones", "carry.tens"] as const) {
    written.cellElements.get(id)!
      .dataset["kpPlaceValueWrittenRole"] = "persistent-written-cell";
  }
}

function applyPersistentContributionClearance(input: {
  readonly stage: HTMLElement;
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly overlay: HTMLElement;
  readonly ownership: KpPlaceValueOnesWrittenOwnershipPlan;
}): void {
  for (const proxy of input.ownership.contributionProxies) {
    const blockerId = input.ownership.contributionProxies.find(
      ({ sourceCellId }) => sourceCellId !== proxy.sourceCellId
    )!.sourceCellId;
    const blocker = input.written.cellElements.get(blockerId)!;
    const blockerPaint = measureKpNativeKatexSubtreePaintRect(
      input.stage,
      blocker
    );
    if (blockerPaint === undefined) continue;
    for (const owner of input.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      if (
        owner.dataset["kpEquationMaterialSemanticEntityId"] !==
          proxy.bindingAnnotationId ||
        getComputedStyle(owner).opacity === "0"
      ) {
        continue;
      }
      owner.style.translate = "none";
      const visual = owner.firstElementChild;
      const movingPaint = visual instanceof HTMLElement
        ? measureKpNativeKatexSubtreePaintRect(input.stage, visual)
        : undefined;
      if (movingPaint === undefined) continue;
      const overlapWidth = Math.min(
        movingPaint.left + movingPaint.width,
        blockerPaint.left + blockerPaint.width
      ) - Math.max(movingPaint.left, blockerPaint.left);
      const overlapHeight = Math.min(
        movingPaint.top + movingPaint.height,
        blockerPaint.top + blockerPaint.height
      ) - Math.max(movingPaint.top, blockerPaint.top);
      if (overlapWidth <= 0.75 || overlapHeight <= 0.75) continue;
      const direction =
        proxy.documentaryClearanceSide === "above" ? -1 : 1;
      owner.style.translate = `0 ${direction * (overlapHeight + 1)}px`;
      owner.dataset["kpPlaceValueDocumentaryClearance"] =
        proxy.documentaryClearanceSide;
    }
  }
}

function certifyPersistentContributionContacts(input: {
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly overlay: HTMLElement;
}): void {
  const bindings = [
    ["annotation.ones.material.0", "digit.first.ones"],
    ["annotation.ones.material.1", "digit.second.ones"]
  ] as const;
  for (const [annotationId, persistentId] of bindings) {
    const persistent = input.written.cellElements.get(persistentId)!;
    const persistentOwnerId =
      persistent.dataset["kpEquationPaintOwnerId"]!;
    const rect = persistent.getBoundingClientRect();
    for (const owner of input.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      if (
        owner.dataset["kpEquationMaterialSemanticEntityId"] !== annotationId
      ) {
        continue;
      }
      const materialOwnerId = owner.dataset["kpEquationMaterialOwnerId"]!;
      const contact = Object.freeze({
        id: `contact.place-value.ones.peel.${persistentId}`,
        ownerIds:
          Object.freeze([persistentOwnerId, materialOwnerId] as const),
        reason: "semantic-reconciliation" as const,
        phase: "transit" as const,
        maximumOverlapWidthPx: rect.width,
        maximumOverlapHeightPx: rect.height
      }) satisfies KpEquationVisiblePaintCertifiedContact;
      setCertifiedContact(persistent, contact);
      setCertifiedContact(owner, contact);
    }
  }
}

function setCertifiedContact(
  element: HTMLElement,
  contact: KpEquationVisiblePaintCertifiedContact
): void {
  const datasetKey =
    element.dataset["kpEquationMaterialOwnerId"] === undefined
      ? "kpEquationSemanticContacts"
      : "kpEquationMaterialSemanticContacts";
  const existing = decodeCertifiedContacts(
    element.dataset[datasetKey]
  );
  element.dataset[datasetKey] = JSON.stringify([
    ...existing.filter(({ id }) => id !== contact.id),
    contact
  ]);
}

function decodeCertifiedContacts(
  encoded: string | undefined
): readonly KpEquationVisiblePaintCertifiedContact[] {
  if (encoded === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(encoded);
    return Array.isArray(parsed)
      ? parsed as readonly KpEquationVisiblePaintCertifiedContact[]
      : [];
  } catch {
    return [];
  }
}

function applyPersistentOnesDocumentaryState(input: {
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly evaluationProgress: number;
  readonly outputOwnership: "transit" | "native-endpoint";
}): void {
  const progress = Math.max(0, Math.min(1, input.evaluationProgress));
  const dimProgress = smoothStep(Math.min(1, progress / 0.2));
  const documentaryOpacity = 1 - 0.62 * dimProgress;
  for (const id of ["digit.first.ones", "digit.second.ones"] as const) {
    const element = input.written.cellElements.get(id)!;
    element.style.opacity = String(documentaryOpacity);
    element.style.transform = "none";
    element.dataset["kpVisibility"] = "visible";
    element.dataset["kpPlaceValueConsumed"] =
      progress > 0 ? "true" : "false";
  }
  const plus = input.written.cellElements.get("operator.add")!;
  plus.style.opacity = "1";
  plus.style.transform = "none";
  plus.dataset["kpVisibility"] = "visible";
  const underline = input.written.root.querySelector<HTMLElement>(
    "[data-kp-place-value-underline]"
  )!;
  underline.style.opacity = "1";
  underline.style.transform = "none";
  underline.style.visibility = "visible";
  for (const id of ["result.ones", "carry.tens"] as const) {
    const output = input.written.cellElements.get(id)!;
    output.style.opacity = "1";
    output.style.transform = "none";
    output.dataset["kpVisibility"] =
      input.outputOwnership === "native-endpoint" ? "visible" : "hidden";
    output.dataset["kpNativeEndpointOwnership"] =
      input.outputOwnership;
  }
}

function requireReferenceBeat(
  beatId: string
): (typeof reference.beats)[number] {
  const beat = reference.beats.find(({ id }) => id === beatId);
  if (beat === undefined) {
    throw new Error(`Persistent workspace lacks reference beat ${beatId}.`);
  }
  return beat;
}

function normalizedPermilleProgress(
  value: number,
  start: number,
  end: number
): number {
  return Math.max(0, Math.min(1, (value - start) / (end - start)));
}

function smoothStep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

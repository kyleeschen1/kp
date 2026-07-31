import {
  isKpPlaceValuePersistentWorkspaceConformance,
  type KpPlaceValuePersistentPositionOperation
} from "../animation/place-value-addition-persistent-workspace.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  createKpPlaceValueBaseTenDomProjection
} from "./place-value-addition-base-ten-dom.ts";
import type {
  KpPlaceValueBaseTenExchange
} from "./place-value-addition-base-ten-projection.ts";
import {
  createKpPlaceValueColumnEvaluationDom
} from "./place-value-addition-column-evaluation.ts";
import {
  applyKpPlaceValueContributorFusionArcs,
  compileKpPlaceValueContributorFusionMotif,
  kpPlaceValueContributorFusionMotifKind,
  kpPlaceValueStandardEvaluationMotif,
  type KpPlaceValueEvaluationVisualMotif
} from "./place-value-addition-contributor-fusion-motif.ts";
import {
  createKpPlaceValueColumnExchangeDom,
  type KpPlaceValueColumnExchangeFrame
} from "./place-value-addition-column-exchange.ts";
import {
  isKpPlaceValueAdditionRuntimeFrame,
  isKpPlaceValueAdditionRuntimeSession,
  type KpPlaceValueAdditionRuntimeFrame,
  type KpPlaceValueAdditionRuntimeSession
} from "./place-value-addition-runtime.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpPlaceValueWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";

export interface KpPlaceValueAdditionSharedDom {
  readonly root: HTMLElement;
  readonly writtenRoot: HTMLElement;
  readonly baseTenRoot: SVGSVGElement;
  readonly prepareNativeScenes: () => void;
  readonly prepareNativeScenesWhenReady: () => Promise<void>;
  readonly apply: (frame: KpPlaceValueAdditionRuntimeFrame) => void;
  readonly dispose: () => void;
}

export const kpPlaceValueContributorFusionReviewedCallerCount = 2;

/**
 * Visual promotion is explicit and exhaustive: every evaluation receives one
 * typed motif, while only the approved exemplar and its structurally distinct
 * second caller receive fusion. The remaining position stays an unchanged
 * rollback comparator until the second human checkpoint passes.
 */
export function compileKpPlaceValueEvaluationVisualMotifs(
  evaluations: KpPlaceValueAdditionRuntimeSession["columnEvaluations"]
): readonly KpPlaceValueEvaluationVisualMotif[] {
  if (
    evaluations.length < kpPlaceValueContributorFusionReviewedCallerCount
  ) {
    throw new Error("Contributor-fusion promotion requires two callers.");
  }
  return Object.freeze(evaluations.map((evaluation, index) =>
    index < kpPlaceValueContributorFusionReviewedCallerCount
      ? compileKpPlaceValueContributorFusionMotif(
          evaluation.writtenOwnership
        )
      : kpPlaceValueStandardEvaluationMotif
  ));
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
  root.dataset["kpPlaceValueSharedSession"] =
    input.session.rendererSessionId;
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
  const evaluationVisualMotifs = compileKpPlaceValueEvaluationVisualMotifs(
    input.session.columnEvaluations
  );
  const evaluationScenes = input.session.columnEvaluations.map(
    (evaluation, index) => createKpPlaceValueColumnEvaluationDom({
      document: input.document,
      projection: input.session.written,
      evaluation,
      visualMotif: evaluationVisualMotifs[index]!
    })
  );
  const exchangeScenes = input.session.columnExchanges.map(
    (exchange) => createKpPlaceValueColumnExchangeDom({
      document: input.document,
      projection: input.session.written,
      exchange
    })
  );
  const motionScenes = [...evaluationScenes, ...exchangeScenes];
  for (const scene of motionScenes) {
    configurePersistentWrittenOverlay(scene.root);
  }
  writtenHost.append(
    written.root,
    ...evaluationScenes.map(({ root: sceneRoot }) => sceneRoot),
    ...exchangeScenes.map(({ root: sceneRoot }) => sceneRoot)
  );
  written.root.dataset["kpPlaceValueWrittenOwnership"] =
    "persistent-documentary";
  written.root.dataset["kpPersistentWorkspaceConformance"] =
    input.session.persistentWorkspace.traceId;
  markPersistentWrittenRoles({
    written,
    operations: input.session.persistentWorkspace.plan.operations
  });
  baseTen.root.dataset["kpPlaceValueView"] = "base-ten";
  root.append(writtenHost, baseTen.root);

  const evaluationByBeat = new Map(input.session.columnEvaluations.map(
    (evaluation, index) => [
      evaluation.beatId,
      {
        evaluation,
        scene: evaluationScenes[index]!,
        visualMotif: evaluationVisualMotifs[index]!
      }
    ] as const
  ));
  const exchangeByBeat = new Map(input.session.columnExchanges.map(
    (exchange, index) => [
      exchange.beatId,
      { exchange, scene: exchangeScenes[index]! }
    ] as const
  ));
  let disposed = false;
  let nativeSceneLayoutsWarmed = false;
  let nativeScenePreparation: Promise<void> | undefined;

  const prepareNativeScenes = (): void => {
    if (disposed) throw new Error("Shared place-value DOM is disposed.");
    if (nativeSceneLayoutsWarmed) return;
    if (!root.isConnected) {
      throw new Error(
        "Shared place-value native scenes require a connected surface."
      );
    }
    for (const scene of motionScenes) {
      const previous = {
        display: scene.root.style.display,
        visibility: scene.root.style.visibility,
        position: scene.root.style.position,
        inset: scene.root.style.inset,
        pointerEvents: scene.root.style.pointerEvents
      };
      try {
        // Direct seeks can activate an unpainted position. This synchronous
        // preflight measures every position through the same connected path.
        scene.root.style.display = "grid";
        scene.root.style.visibility = "visible";
        scene.root.style.position = "absolute";
        scene.root.style.inset = "0";
        scene.root.style.pointerEvents = "none";
        // Hidden preflight may warm layout, but it must not mint persistent
        // compositor geometry. On a cold Chromium mount the containing grid
        // can move after this probe; the first visible apply below is the
        // earliest point at which endpoint coordinates are authoritative.
        void scene.root.offsetWidth;
      } finally {
        scene.root.style.display = previous.display;
        scene.root.style.visibility = previous.visibility;
        scene.root.style.position = previous.position;
        scene.root.style.inset = previous.inset;
        scene.root.style.pointerEvents = previous.pointerEvents;
      }
    }
    nativeSceneLayoutsWarmed = true;
  };

  const prepareNativeScenesWhenReady = (): Promise<void> => {
    if (nativeScenePreparation !== undefined) {
      return nativeScenePreparation;
    }
    const view = input.document.defaultView;
    if (view === null) {
      return Promise.reject(
        new Error("Shared place-value native scenes require a live window.")
      );
    }
    nativeScenePreparation = (async () => {
      await input.document.fonts.ready;
      await nextLayoutFrame(view);
      await nextLayoutFrame(view);
      for (const scene of motionScenes) {
        if (disposed) return;
        await nextTask(view);
        if (disposed) return;
        withVisibleNativeScene(scene.root, () => {
          // Preparing only after fonts and two connected layout frames keeps
          // cold compositor construction out of scroll callbacks without
          // reviving the stale hidden-preflight geometry fixed in slice 16.
          scene.prepare();
        });
      }
    })();
    return nativeScenePreparation;
  };

  const apply = (frame: KpPlaceValueAdditionRuntimeFrame): void => {
    if (disposed) throw new Error("Shared place-value DOM is disposed.");
    if (
      !isKpPlaceValueAdditionRuntimeFrame(frame) ||
      frame.sessionId !== input.session.id ||
      frame.rendererSessionId !== input.session.rendererSessionId
    ) {
      throw new Error("Shared place-value DOM rejected a foreign frame.");
    }
    // The scaffold owns all documentary and settled paint throughout. Motion
    // overlays never acquire authority to replace the entire written scene.
    written.setEndpoint("initial");
    const visible = new Set(frame.responsive.visibleViews);
    const writtenVisible = visible.has("written");
    const baseTenVisible = visible.has("base-ten");
    const activeEvaluation = evaluationByBeat.get(frame.beat.id);
    const activeExchange = exchangeByBeat.get(frame.beat.id);
    writtenHost.style.display = writtenVisible ? "grid" : "none";
    written.root.style.display = writtenVisible ? "grid" : "none";
    for (const { evaluation, scene } of evaluationByBeat.values()) {
      scene.root.style.display =
        writtenVisible && evaluation === activeEvaluation?.evaluation
          ? "grid"
          : "none";
    }
    for (const { exchange, scene } of exchangeByBeat.values()) {
      scene.root.style.display =
        writtenVisible && exchange === activeExchange?.exchange
          ? "grid"
          : "none";
    }
    if (writtenVisible) {
      applyPersistentDocumentaryState({
        written,
        operations: input.session.persistentWorkspace.plan.operations,
        progressPermille: frame.clock.progressPermille
      });
    }
    if (writtenVisible && activeEvaluation !== undefined) {
      void activeEvaluation.scene.root.offsetWidth;
      activeEvaluation.scene.prepare();
      activeEvaluation.scene.apply(
        frame.beatProgress,
        frame.clock.direction
      );
      applyPersistentContributionClearance({
        stage: writtenHost,
        written,
        overlay: activeEvaluation.scene.root,
        ownership: activeEvaluation.evaluation.writtenOwnership,
        visualMotif: activeEvaluation.visualMotif
      });
      certifyPersistentContributionContacts({
        written,
        overlay: activeEvaluation.scene.root,
        ownership: activeEvaluation.evaluation.writtenOwnership
      });
    }
    let exchangeFrame: KpPlaceValueColumnExchangeFrame | undefined;
    if (writtenVisible && activeExchange !== undefined) {
      void activeExchange.scene.root.offsetWidth;
      activeExchange.scene.prepare();
      exchangeFrame = activeExchange.scene.apply(
        frame.beatProgress,
        frame.clock.direction
      );
    }
    if (baseTenVisible) {
      if (activeExchange === undefined) {
        baseTen.setState(frame.baseTen.stable.stateId);
      } else {
        baseTen.applyExchange({
          exchangeId: activeExchange.exchange.baseTenExchangeId as
            KpPlaceValueBaseTenExchange["id"],
          progress: frame.beatProgress,
          transferOccurred:
            exchangeFrame?.semanticTransferOccurred ??
            frame.beatProgress >= activeExchange.exchange.transferProgress
        });
      }
    }
    baseTen.root.style.display = baseTenVisible ? "block" : "none";
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
    for (const scene of motionScenes) scene.dispose();
    root.remove();
  };
  return Object.freeze({
    root,
    writtenRoot: written.root,
    baseTenRoot: baseTen.root,
    prepareNativeScenes,
    prepareNativeScenesWhenReady,
    apply,
    dispose
  });
}

function withVisibleNativeScene(
  root: HTMLElement,
  action: () => void
): void {
  const previous = {
    display: root.style.display,
    visibility: root.style.visibility,
    position: root.style.position,
    inset: root.style.inset,
    pointerEvents: root.style.pointerEvents
  };
  try {
    root.style.display = "grid";
    root.style.visibility = "visible";
    root.style.position = "absolute";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    void root.offsetWidth;
    action();
  } finally {
    root.style.display = previous.display;
    root.style.visibility = previous.visibility;
    root.style.position = previous.position;
    root.style.inset = previous.inset;
    root.style.pointerEvents = previous.pointerEvents;
  }
}

function nextLayoutFrame(view: Window): Promise<void> {
  return new Promise((resolve) => view.requestAnimationFrame(() => resolve()));
}

function nextTask(view: Window): Promise<void> {
  return new Promise((resolve) => view.setTimeout(resolve, 0));
}

function configurePersistentWrittenOverlay(root: HTMLElement): void {
  root.style.cssText +=
    ";display:none;position:absolute;inset:0;pointer-events:none";
  root.dataset["kpPlaceValueWrittenOverlay"] = "motion-proxies-only";
}

function markPersistentWrittenRoles(input: {
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly operations: readonly KpPlaceValuePersistentPositionOperation[];
}): void {
  const cells = new Map<
    string,
    "persistent-written-cell" | "stationary-operator"
  >(
    input.operations.flatMap(({ contributorCellIds, outputs }) => [
      ...contributorCellIds.map((id) => [id, "persistent-written-cell"] as const),
      ...outputs.map(({ destination }) => [
        destination.semanticEntityId,
        "persistent-written-cell"
      ] as const)
    ])
  );
  cells.set("operator.add", "stationary-operator");
  for (const [id, role] of cells) {
    const element = input.written.cellElements.get(id);
    if (element === undefined) {
      throw new Error(`Persistent written scaffold lacks cell ${id}.`);
    }
    element.dataset["kpPlaceValueWrittenRole"] = role;
    element.dataset["kpEquationPaintOwnerId"] = `persistent-written:${id}`;
  }
  const underline = input.written.root.querySelector<HTMLElement>(
    "[data-kp-place-value-underline]"
  );
  if (underline === null) {
    throw new Error("Persistent written scaffold lacks its underline.");
  }
  underline.dataset["kpPlaceValueWrittenRole"] = "stationary-operator";
}

function applyPersistentContributionClearance(input: {
  readonly stage: HTMLElement;
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly overlay: HTMLElement;
  readonly ownership: KpPlaceValueWrittenOwnershipPlan;
  readonly visualMotif: KpPlaceValueEvaluationVisualMotif;
}): void {
  if (
    input.visualMotif.kind === kpPlaceValueContributorFusionMotifKind &&
    applyKpPlaceValueContributorFusionArcs({
      overlay: input.overlay,
      plan: input.visualMotif.plan
    })
  ) {
    return;
  }
  for (const proxy of input.ownership.contributionProxies) {
    const blockers = input.ownership.contributionProxies
      .filter(({ sourceCellId }) => sourceCellId !== proxy.sourceCellId)
      .map(({ sourceCellId }) => input.written.cellElements.get(sourceCellId))
      .filter((element): element is HTMLElement => element !== undefined);
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
      const blockingPaint = [];
      for (const blocker of blockers) {
        const blockerPaint = measureKpNativeKatexSubtreePaintRect(
          input.stage,
          blocker
        );
        if (blockerPaint === undefined) continue;
        const overlapWidth = Math.min(
          movingPaint.left + movingPaint.width,
          blockerPaint.left + blockerPaint.width
        ) - Math.max(movingPaint.left, blockerPaint.left);
        if (overlapWidth > 0.75) blockingPaint.push(blockerPaint);
      }
      const clearance = nearestVerticalClearance({
        movingPaint,
        blockingPaint,
        preferredSide: proxy.documentaryClearanceSide
      });
      if (clearance !== 0) {
        owner.style.translate = `0 ${clearance}px`;
        owner.dataset["kpPlaceValueDocumentaryClearance"] =
          proxy.documentaryClearanceSide;
      }
    }
  }
}

function nearestVerticalClearance(input: {
  readonly movingPaint: {
    readonly top: number;
    readonly height: number;
  };
  readonly blockingPaint: readonly {
    readonly top: number;
    readonly height: number;
  }[];
  readonly preferredSide: "above" | "below";
}): number {
  const gap = 1.5;
  const movingBottom = input.movingPaint.top + input.movingPaint.height;
  const forbidden = input.blockingPaint.map((blocker) => ({
    start: blocker.top - movingBottom - gap,
    end: blocker.top + blocker.height - input.movingPaint.top + gap
  }));
  const allowed = (offset: number) => forbidden.every(({ start, end }) =>
    offset <= start || offset >= end
  );
  if (allowed(0)) return 0;
  // Interval boundaries are the smallest offsets that can clear a blocker.
  // Selecting globally across every documentary cell avoids the old pairwise
  // correction, where clearing one row could push the proxy into another.
  return forbidden.flatMap(({ start, end }) => [start, end])
    .filter(allowed)
    .sort((left, right) => {
      const distance = Math.abs(left) - Math.abs(right);
      if (Math.abs(distance) > 0.001) return distance;
      const preferredSign = input.preferredSide === "above" ? -1 : 1;
      return Math.sign(left) === preferredSign ? -1 : 1;
    })[0] ?? 0;
}

function certifyPersistentContributionContacts(input: {
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly overlay: HTMLElement;
  readonly ownership: KpPlaceValueWrittenOwnershipPlan;
}): void {
  for (const proxy of input.ownership.contributionProxies) {
    const persistent = input.written.cellElements.get(proxy.sourceCellId);
    if (persistent === undefined) continue;
    const persistentOwnerId = persistent.dataset["kpEquationPaintOwnerId"]!;
    const rect = persistent.getBoundingClientRect();
    for (const owner of input.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      if (
        owner.dataset["kpEquationMaterialSemanticEntityId"] !==
          proxy.bindingAnnotationId
      ) {
        continue;
      }
      const materialOwnerId = owner.dataset["kpEquationMaterialOwnerId"]!;
      const contact = Object.freeze({
        id:
          `contact.place-value.${input.ownership.position.id}.peel.${proxy.sourceCellId}`,
        ownerIds: Object.freeze([
          persistentOwnerId,
          materialOwnerId
        ] as const),
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
  const existing = decodeCertifiedContacts(element.dataset[datasetKey]);
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

function applyPersistentDocumentaryState(input: {
  readonly written: ReturnType<
    typeof createKpPlaceValueWrittenColumnDomProjection
  >;
  readonly operations: readonly KpPlaceValuePersistentPositionOperation[];
  readonly progressPermille: number;
}): void {
  const producerByOutput = new Map(
    input.operations.flatMap((operation) => operation.outputs.map((output) => [
      output.destination.semanticEntityId,
      operation
    ] as const))
  );
  const consumerByCell = new Map<string, KpPlaceValuePersistentPositionOperation>();
  for (const operation of input.operations) {
    for (const cellId of operation.contributorCellIds) {
      consumerByCell.set(cellId, operation);
    }
  }
  for (const [cellId, element] of input.written.cellElements) {
    const producer = producerByOutput.get(cellId);
    const consumer = consumerByCell.get(cellId);
    const producerBeat = producer === undefined
      ? undefined
      : requireReferenceBeat(producer.settlementBeatId);
    const isProduced = producerBeat === undefined ||
      input.progressPermille >= producerBeat.endPermille;
    const consumptionProgress = consumer === undefined
      ? 0
      : normalizedPermilleProgress(
          input.progressPermille,
          requireReferenceBeat(consumer.evaluationBeatId).startPermille,
          requireReferenceBeat(consumer.evaluationBeatId).endPermille
        );
    const dimProgress = smoothStep(Math.min(1, consumptionProgress / 0.2));
    const documentaryOpacity = 1 - 0.62 * dimProgress;
    element.style.opacity = String(documentaryOpacity);
    element.style.transform = "none";
    element.dataset["kpVisibility"] = isProduced ? "visible" : "hidden";
    if (consumer !== undefined) {
      element.dataset["kpPlaceValueConsumed"] =
        consumptionProgress > 0 ? "true" : "false";
    }
    if (producer !== undefined) {
      element.dataset["kpNativeEndpointOwnership"] =
        isProduced ? "native-endpoint" : "transit";
    }
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

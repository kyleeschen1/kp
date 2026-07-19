import {
  type KpSymbolicEquationIr,
  type KpSymbolicEquationLayoutIr,
  type KpSymbolicEquationTransitionIr,
  type KpSymbolicTokenLineageIr
} from "../projections/public-api.ts";

import {
  renderSymbolicEquation,
  type KpSymbolicEquationRenderOptions
} from "./symbolic-equation-dom.ts";

export { renderSymbolicEquation } from "./symbolic-equation-dom.ts";

export interface KpLinearEquationSymbolicStage {
  render(
    projection: KpSymbolicEquationIr,
    options?: KpSymbolicEquationRenderOptions
  ): Promise<void>;
  dispose(): void;
}

export function createLinearEquationSymbolicStage(
  root: HTMLElement
): KpLinearEquationSymbolicStage {
  let disposed = false;
  let renderRevision = 0;
  let layoutRevision = 0;
  const observer = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(() => {
        if (disposed) return;
        layoutRevision += 1;
        root.dataset["kpSymbolicMeasurementState"] = "invalidated";
      });
  observer?.observe(root);

  return {
    async render(projection, options = {}) {
      if (disposed) throw new Error("Symbolic motion stage is disposed.");
      const revision = ++renderRevision;
      const transition = projection.transition;
      const reducedMotion = prefersReducedMotion(root);
      if (transition === undefined || transition.phase === "source" || transition.phase === "target" || reducedMotion) {
        renderNative(root, projection, options,
          transition === undefined ? "native" : reducedMotion ? "native-reduced-motion" : transition.phase
        );
        return;
      }

      const stage = document.createElement("div");
      stage.dataset["kpSymbolicMotionStage"] = "true";
      stage.dataset["kpSymbolicMotionPhase"] = transition.phase;
      stage.dataset["kpSymbolicLayoutRevision"] = String(layoutRevision);
      const nativeLayer = layer("native");
      renderSymbolicEquation(nativeLayer, projection, options);
      const measurementLayer = layer("measurement");
      measurementLayer.setAttribute("aria-hidden", "true");
      const sourceMeasure = layer("source-measure");
      const expandedMeasure = layer("expanded-measure");
      const targetMeasure = layer("target-measure");
      renderLayout(sourceMeasure, projection, transition.sourceLayout, options);
      if (transition.expandedLayout !== undefined) {
        renderLayout(expandedMeasure, projection, transition.expandedLayout, options);
      }
      renderLayout(targetMeasure, projection, transition.targetLayout, options);
      measurementLayer.append(sourceMeasure, expandedMeasure, targetMeasure);
      const overlay = layer("overlay");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.visibility = "hidden";
      const sourceVisual = layer("source");
      const expandedVisual = layer("expanded");
      const targetVisual = layer("target");
      renderLayout(sourceVisual, projection, transition.sourceLayout, options);
      if (transition.expandedLayout !== undefined) {
        renderLayout(expandedVisual, projection, transition.expandedLayout, options);
      }
      renderLayout(targetVisual, projection, transition.targetLayout, options);
      overlay.append(sourceVisual, expandedVisual, targetVisual);
      stage.append(nativeLayer, measurementLayer, overlay);
      root.replaceChildren(stage);
      await root.ownerDocument.fonts.ready;
      if (disposed || revision !== renderRevision) return;
      const measurements = measureLineage(sourceMeasure, targetMeasure, transition.lineage);
      if (measurements === 0) {
        renderNative(root, projection, options, "native-zero-geometry");
        return;
      }
      const operationKind = transition.operationApplications[0].kind;
      if (operationKind === "subtract-both-sides" && transition.expandedLayout !== undefined) {
        sourceVisual.style.display = "none";
        choreographSubtractBothSides({
          transition,
          sourceMeasure,
          expandedMeasure,
          targetMeasure,
          expandedVisual,
          targetVisual
        });
        stage.dataset["kpSymbolicChoreography"] = "subtract-both-sides";
      } else if (operationKind === "divide-both-sides" && transition.expandedLayout !== undefined) {
        choreographDivideBothSides({
          transition,
          sourceMeasure,
          expandedMeasure,
          targetMeasure,
          sourceVisual,
          expandedVisual,
          targetVisual
        });
        stage.dataset["kpSymbolicChoreography"] = "divide-both-sides";
      } else {
        expandedVisual.style.display = "none";
        const progress = transition.progressPermille / 1000;
        sourceVisual.style.opacity = String(1 - progress);
        targetVisual.style.opacity = String(progress);
        stage.dataset["kpSymbolicChoreography"] = "measured-fallback";
      }
      overlay.style.visibility = "visible";
      stage.dataset["kpSymbolicMeasurementCount"] = String(measurements);
      stage.dataset["kpSymbolicMeasurementState"] = "ready";
      root.dataset["kpSymbolicMeasurementState"] = "ready";
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderRevision += 1;
      observer?.disconnect();
      root.replaceChildren();
      delete root.dataset["kpSymbolicMeasurementState"];
    }
  };
}

interface SubtractStageLayers {
  readonly transition: KpSymbolicEquationTransitionIr;
  readonly sourceMeasure: HTMLElement;
  readonly expandedMeasure: HTMLElement;
  readonly targetMeasure: HTMLElement;
  readonly expandedVisual: HTMLElement;
  readonly targetVisual: HTMLElement;
}

function choreographSubtractBothSides(layers: SubtractStageLayers): void {
  const { transition, sourceMeasure, expandedMeasure, targetMeasure, expandedVisual, targetVisual } = layers;
  const rawPhaseProgress = transition.phaseProgressPermille / 1000;
  const phaseProgress = transition.phase === "introduce-operation"
    ? ease(rawPhaseProgress)
    : rawPhaseProgress;
  const lineageBySourceId = new Map(transition.lineage
    .filter((item) => item.sourceTokenId !== undefined)
    .map((item) => [item.sourceTokenId!, item]));
  const lineageByTargetId = new Map(transition.lineage
    .filter((item) => item.targetTokenId !== undefined)
    .map((item) => [item.targetTokenId!, item]));
  const applications = new Map(transition.operationApplications.map((item) => [item.side, item]));
  const operationTokenIds = new Set(transition.operationApplications.flatMap((item) =>
    [item.operatorTokenId, item.operandTokenId].filter((id): id is string => id !== undefined)
  ));

  // Whole-equation fading hides causality, so continuity and retirement are owned by individual semantic tokens.
  expandedVisual.style.opacity = "1";
  targetVisual.style.opacity = "1";
  expandedVisual.dataset["kpSymbolicLayerOpacityMode"] = "token-owned";
  targetVisual.dataset["kpSymbolicLayerOpacityMode"] = "token-owned";
  for (const targetToken of tokens(targetVisual)) {
    targetToken.style.opacity = "0";
    targetToken.dataset["kpSymbolicMotionRole"] = "target-reserve";
  }

  if (transition.phase === "introduce-operation") {
    for (const visualToken of tokens(expandedVisual)) {
      const tokenId = requiredTokenId(visualToken);
      if (operationTokenIds.has(tokenId)) {
        visualToken.style.opacity = String(phaseProgress);
        visualToken.style.transform = `translateY(${(1 - phaseProgress) * -0.32}em) scale(${0.88 + phaseProgress * 0.12})`;
        visualToken.dataset["kpSymbolicMotionRole"] = "paired-operation-introduction";
        continue;
      }
      const lineage = lineageBySourceId.get(tokenId);
      moveBetweenLayouts(visualToken, tokenFor(sourceMeasure, tokenId), tokenFor(expandedMeasure, tokenId), phaseProgress);
      visualToken.dataset["kpSymbolicMotionRole"] = lineage?.continuity ?? "source-material";
    }
    return;
  }

  const transformProgress = transition.phase === "settle" ? 1 : phaseProgress;
  const revealProgress = smoothstep(0.38, 0.78, transformProgress);
  const cancelProgress = smoothstep(0.12, 0.72, transformProgress);
  const leftApplication = applications.get("left")!;
  const rightApplication = applications.get("right")!;
  const leftOperand = tokenFor(expandedMeasure, leftApplication.operandTokenId);
  const leftRetiredTerms = transition.lineage.filter((item) =>
    item.continuity === "retired" && tokenFor(expandedMeasure, item.sourceTokenId)?.dataset["kpSymbolicSide"] === "left"
  );
  const transformed = transition.lineage.filter((item) => item.continuity === "transformed");
  const leftMeetingX = meetingCenter(leftRetiredTerms
    .map((item) => tokenFor(expandedMeasure, item.sourceTokenId))
    .concat(leftOperand));

  for (const visualToken of tokens(expandedVisual)) {
    const tokenId = requiredTokenId(visualToken);
    const base = tokenFor(expandedMeasure, tokenId);
    const lineage = lineageBySourceId.get(tokenId);
    if (tokenId === leftApplication.operatorTokenId || tokenId === leftApplication.operandTokenId ||
      (lineage?.continuity === "retired" && visualToken.dataset["kpSymbolicSide"] === "left")) {
      moveToward(visualToken, base, leftMeetingX, cancelProgress);
      visualToken.style.opacity = String(1 - smoothstep(0.55, 1, cancelProgress));
      visualToken.dataset["kpSymbolicMotionRole"] = "meet-and-collapse";
      continue;
    }
    if (tokenId === rightApplication.operatorTokenId || tokenId === rightApplication.operandTokenId ||
      lineage?.continuity === "transformed") {
      const targetLineage = lineage?.continuity === "transformed" ? lineage : transformed[0];
      const target = tokenFor(targetMeasure, targetLineage?.targetTokenId);
      moveTowardTarget(visualToken, base, target, transformProgress);
      visualToken.style.opacity = String(1 - revealProgress);
      visualToken.dataset["kpSymbolicMotionRole"] = "causal-derivation-input";
      continue;
    }
    if (lineage?.continuity === "persistent") {
      moveFromLayoutToTarget(
        visualToken,
        base,
        tokenFor(targetMeasure, lineage.targetTokenId),
        transformProgress
      );
      visualToken.dataset["kpSymbolicMotionRole"] = "persistent-material";
    }
  }

  for (const targetToken of tokens(targetVisual)) {
    const lineage = lineageByTargetId.get(requiredTokenId(targetToken));
    if (lineage?.continuity !== "transformed" && lineage?.continuity !== "introduced") continue;
    targetToken.style.opacity = String(revealProgress);
    targetToken.style.transform = `scale(${0.84 + revealProgress * 0.16})`;
    targetToken.dataset["kpSymbolicMotionRole"] = "causal-derivation-result";
  }
}

interface DivideStageLayers extends SubtractStageLayers {
  readonly sourceVisual: HTMLElement;
}

function choreographDivideBothSides(layers: DivideStageLayers): void {
  const {
    transition,
    sourceMeasure,
    expandedMeasure,
    targetMeasure,
    sourceVisual,
    expandedVisual,
    targetVisual
  } = layers;
  const rawProgress = transition.phaseProgressPermille / 1000;
  const progress = transition.phase === "introduce-operation" ? ease(rawProgress) : rawProgress;
  const applications = new Map(transition.operationApplications.map((item) => [item.side, item]));
  const relationId = transition.sourceLayout.tokens.find((token) => token.side === "relation")!.id;

  for (const visualLayer of [sourceVisual, expandedVisual, targetVisual]) {
    visualLayer.style.opacity = "1";
    visualLayer.dataset["kpSymbolicLayerOpacityMode"] = "token-owned";
  }
  for (const targetToken of tokens(targetVisual)) {
    targetToken.style.opacity = "0";
    targetToken.dataset["kpSymbolicMotionRole"] = "target-reserve";
  }

  if (transition.phase === "introduce-operation") {
    for (const sourceToken of tokens(sourceVisual)) {
      const tokenId = requiredTokenId(sourceToken);
      if (tokenId === relationId) {
        sourceToken.style.opacity = "0";
        continue;
      }
      const side = sourceToken.dataset["kpSymbolicSide"] as "left" | "right";
      const fraction = tokenFor(expandedMeasure, applications.get(side)?.fractionTokenId);
      moveTowardTarget(sourceToken, tokenFor(sourceMeasure, tokenId), fraction, progress);
      sourceToken.style.opacity = String(1 - smoothstep(0.58, 1, progress));
      sourceToken.dataset["kpSymbolicMotionRole"] = "fraction-numerator-source";
    }
    for (const expandedToken of tokens(expandedVisual)) {
      const tokenId = requiredTokenId(expandedToken);
      if (tokenId === relationId) {
        moveBetweenLayouts(
          expandedToken,
          tokenFor(sourceMeasure, relationId),
          tokenFor(expandedMeasure, relationId),
          progress
        );
        expandedToken.dataset["kpSymbolicMotionRole"] = "persistent-equality";
        continue;
      }
      const reveal = smoothstep(0.3, 0.92, progress);
      expandedToken.style.opacity = String(reveal);
      expandedToken.style.transform = `scaleY(${0.82 + reveal * 0.18})`;
      expandedToken.dataset["kpSymbolicMotionRole"] = "matched-fraction-structure";
    }
    return;
  }

  sourceVisual.style.display = "none";
  const transformProgress = transition.phase === "settle" ? 1 : progress;
  const cancellationReveal = smoothstep(0.48, 0.84, transformProgress);
  const leftTarget = tokenForSide(targetMeasure, "left");
  const rightTarget = tokenForSide(targetMeasure, "right");
  const relationTarget = tokenFor(targetMeasure,
    transition.targetLayout.tokens.find((token) => token.side === "relation")?.id
  );

  for (const expandedToken of tokens(expandedVisual)) {
    const tokenId = requiredTokenId(expandedToken);
    if (tokenId === relationId) {
      moveFromLayoutToTarget(
        expandedToken,
        tokenFor(expandedMeasure, tokenId),
        relationTarget,
        transformProgress
      );
      expandedToken.dataset["kpSymbolicMotionRole"] = "persistent-equality";
      continue;
    }
    const side = expandedToken.dataset["kpSymbolicSide"] as "left" | "right";
    const target = side === "left" ? leftTarget : rightTarget;
    moveFromLayoutToTarget(
      expandedToken,
      tokenFor(expandedMeasure, tokenId),
      target,
      transformProgress
    );
    if (side === "right") {
      expandedToken.style.opacity = "1";
      expandedToken.dataset["kpSymbolicMotionRole"] = "exact-fraction-persistent";
      continue;
    }
    scaleTowardTargetWidth(
      expandedToken,
      tokenFor(expandedMeasure, tokenId),
      target,
      transformProgress
    );
    expandedToken.style.transform += ` translateX(${-0.12 * transformProgress}em)`;
    expandedToken.style.opacity = String(1 - cancellationReveal);
    expandedToken.dataset["kpSymbolicMotionRole"] = "coefficient-divisor-cancellation";
    for (const part of ["coefficient", "divisor"] as const) {
      const mark = document.createElement("span");
      mark.dataset["kpSymbolicCancellationMark"] = part;
      mark.style.opacity = String(cancellationMarkOpacity(transformProgress));
      expandedToken.append(mark);
    }
  }

  const targetLeftVisual = tokenForSide(targetVisual, "left");
  if (targetLeftVisual !== undefined) {
    targetLeftVisual.style.opacity = String(cancellationReveal);
    targetLeftVisual.style.transform = `scale(${0.86 + cancellationReveal * 0.14})`;
    targetLeftVisual.dataset["kpSymbolicMotionRole"] = "cancellation-result";
  }
}

function scaleTowardTargetWidth(
  visual: HTMLElement,
  from: HTMLElement | undefined,
  to: HTMLElement | undefined,
  progress: number
): void {
  const fromWidth = from?.getBoundingClientRect().width ?? 0;
  const toWidth = to?.getBoundingClientRect().width ?? 0;
  if (fromWidth <= 0 || toWidth <= 0) return;
  const scale = 1 + (toWidth / fromWidth - 1) * progress;
  visual.style.transform += ` scale(${scale})`;
}

function tokenForSide(root: HTMLElement, side: "left" | "right"): HTMLElement | undefined {
  return tokens(root).find((token) =>
    token.dataset["kpSymbolicSide"] === side && token.dataset["kpSymbolicTokenKind"] === "term"
  );
}

function cancellationMarkOpacity(progress: number): number {
  if (progress <= 0.08 || progress >= 0.86) return 0;
  return Math.sin(Math.PI * (progress - 0.08) / 0.78);
}

function tokens(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[data-kp-symbolic-token]")];
}

function requiredTokenId(token: HTMLElement): string {
  const id = token.dataset["kpSymbolicToken"];
  if (id === undefined) throw new Error("Symbolic stage token is missing its semantic token ID.");
  return id;
}

function moveBetweenLayouts(
  visual: HTMLElement,
  from: HTMLElement | undefined,
  to: HTMLElement | undefined,
  progress: number
): void {
  const fromRect = from?.getBoundingClientRect();
  const toRect = to?.getBoundingClientRect();
  if (fromRect === undefined || toRect === undefined) return;
  const dx = (fromRect.left - toRect.left) * (1 - progress);
  const dy = (fromRect.top - toRect.top) * (1 - progress);
  visual.style.transform = `translate(${dx}px, ${dy}px)`;
}

function moveToward(
  visual: HTMLElement,
  from: HTMLElement | undefined,
  targetCenterX: number | undefined,
  progress: number
): void {
  const fromRect = from?.getBoundingClientRect();
  if (fromRect === undefined || targetCenterX === undefined) return;
  const dx = (targetCenterX - (fromRect.left + fromRect.width / 2)) * progress;
  visual.style.transform = `translateX(${dx}px) scale(${1 - progress * 0.18})`;
}

function moveFromLayoutToTarget(
  visual: HTMLElement,
  from: HTMLElement | undefined,
  to: HTMLElement | undefined,
  progress: number
): void {
  const fromRect = from?.getBoundingClientRect();
  const toRect = to?.getBoundingClientRect();
  if (fromRect === undefined || toRect === undefined) return;
  visual.style.transform = `translate(${(toRect.left - fromRect.left) * progress}px, ${(toRect.top - fromRect.top) * progress}px)`;
}

function moveTowardTarget(
  visual: HTMLElement,
  from: HTMLElement | undefined,
  target: HTMLElement | undefined,
  progress: number
): void {
  const fromRect = from?.getBoundingClientRect();
  const targetRect = target?.getBoundingClientRect();
  if (fromRect === undefined || targetRect === undefined) return;
  const dx = targetRect.left + targetRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = targetRect.top + targetRect.height / 2 - (fromRect.top + fromRect.height / 2);
  visual.style.transform = `translate(${dx * progress}px, ${dy * progress}px) scale(${1 - progress * 0.2})`;
}

function meetingCenter(elements: Array<HTMLElement | undefined>): number | undefined {
  const rects = elements.flatMap((element) => element === undefined ? [] : [element.getBoundingClientRect()]);
  if (rects.length === 0) return undefined;
  return rects.reduce((sum, rect) => sum + rect.left + rect.width / 2, 0) / rects.length;
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

function ease(value: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
}

function renderNative(
  root: HTMLElement,
  projection: KpSymbolicEquationIr,
  options: KpSymbolicEquationRenderOptions,
  state: string
): void {
  renderSymbolicEquation(root, projection, options);
  root.dataset["kpSymbolicMotionState"] = state;
  root.dataset["kpSymbolicMeasurementState"] = "native";
}

function renderLayout(
  root: HTMLElement,
  projection: KpSymbolicEquationIr,
  layout: KpSymbolicEquationLayoutIr,
  options: KpSymbolicEquationRenderOptions
): void {
  renderSymbolicEquation(root, {
    ...projection,
    frameId: layout.frameId,
    equationSemanticId: layout.equationSemanticId,
    tokens: layout.tokens,
    nativeLayout: layout,
    accessibleText: layout.accessibleText
  }, options);
}

function layer(kind: string): HTMLDivElement {
  const element = document.createElement("div");
  element.dataset["kpSymbolicStageLayer"] = kind;
  return element;
}

function measureLineage(
  source: HTMLElement,
  target: HTMLElement,
  lineage: readonly KpSymbolicTokenLineageIr[]
): number {
  let measured = 0;
  for (const item of lineage) {
    const sourceToken = tokenFor(source, item.sourceTokenId);
    const targetToken = tokenFor(target, item.targetTokenId);
    const sourceRect = sourceToken?.getBoundingClientRect();
    const targetRect = targetToken?.getBoundingClientRect();
    if ((sourceRect !== undefined && sourceRect.width > 0 && sourceRect.height > 0) ||
      (targetRect !== undefined && targetRect.width > 0 && targetRect.height > 0)) measured += 1;
  }
  return measured;
}

function tokenFor(root: HTMLElement, tokenId: string | undefined): HTMLElement | undefined {
  if (tokenId === undefined) return undefined;
  return [...root.querySelectorAll<HTMLElement>("[data-kp-symbolic-token]")]
    .find((token) => token.dataset["kpSymbolicToken"] === tokenId);
}

function prefersReducedMotion(root: HTMLElement): boolean {
  return root.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
}

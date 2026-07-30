import type {
  KpPlaceValueAdditionOutlineAnchor
} from "../semantic/place-value-addition-fold-plan.ts";
import {
  isKpPlaceValueAdditionNavigationSession,
  type KpPlaceValueAdditionNavigationSession
} from "./place-value-addition-navigation.ts";
import {
  createKpPlaceValueAdditionSharedDom,
  type KpPlaceValueAdditionSharedDom
} from "./place-value-addition-shared-dom.ts";
import {
  isKpPlaceValueAdditionRuntimeFrame,
  type KpPlaceValueAdditionRuntimeFrame,
  type KpPlaceValueRuntimeView
} from "./place-value-addition-runtime.ts";
import type {
  KpPlaceValueAdditionAccessibleProjection
} from "./place-value-addition-accessible-projection.ts";

export const kpPlaceValueAdditionResponsivePolicy = Object.freeze({
  schemaVersion: "kp.place-value-addition-responsive-policy.v1" as const,
  wideMinimumWidth: 881,
  minimumReadableFontPx: 32,
  nativeFontPx: 40,
  outlineMaximumBlockPx: 192,
  equationFit: "intrinsic-native-no-wrap" as const,
  motionGeometry: "viewport-independent" as const,
  reviewOwner: "external-animation-library-review" as const
});

export interface KpPlaceValueAdditionResponsiveSurface {
  readonly root: HTMLElement;
  readonly outlineRoot: HTMLElement;
  readonly stageRoot: HTMLElement;
  readonly viewControlsRoot: HTMLElement;
  readonly accessibleStateRoot: HTMLElement;
  readonly transcriptRoot: HTMLDetailsElement;
  readonly shared: KpPlaceValueAdditionSharedDom;
  readonly anchorButtons:
    ReadonlyMap<KpPlaceValueAdditionOutlineAnchor["id"], HTMLButtonElement>;
  readonly apply: (frame: KpPlaceValueAdditionRuntimeFrame) => void;
  readonly dispose: () => void;
}

export function createKpPlaceValueAdditionResponsiveSurface(input: {
  readonly document: Document;
  readonly navigation: KpPlaceValueAdditionNavigationSession;
  readonly onOutlineRequest?: (
    anchorId: KpPlaceValueAdditionOutlineAnchor["id"]
  ) => void;
  readonly onViewRequest?: (
    view: KpPlaceValueRuntimeView
  ) => void;
}): KpPlaceValueAdditionResponsiveSurface {
  if (!isKpPlaceValueAdditionNavigationSession(input.navigation)) {
    throw new Error(
      "Responsive place-value surface requires sealed navigation authority."
    );
  }
  const root = input.document.createElement("article");
  root.dataset["kpPlaceValueResponsiveSurface"] = "";
  root.dataset["kpPlaceValueEquationFit"] =
    kpPlaceValueAdditionResponsivePolicy.equationFit;
  root.dataset["kpPlaceValueMotionGeometry"] =
    kpPlaceValueAdditionResponsivePolicy.motionGeometry;
  root.dataset["kpReviewAccessOwner"] =
    kpPlaceValueAdditionResponsivePolicy.reviewOwner;
  root.style.cssText =
    "box-sizing:border-box;display:grid;gap:16px;inline-size:100%;" +
    "min-inline-size:0;align-items:stretch;overflow:visible";
  const srOnly = input.document.createElement("style");
  srOnly.textContent = `
    [data-kp-place-value-sr-only] {
      position:absolute !important;
      inline-size:1px !important;
      block-size:1px !important;
      padding:0 !important;
      margin:-1px !important;
      overflow:hidden !important;
      clip:rect(0,0,0,0) !important;
      white-space:nowrap !important;
      border:0 !important;
    }
  `;
  root.append(srOnly);

  const outline = input.document.createElement("nav");
  outline.dataset["kpPlaceValueOutline"] = "";
  outline.setAttribute("aria-label", "Place-value addition outline");
  outline.style.cssText =
    "box-sizing:border-box;display:grid;gap:6px;align-content:start;" +
    "max-block-size:192px;min-inline-size:0;overflow-y:auto;" +
    "overscroll-behavior:contain;padding:4px";
  const anchorButtons = new Map<
    KpPlaceValueAdditionOutlineAnchor["id"],
    HTMLButtonElement
  >();
  const clickBindings: Array<{
    readonly target: HTMLButtonElement;
    readonly listener: EventListener;
  }> = [];
  let applyCurrentFrame:
    ((frame: KpPlaceValueAdditionRuntimeFrame) => void) | undefined;
  let disposed = false;
  for (const anchor of input.navigation.outlineAnchors) {
    const button = input.document.createElement("button");
    button.type = "button";
    button.dataset["kpPlaceValueOutlineAnchor"] = anchor.id;
    button.dataset["kpPlaceValueOutlineProgressPermille"] =
      String(anchor.progressPermille);
    button.textContent = anchor.label;
    button.style.cssText =
      "box-sizing:border-box;min-block-size:44px;text-align:start;" +
      "white-space:normal";
    const listener = (): void => {
      if (input.onOutlineRequest !== undefined) {
        input.onOutlineRequest(anchor.id);
        return;
      }
      applyCurrentFrame?.(input.navigation.seekOutline(anchor.id));
    };
    button.addEventListener("click", listener);
    clickBindings.push({ target: button, listener });
    outline.append(button);
    anchorButtons.set(anchor.id, button);
  }

  const viewControls = input.document.createElement("div");
  viewControls.dataset["kpPlaceValueViewControls"] = "";
  viewControls.setAttribute("role", "group");
  viewControls.setAttribute("aria-label", "Place-value representation");
  viewControls.style.cssText =
    "display:flex;gap:8px;flex-wrap:wrap;justify-content:center";
  const viewButtons = new Map<KpPlaceValueRuntimeView, HTMLButtonElement>();
  for (const view of ["written", "base-ten"] as const) {
    const button = input.document.createElement("button");
    button.type = "button";
    button.dataset["kpPlaceValueViewButton"] = view;
    button.textContent =
      view === "written" ? "Written algorithm" : "Base-ten blocks";
    button.style.cssText = "min-block-size:44px";
    const listener = (): void => {
      if (input.onViewRequest !== undefined) {
        input.onViewRequest(view);
        return;
      }
      applyCurrentFrame?.(input.navigation.setView(view));
    };
    button.addEventListener("click", listener);
    clickBindings.push({ target: button, listener });
    viewButtons.set(view, button);
    viewControls.append(button);
  }

  const stage = input.document.createElement("div");
  stage.dataset["kpPlaceValueResponsiveStage"] = "";
  stage.style.cssText =
    "box-sizing:border-box;display:grid;min-inline-size:0;" +
    "min-block-size:280px;inline-size:100%;place-items:center;" +
    "overflow:visible;padding:16px";
  const shared = createKpPlaceValueAdditionSharedDom({
    document: input.document,
    session: input.navigation.runtime,
    initialFrame: input.navigation.frame
  });
  shared.root.style.maxInlineSize = "100%";
  // The live region below is the sole accessibility projection. Hiding both
  // visual views prevents responsive visibility from duplicating or omitting
  // mathematical truth in the accessibility tree.
  shared.root.setAttribute("aria-hidden", "true");
  stage.append(shared.root);

  const accessibleState = input.document.createElement("section");
  accessibleState.dataset["kpPlaceValueAccessibleState"] = "";
  accessibleState.dataset["kpPlaceValueSrOnly"] = "";
  accessibleState.setAttribute("aria-live", "polite");
  accessibleState.setAttribute("aria-atomic", "true");
  const transcript = renderAccessibleTranscript(
    input.document,
    input.navigation.runtime.accessibility
  );
  const accessibleStepRoots = new Map(
    input.navigation.runtime.accessibility.steps.map((step) => [
      step.beatId,
      renderAccessibleStepState(input.document, step)
    ] as const)
  );
  root.append(outline, viewControls, accessibleState, stage, transcript);

  const apply = (frame: KpPlaceValueAdditionRuntimeFrame): void => {
    if (disposed) {
      throw new Error("Responsive place-value surface is disposed.");
    }
    if (
      !isKpPlaceValueAdditionRuntimeFrame(frame) ||
      frame.sessionId !== input.navigation.runtime.id
    ) {
      throw new Error(
        "Responsive place-value surface rejected a foreign frame."
      );
    }
    shared.apply(frame);
    const wide = frame.responsive.mode === "wide-both";
    root.style.gridTemplateColumns = wide
      ? "minmax(11rem,14rem) minmax(0,1fr)"
      : "minmax(0,1fr)";
    root.dataset["kpPlaceValueResponsiveMode"] =
      frame.responsive.mode;
    root.dataset["kpPlaceValueProgressPermille"] =
      String(frame.clock.progressPermille);
    root.dataset["kpPlaceValueInputProgressPermille"] =
      String(frame.clock.progressPermille);
    root.dataset["kpPlaceValueRendererSessionId"] =
      frame.rendererSessionId;
    root.dataset["kpPlaceValueBeatId"] = frame.beat.id;
    root.dataset["kpPlaceValuePhaseProgressPermille"] =
      String(Math.round(frame.beatProgress * 1_000));
    root.dataset["kpPlaceValueActivePhase"] =
      activePhase(frame.beatProgress);
    root.dataset["kpPlaceValueActiveRepresentation"] =
      frame.responsive.selectedView;
    root.dataset["kpPlaceValueLayoutPolicy"] =
      frame.responsive.mode;
    root.dataset["kpPlaceValueFoldMode"] =
      input.navigation.fold.mode;
    outline.style.maxBlockSize = wide ? "192px" : "132px";
    viewControls.style.display = wide ? "none" : "flex";
    for (const [view, button] of viewButtons) {
      button.setAttribute(
        "aria-pressed",
        String(frame.responsive.selectedView === view)
      );
    }
    syncAccessibleState({
      root: accessibleState,
      transcript,
      projection: input.navigation.runtime.accessibility,
      stepRoots: accessibleStepRoots,
      frame
    });
    syncReviewTelemetry(root, frame);
    for (const anchor of input.navigation.outlineAnchors) {
      const current =
        anchor.progressPermille === frame.clock.progressPermille;
      const button = anchorButtons.get(anchor.id)!;
      if (current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
  };
  applyCurrentFrame = apply;
  apply(input.navigation.frame);
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    applyCurrentFrame = undefined;
    for (const { target, listener } of clickBindings) {
      target.removeEventListener("click", listener);
    }
    clickBindings.length = 0;
    shared.dispose();
    root.remove();
  };

  return Object.freeze({
    root,
    outlineRoot: outline,
    stageRoot: stage,
    viewControlsRoot: viewControls,
    accessibleStateRoot: accessibleState,
    transcriptRoot: transcript,
    shared,
    anchorButtons,
    apply,
    dispose
  });
}

function renderAccessibleTranscript(
  document: Document,
  projection: KpPlaceValueAdditionAccessibleProjection
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.dataset["kpPlaceValueTranscript"] = "";
  const summary = document.createElement("summary");
  summary.textContent = "Accessible transcript: all seven operations";
  const introduction = document.createElement("p");
  introduction.textContent = projection.introduction;
  const list = document.createElement("ol");
  for (const step of projection.steps) {
    const item = document.createElement("li");
    item.dataset["kpPlaceValueTranscriptStep"] = step.beatId;
    const label = document.createElement("strong");
    label.textContent = `${step.label}. `;
    item.append(label, document.createTextNode(step.description));
    list.append(item);
  }
  const finalStatement = document.createElement("p");
  finalStatement.textContent = projection.finalStatement;
  const references = document.createElement("dl");
  references.dataset["kpPlaceValueSrOnly"] = "";
  references.dataset["kpPlaceValueTranscriptReferences"] = "";
  const referenceIds = new Set(
    projection.steps.flatMap(({ transcriptRefIds }) => transcriptRefIds)
  );
  for (const refId of referenceIds) {
    const entityId = refId.replace("transcript.entity.", "");
    const group = document.createElement("div");
    group.id = refId;
    const term = document.createElement("dt");
    term.textContent = entityId;
    const description = document.createElement("dd");
    description.textContent =
      `Semantic material participating in ${projection.expression}.`;
    group.append(term, description);
    references.append(group);
  }
  details.append(
    summary,
    introduction,
    list,
    finalStatement,
    references
  );
  return details;
}

function syncAccessibleState(input: {
  readonly root: HTMLElement;
  readonly transcript: HTMLDetailsElement;
  readonly projection: KpPlaceValueAdditionAccessibleProjection;
  readonly stepRoots: ReadonlyMap<
    KpPlaceValueAdditionAccessibleProjection["steps"][number]["beatId"],
    HTMLElement
  >;
  readonly frame: KpPlaceValueAdditionRuntimeFrame;
}): void {
  const step = input.projection.steps.find(
    ({ beatId }) => beatId === input.frame.beat.id
  );
  if (step === undefined) {
    throw new Error(
      `Place-value accessibility lacks beat ${input.frame.beat.id}.`
    );
  }
  input.root.dataset["kpPlaceValueAccessibleCheckpoint"] =
    step.checkpointId;
  input.root.dataset["kpPlaceValueAccessibleView"] =
    input.frame.responsive.selectedView;
  input.root.dataset["kpPlaceValueFocusRefs"] =
    step.focusEntityIds.join(",");
  input.root.dataset["kpPlaceValueAnnotationIds"] =
    step.annotationIds.join(",");
  const stepRoot = input.stepRoots.get(step.beatId);
  if (stepRoot === undefined) {
    throw new Error(
      `Place-value accessibility lacks cached DOM for ${step.beatId}.`
    );
  }
  // KaTeX HTML+MathML is compiled once at lazy mount. Moving one cached step
  // root keeps screen-reader truth live without reparsing math on scroll.
  if (input.root.firstElementChild !== stepRoot) {
    input.root.replaceChildren(stepRoot);
  }
  input.transcript
    .querySelectorAll<HTMLElement>("[data-kp-place-value-transcript-step]")
    .forEach((item) => {
      if (item.dataset["kpPlaceValueTranscriptStep"] === step.beatId) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });
}

function renderAccessibleStepState(
  document: Document,
  step: KpPlaceValueAdditionAccessibleProjection["steps"][number]
): HTMLElement {
  const root = document.createElement("div");
  root.dataset["kpPlaceValueAccessibleStep"] = step.beatId;
  const heading = document.createElement("h4");
  heading.textContent = "Current place-value checkpoint";
  const math = document.createElement("div");
  math.dataset["kpPlaceValueAccessibleMath"] = "";
  // This is compiler-owned KaTeX output, not authored or generated free text.
  math.innerHTML = step.nativeHtmlAndMathml;
  const description = document.createElement("p");
  description.textContent = `${step.label}. ${step.description}`;
  const focus = document.createElement("p");
  focus.append(document.createTextNode("Focused quantities: "));
  step.focusEntityIds.forEach((entityId, index) => {
    if (index > 0) focus.append(document.createTextNode(", "));
    const link = document.createElement("a");
    link.href = `#transcript.entity.${entityId}`;
    link.textContent = entityId;
    focus.append(link);
  });
  const annotations = document.createElement("p");
  annotations.textContent =
    `Proof annotations: ${step.annotationIds.join(", ")}.`;
  root.append(
    heading,
    math,
    description,
    focus,
    annotations
  );
  return root;
}

function syncReviewTelemetry(
  root: HTMLElement,
  frame: KpPlaceValueAdditionRuntimeFrame
): void {
  const player = root.closest<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  if (player === null) return;
  const step = root.querySelector<HTMLElement>(
    "[data-kp-place-value-accessible-state]"
  )?.dataset["kpPlaceValueAccessibleCheckpoint"];
  player.dataset["kpPlaceValueProgressPermille"] =
    String(frame.clock.progressPermille);
  player.dataset["kpPlaceValueInputProgressPermille"] =
    String(frame.clock.progressPermille);
  player.dataset["kpPlaceValuePhaseProgressPermille"] =
    String(Math.round(frame.beatProgress * 1_000));
  player.dataset["kpPlaceValueActiveRepresentation"] =
    frame.responsive.selectedView;
  player.dataset["kpPlaceValueBeatId"] = frame.beat.id;
  player.dataset["kpPlaceValueActivePhase"] =
    activePhase(frame.beatProgress);
  player.dataset["kpPlaceValueFoldMode"] =
    root.dataset["kpPlaceValueFoldMode"] ?? "automatic";
  player.dataset["kpPlaceValueLayoutPolicy"] =
    frame.responsive.mode;
  player.dataset["kpPlaceValueRendererSessionId"] =
    frame.rendererSessionId;
  player.dataset["kpPlaceValueFocusRefs"] =
    root.querySelector<HTMLElement>(
      "[data-kp-place-value-accessible-state]"
    )?.dataset["kpPlaceValueFocusRefs"] ?? "";
  if (step === undefined) {
    delete player.dataset["kpPlaceValueCheckpoint"];
  } else {
    player.dataset["kpPlaceValueCheckpoint"] = step;
  }
}

function activePhase(
  beatProgress: number
): "setup" | "action" | "settle" {
  if (beatProgress < 0.2) return "setup";
  if (beatProgress < 0.82) return "action";
  return "settle";
}

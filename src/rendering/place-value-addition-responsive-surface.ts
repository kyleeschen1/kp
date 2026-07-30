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
  type KpPlaceValueAdditionRuntimeFrame
} from "./place-value-addition-runtime.ts";

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
  readonly shared: KpPlaceValueAdditionSharedDom;
  readonly anchorButtons:
    ReadonlyMap<KpPlaceValueAdditionOutlineAnchor["id"], HTMLButtonElement>;
  readonly apply: (frame: KpPlaceValueAdditionRuntimeFrame) => void;
}

export function createKpPlaceValueAdditionResponsiveSurface(input: {
  readonly document: Document;
  readonly navigation: KpPlaceValueAdditionNavigationSession;
  readonly onOutlineRequest?: (
    anchorId: KpPlaceValueAdditionOutlineAnchor["id"]
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
    button.addEventListener("click", () =>
      input.onOutlineRequest?.(anchor.id)
    );
    outline.append(button);
    anchorButtons.set(anchor.id, button);
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
  stage.append(shared.root);
  root.append(outline, stage);

  const apply = (frame: KpPlaceValueAdditionRuntimeFrame): void => {
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
    outline.style.maxBlockSize = wide ? "192px" : "132px";
    for (const anchor of input.navigation.outlineAnchors) {
      const current =
        anchor.progressPermille === frame.clock.progressPermille;
      const button = anchorButtons.get(anchor.id)!;
      if (current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
  };
  apply(input.navigation.frame);

  return Object.freeze({
    root,
    outlineRoot: outline,
    stageRoot: stage,
    shared,
    anchorButtons,
    apply
  });
}

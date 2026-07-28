import {
  cloneElementWithComputedStyles,
  makeKpMaterialOwnerInert,
  stripKpMaterialCloneAuthority
} from "./computed-style-clone.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap.ts";

export interface KpEquationMaterialLayerOwnerFrame {
  readonly ownerId: string;
  readonly sourceElement: HTMLElement;
  readonly sourceMotionId?: string | undefined;
  readonly semanticEntityId?: string | undefined;
  readonly semanticContacts?:
    readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
  readonly verifiedOperationCohortId?: string | undefined;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly expectedPaintRect?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
  readonly opacity: number;
  readonly transform: string;
  readonly filter?: string | undefined;
  readonly semanticDepth?: string | undefined;
  readonly clipPath?: string | undefined;
  readonly visualTransform?: string | undefined;
  readonly fragmentRole?: string | undefined;
}

interface KpEquationMaterialLayerState {
  readonly owners: Map<string, HTMLElement>;
}

const materialLayerStates =
  new WeakMap<HTMLElement, KpEquationMaterialLayerState>();

export function syncKpEquationMaterialLayer(input: {
  readonly stage: HTMLElement;
  readonly owners: readonly KpEquationMaterialLayerOwnerFrame[];
}): void {
  const layer = input.stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  );
  if (layer === null) {
    throw new Error("Equation stage is missing its persistent material layer.");
  }
  const state = materialLayerState(layer);
  const activeOwnerIds = new Set(input.owners.map((owner) => owner.ownerId));
  for (const [ownerId, owner] of state.owners) {
    if (activeOwnerIds.has(ownerId)) continue;
    owner.remove();
    state.owners.delete(ownerId);
  }

  for (const frame of input.owners) {
    let owner = state.owners.get(frame.ownerId);
    if (owner === undefined) {
      // The stage document is the authority because reader surfaces may live
      // in an iframe or a headless document with no matching global document.
      owner = input.stage.ownerDocument.createElement("span");
      owner.className = "editor-equation-stage__material-owner";
      owner.dataset["kpEquationMaterialOwnerId"] = frame.ownerId;
      makeKpMaterialOwnerInert(owner);
      layer.append(owner);
      state.owners.set(frame.ownerId, owner);
    }
    setKpEquationMaterialOwnerVisual({
      owner,
      sourceElement: frame.sourceElement,
      revisionKey: `source:${frame.ownerId}`
    });
    const visual = owner.firstElementChild as HTMLElement | null;
    if (visual !== null) {
      // KaTeX rule bounds already include their border. Without border-box,
      // sizing the clone to its owner adds the border a second time and makes
      // rule paint one pixel taller than the sampled native endpoint.
      if (frame.fragmentRole?.startsWith("rule:") === true) {
        setStyle(visual.style, "boxSizing", "border-box");
      }
      const focused = frame.sourceElement.classList.contains("kp-focus-group");
      if (visual.classList.contains("kp-focus-group") !== focused) {
        visual.classList.toggle("kp-focus-group", focused);
      }
      for (const property of [
        "--kp-focus-z",
        "--kp-focus-scale",
        "--kp-focus-outline-strength",
        "--kp-focus-shadow-opacity",
        "--kp-focus-context-dimming"
      ]) {
        const value = frame.sourceElement.style.getPropertyValue(property);
        if (
          value === "" &&
          visual.style.getPropertyValue(property) !== ""
        ) {
          visual.style.removeProperty(property);
        } else if (
          value !== "" &&
          visual.style.getPropertyValue(property) !== value
        ) {
          visual.style.setProperty(property, value);
        }
      }
      setStyle(visual.style, "clipPath", frame.clipPath ?? "none");
      setStyle(visual.style, "transform", frame.visualTransform ?? "none");
    }
    setStyle(owner.style, "left", `${frame.rect.left}px`);
    setStyle(owner.style, "top", `${frame.rect.top}px`);
    setStyle(owner.style, "width", `${frame.rect.width}px`);
    setStyle(owner.style, "height", `${frame.rect.height}px`);
    setStyle(owner.style, "opacity", String(frame.opacity));
    setStyle(owner.style, "transform", frame.transform);
    setStyle(owner.style, "filter", frame.filter ?? "none");
    setOptionalDataset(
      owner,
      "kpEquationSemanticDepth",
      frame.semanticDepth
    );
    setDataset(
      owner,
      "kpEquationMaterialSourceMotionId",
      frame.sourceMotionId ?? frame.sourceElement.dataset["kpMotionId"] ?? ""
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialSemanticEntityId",
      frame.semanticEntityId
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialSemanticContacts",
      frame.semanticContacts === undefined
        ? undefined
        : JSON.stringify(frame.semanticContacts)
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialVerifiedOperationCohortId",
      frame.verifiedOperationCohortId
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialFragmentRole",
      frame.fragmentRole
    );
    if (frame.expectedPaintRect === undefined || visual === null) {
      setOptionalDataset(owner, "kpEquationMaterialPaintAlignment", undefined);
      setOptionalDataset(owner, "kpEquationMaterialPaintAlignmentKey", undefined);
      setOptionalDataset(owner, "kpEquationMaterialPaintInsetX", undefined);
      setOptionalDataset(owner, "kpEquationMaterialPaintInsetY", undefined);
    } else {
      const alignmentKey = [
        owner.dataset["kpEquationMaterialVisualRevision"],
        frame.rect.width,
        frame.rect.height,
        frame.expectedPaintRect.width,
        frame.expectedPaintRect.height
      ].join(":");
      if (
        owner.dataset["kpEquationMaterialPaintAlignmentKey"] !== alignmentKey
      ) {
        const measured = measureKpNativeKatexSubtreePaintRect(
          input.stage,
          visual
        );
        if (measured === undefined) {
          throw new Error(
            `Material owner ${frame.ownerId} has no measurable cloned paint.`
          );
        }
        const widthResidual = Math.abs(
          measured.width - frame.expectedPaintRect.width
        );
        const heightResidual = Math.abs(
          measured.height - frame.expectedPaintRect.height
        );
        if (widthResidual > 0.75 || heightResidual > 0.75) {
          throw new Error(
            `Material owner ${frame.ownerId} changed cloned paint size ` +
            `(${widthResidual.toFixed(2)}px × ${heightResidual.toFixed(2)}px).`
          );
        }
        setDataset(owner, "kpEquationMaterialPaintAlignmentKey", alignmentKey);
        setDataset(
          owner,
          "kpEquationMaterialPaintInsetX",
          String(measured.left - frame.rect.left)
        );
        setDataset(
          owner,
          "kpEquationMaterialPaintInsetY",
          String(measured.top - frame.rect.top)
        );
      }
      // Clone-internal KaTeX offsets can differ from the native wrapper even
      // when both outer boxes agree. Preserve that inset while the expected
      // native paint inset changes across endpoints.
      const correctionX =
        frame.expectedPaintRect.left -
        frame.rect.left -
        Number(owner.dataset["kpEquationMaterialPaintInsetX"]);
      const correctionY =
        frame.expectedPaintRect.top -
        frame.rect.top -
        Number(owner.dataset["kpEquationMaterialPaintInsetY"]);
      setStyle(owner.style, "left", `${frame.rect.left + correctionX}px`);
      setStyle(owner.style, "top", `${frame.rect.top + correctionY}px`);
      setDataset(
        owner,
        "kpEquationMaterialPaintAlignment",
        "measured-ink"
      );
    }
  }
}

function materialLayerState(layer: HTMLElement): KpEquationMaterialLayerState {
  const existing = materialLayerStates.get(layer);
  if (existing !== undefined) return existing;
  const owners = new Map<string, HTMLElement>();
  for (const owner of layer.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    const ownerId = owner.dataset["kpEquationMaterialOwnerId"];
    if (ownerId !== undefined) owners.set(ownerId, owner);
  }
  const created = { owners };
  materialLayerStates.set(layer, created);
  return created;
}

function setDataset(
  element: HTMLElement,
  key: string,
  value: string
): void {
  if (element.dataset[key] !== value) element.dataset[key] = value;
}

function setOptionalDataset(
  element: HTMLElement,
  key: string,
  value: string | undefined
): void {
  if (value === undefined) {
    if (element.dataset[key] !== undefined) delete element.dataset[key];
  } else {
    setDataset(element, key, value);
  }
}

function setStyle(
  style: CSSStyleDeclaration,
  key:
    | "boxSizing"
    | "clipPath"
    | "filter"
    | "height"
    | "left"
    | "opacity"
    | "top"
    | "transform"
    | "width",
  value: string
): void {
  if (style[key] !== value) style[key] = value;
}

export function setKpEquationMaterialOwnerVisual(input: {
  readonly owner: HTMLElement;
  readonly sourceElement: HTMLElement;
  readonly revisionKey: string;
}): HTMLElement | SVGElement {
  if (input.revisionKey.trim() === "") {
    throw new Error("Material visual revision key must be non-empty.");
  }
  const current = input.owner.firstElementChild;
  if (
    current !== null &&
    input.owner.dataset["kpEquationMaterialVisualRevision"] ===
      input.revisionKey
  ) {
    return current as HTMLElement | SVGElement;
  }
  // A detached SVG path has no paint context. Clone its owning SVG so
  // structural ink remains native and intact inside the material layer.
  const cloneSource =
    input.sourceElement instanceof SVGElement &&
      !(input.sourceElement instanceof SVGSVGElement)
      ? input.sourceElement.ownerSVGElement ?? input.sourceElement
      : input.sourceElement;
  const visual = cloneElementWithComputedStyles(cloneSource);
  stripKpMaterialCloneAuthority(visual);
  visual.style.opacity = "1";
  visual.style.transform = "none";
  visual.style.translate = "none";
  visual.style.scale = "none";
  visual.style.width = "100%";
  visual.style.height = "100%";
  // Ordinary paint needs visible ink overflow, while computed structural
  // clones retain any deliberate cropping from their source.
  visual.style.position = "relative";
  visual.style.display = "block";
  visual.classList.add("editor-equation-stage__material-visual");
  input.owner.replaceChildren(visual);
  input.owner.dataset["kpEquationMaterialVisualRevision"] = input.revisionKey;
  return visual;
}

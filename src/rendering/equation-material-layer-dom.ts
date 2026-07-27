import {
  cloneElementWithComputedStyles,
  makeKpMaterialOwnerInert,
  stripKpMaterialCloneAuthority
} from "./computed-style-clone.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";

export interface KpEquationMaterialLayerOwnerFrame {
  readonly ownerId: string;
  readonly sourceElement: HTMLElement;
  readonly sourceMotionId?: string | undefined;
  readonly semanticEntityId?: string | undefined;
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
  const activeOwnerIds = new Set(input.owners.map((owner) => owner.ownerId));
  layer.querySelectorAll<HTMLElement>("[data-kp-equation-material-owner-id]")
    .forEach((owner) => {
      const ownerId = owner.dataset["kpEquationMaterialOwnerId"];
      if (ownerId === undefined || !activeOwnerIds.has(ownerId)) owner.remove();
    });

  for (const frame of input.owners) {
    let owner = layer.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${CSS.escape(frame.ownerId)}"]`
    );
    if (owner === null) {
      owner = document.createElement("span");
      owner.className = "editor-equation-stage__material-owner";
      owner.dataset["kpEquationMaterialOwnerId"] = frame.ownerId;
      makeKpMaterialOwnerInert(owner);
      layer.append(owner);
    }
    setKpEquationMaterialOwnerVisual({
      owner,
      sourceElement: frame.sourceElement,
      revisionKey: `source:${frame.ownerId}`
    });
    const visual = owner.firstElementChild as HTMLElement | null;
    if (visual !== null) {
      visual.classList.toggle(
        "kp-focus-group",
        frame.sourceElement.classList.contains("kp-focus-group")
      );
      for (const property of [
        "--kp-focus-z",
        "--kp-focus-scale",
        "--kp-focus-outline-strength",
        "--kp-focus-shadow-opacity",
        "--kp-focus-context-dimming"
      ]) {
        const value = frame.sourceElement.style.getPropertyValue(property);
        if (value === "") visual.style.removeProperty(property);
        else visual.style.setProperty(property, value);
      }
      visual.style.clipPath = frame.clipPath ?? "none";
      visual.style.transform = frame.visualTransform ?? "none";
    }
    owner.style.left = `${frame.rect.left}px`;
    owner.style.top = `${frame.rect.top}px`;
    owner.style.width = `${frame.rect.width}px`;
    owner.style.height = `${frame.rect.height}px`;
    owner.style.opacity = String(frame.opacity);
    owner.style.transform = frame.transform;
    owner.style.filter = frame.filter ?? "none";
    if (frame.semanticDepth === undefined) {
      delete owner.dataset["kpEquationSemanticDepth"];
    } else {
      owner.dataset["kpEquationSemanticDepth"] = frame.semanticDepth;
    }
    owner.dataset["kpEquationMaterialSourceMotionId"] =
      frame.sourceMotionId ?? frame.sourceElement.dataset["kpMotionId"] ?? "";
    if (frame.semanticEntityId === undefined) {
      delete owner.dataset["kpEquationMaterialSemanticEntityId"];
    } else {
      owner.dataset["kpEquationMaterialSemanticEntityId"] =
        frame.semanticEntityId;
    }
    if (frame.fragmentRole === undefined) {
      delete owner.dataset["kpEquationMaterialFragmentRole"];
    } else {
      owner.dataset["kpEquationMaterialFragmentRole"] = frame.fragmentRole;
    }
    if (frame.expectedPaintRect === undefined || visual === null) {
      delete owner.dataset["kpEquationMaterialPaintAlignment"];
      delete owner.dataset["kpEquationMaterialPaintAlignmentKey"];
      delete owner.dataset["kpEquationMaterialPaintInsetX"];
      delete owner.dataset["kpEquationMaterialPaintInsetY"];
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
        owner.dataset["kpEquationMaterialPaintAlignmentKey"] = alignmentKey;
        owner.dataset["kpEquationMaterialPaintInsetX"] = String(
          measured.left - frame.rect.left
        );
        owner.dataset["kpEquationMaterialPaintInsetY"] = String(
          measured.top - frame.rect.top
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
      owner.style.left = `${
        frame.rect.left + correctionX
      }px`;
      owner.style.top = `${
        frame.rect.top + correctionY
      }px`;
      owner.dataset["kpEquationMaterialPaintAlignment"] = "measured-ink";
    }
  }
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

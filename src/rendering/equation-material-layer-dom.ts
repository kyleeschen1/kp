import { cloneElementWithComputedStyles } from "./computed-style-clone.ts";

export interface KpEquationMaterialLayerOwnerFrame {
  readonly ownerId: string;
  readonly sourceElement: HTMLElement;
  readonly sourceMotionId?: string | undefined;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
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
      owner.setAttribute("aria-hidden", "true");
      // A detached SVG path has no paint context. Clone its owning SVG so
      // structural ink remains native and intact inside the material layer.
      const cloneSource =
        frame.sourceElement instanceof SVGElement &&
          !(frame.sourceElement instanceof SVGSVGElement)
          ? frame.sourceElement.ownerSVGElement ?? frame.sourceElement
          : frame.sourceElement;
      const visual = cloneElementWithComputedStyles(cloneSource);
      visual.removeAttribute("data-kp-motion-id");
      visual.style.opacity = "1";
      visual.style.transform = "none";
      visual.style.translate = "none";
      visual.style.scale = "none";
      visual.style.width = "100%";
      visual.style.height = "100%";
      // Ordinary glyphs need visible ink overflow, while KaTeX uses hidden
      // overflow selectively for structural crops such as radical tails.
      // The computed clone already carries that distinction from its source.
      visual.style.position = "relative";
      visual.style.display = "block";
      visual.classList.add("editor-equation-stage__material-visual");
      visual.querySelectorAll<HTMLElement>("[data-kp-motion-id]").forEach((token) =>
        token.removeAttribute("data-kp-motion-id")
      );
      owner.append(visual);
      layer.append(owner);
    }
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
    if (frame.fragmentRole === undefined) {
      delete owner.dataset["kpEquationMaterialFragmentRole"];
    } else {
      owner.dataset["kpEquationMaterialFragmentRole"] = frame.fragmentRole;
    }
  }
}

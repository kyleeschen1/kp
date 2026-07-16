export interface KpEquationMaterialLayerOwnerFrame {
  readonly ownerId: string;
  readonly sourceElement: HTMLElement;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly opacity: number;
  readonly transform: string;
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
      const visual = cloneWithComputedStyles(frame.sourceElement);
      visual.removeAttribute("data-kp-motion-id");
      visual.style.opacity = "1";
      visual.style.transform = "none";
      visual.style.translate = "none";
      visual.style.scale = "none";
      visual.style.width = "100%";
      visual.style.height = "100%";
      visual.style.overflow = "hidden";
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
    owner.dataset["kpEquationMaterialSourceMotionId"] =
      frame.sourceElement.dataset["kpMotionId"] ?? "";
    if (frame.fragmentRole === undefined) {
      delete owner.dataset["kpEquationMaterialFragmentRole"];
    } else {
      owner.dataset["kpEquationMaterialFragmentRole"] = frame.fragmentRole;
    }
  }
}

function cloneWithComputedStyles(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error("Equation material visuals must clone to HTMLElements.");
  }
  inlineComputedStyles(source, clone);
  return clone;
}

function inlineComputedStyles(source: Element, clone: Element): void {
  if (clone instanceof HTMLElement || clone instanceof SVGElement) {
    const computed = getComputedStyle(source);
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      clone.style.setProperty(
        property,
        computed.getPropertyValue(property),
        computed.getPropertyPriority(property)
      );
    }
  }
  const sourceChildren = [...source.children];
  const cloneChildren = [...clone.children];
  sourceChildren.forEach((sourceChild, index) => {
    const cloneChild = cloneChildren[index];
    if (cloneChild !== undefined) inlineComputedStyles(sourceChild, cloneChild);
  });
}

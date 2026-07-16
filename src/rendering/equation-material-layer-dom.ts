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
      const visual = frame.sourceElement.cloneNode(true) as HTMLElement;
      visual.removeAttribute("data-kp-motion-id");
      visual.style.opacity = "1";
      visual.style.transform = "none";
      visual.style.translate = "none";
      visual.style.scale = "none";
      visual.classList.add("editor-equation-stage__material-visual");
      visual.querySelectorAll<HTMLElement>("[data-kp-motion-id]").forEach((token) =>
        token.removeAttribute("data-kp-motion-id")
      );
      owner.append(visual);
      layer.append(owner);
    }
    owner.style.left = `${frame.rect.left}px`;
    owner.style.top = `${frame.rect.top}px`;
    owner.style.width = `${frame.rect.width}px`;
    owner.style.height = `${frame.rect.height}px`;
    owner.style.opacity = String(frame.opacity);
    owner.style.transform = frame.transform;
    owner.dataset["kpEquationMaterialSourceMotionId"] =
      frame.sourceElement.dataset["kpMotionId"] ?? "";
  }
}

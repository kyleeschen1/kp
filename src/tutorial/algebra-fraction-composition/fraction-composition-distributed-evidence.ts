export type KpFractionCompositionEvidenceProjection = "static" | "motion";

export interface KpFractionCompositionDistributedEvidenceController {
  readonly active: boolean;
  readonly projection?: KpFractionCompositionEvidenceProjection;
  dispose(): void;
}

const distributedEvidenceRanges = Object.freeze([
  "distribute-and-normalize",
  "evaluate-constant"
]);

export function readKpFractionCompositionEvidenceProjection(
  search: string
): KpFractionCompositionEvidenceProjection | undefined {
  const projection = new URLSearchParams(search).get("evidence");
  return projection === "static" || projection === "motion"
    ? projection
    : undefined;
}

/**
 * Option B changes only where the retained canonical surface is shown. The
 * Article remains the searchable authority and inactive sockets retain their
 * certified static endpoint instead of creating another renderer or clock.
 */
export function mountKpFractionCompositionDistributedEvidence(input: {
  readonly ownerWindow: Window;
  readonly publication: HTMLElement;
  readonly projection: KpFractionCompositionEvidenceProjection;
  readonly prepareRange: (path: string) => void;
  readonly pauseRange: () => void;
  readonly setAttention: (addresses: readonly string[]) => void;
}): KpFractionCompositionDistributedEvidenceController {
  const documentElement = input.ownerWindow.document.documentElement;
  documentElement.dataset["kpAlgebraView"] =
    `distributed-evidence-${input.projection}`;
  input.publication.dataset["kpAlgebraEvidenceProjection"] = input.projection;

  const controls = distributedEvidenceRanges.map((path) => {
    const slot = input.publication.querySelector<HTMLElement>(
      `[data-kp-algebra-evidence-range="${path}"]`
    );
    const button = slot?.querySelector<HTMLButtonElement>(
      `[data-kp-algebra-evidence-activate="${path}"]`
    );
    if (slot === null || button === null ||
        slot === undefined || button === undefined) {
      throw new Error(`Distributed algebra evidence lacks range ${path}.`);
    }
    return Object.freeze({ path, slot, button });
  });

  if (input.projection === "static") {
    return Object.freeze({
      active: true,
      projection: input.projection,
      dispose() {
        delete input.publication.dataset["kpAlgebraEvidenceProjection"];
        delete documentElement.dataset["kpAlgebraView"];
      }
    });
  }

  let activePath: string | undefined;
  const select = (path: string): void => {
    if (path === activePath) return;
    input.pauseRange();
    activePath = path;
    for (const control of controls) {
      const active = control.path === activePath;
      control.slot.toggleAttribute("data-kp-algebra-evidence-active", active);
      control.button.disabled = active;
      control.button.setAttribute("aria-pressed", String(active));
      control.button.textContent = active
        ? "Active operation"
        : "Animate this operation";
    }
    input.publication.dataset["kpAlgebraEvidenceActiveRange"] = path;
    input.prepareRange(path);
  };
  const listeners = controls.map((control) => {
    const activate = (): void => select(control.path);
    control.button.disabled = false;
    control.button.addEventListener("click", activate);
    return Object.freeze({ button: control.button, activate });
  });

  // This experiment isolates layout, so automatic operation-level dimming
  // must not make its live equation less readable than the static baseline.
  input.setAttention(["solve/equation"]);
  select(distributedEvidenceRanges[0]!);

  return Object.freeze({
    active: true,
    projection: input.projection,
    dispose() {
      input.pauseRange();
      input.setAttention([]);
      for (const { button, activate } of listeners) {
        button.removeEventListener("click", activate);
        button.disabled = true;
        button.removeAttribute("aria-pressed");
        button.textContent = "Animate this operation";
      }
      for (const { slot } of controls) {
        slot.removeAttribute("data-kp-algebra-evidence-active");
      }
      delete input.publication.dataset["kpAlgebraEvidenceProjection"];
      delete input.publication.dataset["kpAlgebraEvidenceActiveRange"];
      delete documentElement.dataset["kpAlgebraView"];
    }
  });
}

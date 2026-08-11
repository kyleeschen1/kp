export interface KpFractionCompositionAttentionStageController {
  readonly active: boolean;
  dispose(): void;
}

export function isKpFractionCompositionAttentionStageRequested(
  search: string
): boolean {
  return new URLSearchParams(search).get("view") === "attention-stage";
}

/**
 * The controller only selects compiled beats. Canonical stage time and paint
 * remain behind the callbacks supplied by the retained equation session.
 */
export function mountKpFractionCompositionAttentionStage(input: {
  readonly ownerWindow: Window;
  readonly publication: HTMLElement;
  readonly stageHost: HTMLElement;
  readonly selectCheckpoint: (path: string) => void;
  readonly selectRange: (
    path: string,
    direction: "forward" | "rewind"
  ) => void;
  readonly setAttention: (addresses: readonly string[]) => void;
}): KpFractionCompositionAttentionStageController {
  if (!isKpFractionCompositionAttentionStageRequested(
    input.ownerWindow.location.search
  )) {
    return Object.freeze({ active: false, dispose() {} });
  }
  const root = requireElement<HTMLElement>(
    input.publication,
    "[data-kp-algebra-attention-stage]"
  );
  const visual = requireElement<HTMLElement>(
    root,
    "[data-kp-algebra-attention-visual]"
  );
  const passages = [...root.querySelectorAll<HTMLElement>(
    "[data-kp-algebra-attention-beat]"
  )];
  const progress = requireElement<HTMLProgressElement>(
    root,
    "[data-kp-algebra-attention-progress]"
  );
  const status = requireElement<HTMLElement>(
    root,
    "[data-kp-algebra-attention-status]"
  );
  const back = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="back"]'
  );
  const forward = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="forward"]'
  );
  if (passages.length === 0) {
    throw new Error("Algebra attention stage requires compiled passages.");
  }

  const originalParent = input.stageHost.parentNode;
  const originalNextSibling = input.stageHost.nextSibling;
  let activeIndex = 0;
  const updateProgress = (): void => {
    const active = passages[activeIndex]!;
    const isRange = active.dataset["kpAlgebraAttentionRange"] !== undefined;
    const localPermille = Number(
      input.stageHost.dataset["kpAlgebraCanonicalLocalProgress"] ?? "0"
    );
    progress.value = activeIndex + (
      isRange && Number.isFinite(localPermille) ? localPermille / 1_000 : 0
    );
  };
  const select = (
    index: number,
    direction: "forward" | "rewind"
  ): void => {
    if (index < 0 || index >= passages.length) return;
    activeIndex = index;
    passages.forEach((passage, passageIndex) => {
      const active = passageIndex === activeIndex;
      passage.toggleAttribute("hidden", !active);
      passage.setAttribute("aria-hidden", String(!active));
    });
    const active = passages[activeIndex]!;
    const checkpoint = active.dataset["kpAlgebraAttentionCheckpoint"];
    const range = active.dataset["kpAlgebraAttentionRange"];
    input.setAttention(readWords(
      requiredData(active, "kpAlgebraAttentionPrimary")
    ));
    if (checkpoint !== undefined) input.selectCheckpoint(checkpoint);
    else if (range !== undefined) input.selectRange(range, direction);
    else throw new Error("Algebra attention beat lacks a temporal anchor.");
    updateProgress();
    status.textContent = `${activeIndex + 1} / ${passages.length}`;
    back.disabled = activeIndex === 0;
    forward.disabled = activeIndex === passages.length - 1;
    root.dataset["kpAlgebraAttentionActiveBeat"] =
      requiredData(active, "kpAlgebraAttentionBeat");
  };
  const onBack = (): void => select(activeIndex - 1, "rewind");
  const onForward = (): void => select(activeIndex + 1, "forward");
  const progressObserver = new MutationObserver(updateProgress);

  input.ownerWindow.document.documentElement.dataset["kpAlgebraView"] =
    "attention-stage";
  root.removeAttribute("hidden");
  visual.append(input.stageHost);
  progressObserver.observe(input.stageHost, {
    attributes: true,
    attributeFilter: ["data-kp-algebra-canonical-local-progress"]
  });
  back.addEventListener("click", onBack);
  forward.addEventListener("click", onForward);
  select(0, "forward");

  return Object.freeze({
    active: true,
    dispose() {
      back.removeEventListener("click", onBack);
      forward.removeEventListener("click", onForward);
      progressObserver.disconnect();
      input.setAttention([]);
      if (originalParent !== null) {
        originalParent.insertBefore(input.stageHost, originalNextSibling);
      }
      root.toggleAttribute("hidden", true);
      delete input.ownerWindow.document.documentElement.dataset["kpAlgebraView"];
    }
  });
}

function readWords(value: string): readonly string[] {
  return Object.freeze(value.split(/\s+/u).filter(Boolean));
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing algebra attention-stage ${selector}.`);
  return element;
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing algebra attention-stage data ${key}.`);
  }
  return value;
}

import {
  kpFractionCompositionInspectionLineages,
  resolveKpFractionCompositionInspectionLineageByAddress,
  resolveKpFractionCompositionInspectionLineageBySelector,
  type KpFractionCompositionInspectionLineage
} from "./fraction-composition-inspection-lineage.ts";

export type KpFractionCompositionEvidenceProjection = "static" | "motion";

export interface KpFractionCompositionDistributedEvidenceController {
  readonly active: boolean;
  readonly projection?: KpFractionCompositionEvidenceProjection;
  syncSemanticAddress(address: string | undefined): void;
  restoreProjection(search: string): void;
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

export function readKpFractionCompositionEvidenceRange(search: string): string {
  const path = new URLSearchParams(search).get("evidenceRange");
  return distributedEvidenceRanges.includes(path ?? "")
    ? path!
    : distributedEvidenceRanges[0]!;
}

export function readKpFractionCompositionEvidenceProgress(search: string): 0 | 1 {
  return new URLSearchParams(search).get("evidenceProgress") === "1000" ? 1 : 0;
}

/**
 * Option B changes only where the retained canonical surface is shown. The
 * Article remains the searchable authority and inactive sockets retain their
 * certified static endpoint instead of creating another renderer or clock.
 */
export function mountKpFractionCompositionDistributedEvidence(input: {
  readonly ownerWindow: Window;
  readonly publication: HTMLElement;
  readonly stageHost: HTMLElement;
  readonly projection: KpFractionCompositionEvidenceProjection;
  readonly prepareRange: (path: string, localProgress?: number) => void;
  readonly pauseRange: () => void;
  readonly setAttention: (addresses: readonly string[]) => void;
  readonly selectSemanticAddress: (address: string | undefined) => void;
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
    const lineageRoot = requireElement<HTMLElement>(
      slot,
      "[data-kp-algebra-lineage-controls]"
    );
    const lineageButtons = kpFractionCompositionInspectionLineages.map(
      (lineage) => Object.freeze({
        lineage,
        button: requireElement<HTMLButtonElement>(
          lineageRoot,
          `[data-kp-algebra-lineage-select="${lineage.id}"]`
        )
      })
    );
    return Object.freeze({ path, slot, button, lineageRoot, lineageButtons });
  });

  if (input.projection === "static") {
    return Object.freeze({
      active: true,
      projection: input.projection,
      syncSemanticAddress() {},
      restoreProjection() {},
      dispose() {
        delete input.publication.dataset["kpAlgebraEvidenceProjection"];
        delete documentElement.dataset["kpAlgebraView"];
      }
    });
  }

  let activePath: string | undefined;
  let activeLineage: KpFractionCompositionInspectionLineage | undefined;
  const syncLineageControls = (): void => {
    for (const control of controls) {
      for (const candidate of control.lineageButtons) {
        const selected = candidate.lineage.id === activeLineage?.id;
        candidate.button.setAttribute("aria-pressed", String(selected));
      }
    }
    if (activeLineage === undefined) {
      delete input.publication.dataset["kpAlgebraEvidenceLineage"];
    } else {
      input.publication.dataset["kpAlgebraEvidenceLineage"] = activeLineage.id;
    }
  };
  const syncSemanticAddress = (address: string | undefined): void => {
    activeLineage = resolveKpFractionCompositionInspectionLineageByAddress(
      address
    );
    // The full-equation story focus keeps the idle evidence readable, but it
    // must yield when the reader asks to inspect one semantic object.
    input.setAttention(address === undefined ? ["solve/equation"] : []);
    syncLineageControls();
  };
  const writeProjectionLocation = (
    path: string,
    progress: 0 | 1,
    mode: "push" | "replace"
  ): void => {
    const url = new URL(input.ownerWindow.location.href);
    if (path === distributedEvidenceRanges[0] && progress === 0) {
      url.searchParams.delete("evidenceRange");
      url.searchParams.delete("evidenceProgress");
    } else {
      url.searchParams.set("evidenceRange", path);
      if (progress === 0) url.searchParams.delete("evidenceProgress");
      else url.searchParams.set("evidenceProgress", "1000");
    }
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (href === `${input.ownerWindow.location.pathname}${input.ownerWindow.location.search}${input.ownerWindow.location.hash}`) {
      return;
    }
    input.ownerWindow.history[mode === "push" ? "pushState" : "replaceState"](
      input.ownerWindow.history.state,
      "",
      href
    );
  };
  const select = (
    path: string,
    localProgress: 0 | 1,
    updateLocation: boolean
  ): void => {
    if (path === activePath && !updateLocation) {
      input.prepareRange(path, localProgress);
      return;
    }
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
      control.lineageRoot.toggleAttribute("hidden", !active);
      for (const candidate of control.lineageButtons) {
        candidate.button.disabled = !active;
      }
    }
    input.publication.dataset["kpAlgebraEvidenceActiveRange"] = path;
    input.prepareRange(path, localProgress);
    if (updateLocation) writeProjectionLocation(path, localProgress, "push");
  };
  const listeners = controls.map((control) => {
    const activate = (): void => select(control.path, 0, true);
    control.button.disabled = false;
    control.button.addEventListener("click", activate);
    return Object.freeze({ button: control.button, activate });
  });
  const lineageListeners = controls.flatMap((control) =>
    control.lineageButtons.map(({ lineage, button }) => {
      const choose = (): void => {
        const address = activeLineage?.id === lineage.id
          ? undefined
          : lineage.semanticAddress;
        input.selectSemanticAddress(address);
        syncSemanticAddress(address);
      };
      button.addEventListener("click", choose);
      return Object.freeze({ button, choose });
    })
  );
  const inspectableSelectors = [
    ...input.publication.querySelectorAll<HTMLElement>(
      "[data-kp-reader-selector-id]"
    )
  ];
  for (const element of inspectableSelectors) {
    const lineage = resolveKpFractionCompositionInspectionLineageBySelector(
      requiredData(element, "kpReaderSelectorId")
    );
    if (lineage !== undefined) {
      element.dataset["kpAlgebraLineageTarget"] = lineage.id;
    }
  }
  const onEquationClick = (event: MouseEvent): void => {
    if (!plainActivation(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const selector = target.closest<HTMLElement>(
      "[data-kp-algebra-lineage-target]"
    );
    const lineage = selector !== null && input.publication.contains(selector)
      ? resolveKpFractionCompositionInspectionLineageBySelector(
          requiredData(selector, "kpReaderSelectorId")
        )
      : lineageAtPointer(input.publication, event.clientX, event.clientY);
    if (lineage === undefined) return;
    const address = activeLineage?.id === lineage.id
      ? undefined
      : lineage.semanticAddress;
    input.selectSemanticAddress(address);
    syncSemanticAddress(address);
  };
  const syncEndpointLocation = (): void => {
    const range = input.stageHost.dataset["kpAlgebraCanonicalRange"];
    const status = input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"];
    const progress = Number(
      input.stageHost.dataset["kpAlgebraCanonicalLocalProgress"]
    );
    if (range === undefined || range !== activePath || status === "playing" ||
        (progress !== 0 && progress !== 1_000)) return;
    writeProjectionLocation(range, progress === 1_000 ? 1 : 0, "replace");
  };
  const stageObserver = new MutationObserver(syncEndpointLocation);

  // This experiment isolates layout, so automatic operation-level dimming
  // must not make its live equation less readable than the static baseline.
  input.setAttention(["solve/equation"]);
  input.publication.addEventListener("click", onEquationClick);
  stageObserver.observe(input.stageHost, {
    attributes: true,
    attributeFilter: [
      "data-kp-algebra-canonical-range",
      "data-kp-algebra-canonical-range-status",
      "data-kp-algebra-canonical-local-progress"
    ]
  });
  select(
    readKpFractionCompositionEvidenceRange(input.ownerWindow.location.search),
    readKpFractionCompositionEvidenceProgress(input.ownerWindow.location.search),
    false
  );

  return Object.freeze({
    active: true,
    projection: input.projection,
    syncSemanticAddress,
    restoreProjection(search: string) {
      select(
        readKpFractionCompositionEvidenceRange(search),
        readKpFractionCompositionEvidenceProgress(search),
        false
      );
    },
    dispose() {
      input.pauseRange();
      input.setAttention([]);
      input.publication.removeEventListener("click", onEquationClick);
      stageObserver.disconnect();
      for (const { button, activate } of listeners) {
        button.removeEventListener("click", activate);
        button.disabled = true;
        button.removeAttribute("aria-pressed");
        button.textContent = "Animate this operation";
      }
      for (const { button, choose } of lineageListeners) {
        button.removeEventListener("click", choose);
        button.disabled = true;
        button.setAttribute("aria-pressed", "false");
      }
      for (const { slot, lineageRoot } of controls) {
        slot.removeAttribute("data-kp-algebra-evidence-active");
        lineageRoot.toggleAttribute("hidden", true);
      }
      for (const element of inspectableSelectors) {
        delete element.dataset["kpAlgebraLineageTarget"];
      }
      delete input.publication.dataset["kpAlgebraEvidenceProjection"];
      delete input.publication.dataset["kpAlgebraEvidenceActiveRange"];
      delete input.publication.dataset["kpAlgebraEvidenceLineage"];
      delete documentElement.dataset["kpAlgebraView"];
    }
  });
}

function lineageAtPointer(
  root: ParentNode,
  clientX: number,
  clientY: number
): KpFractionCompositionInspectionLineage | undefined {
  // The compositor may place a non-semantic KaTeX ancestor over the retained
  // selector wrapper. Bounds resolve that paint hit only after stable selector
  // IDs have supplied meaning, and ambiguity deliberately produces no action.
  const matches = new Map<string, KpFractionCompositionInspectionLineage>();
  for (const candidate of root.querySelectorAll<HTMLElement>(
    '[data-kp-reader-transition-active="true"] [data-kp-algebra-lineage-target]'
  )) {
    const bounds = candidate.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0 ||
        clientX < bounds.left || clientX > bounds.right ||
        clientY < bounds.top || clientY > bounds.bottom) continue;
    const lineage = resolveKpFractionCompositionInspectionLineageBySelector(
      requiredData(candidate, "kpReaderSelectorId")
    );
    if (lineage !== undefined) matches.set(lineage.id, lineage);
  }
  return matches.size === 1 ? [...matches.values()][0] : undefined;
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Distributed algebra evidence lacks ${selector}.`);
  }
  return element;
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`Distributed algebra evidence lacks data-${key}.`);
  }
  return value;
}

function plainActivation(event: MouseEvent): boolean {
  return event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey;
}

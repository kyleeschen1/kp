import type {
  KpAnimationCatalogueHostObservation
} from "./animation-catalogue-health.ts";
import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";

export interface KpAnimationCatalogueSurfaceSlotEvidence {
  readonly slotKind: KpEditorAnimationSurfaceSlotKind;
  readonly adapterStatus: "ready" | "missing" | "pending";
  readonly adapterId?: string | undefined;
  readonly painted: boolean;
  readonly unavailableMessage?: string | undefined;
}

export function observeKpAnimationCatalogueHost(
  root: ParentNode
): KpAnimationCatalogueHostObservation {
  const slots = [...root.querySelectorAll<HTMLElement>(
    "[data-kp-animation-catalogue-stage] " +
    "[data-kp-editor-animation-surface-slot]"
  )];
  if (slots.length === 0) {
    return Object.freeze({
      status: "failed" as const,
      message: "The catalogue host exposed no surface slots."
    });
  }

  return classifyKpAnimationCatalogueSlotEvidence(slots.flatMap((slot) => {
    const slotKind = slot.dataset["kpEditorAnimationSurfaceSlot"];
    if (!isSlotKind(slotKind)) return [];
    const unavailable = slot.querySelector<HTMLElement>(
      "[data-kp-editor-equation-unavailable], " +
      "[data-kp-editor-diagram-unavailable]"
    );
    const initialPlaceholder = slot.children.length === 1 &&
      slot.firstElementChild?.tagName === "SPAN";
    const status = slot.dataset["kpEditorAnimationAdapterStatus"];
    return [{
      slotKind,
      adapterStatus: status === "ready" || status === "missing"
        ? status
        : "pending" as const,
      ...(slot.dataset["kpEditorAnimationAdapterId"] === undefined
        ? {}
        : { adapterId: slot.dataset["kpEditorAnimationAdapterId"] }),
      painted: !initialPlaceholder && slot.childElementCount > 0,
      ...(unavailable?.textContent?.trim()
        ? { unavailableMessage: unavailable.textContent.trim() }
        : {})
    }];
  }));
}

export function classifyKpAnimationCatalogueSlotEvidence(
  slots: readonly KpAnimationCatalogueSurfaceSlotEvidence[]
): KpAnimationCatalogueHostObservation {
  const unavailable = slots.find(
    ({ unavailableMessage }) => unavailableMessage !== undefined
  );
  if (unavailable?.unavailableMessage !== undefined) {
    return Object.freeze({
      status: "failed" as const,
      message: unavailable.unavailableMessage
    });
  }
  if (slots.some(({ adapterStatus }) => adapterStatus === "missing")) {
    // Missing-adapter is terminal hostability evidence, not a paint failure.
    return Object.freeze({ status: "not-observed" as const });
  }
  if (slots.some(({ adapterStatus, adapterId, painted }) =>
    adapterStatus !== "ready" || adapterId === undefined || !painted
  )) {
    return Object.freeze({ status: "not-observed" as const });
  }
  return Object.freeze({ status: "painted" as const });
}

function isSlotKind(
  value: string | undefined
): value is KpEditorAnimationSurfaceSlotKind {
  return value === "equation" || value === "diagram" ||
    value === "graph" || value === "programming";
}

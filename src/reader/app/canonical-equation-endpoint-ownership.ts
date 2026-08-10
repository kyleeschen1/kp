import { checkKpEquationNativeEndpointLaw } from
  "../../rendering/equation-native-endpoint-law.ts";
import type {
  KpReaderEquationPerceptualAlignmentPlan,
  KpReaderEquationSymbolMotionFrame
} from "../renderers/public-api.ts";

export interface KpCanonicalEquationAccessibleOwnership {
  readonly stateIds: readonly string[];
  readonly sync: (objectId: string) => void;
  readonly inspect: () => string | undefined;
}

export interface KpCanonicalEquationNativeEndpointEvidence {
  readonly endpoint?: "source" | "target" | undefined;
  readonly passed: boolean;
  readonly maximumGeometryResidualPx: number;
  readonly failureCodes: readonly string[];
}

/** One live semantic equation state backs every visual host representation. */
export function createKpCanonicalEquationAccessibleOwnership(input: {
  readonly stage: HTMLElement;
}): KpCanonicalEquationAccessibleOwnership {
  const states = new Map(
    [...input.stage.querySelectorAll<HTMLElement>(
      "[data-kp-reader-accessible-equation-state]"
    )].map((element) => [
      requiredData(element, "kpReaderAccessibleEquationState"),
      element
    ] as const)
  );
  if (states.size === 0) {
    throw new Error("Canonical equation stage has no accessible equation states.");
  }
  return Object.freeze({
    stateIds: Object.freeze([...states.keys()]),
    sync(objectId: string) {
      if (!states.has(objectId)) {
        throw new Error(`Unknown accessible equation state ${objectId}.`);
      }
      if (input.stage.dataset["kpReaderAccessibleEquationState"] === objectId) {
        return;
      }
      for (const [candidateId, element] of states) {
        const active = candidateId === objectId;
        if (element.hidden === active) element.hidden = !active;
        if (active && element.getAttribute("aria-current") !== "step") {
          element.setAttribute("aria-current", "step");
        } else if (!active && element.hasAttribute("aria-current")) {
          element.removeAttribute("aria-current");
        }
      }
      input.stage.dataset["kpReaderAccessibleEquationState"] = objectId;
    },
    inspect() {
      return input.stage.dataset["kpReaderAccessibleEquationState"];
    }
  });
}

/**
 * Exact timeline endpoints must return paint authority to native KaTeX and
 * retain geometry continuity; intermediate frames deliberately report none.
 */
export function syncKpCanonicalEquationNativeEndpointEvidence(input: {
  readonly stage: HTMLElement;
  readonly motion: KpReaderEquationSymbolMotionFrame;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly phaseProgress: number;
}): KpCanonicalEquationNativeEndpointEvidence {
  const endpoint = input.phaseProgress === 0
    ? "source" as const
    : input.phaseProgress === 1
      ? "target" as const
      : undefined;
  if (endpoint === undefined) {
    for (const key of [
      "kpReaderNativeEndpoint",
      "kpReaderNativeEndpointPassed",
      "kpReaderNativeEndpointMaxResidual",
      "kpReaderNativeEndpointFailures"
    ]) {
      delete input.stage.dataset[key];
    }
    return Object.freeze({
      passed: true,
      maximumGeometryResidualPx: 0,
      failureCodes: Object.freeze([])
    });
  }
  const aligned = new Map(
    input.alignment.owners.map((owner) => [owner.ownerId, owner])
  );
  const results = input.motion.owners.map((owner) => {
    const endpoints = aligned.get(owner.ownerId);
    const nativeBounds = endpoint === "source"
      ? endpoints?.sourceBounds
      : endpoints?.targetBounds;
    return checkKpEquationNativeEndpointLaw({
      endpoint,
      nativePresent: nativeBounds !== undefined,
      handoff: {
        ownerId: owner.ownerId,
        progress: input.phaseProgress,
        materialOpacity: owner.materialOpacity,
        sourceNativeOpacity: owner.sourceNativeOpacity,
        targetNativeOpacity: owner.targetNativeOpacity,
        nativeHandoff: owner.sourceNativeOpacity > 0
          ? "source"
          : owner.targetNativeOpacity > 0
            ? "target"
            : "material"
      },
      ...(nativeBounds === undefined
        ? {}
        : { nativeBounds, materialBounds: owner.currentBounds })
    });
  });
  const residuals = results.flatMap((result) =>
    result.maximumGeometryResidualPx === undefined
      ? []
      : [result.maximumGeometryResidualPx]
  );
  const failureCodes = Object.freeze(results.flatMap((result) =>
    result.failures.map((failure) => `${result.ownerId}:${failure.code}`)
  ));
  const maximumGeometryResidualPx = residuals.length === 0
    ? 0
    : Math.max(...residuals);
  input.stage.dataset["kpReaderNativeEndpoint"] = endpoint;
  input.stage.dataset["kpReaderNativeEndpointPassed"] =
    String(failureCodes.length === 0);
  input.stage.dataset["kpReaderNativeEndpointMaxResidual"] =
    String(maximumGeometryResidualPx);
  input.stage.dataset["kpReaderNativeEndpointFailures"] = failureCodes.join(" ");
  return Object.freeze({
    endpoint,
    passed: failureCodes.length === 0,
    maximumGeometryResidualPx,
    failureCodes
  });
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing data-${key}.`);
  }
  return value;
}

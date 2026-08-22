import type { KpFiniteBinderSemanticId } from
  "../domain-ir/finite-binder-vocabulary.ts";
import {
  KP_FINITE_BINDER_EXPAND_OPERATION,
  type KpVerifiedFiniteBinderExpansionOperation
} from "../semantic/finite-binder-expansion-operation.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../semantic/canonical-finite-sum-expansion.ts";

export interface KpFiniteSumPresentationWindow {
  readonly start: number;
  readonly end: number;
}

export interface KpFiniteSumInstancePresentation {
  readonly ordinal: number;
  readonly bodyInstanceId: KpFiniteBinderSemanticId;
  readonly instantiatedReferenceId: KpFiniteBinderSemanticId;
  readonly bodyTransitWindow: KpFiniteSumPresentationWindow;
  readonly referenceReceptionWindow: KpFiniteSumPresentationWindow;
  readonly referenceReception: Readonly<{
    kind: "range-value-instantiation";
    sourceReferenceId: KpFiniteBinderSemanticId;
    value: number;
    valueSource: "lower-bound" | "range-successor" | "upper-bound";
    receptionWindow: KpFiniteSumPresentationWindow;
  }>;
  readonly precedingConnector?: Readonly<{
    connectorId: KpFiniteBinderSemanticId;
    receptionWindow: KpFiniteSumPresentationWindow;
  }> | undefined;
}

export interface KpFiniteSumExpansionPresentationPlan {
  readonly schemaVersion: "kp.finite-sum-expansion-presentation-plan.v1";
  readonly kind: "finite-sum-expansion-presentation-plan";
  readonly id: "presentation.finite-sum-expansion.canonical.v1";
  readonly maturity: "candidate-local-exemplar";
  readonly operationId: typeof KP_FINITE_BINDER_EXPAND_OPERATION;
  readonly direction: "forward";
  readonly topology: "ordered-template-fan-out";
  readonly stateRetention: Readonly<{
    policy: "equivalence-frame";
    source: "frozen-native-context";
    relation: "fixed-native-equality";
    target: "live-then-native";
  }>;
  readonly sourceHoldWindow: KpFiniteSumPresentationWindow;
  readonly templateFanOut: Readonly<{
    sourceBodyTemplateId: KpFiniteBinderSemanticId;
    topology: "one-source-to-ordered-distinct-instances";
    route: "direct-baseline";
    sourcePaint: "retained-context-with-live-derived-copies";
  }>;
  readonly instances: readonly KpFiniteSumInstancePresentation[];
  readonly targetHoldWindow: KpFiniteSumPresentationWindow;
  readonly accessibility: Readonly<{
    reducedMotion: "same-semantic-windows-with-direct-routes";
    static: "exact-native-endpoints";
  }>;
  readonly clock: Readonly<{
    authority: "one-normalized-external-clock";
    rendererScheduling: "forbidden";
  }>;
}

const SOURCE_HOLD = window(0, 0.08);
const BODY_TRANSIT_WINDOWS = Object.freeze([
  window(0.08, 0.28),
  window(0.3, 0.5),
  window(0.52, 0.72)
]);
const REFERENCE_RECEPTION_WINDOWS = Object.freeze([
  window(0.18, 0.28),
  window(0.4, 0.5),
  window(0.62, 0.72)
]);
const CONNECTOR_RECEPTION_WINDOWS = Object.freeze([
  window(0.5, 0.58),
  window(0.72, 0.8)
]);
const TARGET_HOLD = window(0.8, 1);

/**
 * This is intentionally exemplar-local. It records a reviewable hypothesis:
 * the body glyph fans out left-to-right, substituted indices arrive near
 * settlement, and a connector appears only after both adjacent terms exist.
 */
export function compileKpFiniteSumExpansionPresentationPlan(
  operation: KpVerifiedFiniteBinderExpansionOperation
): KpFiniteSumExpansionPresentationPlan {
  if (operation.operation !== KP_FINITE_BINDER_EXPAND_OPERATION ||
      operation.target.instances.length !== 3 ||
      operation.target.connectors.length !== 2) {
    throw new Error(
      "The candidate finite-sum presentation is limited to the reviewed three-term exemplar."
    );
  }
  const source = operation.source.semantic;
  const sourceReference = source.body.references[0];
  if (sourceReference === undefined) {
    throw new Error("Finite-sum presentation requires one source reference.");
  }
  const instances = operation.target.instances.map((instance, ordinal) => {
    const reference = instance.references[0];
    const bodyTransitWindow = BODY_TRANSIT_WINDOWS[ordinal];
    const referenceReceptionWindow = REFERENCE_RECEPTION_WINDOWS[ordinal];
    if (reference === undefined || bodyTransitWindow === undefined ||
        referenceReceptionWindow === undefined) {
      throw new Error("Finite-sum presentation lacks one ordered instance role.");
    }
    const connector = ordinal === 0
      ? undefined
      : operation.target.connectors[ordinal - 1];
    const connectorWindow = ordinal === 0
      ? undefined
      : CONNECTOR_RECEPTION_WINDOWS[ordinal - 1];
    const referenceReception = Object.freeze({
      kind: "range-value-instantiation" as const,
      sourceReferenceId: sourceReference.id,
      value: instance.indexValue,
      valueSource: ordinal === 0
        ? "lower-bound" as const
        : ordinal === operation.target.instances.length - 1
          ? "upper-bound" as const
          : "range-successor" as const,
      receptionWindow: referenceReceptionWindow
    });
    return Object.freeze({
      ordinal,
      bodyInstanceId: instance.id,
      instantiatedReferenceId: reference.id,
      bodyTransitWindow,
      referenceReceptionWindow,
      referenceReception,
      ...(connector === undefined || connectorWindow === undefined
        ? {}
        : {
            precedingConnector: Object.freeze({
              connectorId: connector.id,
              receptionWindow: connectorWindow
            })
          })
    });
  });
  const plan = Object.freeze({
    schemaVersion: "kp.finite-sum-expansion-presentation-plan.v1" as const,
    kind: "finite-sum-expansion-presentation-plan" as const,
    id: "presentation.finite-sum-expansion.canonical.v1" as const,
    maturity: "candidate-local-exemplar" as const,
    operationId: operation.operation,
    direction: "forward" as const,
    topology: "ordered-template-fan-out" as const,
    stateRetention: Object.freeze({
      policy: "equivalence-frame" as const,
      source: "frozen-native-context" as const,
      relation: "fixed-native-equality" as const,
      target: "live-then-native" as const
    }),
    sourceHoldWindow: SOURCE_HOLD,
    templateFanOut: Object.freeze({
      sourceBodyTemplateId: source.body.id,
      topology: "one-source-to-ordered-distinct-instances" as const,
      route: "direct-baseline" as const,
      sourcePaint: "retained-context-with-live-derived-copies" as const
    }),
    instances: Object.freeze(instances),
    targetHoldWindow: TARGET_HOLD,
    accessibility: Object.freeze({
      reducedMotion: "same-semantic-windows-with-direct-routes" as const,
      static: "exact-native-endpoints" as const
    }),
    clock: Object.freeze({
      authority: "one-normalized-external-clock" as const,
      rendererScheduling: "forbidden" as const
    })
  });
  assertCausalTiming(plan);
  return plan;
}

export const kpCanonicalFiniteSumExpansionPresentationPlan =
  compileKpFiniteSumExpansionPresentationPlan(
    kpCanonicalFiniteSumExpansionOperation
  );

function assertCausalTiming(
  plan: KpFiniteSumExpansionPresentationPlan
): void {
  for (const instance of plan.instances) {
    if (instance.referenceReceptionWindow.end <
        instance.bodyTransitWindow.end) {
      throw new Error(
        `Instance ${instance.ordinal} reference settles before its body.`
      );
    }
    const connector = instance.precedingConnector;
    const previous = plan.instances[instance.ordinal - 1];
    if (connector !== undefined && previous !== undefined &&
        connector.receptionWindow.start <
          Math.max(
            previous.referenceReceptionWindow.end,
            instance.referenceReceptionWindow.end
          )) {
      throw new Error(
        `Connector ${connector.connectorId} precedes its adjacent terms.`
      );
    }
  }
  if (plan.targetHoldWindow.start <
      Math.max(...plan.instances.map((instance) =>
        instance.precedingConnector?.receptionWindow.end ??
        instance.referenceReceptionWindow.end
      ))) {
    throw new Error("Finite-sum target hold begins before syntax settles.");
  }
}

function window(start: number, end: number): KpFiniteSumPresentationWindow {
  if (!Number.isFinite(start) || !Number.isFinite(end) ||
      start < 0 || end > 1 || start > end) {
    throw new Error("Finite-sum presentation windows must be ordered in [0, 1].");
  }
  return Object.freeze({ start, end });
}

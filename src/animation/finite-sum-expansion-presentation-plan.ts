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
  readonly referenceReception:
    | Readonly<{
        kind: "boundary-transfer";
        boundaryRole: "lower-bound" | "upper-bound";
        sourceBoundaryId: KpFiniteBinderSemanticId;
        transitWindow: KpFiniteSumPresentationWindow;
      }>
    | Readonly<{
        kind: "range-successor-instantiation";
        sourceReferenceId: KpFiniteBinderSemanticId;
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
  readonly sourceHoldWindow: KpFiniteSumPresentationWindow;
  readonly sourceScopeWithdrawal: Readonly<{
    topology: "collapse-toward-operator-center";
    operatorId: KpFiniteBinderSemanticId;
    cohortIds: readonly KpFiniteBinderSemanticId[];
    contractionWindow: KpFiniteSumPresentationWindow;
    presenceWindow: KpFiniteSumPresentationWindow;
  }>;
  readonly templateFanOut: Readonly<{
    sourceBodyTemplateId: KpFiniteBinderSemanticId;
    topology: "one-source-to-ordered-distinct-instances";
    route: "direct-baseline";
    sourcePaint: "opaque-until-branches-separate";
  }>;
  readonly sourceReferenceWithdrawal: Readonly<{
    sourceReferenceId: KpFiniteBinderSemanticId;
    topology: "withdraw-before-substituted-reference-reception";
    presenceWindow: KpFiniteSumPresentationWindow;
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

const SOURCE_HOLD = window(0, 0.14);
const SOURCE_SCOPE_CONTRACTION = window(0.14, 0.25);
const SOURCE_SCOPE_PRESENCE = window(0.18, 0.29);
const SOURCE_REFERENCE_PRESENCE = window(0.18, 0.29);
const BODY_TRANSIT_WINDOWS = Object.freeze([
  window(0.22, 0.46),
  window(0.34, 0.58),
  window(0.46, 0.7)
]);
const REFERENCE_RECEPTION_WINDOWS = Object.freeze([
  window(0.18, 0.48),
  window(0.5, 0.6),
  window(0.18, 0.72)
]);
const CONNECTOR_RECEPTION_WINDOWS = Object.freeze([
  window(0.6, 0.68),
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
    const isFirst = ordinal === 0;
    const isLast = ordinal === operation.target.instances.length - 1;
    const referenceReception = isFirst || isLast
      ? Object.freeze({
          kind: "boundary-transfer" as const,
          boundaryRole: isFirst ? "lower-bound" as const : "upper-bound" as const,
          sourceBoundaryId: isFirst
            ? source.lowerBound.id
            : source.upperBound.id,
          transitWindow: referenceReceptionWindow
        })
      : Object.freeze({
          kind: "range-successor-instantiation" as const,
          sourceReferenceId: sourceReference.id,
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
    sourceHoldWindow: SOURCE_HOLD,
    sourceScopeWithdrawal: Object.freeze({
      topology: "collapse-toward-operator-center" as const,
      operatorId: source.operator.id,
      cohortIds: Object.freeze([
        source.operator.id,
        source.binder.id
      ]),
      contractionWindow: SOURCE_SCOPE_CONTRACTION,
      presenceWindow: SOURCE_SCOPE_PRESENCE
    }),
    templateFanOut: Object.freeze({
      sourceBodyTemplateId: source.body.id,
      topology: "one-source-to-ordered-distinct-instances" as const,
      route: "direct-baseline" as const,
      sourcePaint: "opaque-until-branches-separate" as const
    }),
    sourceReferenceWithdrawal: Object.freeze({
      sourceReferenceId: sourceReference.id,
      topology:
        "withdraw-before-substituted-reference-reception" as const,
      presenceWindow: SOURCE_REFERENCE_PRESENCE
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

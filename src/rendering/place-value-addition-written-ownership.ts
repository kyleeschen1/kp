declare const kpPlaceValueWrittenOwnershipBrand: unique symbol;

const sealedOwnershipPlans = new WeakSet<object>();

export type KpPlaceValuePersistentWrittenCellId =
  | "digit.first.ones"
  | "digit.second.ones"
  | "operator.add"
  | "rule.addition.underline"
  | "result.ones"
  | "carry.tens";

export type KpPlaceValueOnesMotionProxyId =
  | "proxy.place-value.ones.first-contribution"
  | "proxy.place-value.ones.second-contribution"
  | "proxy.place-value.ones.addition-catalyst"
  | "proxy.place-value.ones.total-tens"
  | "proxy.place-value.ones.total-ones"
  | "proxy.place-value.ones.evaluated-total"
  | "proxy.place-value.ones.result"
  | "proxy.place-value.ones.carry";

export interface KpPlaceValuePersistentWrittenCell {
  readonly role: "persistent-written-cell" | "stationary-operator";
  readonly semanticEntityId: KpPlaceValuePersistentWrittenCellId;
  readonly nodePolicy: "same-connected-node";
  readonly geometryPolicy: "stationary";
  readonly consumptionPolicy: "remain-opaque" | "dim-documentary-source";
}

export interface KpPlaceValueWrittenMotionProxy {
  readonly role: "contribution-proxy" | "semantic-catalyst-proxy";
  readonly proxySelectorId: KpPlaceValueOnesMotionProxyId;
  readonly sourceCellId:
    | "digit.first.ones"
    | "digit.second.ones"
    | "operator.add";
  readonly originPolicy: "exact-source-paint-rect";
  readonly paintPolicy: "visible-motion" | "compiler-only-stationary-paint";
  readonly bindingAnnotationId:
    | "annotation.ones.material.0"
    | "annotation.ones.material.1"
    | "annotation.ones.plus";
  readonly documentaryClearanceSide?: "above" | "below" | undefined;
}

export interface KpPlaceValueWrittenDerivedOutputProxy {
  readonly role: "derived-output";
  readonly proxySelectorId:
    | "proxy.place-value.ones.result"
    | "proxy.place-value.ones.carry";
  readonly targetCellId: "result.ones" | "carry.tens";
  readonly settlementPolicy: "persistent-native-slot";
}

export interface KpPlaceValueWrittenTransientOutputProxy {
  readonly role: "derived-output" | "contribution-proxy";
  readonly proxySelectorId:
    | "proxy.place-value.ones.total-tens"
    | "proxy.place-value.ones.total-ones"
    | "proxy.place-value.ones.evaluated-total";
  readonly semanticEntityId:
    | "evaluation.ones.total.tens"
    | "evaluation.ones.total.ones"
    | "evaluation.ones.total";
  readonly settlementPolicy: "transient-motion-owner";
}

export interface KpPlaceValueOnesWrittenOwnershipPlan {
  readonly schemaVersion: "kp.place-value-written-ownership.v1";
  readonly persistentCells: readonly [
    KpPlaceValuePersistentWrittenCell,
    KpPlaceValuePersistentWrittenCell,
    KpPlaceValuePersistentWrittenCell,
    KpPlaceValuePersistentWrittenCell,
    KpPlaceValuePersistentWrittenCell,
    KpPlaceValuePersistentWrittenCell
  ];
  readonly contributionProxies: readonly [
    KpPlaceValueWrittenMotionProxy & {
      readonly role: "contribution-proxy";
      readonly sourceCellId: "digit.first.ones";
      readonly documentaryClearanceSide: "above";
    },
    KpPlaceValueWrittenMotionProxy & {
      readonly role: "contribution-proxy";
      readonly sourceCellId: "digit.second.ones";
      readonly documentaryClearanceSide: "below";
    }
  ];
  readonly catalystProxy: KpPlaceValueWrittenMotionProxy & {
    readonly role: "semantic-catalyst-proxy";
    readonly sourceCellId: "operator.add";
    readonly paintPolicy: "compiler-only-stationary-paint";
  };
  readonly derivedOutputProxies: readonly [
    KpPlaceValueWrittenDerivedOutputProxy & {
      readonly targetCellId: "result.ones";
    },
    KpPlaceValueWrittenDerivedOutputProxy & {
      readonly targetCellId: "carry.tens";
    }
  ];
  readonly evaluationOutputProxies: readonly [
    KpPlaceValueWrittenTransientOutputProxy & {
      readonly semanticEntityId: "evaluation.ones.total.tens";
    },
    KpPlaceValueWrittenTransientOutputProxy & {
      readonly semanticEntityId: "evaluation.ones.total.ones";
    }
  ];
  readonly evaluatedTotalProxy:
    KpPlaceValueWrittenTransientOutputProxy & {
      readonly role: "contribution-proxy";
      readonly semanticEntityId: "evaluation.ones.total";
    };
  readonly [kpPlaceValueWrittenOwnershipBrand]: true;
}

/**
 * Written arithmetic is a documentary workspace, not a succession endpoint.
 * These roles keep the stable cells out of moving compositor bindings; only
 * compiler-minted paint proxies may carry an operation through the overlay.
 */
export function compileKpPlaceValueOnesWrittenOwnership():
KpPlaceValueOnesWrittenOwnershipPlan {
  const persistentCell = (
    semanticEntityId: KpPlaceValuePersistentWrittenCellId,
    role: KpPlaceValuePersistentWrittenCell["role"],
    consumptionPolicy:
      KpPlaceValuePersistentWrittenCell["consumptionPolicy"]
  ): KpPlaceValuePersistentWrittenCell => Object.freeze({
    role,
    semanticEntityId,
    nodePolicy: "same-connected-node",
    geometryPolicy: "stationary",
    consumptionPolicy
  });
  const contributionProxy = (
    proxySelectorId: KpPlaceValueOnesMotionProxyId,
    sourceCellId: "digit.first.ones" | "digit.second.ones",
    bindingAnnotationId:
      | "annotation.ones.material.0"
      | "annotation.ones.material.1",
    documentaryClearanceSide: "above" | "below"
  ) => Object.freeze({
    role: "contribution-proxy" as const,
    proxySelectorId,
    sourceCellId,
    originPolicy: "exact-source-paint-rect" as const,
    paintPolicy: "visible-motion" as const,
    bindingAnnotationId,
    documentaryClearanceSide
  });
  const plan = Object.freeze({
    schemaVersion: "kp.place-value-written-ownership.v1" as const,
    persistentCells: Object.freeze([
      persistentCell(
        "digit.first.ones",
        "persistent-written-cell",
        "dim-documentary-source"
      ),
      persistentCell(
        "digit.second.ones",
        "persistent-written-cell",
        "dim-documentary-source"
      ),
      persistentCell(
        "operator.add",
        "stationary-operator",
        "remain-opaque"
      ),
      persistentCell(
        "rule.addition.underline",
        "stationary-operator",
        "remain-opaque"
      ),
      persistentCell(
        "result.ones",
        "persistent-written-cell",
        "remain-opaque"
      ),
      persistentCell(
        "carry.tens",
        "persistent-written-cell",
        "remain-opaque"
      )
    ] as const),
    contributionProxies: Object.freeze([
      contributionProxy(
        "proxy.place-value.ones.first-contribution",
        "digit.first.ones",
        "annotation.ones.material.0",
        "above"
      ),
      contributionProxy(
        "proxy.place-value.ones.second-contribution",
        "digit.second.ones",
        "annotation.ones.material.1",
        "below"
      )
    ] as const),
    catalystProxy: Object.freeze({
      role: "semantic-catalyst-proxy" as const,
      proxySelectorId:
        "proxy.place-value.ones.addition-catalyst" as const,
      sourceCellId: "operator.add" as const,
      originPolicy: "exact-source-paint-rect" as const,
      paintPolicy: "compiler-only-stationary-paint" as const,
      bindingAnnotationId: "annotation.ones.plus" as const
    }),
    derivedOutputProxies: Object.freeze([
      Object.freeze({
        role: "derived-output" as const,
        proxySelectorId: "proxy.place-value.ones.result" as const,
        targetCellId: "result.ones" as const,
        settlementPolicy: "persistent-native-slot" as const
      }),
      Object.freeze({
        role: "derived-output" as const,
        proxySelectorId: "proxy.place-value.ones.carry" as const,
        targetCellId: "carry.tens" as const,
        settlementPolicy: "persistent-native-slot" as const
      })
    ] as const),
    evaluationOutputProxies: Object.freeze([
      Object.freeze({
        role: "derived-output" as const,
        proxySelectorId: "proxy.place-value.ones.total-tens" as const,
        semanticEntityId: "evaluation.ones.total.tens" as const,
        settlementPolicy: "transient-motion-owner" as const
      }),
      Object.freeze({
        role: "derived-output" as const,
        proxySelectorId: "proxy.place-value.ones.total-ones" as const,
        semanticEntityId: "evaluation.ones.total.ones" as const,
        settlementPolicy: "transient-motion-owner" as const
      })
    ] as const),
    evaluatedTotalProxy: Object.freeze({
      role: "contribution-proxy" as const,
      proxySelectorId: "proxy.place-value.ones.evaluated-total" as const,
      semanticEntityId: "evaluation.ones.total" as const,
      settlementPolicy: "transient-motion-owner" as const
    })
  });
  sealedOwnershipPlans.add(plan);
  return plan as unknown as KpPlaceValueOnesWrittenOwnershipPlan;
}

export function isKpPlaceValueOnesWrittenOwnershipPlan(
  value: unknown
): value is KpPlaceValueOnesWrittenOwnershipPlan {
  return typeof value === "object" &&
    value !== null &&
    sealedOwnershipPlans.has(value);
}

export function bindKpPlaceValueWrittenMotionProxy(
  proxy:
    | KpPlaceValueWrittenMotionProxy
    | KpPlaceValueWrittenDerivedOutputProxy
    | KpPlaceValueWrittenTransientOutputProxy
): KpPlaceValueOnesMotionProxyId {
  return proxy.proxySelectorId;
}

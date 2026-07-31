import type {
  KpExactRadixPosition,
  KpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-types.ts";

declare const kpPlaceValueWrittenOwnershipBrand: unique symbol;

const sealedOwnershipPlans = new WeakSet<object>();

export type KpPlaceValueMotionProxyId =
  `proxy.place-value.${string}.${string}`;

export interface KpPlaceValuePersistentWrittenCell {
  readonly role: "persistent-written-cell" | "stationary-operator";
  readonly semanticEntityId: string;
  readonly nodePolicy: "same-connected-node";
  readonly geometryPolicy: "stationary";
  readonly consumptionPolicy: "remain-opaque" | "dim-documentary-source";
}

export interface KpPlaceValueWrittenMotionProxy {
  readonly role: "contribution-proxy" | "semantic-catalyst-proxy";
  readonly proxySelectorId: KpPlaceValueMotionProxyId;
  readonly sourceCellId: string;
  readonly originPolicy: "exact-source-paint-rect";
  readonly paintPolicy: "visible-motion" | "compiler-only-stationary-paint";
  readonly bindingAnnotationId: string;
  readonly contributorKind?: "incoming-carry" | "operand-digit" | undefined;
  readonly documentaryClearanceSide?: "above" | "below" | undefined;
}

export interface KpPlaceValueWrittenDerivedOutputProxy {
  readonly role: "derived-output";
  readonly proxySelectorId: KpPlaceValueMotionProxyId;
  readonly targetCellId: string;
  readonly settlementPolicy: "persistent-native-slot";
}

export interface KpPlaceValueWrittenTransientOutputProxy {
  readonly role: "derived-output" | "contribution-proxy";
  readonly proxySelectorId: KpPlaceValueMotionProxyId;
  readonly semanticEntityId: string;
  readonly settlementPolicy: "transient-motion-owner";
}

export interface KpPlaceValueWrittenOwnershipPlan {
  readonly schemaVersion: "kp.place-value-written-ownership.v2";
  readonly position: KpExactRadixPosition;
  readonly evaluationBeatId: string;
  readonly exchangeBeatId?: string | undefined;
  readonly contributionDestinationPolicy:
    "measured-evaluated-total-native-paint";
  readonly persistentCells: readonly KpPlaceValuePersistentWrittenCell[];
  readonly contributionProxies: readonly (
    KpPlaceValueWrittenMotionProxy & {
      readonly role: "contribution-proxy";
      readonly documentaryClearanceSide: "above" | "below";
    }
  )[];
  readonly catalystProxy: KpPlaceValueWrittenMotionProxy & {
    readonly role: "semantic-catalyst-proxy";
    readonly sourceCellId: "operator.add";
    readonly paintPolicy: "compiler-only-stationary-paint";
  };
  readonly derivedOutputProxies:
    readonly KpPlaceValueWrittenDerivedOutputProxy[];
  readonly evaluationOutputProxies: readonly (
    KpPlaceValueWrittenTransientOutputProxy & {
      readonly role: "derived-output";
    }
  )[];
  readonly evaluatedTotalProxy:
    KpPlaceValueWrittenTransientOutputProxy & {
      readonly role: "contribution-proxy";
    };
  readonly [kpPlaceValueWrittenOwnershipBrand]: true;
}

/**
 * Written arithmetic is a documentary workspace, not a succession endpoint.
 * The input is an ordered position program rather than a named decimal place:
 * the type forces every caller through the same stationary-cell/proxy split,
 * including future negative exponents and uneven operand widths.
 */
export function compileKpPlaceValueWrittenOwnership(
  program: KpPlaceValuePositionProgram
): KpPlaceValueWrittenOwnershipPlan {
  // The evaluation/exchange compilers validate the nominal program before
  // entering this lightweight type-only layer; repeating that import here
  // would drag the fixture compiler into every static ownership check.
  const namespace = program.position.id;
  const persistentCell = (
    semanticEntityId: string,
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
  const contributionProxies = program.evaluation.contributorCellIds.map(
    (sourceCellId, index) => Object.freeze({
      role: "contribution-proxy" as const,
      proxySelectorId:
        `proxy.place-value.${namespace}.contribution-${index}` as const,
      sourceCellId,
      originPolicy: "exact-source-paint-rect" as const,
      paintPolicy: "visible-motion" as const,
      bindingAnnotationId:
        `annotation.${namespace}.material.${index}`,
      contributorKind:
        sourceCellId === program.evaluation.incomingCarryCellId
          ? "incoming-carry" as const
          : "operand-digit" as const,
      documentaryClearanceSide:
        index % 2 === 0 ? "above" as const : "below" as const
    })
  ) as unknown as KpPlaceValueWrittenOwnershipPlan[
    "contributionProxies"
  ];
  const outputCellIds = program.exchange?.outputCellIds ?? [];
  const uniquePersistentIds = new Set<string>([
    ...program.evaluation.contributorCellIds,
    "operator.add",
    "rule.addition.underline",
    ...outputCellIds,
    ...program.evaluation.evaluationDigits
      .map(({ semanticEntityId }) => semanticEntityId)
      .filter((id) => id.startsWith("result."))
  ]);
  const persistentCells = [...uniquePersistentIds].map((id) =>
    persistentCell(
      id,
      id === "operator.add" || id === "rule.addition.underline"
        ? "stationary-operator"
        : "persistent-written-cell",
      program.evaluation.contributorCellIds.includes(id)
        ? "dim-documentary-source"
        : "remain-opaque"
    )
  );
  const plan = Object.freeze({
    schemaVersion: "kp.place-value-written-ownership.v2" as const,
    position: program.position,
    evaluationBeatId: program.evaluation.beatId,
    ...(program.exchange === undefined
      ? {}
      : { exchangeBeatId: program.exchange.beatId }),
    contributionDestinationPolicy:
      "measured-evaluated-total-native-paint" as const,
    persistentCells: Object.freeze(persistentCells),
    contributionProxies: Object.freeze(contributionProxies),
    catalystProxy: Object.freeze({
      role: "semantic-catalyst-proxy" as const,
      proxySelectorId:
        `proxy.place-value.${namespace}.addition-catalyst` as const,
      sourceCellId: "operator.add" as const,
      originPolicy: "exact-source-paint-rect" as const,
      paintPolicy: "compiler-only-stationary-paint" as const,
      bindingAnnotationId: `annotation.${namespace}.plus`
    }),
    derivedOutputProxies: Object.freeze(outputCellIds.map(
      (targetCellId, index) => Object.freeze({
        role: "derived-output" as const,
        proxySelectorId:
          `proxy.place-value.${namespace}.settled-output-${index}` as const,
        targetCellId,
        settlementPolicy: "persistent-native-slot" as const
      })
    )),
    evaluationOutputProxies: Object.freeze(
      program.evaluation.evaluationDigits.map(
        ({ semanticEntityId }, index) => Object.freeze({
          role: "derived-output" as const,
          proxySelectorId:
            `proxy.place-value.${namespace}.evaluated-digit-${index}` as const,
          semanticEntityId,
          settlementPolicy: "transient-motion-owner" as const
        })
      )
    ),
    evaluatedTotalProxy: Object.freeze({
      role: "contribution-proxy" as const,
      proxySelectorId:
        `proxy.place-value.${namespace}.evaluated-total` as const,
      semanticEntityId: program.evaluation.evaluatedTotalEntityId,
      settlementPolicy: "transient-motion-owner" as const
    })
  });
  sealedOwnershipPlans.add(plan);
  return plan as unknown as KpPlaceValueWrittenOwnershipPlan;
}

export function isKpPlaceValueWrittenOwnershipPlan(
  value: unknown
): value is KpPlaceValueWrittenOwnershipPlan {
  return typeof value === "object" &&
    value !== null &&
    sealedOwnershipPlans.has(value);
}

export function bindKpPlaceValueWrittenMotionProxy(
  proxy:
    | KpPlaceValueWrittenMotionProxy
    | KpPlaceValueWrittenDerivedOutputProxy
    | KpPlaceValueWrittenTransientOutputProxy
): KpPlaceValueMotionProxyId {
  return proxy.proxySelectorId;
}

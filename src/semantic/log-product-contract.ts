import { kpLogProductAnimationId } from "./log-product-ids.ts";
import {
  kpCanonicalLogProductStates,
  listKpLogProductExpressionNodes,
  type KpLogProductSemanticId,
  type KpLogProductState
} from "./log-product-states.ts";

export type KpLogProductAssumptionId =
  | "assumption.log-product.x-positive"
  | "assumption.log-product.y-positive"
  | "assumption.log-product.natural-base"
  | "assumption.log-product.product-positive";

export interface KpLogProductDomainAssumption {
  readonly id: KpLogProductAssumptionId;
  readonly predicate: string;
  readonly status: "required" | "derived";
  readonly summary: string;
}

export interface KpLogProductContract {
  readonly schemaVersion: "kp.log-product-contract.v1";
  readonly id: "contract.log-product.product-to-sum";
  readonly animationId: typeof kpLogProductAnimationId;
  readonly lawId: "law.logarithm.product";
  readonly direction: "expand-product-into-sum";
  readonly domain: {
    readonly logarithmBase: "e";
    readonly assumptions: readonly KpLogProductDomainAssumption[];
  };
  readonly assumptionIds: readonly KpLogProductAssumptionId[];
  readonly source: KpLogProductState;
  readonly target: KpLogProductState;
  readonly rewriteFrontier: {
    readonly kind: "standalone-expression";
    readonly sourceRootId: string;
    readonly targetRootId: string;
    readonly anchoredContextSemanticIds: readonly [];
  };
  readonly lineage: {
    readonly persistentSemanticIds: readonly [
      "semantic.log-product.variable.x",
      "semantic.log-product.variable.y"
    ];
    readonly derivedCohorts: readonly {
      readonly id: string;
      readonly relation: "one-to-many";
      readonly sourceSemanticIds: readonly KpLogProductSemanticId[];
      readonly targetSemanticIds: readonly KpLogProductSemanticId[];
      readonly summary: string;
    }[];
    readonly forbiddenIdentityPairs: readonly {
      readonly sourceSemanticId: KpLogProductSemanticId;
      readonly targetSemanticId: KpLogProductSemanticId;
      readonly summary: string;
    }[];
  };
  readonly structuralRequirements: readonly {
    readonly kind:
      | "split-application-shell"
      | "preserve-ordered-arguments"
      | "derive-additive-connector"
      | "settle-native-target";
    readonly entitySemanticIds: readonly KpLogProductSemanticId[];
  }[];
  readonly rewind: {
    readonly targetStateId: "log-product.state.product";
    readonly exactLatex: "\\ln(xy)";
  };
}

export function createKpCanonicalLogProductContract(input: {
  readonly states?: readonly KpLogProductState[] | undefined;
} = {}): KpLogProductContract {
  const states = input.states ?? kpCanonicalLogProductStates;
  const source = states[0];
  const target = states[1];
  if (
    states.length !== 2 ||
    source?.id !== "log-product.state.product" ||
    target?.id !== "log-product.state.sum" ||
    source.latex !== "\\ln(xy)" ||
    target.latex !== "\\ln(x)+\\ln(y)"
  ) {
    throw new Error("The log-product contract requires its exact ordered endpoint pair.");
  }
  const assumptions = Object.freeze([
    assumption(
      "assumption.log-product.x-positive",
      "x > 0",
      "required",
      "The first factor lies in the natural logarithm domain."
    ),
    assumption(
      "assumption.log-product.y-positive",
      "y > 0",
      "required",
      "The second factor lies in the natural logarithm domain."
    ),
    assumption(
      "assumption.log-product.natural-base",
      "base = e",
      "required",
      "Every application uses the same natural-logarithm base."
    ),
    assumption(
      "assumption.log-product.product-positive",
      "xy > 0",
      "derived",
      "The product is positive because both factors are positive."
    )
  ]);
  const contract = Object.freeze({
    schemaVersion: "kp.log-product-contract.v1" as const,
    id: "contract.log-product.product-to-sum" as const,
    animationId: kpLogProductAnimationId,
    lawId: "law.logarithm.product" as const,
    direction: "expand-product-into-sum" as const,
    domain: Object.freeze({
      logarithmBase: "e" as const,
      assumptions
    }),
    assumptionIds: Object.freeze(assumptions.map(({ id }) => id)),
    source,
    target,
    rewriteFrontier: Object.freeze({
      kind: "standalone-expression" as const,
      sourceRootId: source.root.id,
      targetRootId: target.root.id,
      anchoredContextSemanticIds: Object.freeze([] as const)
    }),
    lineage: Object.freeze({
      persistentSemanticIds: Object.freeze([
        "semantic.log-product.variable.x",
        "semantic.log-product.variable.y"
      ] as const),
      derivedCohorts: Object.freeze([
        cohort(
          "cohort.log-product.applications",
          ["semantic.log-product.wrapper.source"],
          [
            "semantic.log-product.wrapper.target-left",
            "semantic.log-product.wrapper.target-right"
          ],
          "One logarithm application derives two ordered applications."
        ),
        cohort(
          "cohort.log-product.operators",
          ["semantic.log-product.wrapper.source.operator"],
          [
            "semantic.log-product.wrapper.target-left.operator",
            "semantic.log-product.wrapper.target-right.operator"
          ],
          "The source ln operator derives both target ln operators."
        ),
        cohort(
          "cohort.log-product.open-shells",
          ["semantic.log-product.wrapper.source.open"],
          [
            "semantic.log-product.wrapper.target-left.open",
            "semantic.log-product.wrapper.target-right.open"
          ],
          "The source opening shell derives one opening shell per target application."
        ),
        cohort(
          "cohort.log-product.close-shells",
          ["semantic.log-product.wrapper.source.close"],
          [
            "semantic.log-product.wrapper.target-left.close",
            "semantic.log-product.wrapper.target-right.close"
          ],
          "The source closing shell derives one closing shell per target application."
        ),
        cohort(
          "cohort.log-product.homomorphic-structure",
          ["semantic.log-product.product.xy"],
          [
            "semantic.log-product.sum.logs",
            "semantic.log-product.connector.plus"
          ],
          "Product structure derives the additive result and its connector without glyph identity."
        )
      ]),
      forbiddenIdentityPairs: Object.freeze([Object.freeze({
        sourceSemanticId: "semantic.log-product.product.xy" as const,
        targetSemanticId: "semantic.log-product.connector.plus" as const,
        summary:
          "The product law licenses the plus connector, but product structure is not plus-glyph identity."
      })])
    }),
    structuralRequirements: Object.freeze([
      requirement("split-application-shell", [
        "semantic.log-product.wrapper.source",
        "semantic.log-product.wrapper.source.operator",
        "semantic.log-product.wrapper.source.open",
        "semantic.log-product.wrapper.source.close",
        "semantic.log-product.wrapper.target-left",
        "semantic.log-product.wrapper.target-left.operator",
        "semantic.log-product.wrapper.target-left.open",
        "semantic.log-product.wrapper.target-left.close",
        "semantic.log-product.wrapper.target-right",
        "semantic.log-product.wrapper.target-right.operator",
        "semantic.log-product.wrapper.target-right.open",
        "semantic.log-product.wrapper.target-right.close"
      ]),
      requirement("preserve-ordered-arguments", [
        "semantic.log-product.variable.x",
        "semantic.log-product.variable.y"
      ]),
      requirement("derive-additive-connector", [
        "semantic.log-product.product.xy",
        "semantic.log-product.sum.logs",
        "semantic.log-product.connector.plus"
      ]),
      requirement("settle-native-target", [
        "semantic.log-product.sum.logs"
      ])
    ]),
    rewind: Object.freeze({
      targetStateId: "log-product.state.product" as const,
      exactLatex: "\\ln(xy)" as const
    })
  } satisfies KpLogProductContract);
  validateContractCoverage(contract);
  return contract;
}

export const kpCanonicalLogProductContract =
  createKpCanonicalLogProductContract();

function assumption(
  id: KpLogProductAssumptionId,
  predicate: string,
  status: "required" | "derived",
  summary: string
): KpLogProductDomainAssumption {
  return Object.freeze({ id, predicate, status, summary });
}

function cohort(
  id: string,
  sourceSemanticIds: readonly KpLogProductSemanticId[],
  targetSemanticIds: readonly KpLogProductSemanticId[],
  summary: string
) {
  return Object.freeze({
    id,
    relation: "one-to-many" as const,
    sourceSemanticIds: Object.freeze([...sourceSemanticIds]),
    targetSemanticIds: Object.freeze([...targetSemanticIds]),
    summary
  });
}

function requirement(
  kind: KpLogProductContract["structuralRequirements"][number]["kind"],
  entitySemanticIds: readonly KpLogProductSemanticId[]
) {
  return Object.freeze({
    kind,
    entitySemanticIds: Object.freeze([...entitySemanticIds])
  });
}

function validateContractCoverage(contract: KpLogProductContract): void {
  const sourceIds = new Set(listKpLogProductExpressionNodes(contract.source)
    .map(({ semanticId }) => semanticId));
  const targetIds = new Set(listKpLogProductExpressionNodes(contract.target)
    .map(({ semanticId }) => semanticId));
  const classifiedSource = [
    ...contract.lineage.persistentSemanticIds,
    ...contract.lineage.derivedCohorts.flatMap(({ sourceSemanticIds }) =>
      sourceSemanticIds
    )
  ];
  const classifiedTarget = [
    ...contract.lineage.persistentSemanticIds,
    ...contract.lineage.derivedCohorts.flatMap(({ targetSemanticIds }) =>
      targetSemanticIds
    )
  ];
  assertExactCoverage("source", sourceIds, classifiedSource);
  assertExactCoverage("target", targetIds, classifiedTarget);
}

function assertExactCoverage(
  endpoint: "source" | "target",
  expected: ReadonlySet<KpLogProductSemanticId>,
  actual: readonly KpLogProductSemanticId[]
): void {
  if (
    actual.length !== expected.size ||
    new Set(actual).size !== actual.length ||
    actual.some((id) => !expected.has(id))
  ) {
    throw new Error(
      `Log-product ${endpoint} lineage must classify every semantic entity exactly once.`
    );
  }
}

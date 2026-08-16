import type { KpLogProductAnimationId } from "./log-product-ids.ts";
import {
  kpCanonicalLogProductFamily,
  kpMultiFactorLogProductFamily,
  listKpLogProductExpressionNodes,
  type KpLogProductFamily,
  type KpLogProductSemanticId,
  type KpLogProductState
} from "./log-product-states.ts";

export type KpLogProductAssumptionId = `assumption.log-product.${string}`;

export interface KpLogProductDomainAssumption {
  readonly id: KpLogProductAssumptionId;
  readonly predicate: string;
  readonly status: "required" | "derived";
  readonly summary: string;
}

export interface KpLogProductContract {
  readonly schemaVersion: "kp.log-product-contract.v1";
  readonly id: string;
  readonly animationId: KpLogProductAnimationId;
  readonly family: KpLogProductFamily;
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
    readonly persistentSemanticIds: readonly KpLogProductSemanticId[];
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
    readonly targetStateId: KpLogProductState["id"];
    readonly exactLatex: string;
  };
}

export function createKpLogProductContract(
  family: KpLogProductFamily
): KpLogProductContract {
  const [source, target] = family.states;
  const assumptions = Object.freeze([
    ...family.factors.map((factor) => assumption(
      assumptionId(`${factor.name}-positive`),
      `${factor.name} > 0`,
      "required",
      `Factor ${factor.name} lies in the natural logarithm domain.`
    )),
    assumption(
      "assumption.log-product.natural-base",
      "base = e",
      "required",
      "Every application uses the same natural-logarithm base."
    ),
    assumption(
      family === kpCanonicalLogProductFamily
        ? "assumption.log-product.product-positive"
        : assumptionId(`${family.factors.map(({ name }) => name).join("")}-positive`),
      `${family.factors.map(({ name }) => name).join("")} > 0`,
      "derived",
      "The product is positive because every factor is positive."
    )
  ]);
  const targetApplications = family.factors.map(({ targetWrapper }) =>
    targetWrapper.application
  );
  const targetOperators = family.factors.map(({ targetWrapper }) =>
    targetWrapper.operator
  );
  const targetOpens = family.factors.map(({ targetWrapper }) =>
    targetWrapper.open
  );
  const targetCloses = family.factors.map(({ targetWrapper }) =>
    targetWrapper.close
  );
  const persistentSemanticIds = family.factors.map(({ semanticId }) => semanticId);
  const contract = Object.freeze({
    schemaVersion: "kp.log-product-contract.v1" as const,
    id: `contract.log-product.${family.factors.map(({ name }) => name).join("")}-to-sum`,
    animationId: family.animationId,
    family,
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
      persistentSemanticIds: Object.freeze(persistentSemanticIds),
      derivedCohorts: Object.freeze([
        cohort(
          `cohort.log-product.${family.id}.applications`,
          [family.sourceWrapper.application],
          targetApplications,
          "One logarithm application derives one ordered application per factor."
        ),
        cohort(
          `cohort.log-product.${family.id}.operators`,
          [family.sourceWrapper.operator],
          targetOperators,
          "The source ln operator derives every target ln operator."
        ),
        cohort(
          `cohort.log-product.${family.id}.open-shells`,
          [family.sourceWrapper.open],
          targetOpens,
          "The source opening shell derives one opening shell per target application."
        ),
        cohort(
          `cohort.log-product.${family.id}.close-shells`,
          [family.sourceWrapper.close],
          targetCloses,
          "The source closing shell derives one closing shell per target application."
        ),
        cohort(
          `cohort.log-product.${family.id}.homomorphic-structure`,
          [family.sourceProductSemanticId],
          [family.targetSumSemanticId, ...family.connectorSemanticIds],
          "Product structure derives the additive result and its connectors without glyph identity."
        )
      ]),
      forbiddenIdentityPairs: Object.freeze(family.connectorSemanticIds.map(
        (connectorSemanticId) => Object.freeze({
          sourceSemanticId: family.sourceProductSemanticId,
          targetSemanticId: connectorSemanticId,
          summary:
            "The product law licenses a plus connector, but product structure is not plus-glyph identity."
        })
      ))
    }),
    structuralRequirements: Object.freeze([
      requirement("split-application-shell", [
        ...Object.values(family.sourceWrapper),
        ...family.factors.flatMap(({ targetWrapper }) => Object.values(targetWrapper))
      ]),
      requirement("preserve-ordered-arguments", persistentSemanticIds),
      requirement("derive-additive-connector", [
        family.sourceProductSemanticId,
        family.targetSumSemanticId,
        ...family.connectorSemanticIds
      ]),
      requirement("settle-native-target", [family.targetSumSemanticId])
    ]),
    rewind: Object.freeze({
      targetStateId: source.id,
      exactLatex: source.latex
    })
  } satisfies KpLogProductContract);
  validateContractCoverage(contract);
  return contract;
}

export function createKpCanonicalLogProductContract(): KpLogProductContract {
  return createKpLogProductContract(kpCanonicalLogProductFamily);
}

export const kpCanonicalLogProductContract =
  createKpCanonicalLogProductContract();
export const kpMultiFactorLogProductContract =
  createKpLogProductContract(kpMultiFactorLogProductFamily);
export const kpLogProductContracts: readonly KpLogProductContract[] = Object.freeze([
  kpCanonicalLogProductContract,
  kpMultiFactorLogProductContract
]);

function assumption(
  id: KpLogProductAssumptionId,
  predicate: string,
  status: "required" | "derived",
  summary: string
): KpLogProductDomainAssumption {
  return Object.freeze({ id, predicate, status, summary });
}

function assumptionId(suffix: string): KpLogProductAssumptionId {
  return `assumption.log-product.${suffix}`;
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

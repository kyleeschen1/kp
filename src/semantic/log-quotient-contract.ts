import {
  kpCanonicalLogQuotientDomainContract,
  type KpLogQuotientAssumptionId,
  type KpLogQuotientDomainContract
} from "./log-quotient-domain-assumptions.ts";
import {
  kpCanonicalLogQuotientStates,
  listKpLogQuotientExpressionNodes,
  type KpLogQuotientSemanticId,
  type KpLogQuotientState
} from "./log-quotient-states.ts";

export interface KpLogQuotientStructuralRequirement {
  readonly kind:
    | "preserve-shell"
    | "retire-shell-after-material-departs"
    | "retire-operator-after-operands-depart"
    | "introduce-shell-after-material-arrives";
  readonly entitySemanticIds: readonly KpLogQuotientSemanticId[];
  readonly requiredMaterialSemanticIds: readonly KpLogQuotientSemanticId[];
}

export interface KpLogQuotientContract {
  readonly schemaVersion: "kp.log-quotient-contract.v1";
  readonly id: "contract.log-quotient.difference-to-quotient";
  readonly animationId: "animation.algebra.log-quotient.difference-to-quotient";
  readonly lawId: "law.logarithm.quotient";
  readonly direction: "combine-difference-into-quotient";
  readonly domain: KpLogQuotientDomainContract;
  readonly source: KpLogQuotientState;
  readonly target: KpLogQuotientState;
  readonly assumptionIds: readonly KpLogQuotientAssumptionId[];
  readonly rewriteFrontier: {
    readonly kind: "standalone-expression";
    readonly sourceRootId: string;
    readonly targetRootId: string;
    readonly anchoredContextSemanticIds: readonly [];
  };
  readonly materialPolicy: {
    readonly persistentSemanticIds: readonly KpLogQuotientSemanticId[];
    readonly retiringSemanticIds: readonly KpLogQuotientSemanticId[];
    readonly introducedSemanticIds: readonly KpLogQuotientSemanticId[];
    readonly forbiddenIdentityPairs: readonly {
      readonly sourceSemanticId: KpLogQuotientSemanticId;
      readonly targetSemanticId: KpLogQuotientSemanticId;
      readonly reason: string;
    }[];
  };
  readonly structuralRequirements: readonly KpLogQuotientStructuralRequirement[];
  readonly rewind: {
    readonly targetStateId: "log-quotient.state.difference";
    readonly exactLatex: "\\ln(x)-\\ln(y)";
  };
}

export function createKpCanonicalLogQuotientContract(input: {
  readonly states?: readonly KpLogQuotientState[] | undefined;
  readonly domain?: KpLogQuotientDomainContract | undefined;
} = {}): KpLogQuotientContract {
  const states = input.states ?? kpCanonicalLogQuotientStates;
  const domain = input.domain ?? kpCanonicalLogQuotientDomainContract;
  const source = states[0];
  const target = states[1];
  if (
    states.length !== 2 ||
    source?.id !== "log-quotient.state.difference" ||
    target?.id !== "log-quotient.state.quotient"
  ) {
    throw new Error("The log-quotient contract requires its exact ordered endpoint pair.");
  }

  const contract = Object.freeze({
    schemaVersion: "kp.log-quotient-contract.v1" as const,
    id: "contract.log-quotient.difference-to-quotient" as const,
    animationId: "animation.algebra.log-quotient.difference-to-quotient" as const,
    lawId: "law.logarithm.quotient" as const,
    direction: "combine-difference-into-quotient" as const,
    domain,
    source,
    target,
    assumptionIds: Object.freeze(domain.assumptions.map(({ id }) => id)),
    rewriteFrontier: Object.freeze({
      kind: "standalone-expression" as const,
      sourceRootId: source.root.id,
      targetRootId: target.root.id,
      anchoredContextSemanticIds: Object.freeze([] as const)
    }),
    materialPolicy: Object.freeze({
      persistentSemanticIds: Object.freeze([
        "semantic.log-quotient.wrapper.persistent",
        "semantic.log-quotient.wrapper.persistent.operator",
        "semantic.log-quotient.wrapper.persistent.open",
        "semantic.log-quotient.wrapper.persistent.close",
        "semantic.log-quotient.variable.x",
        "semantic.log-quotient.variable.y"
      ] as const),
      retiringSemanticIds: Object.freeze([
        "semantic.log-quotient.expression.difference",
        "semantic.log-quotient.operator.subtract",
        "semantic.log-quotient.wrapper.retiring",
        "semantic.log-quotient.wrapper.retiring.operator",
        "semantic.log-quotient.wrapper.retiring.open",
        "semantic.log-quotient.wrapper.retiring.close"
      ] as const),
      introducedSemanticIds: Object.freeze([
        "semantic.log-quotient.quotient.x-over-y",
        "semantic.log-quotient.shell.fraction-bar"
      ] as const),
      forbiddenIdentityPairs: Object.freeze([
        Object.freeze({
          sourceSemanticId: "semantic.log-quotient.operator.subtract" as const,
          targetSemanticId: "semantic.log-quotient.shell.fraction-bar" as const,
          reason: "The subtraction licenses the quotient rewrite but is not the fraction bar."
        })
      ])
    }),
    structuralRequirements: Object.freeze([
      requirement(
        "preserve-shell",
        [
          "semantic.log-quotient.wrapper.persistent",
          "semantic.log-quotient.wrapper.persistent.operator",
          "semantic.log-quotient.wrapper.persistent.open",
          "semantic.log-quotient.wrapper.persistent.close"
        ],
        ["semantic.log-quotient.variable.x", "semantic.log-quotient.variable.y"]
      ),
      requirement(
        "retire-shell-after-material-departs",
        [
          "semantic.log-quotient.wrapper.retiring",
          "semantic.log-quotient.wrapper.retiring.operator",
          "semantic.log-quotient.wrapper.retiring.open",
          "semantic.log-quotient.wrapper.retiring.close"
        ],
        ["semantic.log-quotient.variable.y"]
      ),
      requirement(
        "retire-operator-after-operands-depart",
        [
          "semantic.log-quotient.expression.difference",
          "semantic.log-quotient.operator.subtract"
        ],
        ["semantic.log-quotient.variable.x", "semantic.log-quotient.variable.y"]
      ),
      requirement(
        "introduce-shell-after-material-arrives",
        [
          "semantic.log-quotient.quotient.x-over-y",
          "semantic.log-quotient.shell.fraction-bar"
        ],
        ["semantic.log-quotient.variable.x", "semantic.log-quotient.variable.y"]
      )
    ]),
    rewind: Object.freeze({
      targetStateId: "log-quotient.state.difference" as const,
      exactLatex: "\\ln(x)-\\ln(y)" as const
    })
  } satisfies KpLogQuotientContract);

  validateMaterialCoverage(contract);
  return contract;
}

export const kpCanonicalLogQuotientContract =
  createKpCanonicalLogQuotientContract();

function requirement(
  kind: KpLogQuotientStructuralRequirement["kind"],
  entitySemanticIds: readonly KpLogQuotientSemanticId[],
  requiredMaterialSemanticIds: readonly KpLogQuotientSemanticId[]
): KpLogQuotientStructuralRequirement {
  return Object.freeze({
    kind,
    entitySemanticIds: Object.freeze([...entitySemanticIds]),
    requiredMaterialSemanticIds: Object.freeze([...requiredMaterialSemanticIds])
  });
}

function validateMaterialCoverage(contract: KpLogQuotientContract): void {
  const sourceIds = semanticIds(contract.source);
  const targetIds = semanticIds(contract.target);
  const policy = contract.materialPolicy;
  assertExactCoverage(
    "source",
    sourceIds,
    [...policy.persistentSemanticIds, ...policy.retiringSemanticIds]
  );
  assertExactCoverage(
    "target",
    targetIds,
    [...policy.persistentSemanticIds, ...policy.introducedSemanticIds]
  );
  for (const pair of policy.forbiddenIdentityPairs) {
    if (!sourceIds.has(pair.sourceSemanticId) || !targetIds.has(pair.targetSemanticId)) {
      throw new Error("A forbidden log-quotient identity pair must reference both endpoints.");
    }
    if (pair.sourceSemanticId === pair.targetSemanticId) {
      throw new Error("A forbidden log-quotient identity pair cannot share semantic identity.");
    }
  }
}

function semanticIds(state: KpLogQuotientState): ReadonlySet<KpLogQuotientSemanticId> {
  const nodes = listKpLogQuotientExpressionNodes(state);
  const occurrenceIds = nodes.map(({ id }) => id);
  if (new Set(occurrenceIds).size !== occurrenceIds.length) {
    throw new Error(`Log-quotient endpoint ${state.id} has duplicate occurrence ids.`);
  }
  return new Set(nodes.map(({ semanticId }) => semanticId));
}

function assertExactCoverage(
  endpoint: "source" | "target",
  expected: ReadonlySet<KpLogQuotientSemanticId>,
  actual: readonly KpLogQuotientSemanticId[]
): void {
  const counts = new Map<KpLogQuotientSemanticId, number>();
  actual.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const missing = [...expected].find((id) => counts.get(id) !== 1);
  const extra = actual.find((id) => !expected.has(id));
  if (missing !== undefined || extra !== undefined || actual.length !== expected.size) {
    throw new Error(
      `Log-quotient ${endpoint} material policy must classify every semantic entity exactly once.`
    );
  }
}

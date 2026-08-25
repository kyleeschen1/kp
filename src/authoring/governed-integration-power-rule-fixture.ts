import {
  createGeneratedProblemAnimationAsset
} from "../animation/generated-problem-import.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../semantic/generated-calculus-problem-fixture.ts";
import {
  kpIntegrationCaseLedger,
  type KpIntegrationCaseClass,
  type KpIntegrationCaseLedgerEntry,
  type KpIntegrationCaseRepair
} from "../semantic/integration-case-ledger.ts";
import {
  compileKpGovernedCanonicalConstruction,
  type KpGovernedConstructionSourceAuthority,
  type KpVerifiedGovernedCanonicalConstruction
} from "./governed-canonical-construction-compiler.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

export const kpGovernedIntegrationPowerRuleRevisionId =
  "revision.generated.calculus.integral.power-rule-quadratic.v2" as const;

export interface KpGovernedIntegrationPowerRuleFixture {
  readonly id: "fixture.governed.integration-power-rule-quadratic.v1";
  readonly case: KpIntegrationCaseLedgerEntry;
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly compilation: KpVerifiedGovernedCanonicalConstruction;
}

export type KpGovernedIntegrationPowerRuleResult =
  | Readonly<{
      status: "compiled";
      fixture: KpGovernedIntegrationPowerRuleFixture;
    }>
  | Readonly<{
      status: "repair-required";
      case: KpIntegrationCaseLedgerEntry;
      repair: KpIntegrationCaseRepair;
      preservationBoundary:
        "Keep the current canonical integration exemplar active and do not synthesize target truth, correspondence, presentation, or fallback motion.";
    }>;

/**
 * Routes integration authoring through one accepted case and one governed
 * construction seam. Unsupported mathematics never reaches the compiler as
 * a guessed animation request.
 */
export function createKpGovernedIntegrationPowerRuleResult(input: {
  readonly operationClass: KpIntegrationCaseClass;
}): KpGovernedIntegrationPowerRuleResult {
  const selectedCase = kpIntegrationCaseLedger.cases.find(
    ({ operationClass }) => operationClass === input.operationClass
  );
  if (selectedCase === undefined) {
    throw new Error(`Unknown integration case ${input.operationClass}.`);
  }
  if (selectedCase.disposition === "typed-gap") {
    if (selectedCase.repair === undefined) {
      throw new Error(`Integration gap ${selectedCase.id} lost its repair.`);
    }
    return Object.freeze({
      status: "repair-required" as const,
      case: selectedCase,
      repair: selectedCase.repair,
      preservationBoundary:
        "Keep the current canonical integration exemplar active and do not synthesize target truth, correspondence, presentation, or fallback motion." as const
    });
  }
  return Object.freeze({
    status: "compiled" as const,
    fixture: createKpGovernedIntegrationPowerRuleFixture(selectedCase)
  });
}

function createKpGovernedIntegrationPowerRuleFixture(
  selectedCase: KpIntegrationCaseLedgerEntry
): KpGovernedIntegrationPowerRuleFixture {
  const semanticFixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.integral.power-rule-quadratic"
  );
  const animation = createGeneratedProblemAnimationAsset(semanticFixture);
  const operationPacks = [
    { packId: "kp.core", version: "1.0.0" }
  ] as const;
  const authority: KpGovernedConstructionSourceAuthority = {
    sourceId: semanticFixture.id,
    revisionId: kpGovernedIntegrationPowerRuleRevisionId,
    operationPacks,
    animation
  };
  const objectIds = semanticFixture.bundle.objects.map(({ id }) => id);
  const operationIds = semanticFixture.transformations.map(({ id }) => id);
  const request = createKpGovernedCanonicalConstructionRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.governed.integration-power-rule-quadratic.v1",
    source: {
      kind: "verified-semantic-source",
      sourceId: authority.sourceId,
      revisionId: authority.revisionId,
      operationPacks
    },
    approvedObjectIds: objectIds,
    approvedOperationIds: operationIds,
    explanationPurpose: {
      kind: "cause",
      objectIds,
      operationIds
    },
    detailLevel: "complete",
    compositionIntent: {
      kind: "sequence",
      operationIds
    }
  });
  return deepFreeze({
    id: "fixture.governed.integration-power-rule-quadratic.v1" as const,
    case: selectedCase,
    authority,
    request,
    compilation: compileKpGovernedCanonicalConstruction({
      request,
      authority
    })
  });
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

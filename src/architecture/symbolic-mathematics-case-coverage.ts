import {
  kpRootRewriteVocabulary,
  type KpRootRewriteClass
} from "../semantic/root-rewrite-vocabulary.ts";
import {
  kpFiniteBinderCaseLedger
} from "../semantic/finite-binder-case-ledger.ts";

export const KP_SYMBOLIC_CASE_COVERAGE_SCHEMA =
  "kp.symbolic-case-coverage.v1" as const;

export type KpSymbolicCaseMaturityDimensionId =
  | "notation-paintable"
  | "semantic-representable"
  | "operation-authoritative"
  | "exemplar-executable"
  | "family-promoted"
  | "generation-governed";

export type KpSymbolicCaseMaturityStatus =
  | "satisfied"
  | "pressure"
  | "missing"
  | "not-applicable";

export type KpSymbolicCaseOutcome =
  | "animated-transition"
  | "typed-gap"
  | "ordered-sequence";

export interface KpSymbolicCaseMaturityEvidence {
  readonly dimensionId: KpSymbolicCaseMaturityDimensionId;
  readonly status: KpSymbolicCaseMaturityStatus;
  readonly evidenceSourceIds: readonly string[];
}

export interface KpSymbolicCaseCoverageCase {
  readonly id: string;
  readonly operationClass: string;
  readonly title: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
  readonly outcome: KpSymbolicCaseOutcome;
  readonly requiredEvidenceIds: readonly string[];
  readonly maturity: readonly KpSymbolicCaseMaturityEvidence[];
}

export interface KpSymbolicCaseCoverageFamily {
  readonly schemaVersion: typeof KP_SYMBOLIC_CASE_COVERAGE_SCHEMA;
  readonly kind: "symbolic-case-coverage-family";
  readonly capabilityId: string;
  readonly authorityId: string;
  readonly cases: readonly KpSymbolicCaseCoverageCase[];
}

export interface KpSymbolicCaseCoverageRegistry {
  readonly schemaVersion: typeof KP_SYMBOLIC_CASE_COVERAGE_SCHEMA;
  readonly kind: "symbolic-case-coverage-registry";
  readonly families: readonly KpSymbolicCaseCoverageFamily[];
}

export type KpSymbolicCaseCoverageProjection =
  | Readonly<{
      status: "tracked";
      authorityId: string;
      caseCount: number;
      cases: readonly KpSymbolicCaseCoverageCase[];
    }>
  | Readonly<{
      status: "legacy-untracked";
      promotionGate: "explicit-migration-exemption";
    }>
  | Readonly<{
      status: "not-declared";
      promotionGate: "required-before-direct";
    }>;

export const kpSymbolicCaseMaturityDimensionOrder = Object.freeze([
  "notation-paintable",
  "semantic-representable",
  "operation-authoritative",
  "exemplar-executable",
  "family-promoted",
  "generation-governed"
] as const satisfies readonly KpSymbolicCaseMaturityDimensionId[]);

/**
 * These existing Direct families predate case ledgers. Keeping exemptions
 * explicit makes migration debt visible while preventing a new Direct family
 * from bypassing case enumeration accidentally.
 */
export const kpLegacyDirectCaseCoverageExemptionCapabilityIds = Object.freeze([
  "capability.equation.function-wrapping",
  "capability.equation.distribution",
  "capability.equation.additive-cancellation",
  "capability.equation.log-homomorphic-decomposition",
  "capability.equation.balanced-operations",
  "capability.equation.alternative-logarithm-bases",
  "capability.equation.exponential-homomorphism"
] as const);

const ROOT_CAPABILITY_ID = "capability.equation.radical-inversion";
const ROOT_CASE_COVERAGE_AUTHORITY =
  "coverage.equation.root-rewrite-cases.v1";
const ROOT_PLAN_AUTHORITY = "compiler.equation.root-rewrite-plan.v1";
const ROOT_RECIPE_AUTHORITY = "recipe.equation.radical-inversion.v1";
const ROOT_AUTHORING_AUTHORITY = "authoring.equation.radical-inversion.v1";

type RootEvidenceSeed = Readonly<{
  exemplar: KpSymbolicCaseMaturityEvidence;
  promotion: KpSymbolicCaseMaturityEvidence;
  generation: KpSymbolicCaseMaturityEvidence;
}>;

const rootCaseTitles = {
  "closed-evaluation": "Evaluate a closed radical",
  "inverse-normalization": "Normalize an inverse even power",
  "compound-carrier-normalization": "Preserve a compound carrier",
  "assumption-qualified-cancellation": "Cancel under a domain assumption",
  "exponent-index-composition": "Compose exponent and root index",
  "mixed-evaluation": "Evaluate and preserve independent cohorts",
  "partial-extraction": "Extract a proved perfect-power factor",
  "nested-root-composition": "Compose nested root operators",
  "blocked-rewrite": "Refuse invalid distribution over a sum",
  "composed-derivation": "Require factoring before normalization"
} as const satisfies Readonly<Record<KpRootRewriteClass, string>>;

const rootEvidence = {
  "closed-evaluation": seed(
    pressure([
      "src/semantic/closed-root-evaluation-exemplar.ts",
      "src/rendering/closed-root-evaluation-transit-session.ts"
    ]),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "inverse-normalization": seed(
    missing(),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "compound-carrier-normalization": seed(
    satisfied([
      "animation.algebra.radical.compound-carrier-normalization"
    ]),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    satisfied([
      ROOT_AUTHORING_AUTHORITY,
      "root-authoring.compound-carrier"
    ])
  ),
  "assumption-qualified-cancellation": seed(
    missing(),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "exponent-index-composition": seed(
    pressure([
      "src/semantic/rational-exponent-composition-exemplar.ts",
      "src/rendering/rational-exponent-composition-transit-session.ts"
    ]),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "mixed-evaluation": seed(
    pressure([
      "pressure.root.mixed-evaluation",
      "src/rendering/root-extraction-pressure-native-endpoints.ts"
    ]),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "partial-extraction": seed(
    pressure([
      "pressure.root.partial-extraction",
      "src/rendering/root-extraction-pressure-native-endpoints.ts"
    ]),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    pressure([ROOT_PLAN_AUTHORITY])
  ),
  "nested-root-composition": seed(
    missing(),
    satisfied([ROOT_RECIPE_AUTHORITY]),
    satisfied([
      ROOT_AUTHORING_AUTHORITY,
      "root-authoring.nested-index-composition"
    ])
  ),
  "blocked-rewrite": seed(
    notApplicable(),
    notApplicable(),
    satisfied([
      ROOT_AUTHORING_AUTHORITY,
      "root-authoring.blocked-distribution"
    ])
  ),
  "composed-derivation": seed(
    missing(),
    missing(),
    satisfied([
      ROOT_AUTHORING_AUTHORITY,
      "root-authoring.factoring-first"
    ])
  )
} as const satisfies Readonly<Record<KpRootRewriteClass, RootEvidenceSeed>>;

export const kpSymbolicCaseCoverageRegistry =
  defineKpSymbolicCaseCoverageRegistry({
    schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
    kind: "symbolic-case-coverage-registry",
    families: [rootFamily(), finiteBinderFamily()]
  });

export function defineKpSymbolicCaseCoverageRegistry(
  value: KpSymbolicCaseCoverageRegistry
): KpSymbolicCaseCoverageRegistry {
  const capabilityIds = new Set<string>();
  for (const family of value.families) {
    if (capabilityIds.has(family.capabilityId)) {
      throw new Error(
        `Duplicate symbolic case family ${family.capabilityId}.`
      );
    }
    if (family.cases.length === 0) {
      throw new Error(
        `Symbolic case family ${family.capabilityId} requires cases.`
      );
    }
    const caseIds = new Set<string>();
    for (const entry of family.cases) {
      if (caseIds.has(entry.id)) {
        throw new Error(`Duplicate symbolic case ${entry.id}.`);
      }
      assertMaturity(entry);
      if (entry.outcome === "typed-gap" && entry.targetLatex !== undefined) {
        throw new Error(`Typed-gap case ${entry.id} cannot claim a target.`);
      }
      caseIds.add(entry.id);
    }
    capabilityIds.add(family.capabilityId);
  }
  return deepFreeze({
    ...value,
    families: value.families.map((family) => ({
      ...family,
      cases: [...family.cases]
    }))
  });
}

export function projectKpSymbolicCaseCoverage(input: {
  readonly capabilityId: string;
  readonly isDirect: boolean;
  readonly registry?: KpSymbolicCaseCoverageRegistry;
  readonly legacyExemptionCapabilityIds?: readonly string[];
}): KpSymbolicCaseCoverageProjection {
  const registry = input.registry ?? kpSymbolicCaseCoverageRegistry;
  const family = registry.families.find(({ capabilityId }) =>
    capabilityId === input.capabilityId
  );
  if (family !== undefined) {
    return Object.freeze({
      status: "tracked" as const,
      authorityId: family.authorityId,
      caseCount: family.cases.length,
      cases: family.cases
    });
  }
  const exemptions = input.legacyExemptionCapabilityIds ??
    kpLegacyDirectCaseCoverageExemptionCapabilityIds;
  if (input.isDirect && exemptions.includes(input.capabilityId)) {
    return Object.freeze({
      status: "legacy-untracked" as const,
      promotionGate: "explicit-migration-exemption" as const
    });
  }
  if (input.isDirect) {
    throw new Error(
      `Direct symbolic capability ${input.capabilityId} requires a case ledger.`
    );
  }
  return Object.freeze({
    status: "not-declared" as const,
    promotionGate: "required-before-direct" as const
  });
}

function rootFamily(): KpSymbolicCaseCoverageFamily {
  return Object.freeze({
    schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
    kind: "symbolic-case-coverage-family" as const,
    capabilityId: ROOT_CAPABILITY_ID,
    authorityId: ROOT_CASE_COVERAGE_AUTHORITY,
    cases: Object.freeze(kpRootRewriteVocabulary.cases.map((entry) => {
      const evidence = rootEvidence[entry.operationClass];
      return Object.freeze({
        id: entry.id,
        operationClass: entry.operationClass,
        title: rootCaseTitles[entry.operationClass],
        sourceLatex: entry.sourceLatex,
        ...(entry.targetLatex === undefined
          ? {}
          : { targetLatex: entry.targetLatex }),
        outcome: outcome(entry.disposition),
        requiredEvidenceIds: Object.freeze([...entry.requiredEvidence]),
        maturity: Object.freeze([
          maturity("notation-paintable", "satisfied", [
            "normalizer.equation.radical.v1",
            "shape.structure.root"
          ]),
          maturity("semantic-representable", "satisfied", [
            kpRootRewriteVocabulary.authority,
            ROOT_PLAN_AUTHORITY
          ]),
          maturity("operation-authoritative", "satisfied", [
            ROOT_PLAN_AUTHORITY
          ]),
          withDimension("exemplar-executable", evidence.exemplar),
          withDimension("family-promoted", evidence.promotion),
          withDimension("generation-governed", evidence.generation)
        ])
      });
    }))
  });
}

function finiteBinderFamily(): KpSymbolicCaseCoverageFamily {
  return Object.freeze({
    schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
    kind: "symbolic-case-coverage-family" as const,
    capabilityId: "capability.equation.finite-binder-expansion",
    authorityId: kpFiniteBinderCaseLedger.authority,
    cases: Object.freeze(kpFiniteBinderCaseLedger.cases.map((entry) => ({
      id: entry.id,
      operationClass: entry.operationClass,
      title: entry.title,
      sourceLatex: entry.sourceLatex,
      ...(entry.targetLatex === undefined ? {} : {
        targetLatex: entry.targetLatex
      }),
      outcome: entry.disposition === "typed-gap"
        ? "typed-gap" as const
        : "animated-transition" as const,
      requiredEvidenceIds: entry.requiredEvidenceIds,
      maturity: finiteBinderMaturity(entry.disposition)
    })))
  });
}

function finiteBinderMaturity(
  disposition: typeof kpFiniteBinderCaseLedger.cases[number]["disposition"]
): readonly KpSymbolicCaseMaturityEvidence[] {
  if (disposition === "verified-direct-expansion") {
    return Object.freeze([
      maturity("notation-paintable", "satisfied", [
        "normalizer.equation.finite-binder-expansion.v1",
        "shape.compound.large-operator"
      ]),
      maturity("semantic-representable", "satisfied", [
        "vocabulary.equation.finite-binder-expansion.v1",
        "proof.equation.finite-binder-scope.v1",
        "range.equation.finite-binder-expansion.v1"
      ]),
      maturity("operation-authoritative", "satisfied", [
        "operation.equation.finite-binder-expand.v1"
      ]),
      maturity("exemplar-executable", "missing", []),
      maturity("family-promoted", "missing", []),
      maturity("generation-governed", "missing", [])
    ]);
  }
  if (disposition === "pressure-required") {
    return Object.freeze([
      maturity("notation-paintable", "satisfied", [
        "shape.compound.large-operator"
      ]),
      maturity("semantic-representable", "pressure", [
        "vocabulary.equation.finite-binder-expansion.v1",
        "proof.equation.finite-binder-scope.v1",
        "range.equation.finite-binder-expansion.v1"
      ]),
      maturity("operation-authoritative", "missing", []),
      maturity("exemplar-executable", "missing", []),
      maturity("family-promoted", "missing", []),
      maturity("generation-governed", "missing", [])
    ]);
  }
  return Object.freeze([
    maturity("notation-paintable", "satisfied", [
      "shape.compound.large-operator"
    ]),
    maturity("semantic-representable", "missing", []),
    maturity("operation-authoritative", "not-applicable", []),
    maturity("exemplar-executable", "not-applicable", []),
    maturity("family-promoted", "missing", []),
    maturity("generation-governed", "missing", [])
  ]);
}

function assertMaturity(entry: KpSymbolicCaseCoverageCase): void {
  const ids = entry.maturity.map(({ dimensionId }) => dimensionId);
  if (
    ids.length !== kpSymbolicCaseMaturityDimensionOrder.length ||
    ids.some((id, index) => id !== kpSymbolicCaseMaturityDimensionOrder[index])
  ) {
    throw new Error(
      `Symbolic case ${entry.id} must declare every maturity dimension in order.`
    );
  }
  for (const evidence of entry.maturity) {
    if (
      (evidence.status === "satisfied" || evidence.status === "pressure") &&
      evidence.evidenceSourceIds.length === 0
    ) {
      throw new Error(
        `${entry.id} ${evidence.status} maturity requires evidence.`
      );
    }
    if (
      (evidence.status === "missing" ||
        evidence.status === "not-applicable") &&
      evidence.evidenceSourceIds.length > 0
    ) {
      throw new Error(
        `${entry.id} ${evidence.status} maturity cannot cite evidence.`
      );
    }
  }
}

function outcome(
  disposition: typeof kpRootRewriteVocabulary.cases[number]["disposition"]
): KpSymbolicCaseOutcome {
  if (disposition === "typed-gap") return "typed-gap";
  if (disposition === "ordered-composition-required") {
    return "ordered-sequence";
  }
  return "animated-transition";
}

function seed(
  exemplar: KpSymbolicCaseMaturityEvidence,
  promotion: KpSymbolicCaseMaturityEvidence,
  generation: KpSymbolicCaseMaturityEvidence
): RootEvidenceSeed {
  return Object.freeze({ exemplar, promotion, generation });
}

function satisfied(
  evidenceSourceIds: readonly string[]
): KpSymbolicCaseMaturityEvidence {
  return maturity("exemplar-executable", "satisfied", evidenceSourceIds);
}

function pressure(
  evidenceSourceIds: readonly string[]
): KpSymbolicCaseMaturityEvidence {
  return maturity("exemplar-executable", "pressure", evidenceSourceIds);
}

function missing(): KpSymbolicCaseMaturityEvidence {
  return maturity("exemplar-executable", "missing", []);
}

function notApplicable(): KpSymbolicCaseMaturityEvidence {
  return maturity("exemplar-executable", "not-applicable", []);
}

function withDimension(
  dimensionId: KpSymbolicCaseMaturityDimensionId,
  evidence: KpSymbolicCaseMaturityEvidence
): KpSymbolicCaseMaturityEvidence {
  return Object.freeze({ ...evidence, dimensionId });
}

function maturity(
  dimensionId: KpSymbolicCaseMaturityDimensionId,
  status: KpSymbolicCaseMaturityStatus,
  evidenceSourceIds: readonly string[]
): KpSymbolicCaseMaturityEvidence {
  return Object.freeze({
    dimensionId,
    status,
    evidenceSourceIds: Object.freeze([...new Set(evidenceSourceIds)])
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

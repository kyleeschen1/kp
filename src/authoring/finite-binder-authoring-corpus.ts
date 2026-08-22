import {
  KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY
} from "../domain-ir/finite-binder-authorities.ts";
import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX
} from "../semantic/canonical-finite-product-expansion.ts";
import {
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX
} from "../semantic/canonical-finite-sum-expansion.ts";
import {
  createKpFiniteBinderAuthoringApi,
  KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA,
  type KpFiniteBinderAuthoringOperator,
  type KpFiniteBinderAuthoringRepairCode
} from "./finite-binder-authoring-api.ts";

export { KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY } from
  "../domain-ir/finite-binder-authorities.ts";

type KpFiniteBinderAuthoringCorpusExpectation =
  | Readonly<{
      status: "accepted";
      catalogueStatus: "canonical-asset" | "semantic-only";
    }>
  | Readonly<{
      status: "repair-required";
      repairCode: KpFiniteBinderAuthoringRepairCode;
    }>;

export interface KpFiniteBinderAuthoringCorpusCase {
  readonly id: string;
  readonly operator: KpFiniteBinderAuthoringOperator;
  readonly source: string;
  readonly target: string;
  readonly expected: KpFiniteBinderAuthoringCorpusExpectation;
}

export const kpFiniteBinderAuthoringCorpus = Object.freeze({
  schemaVersion: "kp.finite-binder-authoring-corpus.v1" as const,
  kind: "finite-binder-authoring-corpus" as const,
  authority: KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY,
  cases: Object.freeze([
    accepted("canonical-sum", "sum",
      KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
      KP_CANONICAL_FINITE_SUM_TARGET_LATEX, "canonical-asset"),
    accepted("canonical-product", "product",
      KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
      KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX, "canonical-asset"),
    accepted("shifted-sum", "sum", "\\sum_{j=-1}^{1} b_j",
      "b_{-1}+b_0+b_1", "semantic-only"),
    accepted("shifted-product", "product", "\\prod_{n=2}^{4} y_n",
      "y_2y_3y_4", "semantic-only"),
    repaired("symbolic-sum", "sum", "\\sum_{i=1}^{n} a_i",
      "a_1+\\cdots+a_n", "finite-binder-authoring.source-unsupported"),
    repaired("misordered-product", "product", "\\prod_{k=0}^{2} x_k",
      "x_0x_2x_1", "finite-binder-authoring.expansion-invalid")
  ] satisfies readonly KpFiniteBinderAuthoringCorpusCase[])
});

/**
 * Direct readiness depends on exercising the public compiler, not merely on
 * the presence of declarations with plausible authority IDs.
 */
export function evaluateKpFiniteBinderAuthoringCorpus(): Readonly<{
  status: "passed" | "failed";
  acceptedCount: number;
  repairCount: number;
}> {
  const api = createKpFiniteBinderAuthoringApi();
  let acceptedCount = 0;
  let repairCount = 0;
  for (const candidate of kpFiniteBinderAuthoringCorpus.cases) {
    const result = api.compile({
      schemaVersion: KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA,
      id: `corpus.finite-binder.${candidate.id}`,
      operator: candidate.operator,
      source: candidate.source,
      target: candidate.target
    });
    if (result.status !== candidate.expected.status) {
      return Object.freeze({ status: "failed", acceptedCount, repairCount });
    }
    if (result.status === "accepted" &&
        candidate.expected.status === "accepted") {
      if (result.artifact.catalogue.status !==
          candidate.expected.catalogueStatus) {
        return Object.freeze({ status: "failed", acceptedCount, repairCount });
      }
      acceptedCount += 1;
      continue;
    }
    if (result.status === "repair-required" &&
        candidate.expected.status === "repair-required") {
      const expectedRepairCode = candidate.expected.repairCode;
      if (!result.diagnostics.some(({ code }) =>
        code === expectedRepairCode)) {
        return Object.freeze({ status: "failed", acceptedCount, repairCount });
      }
      repairCount += 1;
    }
  }
  return Object.freeze({ status: "passed", acceptedCount, repairCount });
}

function accepted(
  id: string,
  operator: KpFiniteBinderAuthoringOperator,
  source: string,
  target: string,
  catalogueStatus: "canonical-asset" | "semantic-only"
): KpFiniteBinderAuthoringCorpusCase {
  return Object.freeze({
    id,
    operator,
    source,
    target,
    expected: Object.freeze({ status: "accepted" as const, catalogueStatus })
  });
}

function repaired(
  id: string,
  operator: KpFiniteBinderAuthoringOperator,
  source: string,
  target: string,
  repairCode: KpFiniteBinderAuthoringRepairCode
): KpFiniteBinderAuthoringCorpusCase {
  return Object.freeze({
    id,
    operator,
    source,
    target,
    expected: Object.freeze({ status: "repair-required" as const, repairCode })
  });
}

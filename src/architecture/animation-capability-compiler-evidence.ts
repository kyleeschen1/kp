import {
  createKpEquationLlmAuthoringCatalogue
} from "../authoring/equation-llm-authoring-catalogue.ts";
import {
  KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY
} from "../authoring/equation-series-both-sides-authoring.ts";
import {
  KP_FRACTION_DENOMINATOR_GENERATION_CORPUS_AUTHORITY
} from "../authoring/fraction-denominator-generation-corpus.ts";
import {
  KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY
} from "../authoring/finite-binder-authoring-corpus.ts";
import {
  KP_ROOT_REWRITE_GENERATION_CORPUS_AUTHORITY,
  KP_ROOT_REWRITE_RECIPE_AUTHORITY
} from "../authoring/root-rewrite-authoring-corpus.ts";
import {
  KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
  KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY,
  KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_CORPUS_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY
} from "../domain-ir/code-extract-helper-authorities.ts";
import {
  KP_EQUATION_LATEX_ENDPOINT_NORMALIZER,
  KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
} from "../authoring/equation-latex-endpoint-normalizer.ts";
import { KP_EQUATION_TRANSFORM_SERIES_RUNTIME_AUTHORITY } from "../authoring/equation-series-runtime.ts";
import { kpEquationTransformSeriesCorpus } from "../authoring/equation-transform-series-corpus.ts";
import { KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY } from "../semantic/fraction-equivalence.ts";
import {
  KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY
} from "../animation/both-sides-causal-recipe.ts";
import { KP_FINITE_BINDER_EXPANSION_RECIPE } from
  "../domain-ir/finite-binder-causal-recipe.ts";
import {
  KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY,
  KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY
} from "../animation/logarithm-change-of-base-presentation-plan.ts";
import {
  createKpFunctionWrapEquationExtensionPack
} from "../animation/equation-extension-packs/function-wrap.ts";
import {
  createKpHomomorphicCrossoverEquationExtensionPack
} from "../animation/equation-extension-packs/homomorphic-crossover.ts";
import { createKpExponentialHomomorphismEquationExtensionPack } from
  "../animation/equation-extension-packs/exponential-homomorphism.ts";
import { KP_EXPONENTIAL_HOMOMORPHISM_AUTHORING_CORPUS } from
  "../authoring/exponential-homomorphism-authoring-corpus.ts";
import {
  createKpLlmSemanticMotionOperationCatalog
} from "../animation/llm-semantic-motion-operation-authoring.ts";
import {
  KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY
} from "../semantic/both-sides-operation-family.ts";
import {
  KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY
} from "../semantic/logarithm-change-of-base.ts";
import {
  KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY
} from "../semantic/logarithm-change-of-base-corpus.ts";
import {
  KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY
} from "../semantic/fraction-common-denominator.ts";
import {
  KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY
} from "../semantic/fraction-like-denominator-combination.ts";
import { KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY } from
  "../semantic/finite-binder-expansion-kernel.ts";
import { KP_FINITE_BINDER_EXPAND_OPERATION } from
  "../semantic/finite-binder-expansion-operation.ts";
import { KP_FINITE_SUM_ENDPOINT_NORMALIZER } from
  "../semantic/finite-sum-endpoint-normalizer.ts";
import { KP_FINITE_PRODUCT_EXPAND_OPERATION } from
  "../semantic/finite-product-expansion-operation.ts";
import { KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER } from
  "../semantic/finite-product-endpoint-normalizer.ts";
import {
  KP_INVERSE_POWER_OPERATION_AUTHORITY
} from "../semantic/inverse-power-operation.ts";
import { KP_ROOT_REWRITE_PLAN_AUTHORITY } from
  "../semantic/root-rewrite-plan.ts";
import {
  KP_RADICAL_ENDPOINT_NORMALIZER
} from "../semantic/radical-endpoint-normalizer.ts";
import type {
  KpAnimationCapabilityPlan,
  KpAnimationCapabilityRequirementKind
} from "./animation-capability-plan.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";

export const KP_ANIMATION_CAPABILITY_COMPILER_EVIDENCE_SCHEMA =
  "kp.animation-capability-compiler-evidence.v1" as const;

export type KpAnimationCapabilityCompilerRequirementKind = Extract<
  KpAnimationCapabilityRequirementKind,
  | "semantic-operation"
  | "endpoint-normalizer"
  | "canonical-recipe"
  | "motion-motif"
  | "generation-corpus"
  | "renderer-capability"
  | "series-runtime"
>;

export type KpAnimationCapabilityCompilerAuthoritySource =
  | "llm-operation-catalogue"
  | "equation-authoring-catalogue"
  | "equation-series-authoring-family"
  | "both-sides-causal-recipe"
  | "verified-capability-authority"
  | "equation-extension-pack";

export interface KpAnimationCapabilityCompilerAuthority {
  readonly authorityId: string;
  readonly kind: KpAnimationCapabilityCompilerRequirementKind;
  readonly source: KpAnimationCapabilityCompilerAuthoritySource;
  readonly sourceId: string;
  readonly sourcePath: string;
}

export interface KpAnimationCapabilityCompilerEvidence {
  readonly schemaVersion:
    typeof KP_ANIMATION_CAPABILITY_COMPILER_EVIDENCE_SCHEMA;
  readonly kind: "animation-capability-compiler-evidence";
  readonly authorities: readonly KpAnimationCapabilityCompilerAuthority[];
  readonly requirements:
    readonly KpAnimationCapabilityCompilerRequirementEvidence[];
}

export type KpAnimationCapabilityCompilerRequirementEvidence =
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      authorityId: string;
      kind: KpAnimationCapabilityCompilerRequirementKind;
      status: "matched";
      evidence: readonly KpAnimationCapabilityCompilerAuthority[];
    }>
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      authorityId: string;
      kind: KpAnimationCapabilityCompilerRequirementKind;
      status: "missing";
      reason: "no-exact-compiler-authority";
    }>;

export interface KpAnimationCapabilityCompilerEvidenceDiagnostic {
  readonly code: "compiler-evidence.duplicate-authority";
  readonly authorityId: string;
  readonly message: string;
}

export class KpAnimationCapabilityCompilerEvidenceError extends Error {
  override readonly name = "KpAnimationCapabilityCompilerEvidenceError";
  readonly diagnostics:
    readonly KpAnimationCapabilityCompilerEvidenceDiagnostic[];

  constructor(
    diagnostics: readonly KpAnimationCapabilityCompilerEvidenceDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * This is a read-only evidence join, not another animation registry. Exact
 * authority IDs are the seam: similar titles, laws, or visual behavior never
 * promote a planned capability by implication.
 */
export function compileKpAnimationCapabilityCompilerEvidence(input: {
  readonly plan: KpAnimationCapabilityPlan;
  readonly authorities:
    readonly KpAnimationCapabilityCompilerAuthority[];
}): KpAnimationCapabilityCompilerEvidence {
  const diagnostics:
    KpAnimationCapabilityCompilerEvidenceDiagnostic[] = [];
  const seen = new Set<string>();
  for (const authority of input.authorities) {
    const identity = [
      authority.kind,
      authority.authorityId,
      authority.source,
      authority.sourceId
    ].join("\u0000");
    if (seen.has(identity)) {
      diagnostics.push(Object.freeze({
        code: "compiler-evidence.duplicate-authority" as const,
        authorityId: authority.authorityId,
        message:
          `Duplicate ${authority.kind} evidence ${authority.authorityId} ` +
          `from ${authority.sourceId}.`
      }));
    }
    seen.add(identity);
  }
  if (diagnostics.length > 0) {
    throw new KpAnimationCapabilityCompilerEvidenceError(diagnostics);
  }

  const authorities = Object.freeze(input.authorities.map((authority) =>
    Object.freeze({ ...authority })
  ));
  const byIdentity = new Map<string, KpAnimationCapabilityCompilerAuthority[]>();
  for (const authority of authorities) {
    const key = authorityKey(authority.kind, authority.authorityId);
    const matches = byIdentity.get(key) ?? [];
    matches.push(authority);
    byIdentity.set(key, matches);
  }

  const requirements = Object.freeze(input.plan.entries.flatMap((capability) =>
    capability.requirements.flatMap((requirement) => {
      if (!isCompilerRequirementKind(requirement.kind)) return [];
      const evidence = byIdentity.get(authorityKey(
        requirement.kind,
        requirement.authorityId
      ));
      const projected: KpAnimationCapabilityCompilerRequirementEvidence =
        evidence === undefined
          ? Object.freeze({
              capabilityId: capability.id,
              requirementId: requirement.id,
              authorityId: requirement.authorityId,
              kind: requirement.kind,
              status: "missing" as const,
              reason: "no-exact-compiler-authority" as const
            })
          : Object.freeze({
              capabilityId: capability.id,
              requirementId: requirement.id,
              authorityId: requirement.authorityId,
              kind: requirement.kind,
              status: "matched" as const,
              evidence: Object.freeze([...evidence])
            });
      return [projected];
    })
  ));

  return Object.freeze({
    schemaVersion: KP_ANIMATION_CAPABILITY_COMPILER_EVIDENCE_SCHEMA,
    kind: "animation-capability-compiler-evidence" as const,
    authorities,
    requirements
  });
}

export function createKpAnimationCapabilityCompilerEvidence():
KpAnimationCapabilityCompilerEvidence {
  return compileKpAnimationCapabilityCompilerEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: createCompilerAuthorities()
  });
}

function createCompilerAuthorities():
readonly KpAnimationCapabilityCompilerAuthority[] {
  const operationCatalogue = createKpLlmSemanticMotionOperationCatalog();
  const authoringCatalogue = createKpEquationLlmAuthoringCatalogue();
  const extensionPacks = Object.freeze([{
    pack: createKpFunctionWrapEquationExtensionPack(),
    sourcePath: "src/animation/equation-extension-packs/function-wrap.ts"
  }, {
    pack: createKpHomomorphicCrossoverEquationExtensionPack(),
    sourcePath:
      "src/animation/equation-extension-packs/homomorphic-crossover.ts"
  }, {
    pack: createKpExponentialHomomorphismEquationExtensionPack(),
    sourcePath:
      "src/animation/equation-extension-packs/exponential-homomorphism.ts"
  }]);
  const verified = (
    authorityId: string,
    kind: KpAnimationCapabilityCompilerRequirementKind,
    sourcePath: string
  ) => authority({
    authorityId,
    kind,
    source: "verified-capability-authority",
    sourceId: authorityId,
    sourcePath
  });
  return Object.freeze([
    // Requirement-level evidence is not Direct authoring or compositor certification.
    verified(KP_EQUATION_LATEX_ENDPOINT_NORMALIZER,
      "endpoint-normalizer", "src/authoring/equation-latex-endpoint-normalizer.ts"),
    verified(KP_EQUATION_TRANSFORM_SERIES_RUNTIME_AUTHORITY,
      "series-runtime", "src/authoring/equation-series-runtime.ts"),
    verified(kpEquationTransformSeriesCorpus.id,
      "generation-corpus", "src/authoring/equation-transform-series-corpus.ts"),
    verified(KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY,
      "semantic-operation", "src/semantic/fraction-equivalence.ts"),
    verified(KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
      "semantic-operation",
      "scripts/typescript-code-generation-frontend.ts"),
    verified(KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
      "semantic-operation",
      "scripts/python-code-generation-frontend.ts"),
    verified(KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
      "canonical-recipe",
      "src/domain-ir/code-extract-helper-causal-recipe.ts"),
    verified(KP_TYPESCRIPT_EXTRACT_HELPER_CORPUS_AUTHORITY,
      "generation-corpus",
      "tests/typescript-extract-helper-generation-corpus.test.ts"),
    verified(KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY,
      "generation-corpus",
      "tests/python-extract-helper-generation-corpus.test.ts"),
    verified(KP_EXPONENTIAL_HOMOMORPHISM_AUTHORING_CORPUS,
      "generation-corpus",
      "src/authoring/exponential-homomorphism-authoring-corpus.ts"),
    verified(KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER,
      "endpoint-normalizer",
      "src/authoring/equation-latex-endpoint-normalizer.ts"),
    verified(KP_RADICAL_ENDPOINT_NORMALIZER,
      "endpoint-normalizer",
      "src/semantic/radical-endpoint-normalizer.ts"),
    verified(KP_INVERSE_POWER_OPERATION_AUTHORITY,
      "semantic-operation",
      "src/semantic/inverse-power-operation.ts"),
    verified(KP_ROOT_REWRITE_PLAN_AUTHORITY,
      "semantic-operation",
      "src/semantic/root-rewrite-plan.ts"),
    verified(KP_ROOT_REWRITE_RECIPE_AUTHORITY,
      "canonical-recipe",
      "src/authoring/root-rewrite-authoring-corpus.ts"),
    verified(KP_ROOT_REWRITE_GENERATION_CORPUS_AUTHORITY,
      "generation-corpus",
      "src/authoring/root-rewrite-authoring-corpus.ts"),
    verified(KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
      "semantic-operation", "src/semantic/logarithm-change-of-base.ts"),
    verified(KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY,
      "canonical-recipe",
      "src/animation/logarithm-change-of-base-presentation-plan.ts"),
    verified(KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY, "motion-motif",
      "src/animation/logarithm-change-of-base-presentation-plan.ts"),
    verified(KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY,
      "generation-corpus",
      "src/semantic/logarithm-change-of-base-corpus.ts"),
    verified(KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
      "semantic-operation",
      "src/semantic/fraction-common-denominator.ts"),
    verified(KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY,
      "semantic-operation",
      "src/semantic/fraction-like-denominator-combination.ts"),
    verified(KP_FRACTION_DENOMINATOR_GENERATION_CORPUS_AUTHORITY,
      "generation-corpus",
      "src/authoring/fraction-denominator-generation-corpus.ts"),
    verified(KP_FINITE_SUM_ENDPOINT_NORMALIZER,
      "endpoint-normalizer",
      "src/semantic/finite-sum-endpoint-normalizer.ts"),
    verified(KP_FINITE_PRODUCT_ENDPOINT_NORMALIZER,
      "endpoint-normalizer",
      "src/semantic/finite-product-endpoint-normalizer.ts"),
    verified(KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY,
      "semantic-operation",
      "src/semantic/finite-binder-expansion-kernel.ts"),
    verified(KP_FINITE_BINDER_EXPAND_OPERATION,
      "semantic-operation",
      "src/semantic/finite-binder-expansion-operation.ts"),
    verified(KP_FINITE_PRODUCT_EXPAND_OPERATION,
      "semantic-operation",
      "src/semantic/finite-product-expansion-operation.ts"),
    verified(KP_FINITE_BINDER_EXPANSION_RECIPE,
      "canonical-recipe",
      "src/domain-ir/finite-binder-causal-recipe.ts"),
    verified(KP_FINITE_BINDER_AUTHORING_CORPUS_AUTHORITY,
      "generation-corpus",
      "src/authoring/finite-binder-authoring-corpus.ts"),
    authority({
      authorityId: KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY,
      kind: "semantic-operation",
      source: "equation-series-authoring-family",
      sourceId: KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
      sourcePath: "src/authoring/equation-series-both-sides-authoring.ts"
    }),
    authority({
      authorityId: KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY,
      kind: "canonical-recipe",
      source: "both-sides-causal-recipe",
      sourceId: KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY,
      sourcePath: "src/animation/both-sides-causal-recipe.ts"
    }),
    ...operationCatalogue.operations.map((operation) => authority({
      authorityId: operation.operationId,
      kind: "semantic-operation",
      source: "llm-operation-catalogue",
      sourceId:
        `${operation.operationPack.packId}@${operation.operationPack.version}`,
      sourcePath:
        "src/animation/llm-semantic-motion-operation-authoring.ts"
    })),
    ...authoringCatalogue.recipes.map((recipe) => authority({
      authorityId: recipe.recipeId,
      kind: "canonical-recipe",
      source: "equation-authoring-catalogue",
      sourceId: recipe.recipeId,
      sourcePath: "src/authoring/equation-llm-authoring-catalogue.ts"
    })),
    ...extensionPacks.flatMap(({ pack, sourcePath }) => [
      ...pack.operations.entries.flatMap((operation) =>
        [operation.id, ...operation.semanticAuthorityIds].map(
          (authorityId) => authority({
            authorityId,
            kind: "semantic-operation",
            source: "equation-extension-pack",
            sourceId: pack.id,
            sourcePath
          })
        )
      ),
      ...pack.recipes.entries.map((recipe) => authority({
        authorityId: recipe.id,
        kind: "canonical-recipe",
        source: "equation-extension-pack",
        sourceId: pack.id,
        sourcePath
      })),
      ...pack.motifs.entries.map((motif) => authority({
        authorityId: motif.id,
        kind: "motion-motif",
        source: "equation-extension-pack",
        sourceId: pack.id,
        sourcePath
      })),
      ...pack.rendererCapabilities.entries.map((renderer) => authority({
        authorityId: renderer.id,
        kind: "renderer-capability",
        source: "equation-extension-pack",
        sourceId: pack.id,
        sourcePath
      }))
    ])
  ]);
}

function authority(
  value: KpAnimationCapabilityCompilerAuthority
): KpAnimationCapabilityCompilerAuthority {
  return Object.freeze({ ...value });
}

function authorityKey(
  kind: KpAnimationCapabilityCompilerRequirementKind,
  authorityId: string
): string {
  return `${kind}\u0000${authorityId}`;
}

function isCompilerRequirementKind(
  kind: KpAnimationCapabilityRequirementKind
): kind is KpAnimationCapabilityCompilerRequirementKind {
  return kind === "semantic-operation" ||
    kind === "endpoint-normalizer" ||
    kind === "canonical-recipe" ||
    kind === "motion-motif" ||
    kind === "generation-corpus" ||
    kind === "renderer-capability" ||
    kind === "series-runtime";
}

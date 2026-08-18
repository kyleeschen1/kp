import {
  createKpEquationLlmAuthoringCatalogue
} from "../authoring/equation-llm-authoring-catalogue.ts";
import {
  KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY
} from "../authoring/equation-series-both-sides-authoring.ts";
import {
  KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
} from "../authoring/equation-latex-endpoint-normalizer.ts";
import {
  KP_BOTH_SIDES_CAUSAL_RECIPE_AUTHORITY
} from "../animation/both-sides-causal-recipe.ts";
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
    verified(KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER,
      "endpoint-normalizer",
      "src/authoring/equation-latex-endpoint-normalizer.ts"),
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
    kind === "renderer-capability";
}

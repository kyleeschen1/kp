import {
  kpCodeRefactorLanguages,
  type KpCodeRefactorLanguage
} from "./code-refactor-generation-request.ts";
import type {
  KpExtractHelperCausalContract,
  KpExtractHelperCausalRelationKind
} from "./extract-helper-causal-contract.ts";
import { KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY } from
  "./code-extract-helper-authorities.ts";

export const KP_CODE_EXTRACT_HELPER_CAUSAL_RECIPE_SCHEMA =
  "kp.code-extract-helper-causal-recipe.v1" as const;

export interface KpCodeExtractHelperRecipeCandidate {
  readonly language: KpCodeRefactorLanguage;
  readonly causalContract: KpExtractHelperCausalContract;
  readonly evidenceRoleIds: readonly string[];
}

export interface KpCodeExtractHelperCausalRecipe {
  readonly schemaVersion: typeof KP_CODE_EXTRACT_HELPER_CAUSAL_RECIPE_SCHEMA;
  readonly recipeId: typeof KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY;
  readonly operation: "extract-helper";
  readonly provedLanguages: readonly ["typescript", "python"];
  readonly contributorCardinality: Readonly<{
    minimum: 2;
    policy: "caller-proved";
  }>;
  readonly relationLaws: Readonly<{
    mergeContributors: Readonly<{
      source: "contributors";
      target: "helper-body";
    }>;
    introduceHelper: Readonly<{
      source: "none";
      target: "helper-declaration";
    }>;
    changeContributorRole: Readonly<{
      source: "one-contributor";
      target: "one-helper-call";
      multiplicity: "once-per-contributor";
    }>;
    succeedProgram: Readonly<{
      source: "source-program";
      target: "target-program";
    }>;
  }>;
  readonly delegatedAuthority: readonly [
    "language-owned-syntax-and-legality",
    "artifact-owned-pedagogical-score",
    "caller-owned-motion-and-rendering"
  ];
}

export interface KpCodeExtractHelperRecipeDiagnostic {
  readonly code:
    | "code-recipe.caller-set-invalid"
    | "code-recipe.evidence-incomplete"
    | "code-recipe.relation-shape-invalid";
  readonly path: string;
  readonly message: string;
}

export class KpCodeExtractHelperRecipeError extends Error {
  override readonly name = "KpCodeExtractHelperRecipeError";
  readonly diagnostics: readonly KpCodeExtractHelperRecipeDiagnostic[];

  constructor(diagnostics: readonly KpCodeExtractHelperRecipeDiagnostic[]) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * Promotion compares opaque language results, not their parsers. The shared
 * recipe owns causal role laws only; each caller retains every realization.
 */
export function promoteKpCodeExtractHelperCausalRecipe(
  candidates: readonly KpCodeExtractHelperRecipeCandidate[]
): KpCodeExtractHelperCausalRecipe {
  const diagnostics: KpCodeExtractHelperRecipeDiagnostic[] = [];
  const languages = candidates.map(({ language }) => language);
  if (
    candidates.length !== kpCodeRefactorLanguages.length ||
    new Set(languages).size !== languages.length ||
    kpCodeRefactorLanguages.some((language) => !languages.includes(language))
  ) diagnostics.push(issue(
    "code-recipe.caller-set-invalid",
    "$",
    "Recipe promotion requires one proved TypeScript caller and one proved Python caller."
  ));

  candidates.forEach((candidate, index) => {
    const path = `$[${index}]`;
    const declaredRoleIds = contractRoleIds(candidate.causalContract);
    if (!sameSet(declaredRoleIds, candidate.evidenceRoleIds)) diagnostics.push(issue(
      "code-recipe.evidence-incomplete",
      `${path}.evidenceRoleIds`,
      `${candidate.language} evidence must cover every causal role exactly.`
    ));
    if (!validRelationShape(candidate.causalContract)) diagnostics.push(issue(
      "code-recipe.relation-shape-invalid",
      `${path}.causalContract.relations`,
      `${candidate.language} causal relations do not satisfy extract-helper laws.`
    ));
  });

  if (diagnostics.length > 0) {
    throw new KpCodeExtractHelperRecipeError(diagnostics);
  }
  return deepFreeze({
    schemaVersion: KP_CODE_EXTRACT_HELPER_CAUSAL_RECIPE_SCHEMA,
    recipeId: KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
    operation: "extract-helper" as const,
    provedLanguages: ["typescript", "python"] as const,
    contributorCardinality: {
      minimum: 2 as const,
      policy: "caller-proved" as const
    },
    relationLaws: {
      mergeContributors: {
        source: "contributors" as const,
        target: "helper-body" as const
      },
      introduceHelper: {
        source: "none" as const,
        target: "helper-declaration" as const
      },
      changeContributorRole: {
        source: "one-contributor" as const,
        target: "one-helper-call" as const,
        multiplicity: "once-per-contributor" as const
      },
      succeedProgram: {
        source: "source-program" as const,
        target: "target-program" as const
      }
    },
    delegatedAuthority: [
      "language-owned-syntax-and-legality",
      "artifact-owned-pedagogical-score",
      "caller-owned-motion-and-rendering"
    ] as const
  });
}

function contractRoleIds(contract: KpExtractHelperCausalContract): readonly string[] {
  return [
    contract.sourceProgramRoleId,
    contract.targetProgramRoleId,
    contract.introducedHelper.declarationRoleId,
    contract.introducedHelper.bodyRoleId,
    ...contract.contributors.flatMap((contributor) => [
      contributor.sourceContributorRoleId,
      contributor.targetCallRoleId
    ])
  ];
}

function validRelationShape(contract: KpExtractHelperCausalContract): boolean {
  const contributorCount = contract.contributors.length;
  if (contributorCount < 2 || contract.operation !== "extract-helper") return false;
  const groups = new Map<KpExtractHelperCausalRelationKind,
    KpExtractHelperCausalContract["relations"]>();
  for (const kind of relationKinds) {
    groups.set(kind, contract.relations.filter((relation) => relation.kind === kind));
  }
  const merge = groups.get("merge-contributors") ?? [];
  const introduce = groups.get("introduce-helper") ?? [];
  const changes = groups.get("change-contributor-role") ?? [];
  const succeed = groups.get("succeed-program") ?? [];
  return contract.relations.length === contributorCount + 3 &&
    merge.length === 1 && merge[0]!.sourceRoleIds.length === contributorCount &&
    merge[0]!.targetRoleIds.length === 1 &&
    introduce.length === 1 && introduce[0]!.sourceRoleIds.length === 0 &&
    introduce[0]!.targetRoleIds.length === 1 &&
    changes.length === contributorCount && changes.every((relation) =>
      relation.sourceRoleIds.length === 1 && relation.targetRoleIds.length === 1
    ) &&
    succeed.length === 1 && succeed[0]!.sourceRoleIds.length === 1 &&
    succeed[0]!.targetRoleIds.length === 1;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.every((value) => right.includes(value));
}

function issue(
  code: KpCodeExtractHelperRecipeDiagnostic["code"],
  path: string,
  message: string
): KpCodeExtractHelperRecipeDiagnostic {
  return Object.freeze({ code, path, message });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const relationKinds = [
  "merge-contributors",
  "introduce-helper",
  "change-contributor-role",
  "succeed-program"
] as const satisfies readonly KpExtractHelperCausalRelationKind[];

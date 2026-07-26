import type {
  KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";
import {
  validateKpGovernedCanonicalConstructionCompilation,
  type KpGovernedConstructionSourceAuthority,
  type KpGovernedConstructionVerificationIssue
} from "./governed-canonical-construction-compiler.ts";

export type KpGovernedConstructionRepair =
  | KpProviderConstructionRepair
  | KpCompilerAuthorityRepair;

type KpGovernedConstructionRepairBody =
  | Omit<KpProviderConstructionRepair, "id" | "issueCode" | "diagnosticPath">
  | Omit<KpCompilerAuthorityRepair, "id" | "issueCode" | "diagnosticPath">;

type KpEpistemicGap =
  Extract<
    KpCompilerAuthorityRepair["action"],
    { readonly kind: "resolve-epistemic-gap" }
  >["missingEvidence"];

export interface KpProviderConstructionRepair {
  readonly id: string;
  readonly owner: "provider-revision";
  readonly issueCode: KpGovernedConstructionVerificationIssue["code"];
  readonly diagnosticPath: string;
  readonly action:
    | {
        readonly kind: "sync-verified-source";
        readonly sourceId: string;
        readonly revisionId: string;
      }
    | {
        readonly kind: "sync-operation-pack-pins";
        readonly operationPacks:
          KpGovernedConstructionSourceAuthority["operationPacks"];
      }
    | {
        readonly kind: "choose-approved-object";
        readonly allowedObjectIds: readonly string[];
      }
    | {
        readonly kind: "choose-approved-operation";
        readonly allowedOperationIds: readonly string[];
      }
    | {
        readonly kind: "include-required-objects";
        readonly requiredObjectIds: readonly string[];
      }
    | {
        readonly kind: "choose-supported-composition";
        readonly allowedKinds: readonly ["sequence", "parallel", "compound"];
      }
    | {
        readonly kind: "remove-unsupported-field";
      }
    | {
        readonly kind: "revise-request-schema";
      };
}

export interface KpCompilerAuthorityRepair {
  readonly id: string;
  readonly owner: "compiler-authority-review";
  readonly issueCode: KpGovernedConstructionVerificationIssue["code"];
  readonly diagnosticPath: string;
  readonly action:
    | {
        readonly kind: "rebind-verified-roles";
        readonly operationIds: readonly string[];
      }
    | {
        readonly kind: "resolve-epistemic-gap";
        readonly missingEvidence:
          | "asset-validity"
          | "definition"
          | "strict-law"
          | "lineage";
      };
}

/**
 * Repairs are suggestions for the owning boundary, never executable fallbacks.
 * In particular, this protocol has no renderer or replacement-animation action.
 */
export function planKpGovernedConstructionRepairs(input: {
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly authority: KpGovernedConstructionSourceAuthority;
}): readonly KpGovernedConstructionRepair[] {
  const issues = [...validateKpGovernedCanonicalConstructionCompilation(input)]
    .sort((left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message)
    );
  const operationIds = input.authority.animation.transformations
    .map(({ id }) => id)
    .sort();
  const objectIds = input.authority.animation.bundle.objects
    .map(({ id }) => id)
    .sort();
  const missingObjectIds = [...unique(
    input.request.compositionIntent.operationIds.flatMap((operationId) => {
      const operation = input.authority.animation.transformations.find(
        ({ id }) => id === operationId
      );
      if (operation === undefined) return [];
      return [...operation.sourceObjectIds, ...operation.targetObjectIds]
        .filter((objectId) =>
          !input.request.approvedObjectIds.includes(objectId)
        );
    })
  )].sort();

  const repairs: KpGovernedConstructionRepair[] = issues.map((issue, index) => {
    const repair = repairFor({
      issue,
      authority: input.authority,
      operationIds,
      objectIds,
      missingObjectIds
    });
    return Object.freeze({
      id: `repair.${String(index + 1).padStart(3, "0")}`,
      issueCode: issue.code,
      diagnosticPath: issue.path,
      ...repair
    }) as KpGovernedConstructionRepair;
  });
  return Object.freeze(repairs);
}

function repairFor(input: {
  readonly issue: KpGovernedConstructionVerificationIssue;
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly operationIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly missingObjectIds: readonly string[];
}): KpGovernedConstructionRepairBody {
  const { issue } = input;
  switch (issue.code) {
    case "governed-verification.source":
      return {
        owner: "provider-revision",
        action: {
          kind: "sync-verified-source",
          sourceId: input.authority.sourceId,
          revisionId: input.authority.revisionId
        }
      };
    case "governed-verification.pack":
      return {
        owner: "provider-revision",
        action: {
          kind: "sync-operation-pack-pins",
          operationPacks: Object.freeze(
            input.authority.operationPacks.map((pin) => Object.freeze({ ...pin }))
          )
        }
      };
    case "governed-verification.object":
      return {
        owner: "provider-revision",
        action: {
          kind: "choose-approved-object",
          allowedObjectIds: Object.freeze([...input.objectIds])
        }
      };
    case "governed-verification.operation":
      return {
        owner: "provider-revision",
        action: {
          kind: "choose-approved-operation",
          allowedOperationIds: Object.freeze([...input.operationIds])
        }
      };
    case "governed-verification.closure":
      return {
        owner: "provider-revision",
        action: {
          kind: "include-required-objects",
          requiredObjectIds: Object.freeze([...input.missingObjectIds])
        }
      };
    case "governed-verification.role":
      return {
        owner: "compiler-authority-review",
        action: {
          kind: "rebind-verified-roles",
          operationIds: Object.freeze([...input.operationIds])
        }
      };
    case "governed-verification.asset":
      return epistemic("asset-validity");
    case "governed-verification.definition":
      return epistemic("definition");
    case "governed-verification.law":
      return epistemic("strict-law");
    case "governed-verification.lineage":
      return epistemic("lineage");
    case "governed-verification.request":
      if (issue.path === "$.compositionIntent.kind") {
        return {
          owner: "provider-revision",
          action: {
            kind: "choose-supported-composition",
            allowedKinds: ["sequence", "parallel", "compound"]
          }
        };
      }
      if (issue.message.includes("outside the construction request boundary")) {
        return {
          owner: "provider-revision",
          action: { kind: "remove-unsupported-field" }
        };
      }
      return {
        owner: "provider-revision",
        action: { kind: "revise-request-schema" }
      };
  }
}

function epistemic(
  missingEvidence: KpEpistemicGap
): Omit<KpCompilerAuthorityRepair, "id" | "issueCode" | "diagnosticPath"> {
  return {
    owner: "compiler-authority-review",
    action: { kind: "resolve-epistemic-gap", missingEvidence }
  };
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

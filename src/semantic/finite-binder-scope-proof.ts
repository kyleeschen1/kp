import type {
  KpFiniteBinderSemanticId,
  KpFiniteBinderSource
} from "../domain-ir/finite-binder-vocabulary.ts";

export const KP_FINITE_BINDER_SCOPE_AUTHORITY =
  "proof.equation.finite-binder-scope.v1" as const;

export interface KpFiniteBinderEnclosingDeclaration {
  readonly id: KpFiniteBinderSemanticId;
  readonly symbol: string;
}

export interface KpVerifiedFiniteBinderScope {
  readonly schemaVersion: "kp.verified-finite-binder-scope.v1";
  readonly kind: "verified-finite-binder-scope";
  readonly authority: typeof KP_FINITE_BINDER_SCOPE_AUTHORITY;
  readonly sourceId: KpFiniteBinderSemanticId;
  readonly binderDeclarationId: KpFiniteBinderSemanticId;
  readonly boundReferenceIds: readonly KpFiniteBinderSemanticId[];
  readonly freeSymbols: readonly string[];
  readonly shadowedEnclosingDeclarationIds:
    readonly KpFiniteBinderSemanticId[];
  readonly substitutionDomain: "closed-integer";
  readonly captureAvoidance: "proved-by-closed-substitution";
}

export type KpFiniteBinderScopeProofResult =
  | Readonly<{ status: "verified"; proof: KpVerifiedFiniteBinderScope }>
  | Readonly<{
      status: "illegal";
      diagnostic: Readonly<{
        code:
          | "finite-binder-scope.unowned-reference"
          | "finite-binder-scope.reference-symbol-mismatch"
          | "finite-binder-scope.duplicate-reference"
          | "finite-binder-scope.ambiguous-enclosing-declaration";
        message: string;
        repair: string;
      }>;
    }>;

/**
 * Expansion substitutes closed integers, so it cannot capture a free name.
 * The proof still records lexical shadowing explicitly: a local binder may
 * shadow an enclosing symbol, but every body reference must resolve locally.
 */
export function proveKpFiniteBinderScope(
  source: KpFiniteBinderSource,
  enclosingDeclarations: readonly KpFiniteBinderEnclosingDeclaration[] = []
): KpFiniteBinderScopeProofResult {
  const enclosingIds = enclosingDeclarations.map(({ id }) => id);
  if (new Set(enclosingIds).size !== enclosingIds.length) {
    return illegal(
      "finite-binder-scope.ambiguous-enclosing-declaration",
      "Enclosing declaration ids must be unique."
    );
  }
  const referenceIds = source.body.references.map(({ id }) => id);
  if (new Set(referenceIds).size !== referenceIds.length) {
    return illegal(
      "finite-binder-scope.duplicate-reference",
      "Body reference occurrence ids must be unique."
    );
  }
  for (const reference of source.body.references) {
    if (reference.bindsTo !== source.binder.id) {
      return illegal(
        "finite-binder-scope.unowned-reference",
        `Reference ${reference.id} does not resolve to local binder ${source.binder.id}.`
      );
    }
    if (reference.symbol !== source.binder.symbol) {
      return illegal(
        "finite-binder-scope.reference-symbol-mismatch",
        `Reference ${reference.id} spells ${reference.symbol} but its binder spells ${source.binder.symbol}.`
      );
    }
  }
  const shadowedEnclosingDeclarationIds = enclosingDeclarations
    .filter(({ symbol }) => symbol === source.binder.symbol)
    .map(({ id }) => id);
  return deepFreeze({
    status: "verified" as const,
    proof: {
      schemaVersion: "kp.verified-finite-binder-scope.v1" as const,
      kind: "verified-finite-binder-scope" as const,
      authority: KP_FINITE_BINDER_SCOPE_AUTHORITY,
      sourceId: source.id,
      binderDeclarationId: source.binder.id,
      boundReferenceIds: referenceIds,
      freeSymbols: [...source.body.freeSymbols],
      shadowedEnclosingDeclarationIds,
      substitutionDomain: "closed-integer" as const,
      captureAvoidance: "proved-by-closed-substitution" as const
    }
  });
}

function illegal(
  code: Extract<KpFiniteBinderScopeProofResult, {
    status: "illegal";
  }>["diagnostic"]["code"],
  message: string
): KpFiniteBinderScopeProofResult {
  return deepFreeze({
    status: "illegal" as const,
    diagnostic: {
      code,
      message,
      repair:
        "Normalize one explicit local binder and bind every body reference to that declaration before expansion."
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2
} from "./equation-grammar-v2.ts";
import {
  kpOperationEvaluationAuthorityDescriptors
} from "../semantic/operation-evaluation-authority.ts";

export const kpEquationEvaluationAuthorityRegistryV2SchemaVersion =
  "kp.equation-evaluation-authority-registry.v2" as const;

export type KpEquationEvaluationKindV2 =
  | "product"
  | "quotient"
  | "difference"
  | "sum"
  | "cancellation"
  | "identity"
  | "successor"
  | "root";

export type KpEquationEvaluationPresentationAuthorityV2 =
  | {
      readonly kind: "registered-operation-evaluation";
      readonly presentationId: string;
      readonly familyProfileId:
        "kp.evaluation-family.contributor-fusion.v1";
      readonly planCompilerId:
        "kp.presentation-plan-compiler.successor-synthesis";
      readonly resultFormation: "successor-synthesis";
    }
  | {
      readonly kind: "registered-cancellation";
      readonly recipeId: "witnessed-annihilation-v1";
      readonly planCompilerId:
        "kp.presentation-plan-compiler.cancellation-operation";
      readonly resultFormation: "survivor-after-annihilation";
    }
  | {
      readonly kind: "registered-identity";
      readonly familyProfileId:
        "kp.evaluation-family.carrier-preserving-simplification.v1";
      readonly resultFormation: "persistent-carrier-transfer";
    }
  | {
      readonly kind: "registered-successor";
      readonly familyProfileId:
        "kp.evaluation-family.contributor-fusion.v1";
      readonly planCompilerId:
        "kp.presentation-plan-compiler.successor-synthesis";
      readonly resultFormation: "successor-synthesis";
    };

export interface KpEquationEvaluationAuthorityEntryV2 {
  readonly id: string;
  readonly evaluationKind: KpEquationEvaluationKindV2;
  readonly transformationKinds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly presentationAuthority:
    KpEquationEvaluationPresentationAuthorityV2;
}

export interface KpEquationEvaluationAuthorityRegistryV2 {
  readonly schemaVersion:
    typeof kpEquationEvaluationAuthorityRegistryV2SchemaVersion;
  readonly kind: "equation-evaluation-authority-registry-v2";
  readonly genericFallback: "forbidden";
  readonly callerAuthoredEvaluation: "forbidden";
  readonly entries: readonly KpEquationEvaluationAuthorityEntryV2[];
}

export const kpEquationEvaluationAuthorityRegistryV2 =
  createKpEquationEvaluationAuthorityRegistryV2({
    entries: [
      ...kpOperationEvaluationAuthorityDescriptors.map((descriptor) => ({
        id: `${descriptor.presentationId}.authority-v2`,
        evaluationKind: arithmeticKind(descriptor.transformationKind),
        transformationKinds: [descriptor.transformationKind],
        semanticOperationIds: descriptor.semanticOperationIds,
        presentationAuthority: {
          kind: "registered-operation-evaluation" as const,
          presentationId: descriptor.presentationId,
          familyProfileId:
            "kp.evaluation-family.contributor-fusion.v1" as const,
          planCompilerId:
            "kp.presentation-plan-compiler.successor-synthesis" as const,
          resultFormation: "successor-synthesis" as const
        }
      })),
      {
        id: "kp.evaluation-authority.cancellation.v2",
        evaluationKind: "cancellation",
        transformationKinds: [
          "cancelAdditiveInverses",
          "cancelMultiplicativeInverses",
          "simplifyUnitFractionFactor"
        ],
        semanticOperationIds: [
          "kp.algebra.cancel-additive-inverses",
          "kp.algebra.cancel-multiplicative-inverses",
          "kp.algebra.simplify-unit-fraction-factor"
        ],
        presentationAuthority: {
          kind: "registered-cancellation",
          recipeId: "witnessed-annihilation-v1",
          planCompilerId:
            "kp.presentation-plan-compiler.cancellation-operation",
          resultFormation: "survivor-after-annihilation"
        }
      },
      {
        id: "kp.evaluation-authority.real-root.v2",
        evaluationKind: "root",
        transformationKinds: [
          "operation.arithmetic.evaluate-real-root.v1"
        ],
        semanticOperationIds: [
          "operation.arithmetic.evaluate-real-root.v1"
        ],
        presentationAuthority: {
          kind: "registered-operation-evaluation",
          // Real-root evaluation reuses contributor fusion as presentation;
          // the semantic operation remains distinct from multiplication.
          presentationId: "kp.presentation.operation-evaluation.product",
          familyProfileId:
            "kp.evaluation-family.contributor-fusion.v1",
          planCompilerId:
            "kp.presentation-plan-compiler.successor-synthesis",
          resultFormation: "successor-synthesis"
        }
      },
      {
        id: "kp.evaluation-authority.identity.v2",
        evaluationKind: "identity",
        transformationKinds: [
          "simplify-additive-identity",
          "simplify-multiplicative-identity"
        ],
        semanticOperationIds: [
          "kp.semantic-motion.absorb-additive-identity",
          "kp.semantic-motion.absorb-multiplicative-identity"
        ],
        presentationAuthority: {
          kind: "registered-identity",
          familyProfileId:
            "kp.evaluation-family.carrier-preserving-simplification.v1",
          resultFormation: "persistent-carrier-transfer"
        }
      },
      {
        id: "kp.evaluation-authority.successor.v2",
        evaluationKind: "successor",
        transformationKinds: ["formSemanticSuccessor"],
        semanticOperationIds: ["kp.core.merge"],
        presentationAuthority: {
          kind: "registered-successor",
          familyProfileId:
            "kp.evaluation-family.contributor-fusion.v1",
          planCompilerId:
            "kp.presentation-plan-compiler.successor-synthesis",
          resultFormation: "successor-synthesis"
        }
      }
    ]
  });

export function createKpEquationEvaluationAuthorityRegistryV2(input: {
  readonly entries: readonly KpEquationEvaluationAuthorityEntryV2[];
}): KpEquationEvaluationAuthorityRegistryV2 {
  const entryIds = new Set<string>();
  const operationIds = new Set<string>();
  input.entries.forEach((entry) => {
    if (entry.id.trim() === "" || entryIds.has(entry.id)) {
      throw new Error(`Duplicate or empty evaluation authority ${entry.id}.`);
    }
    entryIds.add(entry.id);
    if (entry.transformationKinds.length === 0 ||
        entry.semanticOperationIds.length === 0) {
      throw new Error(`Evaluation authority ${entry.id} requires operations.`);
    }
    entry.semanticOperationIds.forEach((operationId) => {
      if (operationIds.has(operationId)) {
        throw new Error(`Duplicate evaluation operation ${operationId}.`);
      }
      operationIds.add(operationId);
    });
    if (!entry.presentationAuthority.kind.startsWith("registered-")) {
      throw new Error(
        `Evaluation authority ${entry.id} must name a registered presentation.`
      );
    }
  });
  return Object.freeze({
    schemaVersion: kpEquationEvaluationAuthorityRegistryV2SchemaVersion,
    kind: "equation-evaluation-authority-registry-v2" as const,
    genericFallback: "forbidden" as const,
    callerAuthoredEvaluation: "forbidden" as const,
    entries: Object.freeze(input.entries.map((entry) => Object.freeze({
      ...entry,
      transformationKinds: Object.freeze([...entry.transformationKinds]),
      semanticOperationIds: Object.freeze([...entry.semanticOperationIds]),
      presentationAuthority: Object.freeze({
        ...entry.presentationAuthority
      })
    })))
  });
}

export interface KpResolvedEquationEvaluationAuthorityV2 {
  readonly transitionId: string;
  readonly transformationId: string;
  readonly operationId: string;
  readonly authorityId: string;
  readonly evaluationKind: KpEquationEvaluationKindV2;
  readonly presentationAuthority:
    KpEquationEvaluationPresentationAuthorityV2;
  readonly resolutionSource: "mandatory-evaluation-registry";
}

export interface KpEquationEvaluationAuthorityDiagnosticV2 {
  readonly code:
    | "evaluation-authority.grammar-uncompiled"
    | "evaluation-authority.unregistered"
    | "evaluation-authority.misclassified";
  readonly transitionId?: string | undefined;
  readonly operationId?: string | undefined;
  readonly message: string;
}

export type KpEquationEvaluationAuthorityResolutionV2 =
  | {
      readonly status: "resolved";
      readonly evaluations:
        readonly KpResolvedEquationEvaluationAuthorityV2[];
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationEvaluationAuthorityDiagnosticV2[];
    };

export function resolveKpEquationEvaluationAuthoritiesV2(input: {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly registry?: KpEquationEvaluationAuthorityRegistryV2 | undefined;
}): KpEquationEvaluationAuthorityResolutionV2 {
  if (!isKpCompiledEquationGrammarV2(input.grammar)) {
    return repair([{
      code: "evaluation-authority.grammar-uncompiled",
      message: "Evaluation authority requires compiler-minted grammar v2."
    }]);
  }
  const registry = input.registry ?? kpEquationEvaluationAuthorityRegistryV2;
  const diagnostics: KpEquationEvaluationAuthorityDiagnosticV2[] = [];
  const evaluations: KpResolvedEquationEvaluationAuthorityV2[] = [];
  input.grammar.transitions.forEach((transition) => {
    const operationId = transition.operation.operationId;
    const entry = registry.entries.find(({ semanticOperationIds }) =>
      semanticOperationIds.includes(operationId)
    );
    if (transition.operation.semanticClass === "evaluation") {
      if (entry === undefined) {
        diagnostics.push({
          code: "evaluation-authority.unregistered",
          transitionId: transition.id,
          operationId,
          message:
            `Evaluation ${operationId} has no registered presentation authority.`
        });
        return;
      }
      evaluations.push(Object.freeze({
        transitionId: transition.id,
        transformationId: transition.transformationId,
        operationId,
        authorityId: entry.id,
        evaluationKind: entry.evaluationKind,
        presentationAuthority: entry.presentationAuthority,
        resolutionSource: "mandatory-evaluation-registry" as const
      }));
      return;
    }
    if (entry !== undefined) {
      diagnostics.push({
        code: "evaluation-authority.misclassified",
        transitionId: transition.id,
        operationId,
        message:
          `Registered evaluation ${operationId} cannot be declared as a ` +
          "generic transformation."
      });
    }
  });
  if (diagnostics.length > 0) return repair(diagnostics);
  return Object.freeze({
    status: "resolved" as const,
    evaluations: Object.freeze(evaluations),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function arithmeticKind(
  transformationKind: string
): "product" | "quotient" | "difference" | "sum" {
  switch (transformationKind) {
    case "simplifyConstantProduct": return "product";
    case "simplifyConstantQuotient": return "quotient";
    case "simplifyConstantDifference": return "difference";
    case "simplifyConstantSum": return "sum";
    default:
      throw new Error(`Unknown arithmetic evaluation ${transformationKind}.`);
  }
}

function repair(
  diagnostics: readonly KpEquationEvaluationAuthorityDiagnosticV2[]
): KpEquationEvaluationAuthorityResolutionV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}

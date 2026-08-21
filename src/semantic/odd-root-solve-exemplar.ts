import {
  isKpVerifiedInversePowerOperation,
  KP_INVERSE_POWER_OPERATION_AUTHORITY,
  verifyKpInversePowerOperation,
  type KpVerifiedInversePowerOperation
} from "./inverse-power-operation.ts";
import {
  normalizeKpRadicalEndpoint,
  type KpNormalizedPowerRootEndpoint,
  type KpNormalizedRadicalRootEndpoint
} from "./radical-endpoint-normalizer.ts";
import type { KpRootRewriteOccurrence } from "./root-rewrite-plan.ts";

declare const kpVerifiedOddRootSolveExemplarBrand: unique symbol;

export const KP_ODD_ROOT_SOLVE_EXEMPLAR_ID =
  "exemplar.equation.odd-root.x-cubed-eight" as const;

export interface KpOddRootSourceState {
  readonly id: "state.odd-root.source";
  readonly kind: "powered-equality";
  readonly latex: "x^{3}=8";
  readonly accessibleText: "x cubed equals eight";
  readonly expression: KpRootRewriteOccurrence;
  readonly power: KpRootRewriteOccurrence;
  readonly subject: KpRootRewriteOccurrence;
  readonly exponent: KpRootRewriteOccurrence;
  readonly relation: KpRootRewriteOccurrence;
  readonly right: KpRootRewriteOccurrence;
}

export interface KpOddRootTargetState {
  readonly id: "state.odd-root.radical";
  readonly kind: "unique-radical-equality";
  readonly latex: "x=\\sqrt[3]{8}";
  readonly accessibleText: "x equals the cube root of eight";
  readonly expression: KpRootRewriteOccurrence;
  readonly subject: KpRootRewriteOccurrence;
  readonly relation: KpRootRewriteOccurrence;
  readonly rootExpression: KpRootRewriteOccurrence;
  readonly radical: KpRootRewriteOccurrence;
  readonly rootIndex: KpRootRewriteOccurrence;
  readonly radicand: KpRootRewriteOccurrence;
  readonly branch: Readonly<{
    id: "branch.odd-root.unique-real";
    sign: "unique-real";
    solutionSemanticId: "semantic.solution.x.two";
    representationEntityId: "target.odd-root.root-expression";
  }>;
}

export type KpVerifiedOddRootSolveExemplar = Readonly<{
  schemaVersion: "kp.odd-root-solve-exemplar.v1";
  kind: "verified-odd-root-solve-exemplar";
  id: typeof KP_ODD_ROOT_SOLVE_EXEMPLAR_ID;
  states: readonly [KpOddRootSourceState, KpOddRootTargetState];
  operation: KpVerifiedInversePowerOperation;
  restoration: Readonly<{
    kind: "direct-immutable-state-lookup";
    stateIds: readonly [KpOddRootSourceState["id"],
      KpOddRootTargetState["id"]];
    replayRequired: false;
  }>;
  readonly [kpVerifiedOddRootSolveExemplarBrand]: true;
}>;

const verifiedExemplars = new WeakSet<object>();

export function createKpOddRootSolveExemplar():
  KpVerifiedOddRootSolveExemplar {
  const source = sourceState();
  const target = targetState();
  const sourceEndpoint = requirePowerEndpoint("x^3");
  const targetEndpoint = requireRadicalEndpoint("\\sqrt[3]{8}");
  const operation = verifyKpInversePowerOperation({
    schemaVersion: "kp.inverse-power-operation.v1",
    id: "operation.odd-root.apply-inverse-cube",
    operationAuthority: KP_INVERSE_POWER_OPERATION_AUTHORITY,
    lawAuthority: {
      id: "law.equation.inverse-positive-integer-power-over-reals",
      authorityRefId: "definition.inverse-power.real-cube",
      level: "strict"
    },
    relation: {
      semanticId: "semantic.relation.equality",
      sourceEntityId: source.relation.entityId,
      targetEntityId: target.relation.entityId
    },
    source: {
      stateId: source.id,
      poweredExpressionEntityId: source.power.entityId,
      base: occurrenceRef(source.subject),
      exponentEntityId: source.exponent.entityId,
      right: occurrenceRef(source.right),
      endpoint: sourceEndpoint
    },
    target: {
      stateId: target.id,
      subject: occurrenceRef(target.subject),
      rootExpressionEntityId: target.rootExpression.entityId,
      radicalOperatorEntityId: target.radical.entityId,
      rootIndexEntityId: target.rootIndex.entityId,
      radicand: occurrenceRef(target.radicand),
      endpoint: targetEndpoint
    },
    exponentEvidence: {
      kind: "positive-integer-exponent",
      exponent: 3,
      parity: "odd",
      positiveIntegerEvidenceId: "evidence.exponent.three.positive-integer",
      parityEvidenceId: "evidence.exponent.three.odd"
    },
    domainEvidence: {
      scalarDomain: "real",
      sourceBaseDomainEvidenceId: "evidence.variable.x.real",
      rightValueDomainEvidenceId: "evidence.value.eight.real",
      radicandSign: "positive",
      radicandSignEvidenceId: "evidence.value.eight.positive"
    },
    solutionSet: {
      kind: "enumerated-real-roots",
      multiplicity: 1,
      branches: [{
        id: target.branch.id,
        sign: target.branch.sign,
        solutionSemanticId: target.branch.solutionSemanticId,
        candidateEntityId: target.branch.representationEntityId,
        substitutionEvidenceId: "evidence.substitution.two-cubed-is-eight"
      }],
      candidateAudit: {
        kind: "complete-candidate-audit",
        acceptedBranchIds: [target.branch.id],
        rejectedCandidates: [],
        completenessEvidenceId: "evidence.odd-root.candidates.complete"
      }
    }
  });
  const stateIds = [source.id, target.id] as const;
  const exemplar = deepFreeze({
    schemaVersion: "kp.odd-root-solve-exemplar.v1" as const,
    kind: "verified-odd-root-solve-exemplar" as const,
    id: KP_ODD_ROOT_SOLVE_EXEMPLAR_ID,
    states: [source, target] as const,
    operation,
    restoration: {
      kind: "direct-immutable-state-lookup" as const,
      stateIds,
      replayRequired: false as const
    }
  }) as unknown as KpVerifiedOddRootSolveExemplar;
  verifiedExemplars.add(exemplar);
  return exemplar;
}

export function isKpVerifiedOddRootSolveExemplar(
  value: unknown
): value is KpVerifiedOddRootSolveExemplar {
  return typeof value === "object" && value !== null &&
    verifiedExemplars.has(value) &&
    isKpVerifiedInversePowerOperation(
      (value as KpVerifiedOddRootSolveExemplar).operation
    );
}

export const kpOddRootSolveExemplar = createKpOddRootSolveExemplar();

function sourceState(): KpOddRootSourceState {
  return deepFreeze({
    id: "state.odd-root.source" as const,
    kind: "powered-equality" as const,
    latex: "x^{3}=8" as const,
    accessibleText: "x cubed equals eight" as const,
    expression: occurrence("source.odd-root.expression",
      "semantic.equation.x-cubed-eight", "compound"),
    power: occurrence("source.odd-root.power",
      "semantic.expression.x-cubed", "compound"),
    subject: occurrence("source.odd-root.x", "semantic.variable.x", "atomic"),
    exponent: occurrence("source.odd-root.exponent.three",
      "semantic.index.three", "value"),
    relation: occurrence("source.odd-root.relation",
      "semantic.relation.equality", "operator"),
    right: occurrence("source.odd-root.value.eight",
      "semantic.value.eight", "value")
  });
}

function targetState(): KpOddRootTargetState {
  return deepFreeze({
    id: "state.odd-root.radical" as const,
    kind: "unique-radical-equality" as const,
    latex: "x=\\sqrt[3]{8}" as const,
    accessibleText: "x equals the cube root of eight" as const,
    expression: occurrence("target.odd-root.expression",
      "semantic.equation.x-cube-root-eight", "compound"),
    subject: occurrence("target.odd-root.x", "semantic.variable.x", "atomic"),
    relation: occurrence("target.odd-root.relation",
      "semantic.relation.equality", "operator"),
    rootExpression: occurrence("target.odd-root.root-expression",
      "semantic.expression.cube-root-eight", "compound"),
    radical: occurrence("target.odd-root.radical",
      "semantic.operator.cube-root", "operator"),
    rootIndex: occurrence("target.odd-root.index.three",
      "semantic.index.three", "value"),
    radicand: occurrence("target.odd-root.radicand.eight",
      "semantic.value.eight", "value"),
    branch: {
      id: "branch.odd-root.unique-real" as const,
      sign: "unique-real" as const,
      solutionSemanticId: "semantic.solution.x.two" as const,
      representationEntityId: "target.odd-root.root-expression" as const
    }
  });
}

function occurrence(
  entityId: string,
  semanticId: string,
  subtreeKind: KpRootRewriteOccurrence["subtreeKind"]
): KpRootRewriteOccurrence {
  return { entityId, semanticId, subtreeId: `subtree.${entityId}`, subtreeKind };
}

function occurrenceRef(occurrence: KpRootRewriteOccurrence) {
  return { entityId: occurrence.entityId, semanticId: occurrence.semanticId };
}

function requirePowerEndpoint(latex: string): KpNormalizedPowerRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "power") {
    throw new Error(`Expected normalized power endpoint ${latex}.`);
  }
  return result.endpoint;
}

function requireRadicalEndpoint(latex: string): KpNormalizedRadicalRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "radical") {
    throw new Error(`Expected normalized radical endpoint ${latex}.`);
  }
  return result.endpoint;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

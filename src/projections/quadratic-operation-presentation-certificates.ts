import {
  createKpOperationPresentationCertificate,
  evaluateKpOperationPresentationConformance,
  evaluateKpOperationPresentationCoverage,
  evaluateKpOperationPresentationMaterialRoles,
  validateKpOperationPresentationCertificate,
  type KpOperationPresentationCertificate,
  type KpOperationPresentationMaterial,
  type KpOperationPresentationMaterialRoleId,
  type KpOperationPresentationMotifRegistration,
  type KpOperationPresentationPhase
} from "../animation/operation-presentation-certificate.ts";
import {
  createKpCompletingSquareKatexProjection,
  type KpQuadraticKatexState,
  type KpQuadraticKatexTransition
} from "./quadratic-completing-square-katex.ts";
import {
  createKpQuadraticFormulaKatexProjection
} from "./quadratic-formula-katex.ts";

export const kpQuadraticOperationPresentationCertificateIds = Object.freeze([
  "certificate.reader.quadratic.completing-square",
  "certificate.reader.quadratic.formula"
] as const);

const motifByOperationId = Object.freeze({
  "rewrite.quadratic.completing-square.balance-constant":
    "motif.equation.balance-relocation",
  "rewrite.quadratic.completing-square.add-square-term":
    "motif.equation.balance-both-sides",
  "operation.arithmetic.integer-to-equivalent-fraction":
    "motif.fraction.equivalent-denominator",
  "operation.arithmetic.add-like-denominator-fractions":
    "motif.fraction.merge-like-denominator",
  "operation.algebra.expose-perfect-square-pattern":
    "motif.factoring.expose-pattern",
  "rewrite.quadratic.completing-square.recognize-perfect-square":
    "motif.factoring.group-wrap",
  "operation.quadratic.take-square-roots-and-branch-sign":
    "motif.radical.take-square-roots",
  "operation.quadratic.evaluate-principal-square-root":
    "motif.radical.root-fold",
  "operation.quadratic.isolate-signed-candidates":
    "motif.equation.isolate-signed-candidates",
  "operation.quadratic.normalize-signed-candidates":
    "motif.fraction.normalize-signed-candidates",
  "operation.quadratic-formula.substitute-coefficients":
    "motif.formula.substitute-coefficients",
  "operation.quadratic-formula.evaluate-b-square":
    "motif.exponent.evaluate-power",
  "operation.quadratic-formula.evaluate-four-a-c":
    "motif.product.evaluate-factors",
  "operation.quadratic-formula.subtract-discriminant":
    "motif.arithmetic.subtract-discriminant",
  "operation.quadratic-formula.prepare-denominator":
    "motif.product.prepare-denominator",
  "operation.quadratic-formula.simplify-exact-radical":
    "motif.radical.root-fold",
  "operation.quadratic-formula.evaluate-candidate-numerators":
    "motif.arithmetic.evaluate-signed-numerators",
  "operation.quadratic-formula.divide-candidates":
    "motif.fraction.divide-candidates"
} as const satisfies Readonly<Record<string, string>>);

export function createKpQuadraticOperationPresentationCertificates():
  readonly KpOperationPresentationCertificate[] {
  return Object.freeze([
    compileProjectionCertificate({
      id: kpQuadraticOperationPresentationCertificateIds[0],
      authorityRefId: "authority.quadratic.completing-square",
      projection: createKpCompletingSquareKatexProjection()
    }),
    compileProjectionCertificate({
      id: kpQuadraticOperationPresentationCertificateIds[1],
      authorityRefId: "authority.quadratic.formula",
      projection: createKpQuadraticFormulaKatexProjection()
    })
  ]);
}

export function createKpQuadraticOperationMotifRegistry():
  readonly KpOperationPresentationMotifRegistration[] {
  const operationIdsByMotif = new Map<string, string[]>();
  Object.entries(motifByOperationId).forEach(
    ([canonicalOperationId, motifId]) => {
      operationIdsByMotif.set(motifId, [
        ...(operationIdsByMotif.get(motifId) ?? []),
        canonicalOperationId
      ]);
    }
  );
  return Object.freeze([...operationIdsByMotif].map(
    ([motifId, canonicalOperationIds]) => Object.freeze({
      motifId,
      canonicalOperationIds: Object.freeze(canonicalOperationIds)
    })
  ));
}

export function evaluateKpQuadraticOperationPresentationCertificates():
  readonly string[] {
  const motifRegistry = createKpQuadraticOperationMotifRegistry();
  return Object.freeze(
    createKpQuadraticOperationPresentationCertificates().flatMap(
      (certificate) => [
        ...validateKpOperationPresentationCertificate(certificate).map(
          ({ path, message }) => `${certificate.id}:${path}:${message}`
        ),
        ...evaluateKpOperationPresentationCoverage(certificate).map(
          ({ code, message }) => `${certificate.id}:${code}:${message}`
        ),
        ...evaluateKpOperationPresentationMaterialRoles(certificate).map(
          ({ code, message }) => `${certificate.id}:${code}:${message}`
        ),
        ...evaluateKpOperationPresentationConformance({
          certificate,
          motifRegistry
        }).map(
          ({ code, message }) => `${certificate.id}:${code}:${message}`
        )
      ]
    )
  );
}

function compileProjectionCertificate(input: {
  readonly id: string;
  readonly authorityRefId: string;
  readonly projection: {
    readonly id: string;
    readonly states: readonly KpQuadraticKatexState[];
    readonly transitions: readonly KpQuadraticKatexTransition[];
  };
}): KpOperationPresentationCertificate {
  const materials: KpOperationPresentationMaterial[] = [];
  const spans = input.projection.transitions.map((transition, semanticRank) => {
    const operationId = transition.presentation?.operationRef;
    if (operationId === undefined) {
      throw new Error(
        `Quadratic transition ${transition.id} cannot certify generic fallback.`
      );
    }
    const source = input.projection.states.find(
      ({ id }) => id === transition.sourceStateId
    )!;
    const target = input.projection.states.find(
      ({ id }) => id === transition.targetStateId
    )!;
    const spanMaterials = materialInstances({
      transition,
      source,
      target,
      semanticRank
    });
    materials.push(...spanMaterials);
    return {
      id: `span.${transition.id}`,
      presentation: "atomic" as const,
      representedOperationIds: [operationId],
      sourceStateId: source.semanticStateId,
      targetStateId: target.semanticStateId,
      motifId: motifFor(operationId),
      phases: phasesFor(transition.id, spanMaterials)
    };
  });
  return createKpOperationPresentationCertificate({
    id: input.id,
    authorityRefId: input.authorityRefId,
    timelineRefId: "timeline.quadratic.solution-branching.shared",
    authorityOperations: input.projection.transitions.map(
      (transition, semanticRank) => {
        const operationId = transition.presentation?.operationRef;
        if (operationId === undefined) {
          throw new Error(
            `Quadratic transition ${transition.id} cannot certify generic fallback.`
          );
        }
        return {
          id: operationId,
          semanticRank,
          canonicalOperationId: operationId
        };
      }
    ),
    materials,
    spans
  });
}

function materialInstances(input: {
  readonly transition: KpQuadraticKatexTransition;
  readonly source: KpQuadraticKatexState;
  readonly target: KpQuadraticKatexState;
  readonly semanticRank: number;
}): readonly KpOperationPresentationMaterial[] {
  const prefix = `material.${input.semanticRank}.${input.transition.id}`;
  const correspondenceBySource = new Map(
    input.transition.correspondence.map(
      (binding) => [binding.sourceSelectorId, binding] as const
    )
  );
  const correspondenceByTarget = new Map(
    input.transition.correspondence.map(
      (binding) => [binding.targetSelectorId, binding] as const
    )
  );
  return Object.freeze([
    ...input.source.selectors.map((selector) => {
      const binding = correspondenceBySource.get(selector.id);
      return Object.freeze({
        entityId: `${prefix}.source.${selector.id}`,
        semanticRoleId: selector.role,
        presentationRole:
          binding?.presentationRole ?? "eliminated"
      });
    }),
    ...input.target.selectors.map((selector) => {
      const binding = correspondenceByTarget.get(selector.id);
      return Object.freeze({
        entityId: `${prefix}.target.${selector.id}`,
        semanticRoleId: selector.role,
        presentationRole:
          binding?.presentationRole ?? "introduced"
      });
    })
  ]);
}

function phasesFor(
  transitionId: string,
  materials: readonly KpOperationPresentationMaterial[]
): readonly KpOperationPresentationPhase[] {
  const byRole = (
    roles: readonly KpOperationPresentationMaterialRoleId[]
  ) => materials
    .filter(({ presentationRole }) => roles.includes(presentationRole))
    .map(({ entityId }) => entityId);
  const continuants = byRole(["continuant"]);
  const introduced = byRole(["introduced"]);
  const structural = byRole(["structural"]);
  const actors = byRole([
    "focal-operand",
    "introduced",
    "eliminated",
    "copied",
    "merged"
  ]);
  return Object.freeze([
    ...(structural.length === 0 ? [] : [{
      id: `${transitionId}.orient`,
      phaseId: "orient" as const,
      activityKind: "focus" as const,
      materialEntityIds: structural
    }]),
    ...(continuants.length === 0 ? [] : [{
      id: `${transitionId}.reflow`,
      phaseId: "reflow" as const,
      activityKind: "move-continuant" as const,
      materialEntityIds: continuants
    }]),
    ...(introduced.length === 0 ? [] : [{
      id: `${transitionId}.reserve`,
      phaseId: "reflow" as const,
      activityKind: "reserve-space" as const,
      materialEntityIds: introduced
    }]),
    {
      id: `${transitionId}.act`,
      phaseId: "act" as const,
      activityKind: "execute-operation" as const,
      materialEntityIds: actors
    }
  ]);
}

function motifFor(operationId: string): string {
  const motifId = motifByOperationId[
    operationId as keyof typeof motifByOperationId
  ];
  if (motifId === undefined) {
    throw new Error(
      `Quadratic operation ${operationId} has no registered presentation motif.`
    );
  }
  return motifId;
}

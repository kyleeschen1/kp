import {
  KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY,
  KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY
} from "../animation/logarithm-change-of-base-presentation-plan.ts";
import {
  KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
  verifyKpLogarithmChangeOfBase,
  type KpLogarithmChangeOfBaseAtom,
  type KpVerifiedLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import {
  KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY,
  kpLogarithmChangeOfBaseCorpus
} from "../semantic/logarithm-change-of-base-corpus.ts";
import { compileKpEquationTransformSeries } from
  "./compile-equation-transform-series.ts";
import {
  KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
} from "./equation-latex-endpoint-normalizer.ts";
import {
  createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
  KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
  KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY,
  type KpEquationSeriesLogarithmBaseSemanticArguments
} from "./equation-series-logarithm-base-authoring.ts";

export const KP_LOGARITHM_BASE_AUTHORING_EVIDENCE_ID =
  "evidence.equation.logarithm-base-authoring.v1" as const;

export function evaluateKpLogarithmBaseAuthoringEvidence() {
  const verifiedCases = kpLogarithmChangeOfBaseCorpus.cases
    .filter(({ expectedStatus }) => expectedStatus === "verified")
    .map(({ id, draft }) => ({
      id,
      transformation: verifyKpLogarithmChangeOfBase(draft)
    }));
  const cases = verifiedCases.map(({ id, transformation }) => {
    const source = createKpEquationSeriesLogarithmBaseSemanticSource({
      sourceId: `source.authoring.${id}`,
      revisionId: `revision.authoring.${id}.v1`,
      transformation
    });
    const result = compileKpEquationTransformSeries({
      value: request(transformation, source.sourceId, source.revisionId),
      governedSources: [source]
    });
    return Object.freeze({
      fixtureId: id,
      status: result.status,
      passed: result.status === "compiled" &&
        result.active?.runtime.plans[0]?.operationId ===
          KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
    });
  });
  return deepFreeze({
    schemaVersion: "kp.logarithm-base-authoring-evidence.v1" as const,
    id: KP_LOGARITHM_BASE_AUTHORING_EVIDENCE_ID,
    status: cases.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    animationId: "animation.equation.logarithm-change-of-base.v1" as const,
    operationId: KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
    authoringAuthorityId:
      KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY,
    resolvedAuthorityIds: [
      KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
      KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY,
      KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY,
      KP_EQUATION_LOGARITHM_BASE_SYNTAX_NORMALIZER
    ],
    generationCorpusAuthorityIds: [
      KP_LOGARITHM_CHANGE_OF_BASE_CORPUS_AUTHORITY
    ],
    cases
  });
}

function request(
  transformation: KpVerifiedLogarithmChangeOfBase,
  sourceId: string,
  revisionId: string
) {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `series.authoring.${transformation.id}`,
    states: [{
      id: transformation.source.stateId,
      latex: `\\log_{${atomLatex(transformation.source.base)}}(` +
        `${atomLatex(transformation.source.argument)})`
    }, {
      id: transformation.target.stateId,
      latex: `\\frac{\\ln(${atomLatex(
        transformation.target.numerator.argument
      )})}{\\ln(${atomLatex(
        transformation.target.denominator.argument
      )})}`
    }],
    adjacencies: [{
      id: `adjacency.authoring.${transformation.id}`,
      fromStateId: transformation.source.stateId,
      toStateId: transformation.target.stateId,
      intent: {
        mode: "explicit",
        operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
        semanticArguments: semanticArguments(
          transformation,
          sourceId,
          revisionId
        )
      }
    }]
  };
}

function semanticArguments(
  transformation: KpVerifiedLogarithmChangeOfBase,
  sourceId: string,
  revisionId: string
): KpEquationSeriesLogarithmBaseSemanticArguments {
  return {
    schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
    sourcePin: { sourceId, revisionId },
    operationPin: { ...KP_LOGARITHM_BASE_AUTHORING_PACK_PIN },
    semanticBindings: {
      sourceBaseSemanticId: transformation.source.base.semanticId,
      sourceArgumentSemanticId: transformation.source.argument.semanticId,
      targetLogarithmFunction: "natural-logarithm"
    },
    domainEvidenceIds: { ...transformation.domainEvidence }
  };
}

function atomLatex(atom: KpLogarithmChangeOfBaseAtom): string {
  return atom.kind === "number" ? String(atom.value) : atom.symbol;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

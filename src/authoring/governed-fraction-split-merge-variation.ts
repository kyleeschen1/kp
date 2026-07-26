import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../animation/numerator-split-merge-equation-adapter.ts";
import {
  createParameterizedNumeratorSplitMergeEquationKpAsset,
  type NumeratorSplitMergeEquationParameters
} from "../semantic/numerator-split-merge-equation-asset.ts";
import {
  compileKpGovernedCanonicalConstruction,
  type KpGovernedConstructionSourceAuthority,
  type KpVerifiedGovernedCanonicalConstruction
} from "./governed-canonical-construction-compiler.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

const parameters: NumeratorSplitMergeEquationParameters = {
  idStem: "fraction-variation-three-y-nine-thirds",
  coefficient: 3,
  variable: "y",
  constant: 9,
  denominator: 3
};

export interface KpGovernedFractionSplitMergeVariation {
  readonly id: "fixture.governed.fraction-split-merge-variation.v1";
  readonly parameters: NumeratorSplitMergeEquationParameters;
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly compilation: KpVerifiedGovernedCanonicalConstruction;
  readonly equalityCertificate: {
    readonly kind: "exact-linear-rational-equality";
    readonly lawId: "law.algebra.fraction-sum-split";
    readonly variable: string;
    readonly source: KpExactLinearRationalForm;
    readonly target: KpExactLinearRationalForm;
  };
}

export interface KpExactLinearRationalForm {
  readonly variableCoefficient: {
    readonly numerator: string;
    readonly denominator: string;
  };
  readonly constant: {
    readonly numerator: string;
    readonly denominator: string;
  };
}

/**
 * This fixture varies only verified semantic parameters. The accepted adapter,
 * compiler, material projection, and renderer session remain the sole owners
 * of scheduling and paint.
 */
export function createKpGovernedFractionSplitMergeVariation():
  KpGovernedFractionSplitMergeVariation {
  const semantic = createParameterizedNumeratorSplitMergeEquationKpAsset(
    parameters
  );
  const animation = createNumeratorSplitMergeEquationAnimationAsset(semantic);
  const operationPacks = [{
    packId: "kp.algebra",
    version: "0.1.0"
  }] as const;
  const authority: KpGovernedConstructionSourceAuthority = {
    sourceId: semantic.bundle.id,
    revisionId: "1",
    operationPacks,
    animation
  };
  const request = createKpGovernedCanonicalConstructionRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.governed.fraction-split-merge-variation.v1",
    source: {
      kind: "verified-semantic-source",
      sourceId: authority.sourceId,
      revisionId: authority.revisionId,
      operationPacks
    },
    approvedObjectIds: [semantic.ids.combined, semantic.ids.split],
    approvedOperationIds: [
      semantic.ids.splitTransform,
      semantic.ids.mergeTransform
    ],
    explanationPurpose: {
      kind: "transmit",
      objectIds: [semantic.ids.combined, semantic.ids.split],
      operationIds: [
        semantic.ids.splitTransform,
        semantic.ids.mergeTransform
      ]
    },
    detailLevel: "complete",
    compositionIntent: {
      kind: "sequence",
      operationIds: [
        semantic.ids.splitTransform,
        semantic.ids.mergeTransform
      ]
    }
  });
  const compilation = compileKpGovernedCanonicalConstruction({
    request,
    authority
  });
  const normalized = exactLinearForm(parameters);
  return deepFreeze({
    id: "fixture.governed.fraction-split-merge-variation.v1" as const,
    parameters,
    authority,
    request,
    compilation,
    equalityCertificate: {
      kind: "exact-linear-rational-equality" as const,
      lawId: "law.algebra.fraction-sum-split" as const,
      variable: parameters.variable,
      source: normalized,
      target: normalized
    }
  });
}

function exactLinearForm(
  input: NumeratorSplitMergeEquationParameters
): KpExactLinearRationalForm {
  return {
    variableCoefficient: reduce(input.coefficient, input.denominator),
    constant: reduce(input.constant, input.denominator)
  };
}

function reduce(numerator: number, denominator: number) {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: String(numerator / divisor),
    denominator: String(denominator / divisor)
  };
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function deepFreeze<T>(value: T): T {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

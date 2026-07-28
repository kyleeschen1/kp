import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  deriveKpCancellationPresentationRoleComplements,
  validateAndMintKpCancellationPresentationAuthoring,
  type KpCancellationPresentationAuthoringDraft,
  type KpCancellationPresentationSelectorBundle
} from "./cancellation-presentation-authoring.ts";
import {
  compileKpCancellationOperationPresentationPlan
} from "./cancellation-operation-presentation-plan.ts";
import type {
  KpVerifiedInverseCancellationPresentationPlan
} from "./operation-presentation-plan-types.ts";

// Keep the shared reader resolver independent of family asset constructors.
// The executable discovery test for this boundary proves these exact IDs
// still match their canonical assets without loading those assets on every
// reader route.
const existingCancellationIds = {
  linearSolve: {
    cancel: "transform.linear-solve.cancel-left-additive-inverse",
    source: "equation.linear-solve.after-subtract"
  },
  fractionalLinear: {
    cancelAdditive:
      "transform.fractional-linear.cancel-additive-inverses",
    cancelDenominator: "transform.fractional-linear.cancel-denominator",
    afterSubtract: "equation.fractional-linear.after-subtract",
    multiplied: "equation.fractional-linear.multiplied"
  },
  divideBothSides: {
    cancelCoefficient: "transform.divide-both-sides.cancel-coefficient",
    divided: "equation.divide-both-sides.divided"
  }
} as const;

type KpExistingEquationCancellationTransformationId =
  | typeof existingCancellationIds.linearSolve.cancel
  | typeof existingCancellationIds.fractionalLinear.cancelAdditive
  | typeof existingCancellationIds.fractionalLinear.cancelDenominator
  | typeof existingCancellationIds.divideBothSides.cancelCoefficient;

interface KpExistingEquationCancellationRoleSpec {
  readonly authoringId: string;
  readonly bundleNamespace: string;
  readonly cancellationRecordId: string;
  readonly inverseBundles: readonly [
    KpCancellationPresentationSelectorBundle,
    KpCancellationPresentationSelectorBundle
  ];
  readonly catalysts: readonly KpCancellationPresentationSelectorBundle[];
}

/**
 * This exact transformation registry is the authored semantic authority for
 * existing cancellation families. Its two inverse bundles are deliberately
 * explicit: equal-looking glyphs or nearby DOM nodes may never create motion
 * authority.
 */
const kpExistingEquationCancellationRoleSpecs = {
  [existingCancellationIds.linearSolve.cancel]: {
    authoringId: "linear-solve.cancellation.additive-inverses",
    bundleNamespace: "linear-solve",
    cancellationRecordId: "left-inverses-cancel",
    inverseBundles: [
      {
        id: "linear-solve.inverse.positive-three",
        selectorIds: [
          `${existingCancellationIds.linearSolve.source}.lhs.plus3`
        ]
      },
      {
        id: "linear-solve.inverse.negative-three",
        selectorIds: [
          `${existingCancellationIds.linearSolve.source}.lhs.minus3`
        ]
      }
    ],
    catalysts: []
  },
  [existingCancellationIds.fractionalLinear.cancelAdditive]: {
    authoringId: "fractional-linear.cancellation.additive-inverses",
    bundleNamespace: "fractional-linear.additive",
    cancellationRecordId: "left-inverses-cancel",
    inverseBundles: [
      {
        id: "fractional-linear.inverse.positive-three",
        selectorIds: [
          `${existingCancellationIds.fractionalLinear.afterSubtract}.lhs.plus3`
        ]
      },
      {
        id: "fractional-linear.inverse.negative-three",
        selectorIds: [
          `${existingCancellationIds.fractionalLinear.afterSubtract}.lhs.minus3`
        ]
      }
    ],
    catalysts: []
  },
  [existingCancellationIds.fractionalLinear.cancelDenominator]: {
    authoringId: "fractional-linear.cancellation.denominator",
    bundleNamespace: "fractional-linear.denominator",
    cancellationRecordId: "twos-cancel",
    inverseBundles: [
      {
        id: "fractional-linear.inverse.multiplier-two",
        selectorIds: [
          `${existingCancellationIds.fractionalLinear.multiplied}.lhs.multiplier.2`
        ]
      },
      {
        id: "fractional-linear.inverse.denominator-two",
        selectorIds: [
          `${existingCancellationIds.fractionalLinear.multiplied}.fraction.denominator.2`
        ]
      }
    ],
    catalysts: []
  },
  [existingCancellationIds.divideBothSides.cancelCoefficient]: {
    authoringId: "divide-both-sides.cancellation.coefficient",
    bundleNamespace: "divide-both-sides.coefficient",
    cancellationRecordId: "coefficient-and-divisor-cancel",
    inverseBundles: [
      {
        id: "divide-both-sides.inverse.coefficient-three",
        selectorIds: [
          `${existingCancellationIds.divideBothSides.divided}.lhs.fraction.numerator.coefficient.3`
        ]
      },
      {
        id: "divide-both-sides.inverse.divisor-three",
        selectorIds: [
          `${existingCancellationIds.divideBothSides.divided}.lhs.fraction.denominator.3`
        ]
      }
    ],
    catalysts: []
  }
} as const satisfies Readonly<
  Record<
    KpExistingEquationCancellationTransformationId,
    KpExistingEquationCancellationRoleSpec
  >
>;

export const kpExistingEquationCancellationTransformationIds =
  Object.freeze(
    Object.keys(kpExistingEquationCancellationRoleSpecs) as
      KpExistingEquationCancellationTransformationId[]
  );

export function compileKpExistingEquationCancellationPresentationPlan(
  transformation: KpSemanticTransformation
): KpVerifiedInverseCancellationPresentationPlan | undefined {
  const spec = kpExistingEquationCancellationRoleSpecs[
    transformation.id as KpExistingEquationCancellationTransformationId
  ];
  if (spec === undefined) return undefined;

  const draft: KpCancellationPresentationAuthoringDraft = {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: spec.authoringId,
    transformationId: transformation.id,
    cancellationRecordId: spec.cancellationRecordId,
    inverseBundles: spec.inverseBundles,
    catalysts: spec.catalysts,
    ...deriveKpCancellationPresentationRoleComplements({
      transformation,
      bundleNamespace: spec.bundleNamespace
    })
  };
  const authoring = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft
  });
  if (authoring.status !== "verified") {
    throw new Error(
      `Existing cancellation ${transformation.id} is not role-complete:\n` +
      authoring.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  const plan = compileKpCancellationOperationPresentationPlan(
    authoring.authoring
  );
  if (plan.planKind !== "inverse-cancellation") {
    throw new Error(
      `Existing cancellation ${transformation.id} compiled ${plan.planKind}.`
    );
  }
  return plan;
}

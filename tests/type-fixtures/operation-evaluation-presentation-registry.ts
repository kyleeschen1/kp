import type {
  KpCanonicalOperationEvaluationTransformationKind,
  KpResolvedOperationEvaluationPresentation
} from "../../src/animation/operation-evaluation-presentation-types.ts";
import type {
  CreateKpCanonicalBalancedSolveAnimationAssetInput
} from "../../src/animation/canonical-balanced-solve-animation.ts";
import {
  createKpCanonicalBalancedSolveAnimationAsset
} from "../../src/animation/canonical-balanced-solve-animation.ts";
import type {
  KpEquationOperationChoreography
} from "../../src/animation/equation-operation-choreography.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "../../src/animation/equation-presentation-profile.ts";

// @ts-expect-error Structural lookalikes cannot bypass registry resolution.
const fabricated: KpResolvedOperationEvaluationPresentation = {
  schemaVersion: "kp.resolved-operation-evaluation-presentation.v3",
  presentationId: "project.fabricated.result",
  transformationKind: "simplifyConstantProduct",
  packId: "project.fabricated",
  packVersion: "1.0.0",
  motifKind: "successor-synthesis",
  planCompiler: {
    id: "kp.presentation-plan-compiler.successor-synthesis",
    version: "1.0.0",
    planKind: "successor-synthesis",
    motifKind: "successor-synthesis",
    lawIds: [
      "presentation.lineage",
      "presentation.ownership",
      "presentation.temporal-groups",
      "presentation.contacts",
      "presentation.endpoint-settlement",
      "presentation.rewind"
    ]
  },
  paintContinuityCompiler: {
    id: "kp.paint-continuity-compiler.shared-junction",
    version: "1.0.0",
    transferTopology: "shared-zero-area-junction",
    nonZeroPaint: "opaque",
    endpointSettlement: "native-source-and-target",
    boundaryLawId: "paint-continuity.t-epsilon-boundary"
  },
  definitionIds: [],
  canonicalOperationIds: ["kp.core.merge"],
  trustedMotifIds: ["merge"],
  summary: "Fabricated local rule."
};

const rawRule = {
  transformationKind: "simplifyConstantProduct",
  descriptor: {
    kind: "successor-synthesis",
    motionPrimitiveIds: ["merge", "shift"],
    phaseIds: [
      "gather-contributors",
      "recognize-successor",
      "native-settle"
    ],
    summary: "A structurally compatible local descriptor."
  }
};

declare function consumeResolvedPresentation(
  certificate: KpResolvedOperationEvaluationPresentation
): void;

// @ts-expect-error Resolved-presentation consumers reject raw local rules.
consumeResolvedPresentation(rawRule);

// @ts-expect-error Canonical callers cannot silently widen to an unknown kind.
const unknownCanonicalKind: KpCanonicalOperationEvaluationTransformationKind =
  "evaluateProjectOperation";

declare const balancedSolveInput:
  CreateKpCanonicalBalancedSolveAnimationAssetInput;

createKpCanonicalBalancedSolveAnimationAsset({
  ...balancedSolveInput,
  // @ts-expect-error The balanced-solve factory, not its caller, owns the profile.
  presentationProfile: createKpSemanticMaterialEquationPresentationProfileV1()
});

// @ts-expect-error A raw object cannot mint executable operation choreography.
const fabricatedChoreography: KpEquationOperationChoreography = {
  schemaVersion: "kp.equation-operation-choreography.v1",
  kind: "counter-orbit-cancellation",
  id: "fabricated",
  transformationId: "fabricated",
  direction: "forward",
  linearRearrangementKind: "cancel-multiplicative-inverses",
  relationRecordId: "fabricated",
  semanticEntityIds: ["left", "right"],
  cancellationRecipe: "counter-orbit-v1",
  zeroWitnessRecipe: "none"
};

void [fabricated, unknownCanonicalKind, fabricatedChoreography];

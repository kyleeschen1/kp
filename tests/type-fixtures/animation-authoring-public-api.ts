import * as animationAuthoring from "../../src/animation/public-api.ts";
import {
  createKpCanonicalBalancedSolveAnimationAsset,
  validateKpAnimationAsset,
  type CreateKpCanonicalBalancedSolveAnimationAssetInput,
  type KpAnimationAsset,
  type KpAnimationAssetValidationIssue
} from "../../src/animation/public-api.ts";

const createAsset: (
  input: CreateKpCanonicalBalancedSolveAnimationAssetInput
) => KpAnimationAsset = createKpCanonicalBalancedSolveAnimationAsset;
const validateAsset: (
  asset: KpAnimationAsset
) => readonly KpAnimationAssetValidationIssue[] = validateKpAnimationAsset;

void createAsset;
void validateAsset;

// @ts-expect-error The raw builder is an internal construction detail.
void animationAuthoring.createKpAnimationAssetBuilder;
// @ts-expect-error Exemplar-specific compilers are not public authoring API.
void animationAuthoring.compileVerifiedLinearProblemAnimation;
// @ts-expect-error Domain presenter composition stays outside authoring.
void animationAuthoring.createKpEconomicsEquilibriumSynchronizedView;
// @ts-expect-error Reader DOM rendering stays outside authoring.
void animationAuthoring.createKpReaderEquationRenderPlan;
// @ts-expect-error Motifs remain a separate bounded vocabulary facade.
void animationAuthoring.kpExecutableMotifGrammar;

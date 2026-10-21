import type { KpAnimationAsset } from "./asset.ts";
import { getGeneratedDistributionTutorialFixtureSpec } from "../semantic/generated-algebra-fixture-registry.ts";
import { createGeneratedDistributionTutorialFixture, type GeneratedDistributionTutorialFixture } from "../semantic/generated-algebra-tutorial-fixture.ts";
import { isKpVerifiedCommonFactorRewrite, type KpVerifiedCommonFactorRewrite } from "../semantic/common-factor-rewrite.ts";
import { createDistributionSemanticAnimation } from "./distribution-semantic-adapter.ts";

export { createDistributionBeforeCollectionAnimation, createVerifiedComposedDistributionAnimationAsset,
  createVerifiedIntegerMultipleFactoringAnimationAsset } from "./distribution-semantic-adapter.ts";

export class KpCommonFactorPresentationGap extends Error {
  readonly code = "unsupported-presentation";
}

/** Existing fixture consumers retain their API. Authored factoring enters the
 * same constructor only through the distributive-law proof boundary. */
export function createVerifiedCommonFactorAnimationAsset(proof: KpVerifiedCommonFactorRewrite): KpAnimationAsset {
  if (!isKpVerifiedCommonFactorRewrite(proof)) throw new TypeError("Factoring paint requires an authenticated rewrite, not a candidate.");
  // The established template uses juxtaposition, not an explicit product glyph.
  // Numeric addends would concatenate digits or reverse conventional notation.
  if (proof.addends.some(atom => atom.kind !== "symbol"))
    throw new KpCommonFactorPresentationGap("The existing factoring mechanism requires symbolic addends; numeric addends need an explicit-product presentation mechanism.");
  const spelling = (atom: KpVerifiedCommonFactorRewrite["factor"]) => atom.kind === "symbol" ? atom.name : String(atom.value);
  return createGeneratedDistributionAnimationAsset(createGeneratedDistributionTutorialFixture({
    familyId: "generated.distribution", id: `authored.common-factor.${proof.revisionId.slice(7)}`,
    title: "Factor a common scalar", direction: "factor", factor: spelling(proof.factor),
    leftTerm: spelling(proof.addends[0]), rightTerm: spelling(proof.addends[1])
  }));
}

export const defaultDistributionExpansionFixtureId =
  "generated.distribution.expand-a-sum";

export const defaultDistributionFactoringFixtureId =
  "generated.distribution.factor-common-a";

export function createDistributionExpansionAnimationAsset(
  fixtureId: string = defaultDistributionExpansionFixtureId
): KpAnimationAsset {
  return createDistributionAnimationAsset(fixtureId, "distribute");
}

export function createDistributionFactoringAnimationAsset(
  fixtureId: string = defaultDistributionFactoringFixtureId
): KpAnimationAsset {
  return createDistributionAnimationAsset(fixtureId, "factor");
}

function createDistributionAnimationAsset(
  fixtureId: string,
  direction: "distribute" | "factor"
): KpAnimationAsset {
  const spec = getGeneratedDistributionTutorialFixtureSpec(fixtureId);

  if (spec === undefined) {
    throw new Error(`Unknown generated distribution fixture: ${fixtureId}`);
  }

  if (spec.direction !== direction) {
    throw new Error(
      `Expected generated distribution ${direction} fixture, received ${spec.direction}.`
    );
  }

  return createGeneratedDistributionAnimationAsset(
    createGeneratedDistributionTutorialFixture(spec)
  );
}

function createGeneratedDistributionAnimationAsset(
  fixture: GeneratedDistributionTutorialFixture
): KpAnimationAsset {
  return createDistributionSemanticAnimation({ ...fixture, sourceRefIds: [fixture.id, fixture.trace.id],
    metadata: { sourceFixtureId: fixture.id, sourceFixtureFamilyId: fixture.familyId, sourceTraceId: fixture.trace.id } });
}

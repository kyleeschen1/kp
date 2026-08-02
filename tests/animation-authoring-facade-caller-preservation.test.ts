import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  validateKpAnimationAsset
} from "../src/animation/public-api.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import generatedRuntimeAsset from
  "../src/animation/verified-generated-linear-solve-asset.generated.json" with {
    type: "json"
  };
import {
  createKpVerifiedGeneratedLinearSolveSession
} from "../src/tutorial/verified-generated-linear-solve-session.ts";

const fractionCallerSource = source(
  "../src/animation/fraction-composition-equation-adapter.ts"
);
const generatedCallerSource = source(
  "../src/animation/verified-linear-problem-animation-compiler.ts"
);

test("the two approved production callers import only the public facade", () => {
  assert.match(fractionCallerSource, /from "\.\/public-api\.ts"/);
  assert.doesNotMatch(
    fractionCallerSource,
    /canonical-balanced-solve-animation\.ts|from "\.\/asset\.ts"/
  );
  assert.match(generatedCallerSource, /from "\.\/public-api\.ts"/);
  assert.doesNotMatch(
    generatedCallerSource,
    /canonical-balanced-solve-animation\.ts|from "\.\/asset\.ts"/
  );
});

test("canonical fraction asset remains structurally valid through the facade", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(animation.id, "animation.fraction-composition.two-thirds-solve");
  assert.equal(animation.bundle.objects.length, 14);
  assert.equal(animation.transformations.length, 13);
  assert.equal(animation.presentationProfile?.schemaVersion, "kp.presentation-profile.v1");
});

test("generated solve remains byte-equivalent to its committed runtime asset", () => {
  const session = createKpVerifiedGeneratedLinearSolveSession();
  assert.deepEqual(session.animation.animation, generatedRuntimeAsset);
  assert.deepEqual(validateKpAnimationAsset(session.animation.animation), []);
});

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

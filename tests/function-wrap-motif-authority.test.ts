import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createKpFunctionWrapEquationExtensionPack,
  kpFunctionWrapRecipePhaseIds
} from "../src/animation/equation-extension-packs/function-wrap.ts";
import {
  createKpFunctionWrapReceptionPlan,
  kpCanonicalFunctionWrapMotionProfile,
  kpCanonicalFunctionWrapPhaseGrammar,
  kpFunctionWrapMotifDefinition,
  kpFunctionWrapMotifSchema
} from "../src/animation/function-wrap-motif.ts";
import {
  kpCanonicalFunctionWrapMotionProfile as compatibilityProfile
} from "../src/animation/function-wrap-motion-profile.ts";
import {
  createKpFunctionWrapReceptionPlan as compatibilityPlanFactory
} from "../src/animation/function-wrap-reception.ts";
import {
  validateKpEquationExtensionPack
} from "../src/domain-ir/equation-extension-pack-validator.ts";

test("function-wrap motif is the shared authority behind compatibility imports", () => {
  assert.equal(compatibilityProfile, kpCanonicalFunctionWrapMotionProfile);
  assert.equal(compatibilityPlanFactory, createKpFunctionWrapReceptionPlan);
  assert.equal(
    kpFunctionWrapMotifDefinition.motionProfile,
    kpCanonicalFunctionWrapMotionProfile
  );
  assert.equal(
    kpFunctionWrapMotifDefinition.createReceptionPlan,
    createKpFunctionWrapReceptionPlan
  );
  assert.equal(kpFunctionWrapMotifDefinition.schema, kpFunctionWrapMotifSchema);
});

test("phase grammar covers the exact role schema and drives the recipe pack", () => {
  assert.deepEqual(
    [...new Set(kpCanonicalFunctionWrapPhaseGrammar.flatMap(({ roleIds }) => roleIds))].sort(),
    kpFunctionWrapMotifSchema.roles.map(({ id }) => id).sort()
  );
  assert.deepEqual(
    kpFunctionWrapRecipePhaseIds,
    kpCanonicalFunctionWrapPhaseGrammar.map(({ id }) => id)
  );
  assert.equal(
    validateKpEquationExtensionPack(
      createKpFunctionWrapEquationExtensionPack()
    ).status,
    "valid"
  );
});

test("renderer-neutral motif authority owns no native geometry", () => {
  const source = readFileSync(fileURLToPath(new URL(
    "../src/animation/function-wrap-motif.ts",
    import.meta.url
  )), "utf8");
  assert.doesNotMatch(
    source,
    /(?:DOMRect|HTMLElement|SVGElement|nativeRect|PaintMeasured|offsetInNativeHeights)/
  );
});

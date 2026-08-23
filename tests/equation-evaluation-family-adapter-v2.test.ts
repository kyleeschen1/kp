import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  consumeKpEquationEvaluationFamilyTransitionsV2
} from "../src/domain-ir/equation-evaluation-family-adapter-v2.ts";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

test("evaluation adapter consumes the exact transition certificate", () => {
  const animation = createKpAnimationAssets().find(
    ({ id }) => id === animationId
  )!;
  const migration = compileKpDerivativePowerMigrationV2(animation);
  const transition = migration.presentationPlan.transitions[1]!;
  const outputs = consumeKpEquationEvaluationFamilyTransitionsV2({
    plan: migration.presentationPlan,
    adapter: {
      id: "adapter.test.evaluation-family",
      kind: "equation-evaluation-family-adapter-v2",
      compile: ({ certificate }) => certificate
    }
  });

  assert.equal(outputs.length, 1);
  assert.strictEqual(outputs[0], transition.evaluationFamilyCertificate);
  assert.equal(
    outputs[0]?.familyProfile.rendererProfileId,
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1"
  );
  assert.throws(() => consumeKpEquationEvaluationFamilyTransitionsV2({
    plan: { ...migration.presentationPlan },
    adapter: {
      id: "adapter.test.forged-plan",
      kind: "equation-evaluation-family-adapter-v2",
      compile: ({ certificate }) => certificate
    }
  }), /nominal presentation plan/);
});

test("adapter seam contains no family re-resolution inputs", async () => {
  const source = await readFile(
    new URL(
      "../src/domain-ir/equation-evaluation-family-adapter-v2.ts",
      import.meta.url
    ),
    "utf8"
  );
  assert.equal(source.includes("resolveKp"), false);
  assert.equal(source.includes("transformationKind"), false);
  assert.equal(source.includes("assetId"), false);
});

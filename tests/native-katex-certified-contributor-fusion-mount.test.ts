import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  createKpCertifiedNativeKatexContributorFusionPlayback,
  kpNativeKatexContributorFusionRealizedPrimitiveId
} from "../src/rendering/native-katex-operation-evaluation-contributor-fusion.ts";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

test("neutral Native KaTeX mount consumes the derivative certificate", () => {
  const animation = createKpAnimationAssets().find(
    ({ id }) => id === animationId
  )!;
  const certificate = compileKpDerivativePowerMigrationV2(animation)
    .presentationPlan.transitions[1]!.evaluationFamilyCertificate!;
  const retirements: unknown[] = [];
  const base = {
    sample: (progress: number) => ({ progress }),
    apply: (progress: number) => ({ progress }),
    retire: (retirement: unknown) => retirements.push(retirement)
  };
  const playback = createKpCertifiedNativeKatexContributorFusionPlayback({
    stage: {} as HTMLElement,
    base,
    certificate
  });

  assert.deepEqual(playback.sample(0.25), { progress: 0.25 });
  const retirement = {
    kind: "native-katex-paint-preserving-retirement",
    reason: "surface-disposed",
    structuralSuccession: "retire-preserving-paint"
  } as const;
  playback.retire(retirement);
  assert.deepEqual(retirements, [retirement]);
  assert.throws(() => createKpCertifiedNativeKatexContributorFusionPlayback({
    stage: {} as HTMLElement,
    base,
    certificate: { ...certificate }
  }), /compiler-minted family certificate/);
});

test("paint attestation stays write-only telemetry", () => {
  assert.equal(
    kpNativeKatexContributorFusionRealizedPrimitiveId,
    "kp.rendering.native-katex.primitive.ink-knot.v1"
  );
  const source = readFileSync(new URL(
    "../src/rendering/native-katex-operation-evaluation-contributor-fusion.ts",
    import.meta.url
  ), "utf8");
  for (const key of [
    "kpOperationEvaluationFamily",
    "kpOperationEvaluationFamilyProfileId",
    "kpOperationEvaluationRendererProfileId",
    "kpOperationEvaluationRealizedPrimitiveId"
  ]) {
    const uses = source.split("\n").filter((line) =>
      line.includes(`"${key}"`)
    );
    assert.equal(
      uses.length,
      1,
      `${key} must have one renderer telemetry write and no authority reads.`
    );
    assert.match(uses[0]!, /dataset\[[^\]]+\]\s*=/);
  }
});

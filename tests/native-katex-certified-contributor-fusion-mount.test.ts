import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAntiderivativePowerMigrationV2,
  isKpAntiderivativePowerEvaluationCohortsPayloadV2
} from "../src/domain-ir/antiderivative-power-migration-v2.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  createKpCertifiedNativeKatexContributorFusionCohortPlayback,
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

test("cohort mount preserves one base lifecycle for both integration knots", () => {
  const animation = createKpAnimationAssets().find(({ id }) => id ===
    "animation.generated.calculus.integral.power-rule-quadratic")!;
  const migration = compileKpAntiderivativePowerMigrationV2(animation);
  const payload = migration.presentationPlan.transitions[1]?.domainPayloads[0];
  assert.ok(payload);
  assert.equal(isKpAntiderivativePowerEvaluationCohortsPayloadV2(payload), true);
  if (!isKpAntiderivativePowerEvaluationCohortsPayloadV2(payload)) return;
  const retirements: unknown[] = [];
  const base = {
    sample: (progress: number) => ({ progress }),
    apply: (progress: number) => ({ progress }),
    retire: (retirement: unknown) => retirements.push(retirement)
  };
  const playback =
    createKpCertifiedNativeKatexContributorFusionCohortPlayback({
      stage: {} as HTMLElement,
      base,
      cohorts: payload.cohorts
    });
  assert.deepEqual(playback.sample(0.5), { progress: 0.5 });
  const retirement = {
    kind: "native-katex-paint-preserving-retirement",
    reason: "scene-replaced",
    structuralSuccession: "preserve"
  } as const;
  playback.retire(retirement);
  assert.deepEqual(retirements, [retirement]);
  assert.throws(() =>
    createKpCertifiedNativeKatexContributorFusionCohortPlayback({
      stage: {} as HTMLElement,
      base,
      cohorts: [payload.cohorts[0]!, payload.cohorts[0]!]
    }), /unique certificate-owned cohort IDs/u);
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

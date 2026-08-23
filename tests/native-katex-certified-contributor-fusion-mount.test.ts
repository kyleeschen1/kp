import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  createKpCertifiedNativeKatexContributorFusionPlayback
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

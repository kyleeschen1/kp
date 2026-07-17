import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpWitnessedAnnihilationPlan,
  sampleKpWitnessedAnnihilation
} from "../src/animation/witnessed-annihilation.ts";
import {
  evaluateKpWitnessedAnnihilationLaws
} from "../src/animation/witnessed-annihilation-conformance.ts";
import { deriveKpCancellationWitness } from "../src/semantic/cancellation-witness.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";

test("organic annihilation meets symmetrically and compresses without disappearing", () => {
  const plan = fixturePlan();
  const contact = sampleKpWitnessedAnnihilation({ plan, progress: plan.contactEnd });
  assert.equal(contact.contactProgress, 1);
  assert.ok(contact.sources.every((source) => source.pose.opacity === 1));
  assert.ok(contact.sources.every((source) => source.pose.scale >= 0.72));
  assert.ok(contact.inwardPulse > 0);
});

test("semantic witness is born after contact and dwells in the canceled slot", () => {
  const plan = fixturePlan();
  const early = sampleKpWitnessedAnnihilation({ plan, progress: 0.45 });
  assert.equal(early.witness.pose.opacity, 0);
  const dwell = sampleKpWitnessedAnnihilation({ plan, progress: 0.7 });
  assert.equal(dwell.witnessReadable, true);
  assert.equal(dwell.witness.latex, "0");
  assert.equal(dwell.witness.slotId, "slot.linear.left-inverses");
  assert.equal(dwell.witness.pose.opacity, 1);
  assert.ok(dwell.witnessDwellProgress > 0);
});

test("survivors cannot compact until sources and witness are absorbed", () => {
  const plan = fixturePlan();
  const witnessAbsorbing = sampleKpWitnessedAnnihilation({ plan, progress: 0.86 });
  assert.ok(witnessAbsorbing.witnessAbsorptionProgress > 0);
  assert.equal(witnessAbsorbing.survivorCompactionProgress, 0);
  const compacting = sampleKpWitnessedAnnihilation({ plan, progress: 0.94 });
  assert.equal(compacting.witnessAbsorptionProgress, 1);
  assert.ok(compacting.survivorCompactionProgress > 0);
});

test("annihilation settles to exact native survivors and no witness", () => {
  const settled = sampleKpWitnessedAnnihilation({ plan: fixturePlan(), progress: 1 });
  assert.equal(settled.phase, "settled");
  assert.ok(settled.sources.every((source) => source.pose.opacity === 0));
  assert.equal(settled.witness.pose.opacity, 0);
  assert.ok(settled.survivors.every((survivor) =>
    survivor.pose.opacity === 0 && survivor.nativeOpacity === 1
  ));
});

test("canonical additive fixture satisfies witnessed annihilation laws", () => {
  assert.deepEqual(evaluateKpWitnessedAnnihilationLaws(fixturePlan()), []);
});

test("annihilation refuses partial witness slots and zero-scale collapse", () => {
  const plan = fixturePlan();
  assert.throws(() => createKpWitnessedAnnihilationPlan({
    id: "annihilation.partial",
    witness: plan.witness,
    sources: [plan.sources[0]!],
    measurements: { [plan.sources[0]!.id]: plan.sources[0]!.rect },
    survivors: []
  }), /at least two/);
  assert.throws(() => createKpWitnessedAnnihilationPlan({
    id: "annihilation.zero-scale",
    witness: plan.witness,
    sources: plan.sources,
    measurements: Object.fromEntries(plan.sources.map((source) => [source.id, source.rect])),
    survivors: plan.survivors,
    compressedScale: 0
  }), /preserve visible material/);
});

function fixturePlan() {
  const asset = createLinearSolveKpAssetBundle();
  const transformation = asset.transformations.find((candidate) =>
    candidate.transformType === "cancelAdditiveInverses"
  )!;
  const witness = deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "left-inverses-cancel",
    slotId: "slot.linear.left-inverses",
    survivorAnchorSelectorIds: [
      "equation.linear-solve.after-subtract.lhs.x",
      "equation.linear-solve.after-subtract.equals"
    ]
  });
  return createKpWitnessedAnnihilationPlan({
    id: "annihilation.linear.left-inverses",
    witness,
    sources: [
      {
        id: "source.plus-three",
        selectorIds: ["equation.linear-solve.after-subtract.lhs.plus3"],
        semanticRole: "additive-term",
        semanticRank: 0
      },
      {
        id: "source.minus-three",
        selectorIds: ["equation.linear-solve.after-subtract.lhs.minus3"],
        semanticRole: "additive-inverse",
        semanticRank: 1
      }
    ],
    measurements: {
      "source.plus-three": { left: 30, top: 20, width: 20, height: 18 },
      "source.minus-three": { left: 58, top: 20, width: 24, height: 18 }
    },
    survivors: [
      {
        id: "survivor.x",
        sourceSelectorIds: ["equation.linear-solve.after-subtract.lhs.x"],
        targetSelectorIds: ["equation.linear-solve.left-simplified.lhs.x"],
        sourceRect: { left: 8, top: 20, width: 12, height: 18 },
        targetRect: { left: 8, top: 20, width: 12, height: 18 }
      },
      {
        id: "survivor.equals",
        sourceSelectorIds: ["equation.linear-solve.after-subtract.equals"],
        targetSelectorIds: ["equation.linear-solve.left-simplified.equals"],
        sourceRect: { left: 92, top: 20, width: 14, height: 18 },
        targetRect: { left: 38, top: 20, width: 14, height: 18 }
      }
    ]
  });
}

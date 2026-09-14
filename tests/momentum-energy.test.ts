import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMomentumEnergy, momentumEnergyExamples, physicalTime, sampleMomentumEnergy } from "../domains/physics/momentum-energy.ts";
import { compileMomentumEnergyAsset } from "../src/authoring/momentum-energy-authoring.ts";
import { readFileSync } from "node:fs";
import { compileMomentumEnergyPublication, momentumEnergySourcePath } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";

function model(index: number, massKg = 1) {
  const result = checkMomentumEnergy({ ...momentumEnergyExamples[index], massKg });
  assert.equal(result.status, "checked");
  return result.model;
}
const near = (actual: number, expected: number, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("one analytical state owns position, momentum, force, energy and work", () => {
  const straight = sampleMomentumEnergy(model(0), physicalTime(2));
  assert.deepEqual(straight.position, { x: 4, y: 0 });
  assert.deepEqual(straight.momentum, { x: 4, y: 0 });
  assert.equal(straight.work, 8); assert.equal(straight.energyChange, 8);
  const turning = sampleMomentumEnergy(model(1), physicalTime(Math.PI / 2));
  assert.deepEqual(turning.momentumChange, { x: -1, y: -1 });
  assert.equal(turning.kineticEnergy, .5); assert.equal(turning.energyChange, 0); assert.equal(turning.work, 0);
});

test("interior samples obey differential laws and replay without accumulation drift", () => {
  for (const index of [0, 1]) for (const mass of [1, 2, 4]) {
    const checked = model(index, mass), dt = 1e-5;
    for (const fraction of [.1, .3, .5, .8]) {
      const t = fraction * checked.durationSeconds, frame = sampleMomentumEnergy(checked, physicalTime(t));
      const before = sampleMomentumEnergy(checked, physicalTime(t - dt)), after = sampleMomentumEnergy(checked, physicalTime(t + dt));
      near((after.position.x - before.position.x) / (2 * dt), frame.velocity.x);
      near((after.position.y - before.position.y) / (2 * dt), frame.velocity.y);
      near((after.momentum.x - before.momentum.x) / (2 * dt), frame.force.x);
      near((after.momentum.y - before.momentum.y) / (2 * dt), frame.force.y);
      near((after.kineticEnergy - before.kineticEnergy) / (2 * dt), frame.power);
      near(frame.force.x * frame.velocity.x + frame.force.y * frame.velocity.y, frame.power);
      near(.5 * mass * (frame.velocity.x ** 2 + frame.velocity.y ** 2), frame.kineticEnergy);
      near(frame.work, frame.energyChange);
      sampleMomentumEnergy(checked, physicalTime(checked.durationSeconds));
      assert.deepEqual(sampleMomentumEnergy(checked, physicalTime(t)), frame);
    }
  }
});

test("source boundary rejects unsupported claims, geometry, mass and getters without invoking them", () => {
  for (const input of [null, {}, { ...momentumEnergyExamples[0], massKg: NaN }, { ...momentumEnergyExamples[0], massKg: 0 },
    { ...momentumEnergyExamples[0], massKg: 5 }, { ...momentumEnergyExamples[0], energy: 7 }, { ...momentumEnergyExamples[0], episode: "free-form" }])
    assert.equal(checkMomentumEnergy(input).status, "repair");
  let called = false;
  assert.equal(checkMomentumEnergy({ ...momentumEnergyExamples[0], get massKg() { called = true; return 1; } }).status, "repair");
  assert.equal(called, false);
  const input = { ...momentumEnergyExamples[0]!, massKg: 1 }, result = checkMomentumEnergy(input);
  assert.equal(result.status, "checked"); if (result.status !== "checked") return;
  input.massKg = 4; assert.equal(result.model.source.massKg, 1); assert.ok(Object.isFrozen(result.model.source));
});

test("physical seconds cannot be confused with presentation progress or forged models", () => {
  const checked = model(0);
  assert.throws(() => physicalTime(NaN)); assert.throws(() => physicalTime(-1));
  assert.throws(() => sampleMomentumEnergy(checked, physicalTime(3)));
  // @ts-expect-error A presentation percentage is not a physical-time coordinate.
  assert.throws(() => sampleMomentumEnergy(checked, .5));
  assert.throws(() => sampleMomentumEnergy({ ...checked }, physicalTime(0)));
});

test("each episode traverses governed construction with immutable state lineage", () => {
  for (const index of [0, 1]) {
    const compiled = compileMomentumEnergyAsset(model(index));
    assert.equal(compiled.animation.transformations.length, 1);
    assert.ok(compiled.construction);
    assert.equal(compiled.animation.transformations[0]!.correspondenceMap!.records.length, 4);
    assert.notEqual(compileMomentumEnergyAsset(model(index, 2)).revisionId, compiled.revisionId);
  }
});

test("the canonical Article resolves governed vignettes and complete no-script static figures", () => {
  const text = readFileSync(momentumEnergySourcePath, "utf8");
  const publication = compileMomentumEnergyPublication(text, JSON.parse(readFileSync("examples/physics/momentum-energy.article.lock.json", "utf8")));
  assert.equal(publication.capabilities.length, 2);
  assert.equal(publication.assets.size, 4);
  assert.equal(publication.staticHtml.math.clientRuntimeRequired, false);
  assert.ok(publication.staticHtml.math.displayCount >= 6);
  assert.match(publication.staticHtml.articleHtml, /direction/);
  assert.match(publication.staticHtml.articleHtml, /<math/);
  assert.doesNotMatch(publication.staticHtml.articleHtml, /<script/);
  assert.deepEqual(compileMomentumEnergyPublication(text, publication.article.document.importLock).article.document, publication.article.document);
  assert.throws(() => compileMomentumEnergyPublication(text.replace("straight/advance", "straight/unsupported")));
  for (const svg of publication.assets.values()) assert.match(svg, /data-momentum/);
});

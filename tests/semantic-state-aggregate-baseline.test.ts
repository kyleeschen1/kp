import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticStateSupplyTaxFamilyAuthoring
} from "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
import {
  createKpSemanticStateFamilyEvaluator
} from "../src/semantic-state/state-family-evaluator.ts";
import {
  createKpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";

test("the Loop 4 baseline has single-family state but no aggregate authority", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application,
    sampleCacheCapacity: 2
  });
  const persistentBefore = capturePersistentInventory(fixture.application);

  evaluator.at(createKpSemanticProgress(1n, 4n));
  evaluator.at(createKpSemanticProgress(3n, 4n));

  assert.equal(capturePersistentInventory(fixture.application), persistentBefore);
  assert.equal("composition" in fixture.application, false);
  assert.equal("members" in fixture.application, false);
  assert.equal("boundaries" in fixture.application, false);
  assert.equal("logicalAddress" in fixture.application, false);
  assert.equal("seek" in evaluator, false);
  assert.equal("branch" in evaluator, false);
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 2,
    hits: 0,
    misses: 2
  });
});

function capturePersistentInventory(
  application: ReturnType<
    typeof createKpSemanticStateSupplyTaxFamilyAuthoring
  >["application"]
): string {
  return JSON.stringify({
    before: application.commit.before,
    after: application.commit.after,
    journal: application.commit.journal,
    source: application.source,
    transitions: application.transitionPlan
  });
}

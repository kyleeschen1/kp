import assert from "node:assert/strict";
import test from "node:test";

import { createKpGeneratedSubstitutionFixture } from "../src/animation/generated-substitution-fixture.ts";
import { sampleKpSubstitutionChoreography } from "../src/animation/substitution-choreography.ts";

test("generated substitution compiles a mixed-surface value lineage", () => {
  const fixture = createKpGeneratedSubstitutionFixture();

  assert.equal(fixture.source.surfaceKind, "mixed");
  assert.equal(fixture.target.surfaceKind, "mixed");
  assert.deepEqual(fixture.choreography.operationComposition.operationIds, [
    "kp.core.persist",
    "kp.core.substitute"
  ]);
  assert.equal(
    fixture.choreography.transferLineageEdgeId,
    "generated.substitution.transmit-value"
  );
  assert.equal(
    fixture.choreography.replacementLifecycleRecordId,
    "generated.substitution.value-lineage"
  );
});

test("substitution transmits value salience before replacing the occupant", () => {
  const plan = createKpGeneratedSubstitutionFixture().choreography;
  const early = sampleKpSubstitutionChoreography({ plan, progress: 0.1 });
  const transit = sampleKpSubstitutionChoreography({ plan, progress: 0.5 });
  const late = sampleKpSubstitutionChoreography({ plan, progress: 0.75 });

  assert.ok(early.valueSource.emphasis > 0);
  assert.equal(early.replaced.opacity, 1);
  assert.equal(early.replacement.opacity, 0);
  assert.ok(transit.transfer.opacity > 0);
  assert.ok(transit.transfer.pathProgress > 0 && transit.transfer.pathProgress < 1);
  assert.equal(transit.replaced.opacity, 1);
  assert.ok(late.transfer.pathProgress > transit.transfer.pathProgress);
  assert.ok(late.replaced.opacity < 1);
  assert.ok(late.replacement.opacity > 0);
  assert.equal(late.salienceTransfer, late.replacement.opacity);
});

test("substitution has exact endpoints and an exact rewind law", () => {
  const plan = createKpGeneratedSubstitutionFixture().choreography;
  const start = sampleKpSubstitutionChoreography({ plan, progress: 0 });
  const end = sampleKpSubstitutionChoreography({ plan, progress: 1 });

  assert.deepEqual(
    {
      source: start.valueSource.opacity,
      transfer: start.transfer.opacity,
      replaced: start.replaced.opacity,
      replacement: start.replacement.opacity
    },
    { source: 1, transfer: 0, replaced: 1, replacement: 0 }
  );
  assert.deepEqual(
    {
      source: end.valueSource.opacity,
      transfer: end.transfer.opacity,
      replaced: end.replaced.opacity,
      replacement: end.replacement.opacity
    },
    { source: 0, transfer: 0, replaced: 0, replacement: 1 }
  );
  for (const progress of [0, 0.17, 0.5, 0.83, 1]) {
    const rewind = sampleKpSubstitutionChoreography({
      plan,
      progress,
      direction: "rewind"
    });
    const mirrored = sampleKpSubstitutionChoreography({
      plan,
      progress: 1 - progress,
      direction: "forward"
    });
    assert.deepEqual(rewind, mirrored);
  }
});

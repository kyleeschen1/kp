import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";

test("default Workbench index reads catalog and durable seed controls", () => {
  const index = createKpSemanticAnimationWorkbenchIndex();
  const byId = new Map(
    index.entries.map((entry) => [entry.identity.animationId, entry])
  );

  assert.equal(index.valid, true);
  assert.equal(
    new Set(index.entries.map((entry) => entry.identity.animationId)).size,
    index.entries.length
  );
  assert.equal(
    byId.get("animation.generated.radical.square-root-as-power")?.lifecycle
      .execution,
    "complete"
  );
  assert.equal(
    byId.get("animation.derivative-rules.tangent-graph")?.lifecycle.maturity,
    "approved"
  );
  assert.equal(
    byId.get("animation.algebra.quadratic.solution-branching")?.lifecycle
      .playability,
    "planned-only"
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  kpFractionEndpointCheckpoints
} from "../scripts/glyph-reconciliation-endpoint-checkpoints.ts";

test("fraction endpoint captures densely sample the material-to-native handoff", () => {
  assert.deepEqual(
    kpFractionEndpointCheckpoints.map((checkpoint) =>
      checkpoint.fractionProgressPermille
    ),
    [960, 970, 980, 990, 995, 999, 1_000]
  );
  assert.deepEqual(
    kpFractionEndpointCheckpoints.map((checkpoint) =>
      checkpoint.routeProgressPermille
    ),
    [831, 838, 846, 853, 856, 859, 860]
  );
  assert.equal(
    new Set(kpFractionEndpointCheckpoints.map(({ id }) => id)).size,
    kpFractionEndpointCheckpoints.length
  );
  assert.equal(kpFractionEndpointCheckpoints.at(-1)?.id, "native-target");
});


import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEndpointSpecs
} from "../src/semantic/fraction-composition-endpoint-spec.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../src/semantic/fraction-solve-macro.ts";
import {
  planKpFractionCompositionLayout
} from "../src/reader/runtime/fraction-composition-layout.ts";

test("fraction composition layout covers every transition with native envelopes", () => {
  const macro = createKpLawfulFractionSolveMacro();
  const endpoints = createKpFractionCompositionEndpointSpecs();
  const envelopeIds = new Set(
    endpoints.flatMap(({ groupEnvelopes }) =>
      groupEnvelopes.map(({ id }) => id)
    )
  );

  for (const viewport of ["wide", "phone"] as const) {
    const layout = planKpFractionCompositionLayout({ viewport });
    assert.equal(layout.phases.length, macro.steps.length);
    assert.deepEqual(
      layout.phases.map(({ nodeId }) => nodeId),
      macro.steps.map(({ id }) => id)
    );
    assert.ok(layout.phases.every(({ policy, rows }) => {
      const expectedPolicy = viewport === "wide"
        ? "single-row"
        : "semantic-two-row-stage";
      return (
        policy === expectedPolicy &&
        rows.length === (viewport === "wide" ? 1 : 2) &&
        rows.every(
          ({ envelopeIds: ids }) =>
            ids.length === 2 && ids.every((id) => envelopeIds.has(id))
        )
      );
    }));
  }
});

test("fraction layout delegates geometry and forbids wrapping recipes", () => {
  const wide = planKpFractionCompositionLayout({ viewport: "wide" });
  const phone = planKpFractionCompositionLayout({ viewport: "phone" });

  assert.equal(wide.geometryAuthority, "native-measurement");
  assert.equal(wide.operationSpecificCoordinates, false);
  assert.deepEqual(
    wide.phases.map(({ nodeId }) => nodeId),
    phone.phases.map(({ nodeId }) => nodeId)
  );
  assert.ok(phone.phases.every(
    ({ lineChangeReason }) =>
      lineChangeReason === "viewport-semantic-staging"
  ));
  assert.doesNotMatch(
    JSON.stringify(wide),
    /translate|offset|pixel|wrap|fraction-specific/
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDistributionAreaExemplarEndpoint
} from "../src/rendering/distribution-area-exemplar-endpoint.ts";

test("factored endpoint is one native searchable rectangle", () => {
  const endpoint = createKpDistributionAreaExemplarEndpoint("factored");

  assert.equal(endpoint.owner, "native");
  assert.equal(endpoint.algebra.latex, "3(x+2)");
  assert.equal(endpoint.area.topology, "unified");
  assert.equal(endpoint.area.dividerOpacity, 0);
  assert.deepEqual(endpoint.area.labels.map(({ latex }) => latex), ["3", "x+2", "3(x+2)"]);
  assert.ok(endpoint.searchableText.includes("x+2"));
});

test("expanded endpoint is one native searchable partition", () => {
  const endpoint = createKpDistributionAreaExemplarEndpoint("expanded");

  assert.equal(endpoint.owner, "native");
  assert.equal(endpoint.algebra.latex, "3x+6");
  assert.equal(endpoint.area.topology, "partitioned");
  assert.equal(endpoint.area.dividerOpacity, 1);
  assert.deepEqual(endpoint.area.labels.map(({ latex }) => latex), ["3", "x", "2", "3x", "6"]);
  assert.ok(endpoint.searchableText.includes("6"));
});

test("native endpoints contain no transient material or witness authority", () => {
  for (const id of ["factored", "expanded"] as const) {
    const serialized = JSON.stringify(createKpDistributionAreaExemplarEndpoint(id));
    assert.equal(serialized.includes('"owner":"material"'), false);
    assert.equal(serialized.includes('"owner":"witness"'), false);
    assert.ok(serialized.includes("class=\\\"katex\\\""));
  }
});

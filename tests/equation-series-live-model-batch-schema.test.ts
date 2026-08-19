import assert from "node:assert/strict";
import test from "node:test";

import { createKpEquationSeriesLiveModelBatchResponseSchema } from
  "../src/authoring/equation-series-live-model-batch-schema.ts";

test("batch schema keeps proposed and unsupported records disjoint", () => {
  const schema = createKpEquationSeriesLiveModelBatchResponseSchema({
    plannerId: "planner.schema.fixture.v1",
    resultCount: 6
  }) as {
    properties: {
      results: {
        minItems: number;
        maxItems: number;
        items: { anyOf: Array<{
          required: string[];
          properties: Record<string, { const?: string }>;
        }>;
      };
    };
  };
  };
  const results = schema.properties.results;
  assert.equal(results.minItems, 6);
  assert.equal(results.maxItems, 6);
  const [proposed, unsupported] = results.items.anyOf;
  assert.equal(proposed?.properties["status"]?.const, "proposed");
  assert.equal(proposed?.required.includes("proposals"), true);
  assert.equal(proposed?.required.includes("reason"), false);
  assert.equal(unsupported?.properties["status"]?.const, "unsupported");
  assert.equal(unsupported?.required.includes("proposals"), false);
  assert.equal(unsupported?.required.includes("reason"), true);
  assert.equal(unsupported?.required.includes("unsupportedAdjacencyIds"), true);
  assert.equal(Object.isFrozen(schema), true);
});

test("batch schema requires explicit planner identity and corpus size", () => {
  assert.throws(() => createKpEquationSeriesLiveModelBatchResponseSchema({
    plannerId: "",
    resultCount: 6
  }), /planner identity/u);
  assert.throws(() => createKpEquationSeriesLiveModelBatchResponseSchema({
    plannerId: "planner.schema.fixture.v1",
    resultCount: 0
  }), /result count/u);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  listKpWorkbenchRoadmapTopics,
  queryKpWorkbenchRoadmap
} from "../src/editor/semantic-animation-workbench-roadmap-query.ts";
import type {
  KpWorkbenchRoadmapRow
} from "../src/editor/semantic-animation-workbench-roadmap.ts";

const rows = [
  row(1, "zeta", "Zeta", "Algebra", "now", "active"),
  row(2, "alpha", "Alpha", "Arithmetic", "later", "planned"),
  row(3, "beta", "Beta", "Algebra", "next", "complete"),
  row(4, "gamma", "Gamma", undefined, "someday", "deferred"),
  row(5, "delta", "Delta", "Data", "later", "planned")
] as const;

test("sorts by canonical order, name, topic, horizon, and state", () => {
  assert.deepEqual(ids(query("canonical")), ["zeta", "alpha", "beta", "gamma", "delta"]);
  assert.deepEqual(ids(query("name")), ["alpha", "beta", "delta", "gamma", "zeta"]);
  assert.deepEqual(ids(query("topic")), ["zeta", "beta", "alpha", "delta", "gamma"]);
  assert.deepEqual(ids(query("horizon")), ["zeta", "beta", "alpha", "delta", "gamma"]);
  assert.deepEqual(ids(query("state")), ["zeta", "alpha", "delta", "beta", "gamma"]);
});

test("supports deterministic descending order with canonical tie-breaking", () => {
  assert.deepEqual(
    ids(
      queryKpWorkbenchRoadmap(rows, {
        sortBy: "horizon",
        direction: "descending"
      })
    ),
    ["gamma", "alpha", "delta", "beta", "zeta"]
  );
});

test("combines exact topic, horizon, and state filters", () => {
  assert.deepEqual(
    ids(
      queryKpWorkbenchRoadmap(rows, {
        sortBy: "canonical",
        direction: "ascending",
        topics: ["Arithmetic", "Data"],
        horizons: ["later"],
        states: ["planned"]
      })
    ),
    ["alpha", "delta"]
  );
  assert.deepEqual(listKpWorkbenchRoadmapTopics(rows), [
    "Algebra",
    "Arithmetic",
    "Data"
  ]);
});

function query(
  sortBy: Parameters<typeof queryKpWorkbenchRoadmap>[1]["sortBy"]
): readonly KpWorkbenchRoadmapRow[] {
  return queryKpWorkbenchRoadmap(rows, {
    sortBy,
    direction: "ascending"
  });
}

function ids(input: readonly KpWorkbenchRoadmapRow[]): readonly string[] {
  return input.map(({ id }) => id);
}

function row(
  order: number,
  id: string,
  title: string,
  topic: string | undefined,
  horizon: KpWorkbenchRoadmapRow["horizon"],
  state: KpWorkbenchRoadmapRow["state"]
): KpWorkbenchRoadmapRow {
  return {
    id,
    order,
    title,
    objective: `${title} objective`,
    ...(topic === undefined ? {} : { topic }),
    horizon,
    state
  };
}

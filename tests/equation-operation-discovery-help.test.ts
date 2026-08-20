import assert from "node:assert/strict";
import test from "node:test";

import {
  formatKpEquationOperationDiscoveryHelp
} from "../src/authoring/equation-operation-discovery-help.ts";

test("CLI help stays concise and points to search and inspect", () => {
  const summary = formatKpEquationOperationDiscoveryHelp({ kind: "summary" });
  assert.match(summary, /KP equation operations: \d+ available/u);
  assert.match(summary, /--query/u);
  assert.match(summary, /--inspect/u);
  assert.equal(summary.split("\n").length, 3);
});

test("CLI search and inspect project the canonical descriptor", () => {
  const search = formatKpEquationOperationDiscoveryHelp({
    kind: "search",
    query: "remove additive zero"
  });
  assert.match(search, /kp\.semantic-motion\.absorb-additive-identity/u);
  const inspect = formatKpEquationOperationDiscoveryHelp({
    kind: "inspect",
    operationOrAlias: "drop + 0"
  });
  assert.match(inspect, /^Remove additive identity/mu);
  assert.match(inspect, /resolved: alias/u);
  assert.match(inspect, /example: Transform x \+ 0 = 4/u);
  assert.match(inspect, /not: Do not use for 2 \+ 3/u);
});

import test from "node:test";
import assert from "node:assert/strict";
import trial from "../content/authoring/chain-first-session-trial.json" with { type: "json" };
import { runAuthorCheckCli } from "../scripts/author-check.ts";

test("retained current-session proposals preserve intent and produce the recorded checker outcomes", async () => {
  let accepted = 0, repairs = 0, falseAcceptances = 0;
  for (const row of trial.cases) {
    assert.deepEqual(row.proposal.states.map(state => state.latex), row.intent, row.id);
    const result = await runAuthorCheckCli(["--task", "equation.fraction-chain", "--request", "retained"], () => JSON.stringify(row.proposal));
    assert.ok(result && typeof result === "object" && "status" in result);
    if (result.status === "checked") { accepted++; if (row.expected !== "checked") falseAcceptances++; }
    else repairs++;
    assert.equal(result.status, row.expected, row.id);
    if (result.status === "repair-gap") {
      assert.ok("result" in result && typeof result.result === "object" && result.result !== null && "path" in result.result);
      assert.equal(typeof result.result.path, "string");
      if (typeof result.result.path !== "string") throw new Error("Missing repair path");
      assert.match(result.result.path, /^\$\.(moves|states)/);
    }
  }
  assert.deepEqual({ accepted, repairs, falseAcceptances }, { accepted: 4, repairs: 3, falseAcceptances: 0 });
});

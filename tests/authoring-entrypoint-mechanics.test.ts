import assert from "node:assert/strict";
import test from "node:test";
import { authorTaskExample, checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";

test("mechanics discovery retains its own bounded authority and reference-only host", async () => {
  const source = await authorTaskExample("mechanics.momentum-energy");
  const result = await checkAuthorTask("mechanics.momentum-energy", JSON.stringify(source));
  assert.equal(result.status, "checked");
  assert.equal(result.handoff.execution, "not-performed");
  assert.equal(result.handoff.capabilities.preview.kind, "reference-only");
  assert.doesNotMatch(JSON.stringify(result.result), /"proof"|"authority"/);
  for (const value of [{ ...Object(source), mass: "zero" }, { ...Object(source), proof: "invented" }, { latex: "p=mv" }]) {
    const rejected = await checkAuthorTask("mechanics.momentum-energy", JSON.stringify(value));
    assert.equal(rejected.status, "repair-gap");
  }
  assert.equal((await checkAuthorTask("mechanics.momentum-energy", "{")).status, "repair-gap");
});

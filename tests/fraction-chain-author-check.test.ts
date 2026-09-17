import test from "node:test";
import assert from "node:assert/strict";
import { createFractionChainAuthorExample, checkFractionChainAuthorSource } from "../src/authoring/fraction-chain-author-check.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";

test("fraction discovery checks inferred moves but reports no live or applied authority", async () => {
  const source = createFractionChainAuthorExample();
  const checked = await checkAuthorTask("equation.fraction-chain", JSON.stringify(source));
  assert.equal(checked.status, "checked");
  assert.equal(checked.handoff.execution, "not-performed");
  const result = checkFractionChainAuthorSource(JSON.stringify(source));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("Missing compilation");
  assert.deepEqual(result.moves.map(move => move.kind), ["align", "combine", "reduce"]);
  assert.equal(result.presentationStatus, "not-certified-by-this-check");
  assert.equal(checkFractionChainAuthorSource(JSON.stringify(result)).status, "repair-required");
  source.moves[0]!.prose += " Keep the quantity fixed.";
  const changed = checkFractionChainAuthorSource(JSON.stringify(source));
  assert.equal(changed.status, "compiled");
  if (changed.status === "compiled") assert.notEqual(changed.revisionId, result.revisionId);
});

test("injected controls and stale authority fail; a repaired endpoint rechecks cleanly", () => {
  for (const key of ["proof", "motifId", "geometry", "revisionId", "authority"]) {
    const source = { ...createFractionChainAuthorExample(), [key]: "transported" };
    assert.equal(checkFractionChainAuthorSource(JSON.stringify(source)).status, "repair-required");
  }
  const source = createFractionChainAuthorExample();
  source.states[2]!.latex = "7/6";
  const rejected = checkFractionChainAuthorSource(JSON.stringify(source));
  assert.equal(rejected.status, "repair-required");
  if (rejected.status === "repair-required") assert.equal(rejected.path, "$.moves[1]");
  source.states[2]!.latex = "3/6";
  assert.equal(checkFractionChainAuthorSource(JSON.stringify(source)).status, "compiled");
  assert.equal(checkFractionChainAuthorSource("{").status, "repair-required");
});

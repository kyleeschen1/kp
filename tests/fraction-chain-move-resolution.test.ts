import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";

test("all four retained callers infer the same checked moves without hints", () => {
  for (const suffix of ["", "-numeric", "-two-sided", "-subtraction"]) {
    const source = JSON.parse(readFileSync(`examples/algebra/fraction-chain${suffix}.json`, "utf8"));
    const hadHints = source.moves.some((move: { hint?: string }) => move.hint !== undefined);
    const explicit = compileFractionChain(source);
    for (const move of source.moves) delete move.hint;
    const inferred = compileFractionChain(source);
    assert.equal(explicit.status, "compiled"); assert.equal(inferred.status, "compiled");
    if (explicit.status !== "compiled" || inferred.status !== "compiled") throw new Error("Missing checked chain");
    assert.deepEqual(inferred.compilation.steps.map(s => s.kind), explicit.compilation.steps.map(s => s.kind));
    assert.deepEqual(inferred.compilation.steps.map(s => s.authority), explicit.compilation.steps.map(s => s.authority));
    assert.ok(inferred.compilation.source.moves.every(move => move.hint === undefined));
    if (hadHints) assert.notEqual(inferred.compilation.revision, explicit.compilation.revision);
    else assert.equal(inferred.compilation.revision, explicit.compilation.revision);
  }
});

test("equivalent endpoints with omitted paths, wrong hints and false arithmetic abstain with located repairs", () => {
  const pair = (from: string, to: string, hint?: string) => ({ schema: "kp.algebra.fraction-chain.v1", id: "probe", title: "Probe",
    states: [{ id: "a", latex: from }, { id: "b", latex: to }],
    moves: [{ id: "move", from: "a", to: "b", prose: "Preserve the amount.", ...(hint ? { hint } : {}) }] });
  for (const source of [pair("1/3+1/6", "1/2"), pair("2/6+1/6", "1/2"),
    pair("5/6-2/6", "7/6"), pair("1/3+1/6", "2/6+1/6", "combine"), pair("1/x+1/6", "1/2")]) {
    const result = compileFractionChain(source);
    assert.equal(result.status, "repair-required");
    if (result.status === "repair-required") assert.match(result.path, /^\$\.(moves|states)/);
  }
  const repaired = pair("2/6+1/6", "3/6");
  assert.equal(compileFractionChain(repaired).status, "compiled");
});

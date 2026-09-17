import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFractionChainSource } from "../src/authoring/fraction-chain-source.ts";

const input = () => JSON.parse(readFileSync("examples/algebra/fraction-chain.json", "utf8"));
test("bounded chain parsing retains exact written fractions without granting operation authority", () => {
  const result = readFractionChainSource(input());
  assert.equal(result.status, "parsed");
  if (result.status !== "parsed") return;
  assert.deepEqual(result.source.states[2]!.expression, { kind: "fraction", fraction: { numerator: 3n, denominator: 6n } });
  assert.equal(Object.isFrozen(result.source.states[0]!.expression), true);
  const candidate = input(); candidate.states[2].latex = "\\frac{5}{6}";
  assert.equal(readFractionChainSource(candidate).status, "parsed"); // adjacency owners must reject this later
});
test("unsupported notation and unbounded or nonpositive integers return located repair gaps", () => {
  for (const latex of ["x", "\\frac{1}{0}", "\\frac{1}{-3}", "\\frac{1.5}{3}", "\\frac{1.00000000000000001}{3}", "\\frac{1000001}{3}",
    "\\frac{1}{3}+\\frac{1}{6}+\\frac{1}{2}", "\\frac{1+1}{3}", "\\frac{", "1".repeat(257)]) {
    const source = input(); source.states[0].latex = latex;
    const result = readFractionChainSource(source);
    assert.equal(result.status, "repair-required", latex);
    if (result.status === "repair-required") assert.equal(result.path, "$.states[0].latex");
  }
});
test("shape, adjacency, identity, injected authority and accessor errors fail before evaluation", () => {
  for (const mutate of [
    (source: ReturnType<typeof input>) => { source.proof = "trusted"; },
    (source: ReturnType<typeof input>) => { source.states[0].geometry = {}; },
    (source: ReturnType<typeof input>) => { source.moves[0].hint = "fade"; },
    (source: ReturnType<typeof input>) => { source.moves[0].to = "combined"; },
    (source: ReturnType<typeof input>) => { source.states[1].id = "unlike"; },
    (source: ReturnType<typeof input>) => { source.moves.pop(); },
    (source: ReturnType<typeof input>) => { source.states = Array(9).fill(source.states[0]); }
  ]) { const source = input(); mutate(source); assert.equal(readFractionChainSource(source).status, "repair-required"); }
  let invoked = false;
  const source = input(); Object.defineProperty(source.states[0], "latex", { get() { invoked = true; return "1/2"; } });
  assert.equal(readFractionChainSource(source).status, "repair-required");
  assert.equal(invoked, false);
});

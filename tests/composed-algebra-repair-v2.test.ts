import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import transfer from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { check } from "../src/authoring/algebra/compile.ts";

test("author repairs locate unsupported moves and describe a supported recovery without rewriting source", () => {
  const early = structuredClone(primary); early.states[3]!.latex = "5x+15";
  const symbolic = { ...transfer, states: [...transfer.states, { id: "state.transfer.unsupported", latex: "6x+6y", narration: "An unsupported extra step." }] };
  const cases = [
    { source: early, path: "$.states[3].latex", guidance: /separate final endpoint/ },
    { source: symbolic, path: "$.states[4].latex", guidance: /four states/ }
  ];
  for (const item of cases) {
    const text = JSON.stringify(item.source), result = check(text);
    assert.equal(result.status, "repair-gap");
    if (result.status !== "repair-gap") throw new Error("Expected repair, never fallback.");
    assert.equal(result.diagnostic.path, item.path);
    assert.match(result.diagnostic.expected, item.guidance);
    assert.equal(JSON.stringify(item.source), text);
  }
  for (const source of [primary, transfer]) assert.equal(check(JSON.stringify(source)).status, "compiled");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPlaceValueIntegerAdditionFixture,
  isKpGeneratedPlaceValueAdditionFixture,
  isKpGeneratedPlaceValueAdditionTrace
} from "../src/animation/place-value-addition-generated-fixture.ts";

test("an unequal-width fixture extends its terminal result position", () => {
  const fixture = compileKpPlaceValueIntegerAdditionFixture({
    id: "999-plus-1",
    addends: ["999", "1"]
  });

  assert.equal(isKpGeneratedPlaceValueAdditionFixture(fixture), true);
  assert.equal(isKpGeneratedPlaceValueAdditionTrace(fixture.trace), true);
  assert.equal(fixture.expression, "999 + 1 = 1000");
  assert.equal(fixture.exactResult, 1000n);
  assert.deepEqual(fixture.verification, {
    exactSum: true,
    unequalWidth: true,
    terminalResultExtension: true,
    orderedRadixSequence: true
  });
  assert.deepEqual(
    fixture.positions.map(({ sequenceIndex, exponent, columnId }) => ({
      sequenceIndex,
      exponent,
      columnId
    })),
    [0, 1, 2, 3].map((sequenceIndex) => ({
      sequenceIndex,
      exponent: sequenceIndex,
      columnId: `radix-column-${sequenceIndex}`
    }))
  );
  assert.equal(fixture.positionPrograms.length, 3);
  assert.deepEqual(
    fixture.trace.beats.map(({ operation }) => operation),
    [
      "establish",
      "evaluate-position",
      "exchange-adjacent-position",
      "evaluate-position",
      "exchange-adjacent-position",
      "evaluate-position",
      "settle-result"
    ]
  );
  assert.deepEqual(
    fixture.trace.beats.slice(1).map(({ dependencyBeatIds }) =>
      dependencyBeatIds.length
    ),
    [1, 1, 1, 1, 1, 1]
  );
  assert.deepEqual(
    fixture.positionPrograms.map(({ exchange, terminalOutput }) =>
      exchange === undefined ? terminalOutput?.mode : "exchange"
    ),
    ["exchange", "exchange", "extend-result-sequence"]
  );
  assert.deepEqual(
    fixture.positionPrograms[2]!.terminalOutput!.outputs.map((output) => ({
      role: output.role,
      sequenceIndex: output.position.sequenceIndex,
      digitValue: output.digitValue
    })),
    [
      { role: "settled-digit", sequenceIndex: 2, digitValue: 0n },
      {
        role: "terminal-result-extension",
        sequenceIndex: 3,
        digitValue: 1n
      }
    ]
  );
  assert.equal(fixture.projection.cells.filter(
    ({ role }) => role === "addend-digit"
  ).length, 4);
  assert.equal(fixture.projection.cells.filter(
    ({ role }) => role === "result-digit"
  ).length, 4);
  assert.equal(fixture.workspace.operations.length, 3);
  assert.equal(
    fixture.workspace.operations.at(-1)!.outputs.at(-1)!.role,
    "terminal-result-extension"
  );
});

test("the bounded generator rejects an unanimated single-contributor step", () => {
  assert.throws(() => compileKpPlaceValueIntegerAdditionFixture({
    id: "123-plus-4",
    addends: ["123", "4"]
  }), /direct-settlement support/u);
});

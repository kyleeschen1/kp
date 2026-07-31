import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPlaceValueTerminalOutputPolicy,
  isKpPlaceValueTerminalOutputPolicy
} from "../src/reader/compiler/place-value-addition-terminal-output.ts";
import type {
  KpExactRadixPosition
} from "../src/reader/compiler/place-value-addition-position-types.ts";

const terminalPosition = Object.freeze({
  id: "radix-position-a",
  sequenceIndex: 3,
  radix: 10,
  exponent: -2,
  columnId: "column-a"
}) satisfies KpExactRadixPosition;

const extensionPosition = Object.freeze({
  id: "radix-position-b",
  sequenceIndex: 4,
  radix: 10,
  exponent: -1,
  columnId: "column-b"
}) satisfies KpExactRadixPosition;

test("terminal output settles a total that fits its current radix position", () => {
  const policy = compileKpPlaceValueTerminalOutputPolicy({
    mode: "settle-in-terminal-position",
    terminalPosition,
    evaluatedTotal: 4n,
    result: {
      targetCellId: "result-a",
      materialEntityId: "material-a"
    }
  });

  assert.equal(isKpPlaceValueTerminalOutputPolicy(policy), true);
  assert.equal(policy.mode, "settle-in-terminal-position");
  assert.equal(policy.remainderDigit, 4n);
  assert.deepEqual(policy.outputs.map(({ role, digitValue }) => ({
    role,
    digitValue
  })), [{ role: "settled-digit", digitValue: 4n }]);
});

test("terminal overflow creates a persistent adjacent result extension", () => {
  const policy = compileKpPlaceValueTerminalOutputPolicy({
    mode: "extend-result-sequence",
    terminalPosition,
    extensionPosition,
    evaluatedTotal: 14n,
    remainder: {
      targetCellId: "result-a",
      materialEntityId: "material-a"
    },
    overflow: {
      targetCellId: "result-b",
      materialEntityId: "material-b"
    }
  });

  assert.equal(policy.mode, "extend-result-sequence");
  assert.equal(policy.remainderDigit, 4n);
  assert.equal(policy.overflowDigit, 1n);
  assert.deepEqual(policy.outputs.map(({ role, position, digitValue }) => ({
    role,
    sequenceIndex: position.sequenceIndex,
    exponent: position.exponent,
    digitValue
  })), [
    {
      role: "settled-digit",
      sequenceIndex: 3,
      exponent: -2,
      digitValue: 4n
    },
    {
      role: "terminal-result-extension",
      sequenceIndex: 4,
      exponent: -1,
      digitValue: 1n
    }
  ]);
  assert.equal(isKpPlaceValueTerminalOutputPolicy({ ...policy }), false);
});

test("terminal mode cannot conceal or fabricate overflow", () => {
  assert.throws(() => compileKpPlaceValueTerminalOutputPolicy({
    mode: "settle-in-terminal-position",
    terminalPosition,
    evaluatedTotal: 14n,
    result: { targetCellId: "result-a", materialEntityId: "material-a" }
  }), /must extend the result sequence/u);
  assert.throws(() => compileKpPlaceValueTerminalOutputPolicy({
    mode: "extend-result-sequence",
    terminalPosition,
    extensionPosition,
    evaluatedTotal: 4n,
    remainder: { targetCellId: "result-a", materialEntityId: "material-a" },
    overflow: { targetCellId: "result-b", materialEntityId: "material-b" }
  }), /exactly one adjacent result-extension/u);
});

test("terminal extension must be the exact adjacent radix position", () => {
  assert.throws(() => compileKpPlaceValueTerminalOutputPolicy({
    mode: "extend-result-sequence",
    terminalPosition,
    extensionPosition: { ...extensionPosition, exponent: 0 },
    evaluatedTotal: 14n,
    remainder: { targetCellId: "result-a", materialEntityId: "material-a" },
    overflow: { targetCellId: "result-b", materialEntityId: "material-b" }
  }), /exactly one adjacent result-extension/u);
  assert.throws(() => compileKpPlaceValueTerminalOutputPolicy({
    mode: "extend-result-sequence",
    terminalPosition,
    extensionPosition: { ...extensionPosition, radix: 2 },
    evaluatedTotal: 14n,
    remainder: { targetCellId: "result-a", materialEntityId: "material-a" },
    overflow: { targetCellId: "result-b", materialEntityId: "material-b" }
  }), /exactly one adjacent result-extension/u);
});

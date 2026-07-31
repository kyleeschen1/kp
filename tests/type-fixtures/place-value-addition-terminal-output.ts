import {
  compileKpPlaceValueTerminalOutputPolicy
} from "../../src/reader/compiler/place-value-addition-terminal-output.ts";
import type {
  KpExactRadixPosition
} from "../../src/reader/compiler/place-value-addition-position-types.ts";

declare const terminalPosition: KpExactRadixPosition;
declare const extensionPosition: KpExactRadixPosition;

compileKpPlaceValueTerminalOutputPolicy({
  mode: "settle-in-terminal-position",
  terminalPosition,
  evaluatedTotal: 4n,
  result: { targetCellId: "result-a", materialEntityId: "material-a" },
  // @ts-expect-error A settled terminal result cannot also declare an extension.
  extensionPosition
});

// @ts-expect-error Result extension requires both persistent output targets.
compileKpPlaceValueTerminalOutputPolicy({
  mode: "extend-result-sequence",
  terminalPosition,
  extensionPosition,
  evaluatedTotal: 14n,
  remainder: { targetCellId: "result-a", materialEntityId: "material-a" }
});

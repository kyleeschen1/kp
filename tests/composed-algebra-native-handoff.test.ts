import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraProofV2 } from "../src/authoring/composed-algebra-proof-v2.ts";
import { resolveKpComposedAlgebraPresentationV2 } from "../src/authoring/composed-algebra-presentation-v2.ts";
import { alignKpEquationStageSequence } from "../src/reader/runtime/equation-stage-transit-corridor.ts";
import { assertKpMeasuredCanonicalEquationHandoff } from "../src/reader/app/canonical-equation-native-handoff.ts";

test("native handoff rejects semantic copies, unused partitions and unmeasured continuity evidence", () => {
  const presentation = resolveKpComposedAlgebraPresentationV2(checkKpComposedAlgebraProofV2(primary));
  const handoff = presentation.handoffs[0];
  assert.throws(() => alignKpEquationStageSequence([], [{ ...handoff }]), /issued/);
  assert.throws(() => alignKpEquationStageSequence([], [handoff, handoff]), /unique/);
  assert.throws(() => alignKpEquationStageSequence([], [handoff]), /no adjacent/);
  assert.throws(() => assertKpMeasuredCanonicalEquationHandoff({ authority: handoff }), /measured/);
});

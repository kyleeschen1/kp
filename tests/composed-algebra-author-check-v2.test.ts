import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import transfer from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { runAuthorCheckCli } from "../scripts/author-check.ts";
import { checkKpComposedAlgebraAuthorSourceV2 } from "../src/authoring/composed-algebra-author-check-v2.ts";
import { assertKpComposedAlgebraPresentationV2 } from "../src/authoring/composed-algebra-presentation-v2.ts";

test("registered intuition author entry returns bounded reports not live capabilities", async () => {
  assert.deepEqual(await runAuthorCheckCli(["--task", "equation.algebra-intuition", "--example"]), primary);
  for (const source of [primary, transfer]) {
    const text = JSON.stringify(source), result = checkKpComposedAlgebraAuthorSourceV2(text);
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") throw new Error("Supported example rejected.");
    assert.equal(result.checkpointCount, source.states.length);
    assert.equal(result.transitionCount, source.states.length - 1);
    assert.equal(result.operationIds.length, result.transitionCount);
    const report = await runAuthorCheckCli(["--task", "equation.algebra-intuition", "--request", "source.json"], () => text);
    assert.ok(report && typeof report === "object" && "status" in report && report.status === "checked");
    assert.throws(() => assertKpComposedAlgebraPresentationV2(result), /issued/);
    assert.equal(checkKpComposedAlgebraAuthorSourceV2(JSON.stringify(result)).status, "repair-gap");
  }
});

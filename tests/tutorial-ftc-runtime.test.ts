import assert from "node:assert/strict";
import test from "node:test";
import {
  checkKpFtcTutorialRuntimeLaws,
  sampleKpFtcTutorialRuntime
} from "../src/tutorial/ftc-runtime.ts";

test("FTC runtime passes direct seek, rewind, and stateless sampling laws", () => {
  assert.deepEqual(checkKpFtcTutorialRuntimeLaws(), []);
});

test("FTC runtime reveals claims and notation in authored semantic order", () => {
  const frames = [0, 0.2, 0.4, 0.62, 0.8, 0.95, 1].map((progress) =>
    sampleKpFtcTutorialRuntime({ progress })
  );

  assert.equal(frames[0]?.activeClaimId, "claim.ftc.whole");
  assert.ok(
    frames.find(({ activeClaimId }) => activeClaimId === "claim.ftc.convergence")
  );
  assert.ok(frames.find(({ equationLatex }) => equationLatex.includes("\\lim")));
  assert.equal(frames.at(-1)?.activeClaimId, "claim.ftc.net-change");
  assert.equal(frames.at(-1)?.equationStage, "net-change");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpFtcFiniteQuotientProbe,
  respondToKpTutorialEpistemicProbe
} from "../src/tutorial/ftc-epistemic-probe.ts";

test("FTC epistemic probe is optional, unscored, and non-gating", () => {
  const probe = createKpFtcFiniteQuotientProbe();

  assert.equal(probe.optional, true);
  assert.equal(probe.gatesProgress, false);
  assert.equal(probe.scored, false);
  assert.equal(probe.options[1]?.validity, "intentional-invalid");
  assert.deepEqual(respondToKpTutorialEpistemicProbe({ probe }), {
    probeId: probe.id,
    optionId: undefined,
    skipped: true,
    canonicalProgressChanged: false,
    disclosure: "Probe skipped; the canonical explanation continues unchanged."
  });
});

test("probe feedback interprets rather than grading the learner", () => {
  const probe = createKpFtcFiniteQuotientProbe();
  const response = respondToKpTutorialEpistemicProbe({
    probe,
    optionId: "option.ftc.derivative-already"
  });

  assert.equal(response.canonicalProgressChanged, false);
  assert.match(response.disclosure, /intentional tempting shortcut/);
  assert.equal("score" in response, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { validateKpTutorialAccessibilityFamily } from "../src/tutorial/accessibility-projection.ts";
import { validateKpClaimSceneGraphBundle } from "../src/tutorial/claim-scene-graphs.ts";
import { validateKpCrossViewCorrespondenceMap } from "../src/tutorial/cross-view-correspondence.ts";
import { validateKpTutorialEpistemicNarration } from "../src/tutorial/epistemic-narration.ts";
import {
  createKpFtcNetChangeFrame,
  createKpFtcReintegrationFrames,
  createKpFtcTutorialDefinition
} from "../src/tutorial/ftc-tutorial-module.ts";
import { validateKpInterpretiveCycle } from "../src/tutorial/interpretive-cycle.ts";

test("FTC module closes claims, scenes, cycles, correspondence, narration, and accessibility", () => {
  const definition = createKpFtcTutorialDefinition();

  assert.deepEqual(validateKpClaimSceneGraphBundle(definition.graphs), []);
  assert.deepEqual(validateKpCrossViewCorrespondenceMap(definition.correspondence), []);
  assert.deepEqual(
    validateKpTutorialEpistemicNarration({
      claimGraph: definition.graphs.claimGraph,
      narrations: definition.narrations
    }),
    []
  );
  assert.deepEqual(
    validateKpInterpretiveCycle({
      cycle: definition.cycles[0]!,
      module: definition.module,
      graphBundle: definition.graphs
    }),
    []
  );
  assert.deepEqual(validateKpTutorialAccessibilityFamily(definition.accessibility), []);
  assert.equal(definition.timeline.clockId, definition.module.clockId);
});

test("FTC net change follows and reuses the accumulator interpretation", () => {
  const definition = createKpFtcTutorialDefinition();
  const frame = createKpFtcNetChangeFrame();

  assert.deepEqual(definition.module.canonicalSceneIds, [
    "scene.ftc.accumulator-derivative",
    "scene.ftc.net-change"
  ]);
  assert.equal(definition.module.checkpoints.at(-1)?.id, "checkpoint.ftc.net-change");
  assert.equal(frame.latex, "A(b)-A(a)=\\int_a^b f(t)\\,dt");
  assert.ok(frame.persistentSelectorIds.includes("ftc.symbol.accumulator-A"));
  assert.deepEqual(frame.activeCorrespondenceIds, [
    "correspondence.ftc.area-to-net-change"
  ]);
});

test("FTC reintegration introduces the limit before the derivative identity", () => {
  const frames = createKpFtcReintegrationFrames();

  assert.deepEqual(frames.map(({ stage }) => stage), ["finite-ratio", "limit", "identity"]);
  assert.equal(frames[0]?.proofStatus, "computation");
  assert.match(frames[1]?.latex ?? "", /\\lim/);
  assert.equal(frames[2]?.latex, "A'(x)=f(x)");
  assert.deepEqual(frames[0]?.persistentSelectorIds, frames[2]?.persistentSelectorIds);
});

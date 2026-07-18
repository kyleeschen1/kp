import assert from "node:assert/strict";
import test from "node:test";
import { validateKpTutorialAccessibilityFamily } from "../src/tutorial/accessibility-projection.ts";
import { validateKpClaimSceneGraphBundle } from "../src/tutorial/claim-scene-graphs.ts";
import { validateKpCrossViewCorrespondenceMap } from "../src/tutorial/cross-view-correspondence.ts";
import { validateKpTutorialEpistemicNarration } from "../src/tutorial/epistemic-narration.ts";
import {
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

test("FTC reintegration introduces the limit before the derivative identity", () => {
  const frames = createKpFtcReintegrationFrames();

  assert.deepEqual(frames.map(({ stage }) => stage), ["finite-ratio", "limit", "identity"]);
  assert.equal(frames[0]?.proofStatus, "computation");
  assert.match(frames[1]?.latex ?? "", /\\lim/);
  assert.equal(frames[2]?.latex, "A'(x)=f(x)");
  assert.deepEqual(frames[0]?.persistentSelectorIds, frames[2]?.persistentSelectorIds);
});

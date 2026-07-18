import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectKpHermeneuticTutorial,
  renderKpHermeneuticTutorialInspector
} from "../src/editor/hermeneutic-tutorial-inspector.ts";
import { createKpTutorialExplorationState } from "../src/tutorial/exploration-state.ts";
import type { KpHermeneuticTutorialModule } from "../src/tutorial/hermeneutic-module.ts";

test("editor inspector exposes tutorial semantics and independent promotion facets", () => {
  const module = {
    id: "tutorial.ftc",
    version: 1,
    title: "FTC & accumulation",
    clockId: "clock.ftc.shared",
    canonicalSceneIds: [],
    views: [],
    scenes: [],
    checkpoints: []
  } satisfies KpHermeneuticTutorialModule;
  const model = inspectKpHermeneuticTutorial({
    module,
    claimGraph: {
      id: "claims.ftc",
      nodes: [{ id: "claim.ftc.whole", statement: "Whole", evidenceIds: [] }],
      edges: []
    },
    cycles: [],
    explorationState: createKpTutorialExplorationState({
      id: "state.ftc",
      values: { upperBound: 2 }
    }),
    correspondenceMap: {
      id: "cross-view.ftc",
      members: [],
      identities: [],
      correspondences: []
    },
    narrations: [],
    promotion: {
      maturity: "draft",
      novelty: "new-combination",
      humanReviewRequired: true,
      goldCohort: false
    }
  });
  const html = renderKpHermeneuticTutorialInspector(model);

  assert.match(html, /data-kp-tutorial-inspector="tutorial\.ftc"/);
  assert.match(html, /data-kp-tutorial-clock="clock\.ftc\.shared"/);
  assert.match(html, /data-kp-artifact-maturity="draft"/);
  assert.match(html, /data-kp-artifact-novelty="new-combination"/);
  assert.match(html, /data-kp-tutorial-claim="claim\.ftc\.whole"/);
  assert.match(html, /FTC &amp; accumulation/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { projectKpAuthoringMarketPreviewStatus as project } from "../src/experiments/authoring-market/authoring-market-preview-status.ts";
import type { KpAuthoringMarketBuildRevision } from "../src/experiments/authoring-market/authoring-market-preview-protocol.ts";

const draft: KpAuthoringMarketBuildRevision = {
  schemaVersion: "kp.authoring-market-build.v1", sequence: 2,
  sourceRevision: "draft.2", sourcePaths: ["article.ts"], status: "valid"
};

test("build success stays preparing until that exact revision is displayed", () => {
  assert.equal(project(draft).phase, "preparing");
  assert.match(project(draft).text, /No valid preview is available yet/);
  assert.equal(project(draft, "draft.1").phase, "preparing");
  assert.match(project(draft, "draft.1").text, /Displayed revision: draft.1/);
  assert.equal(project(draft, "draft.2").phase, "valid");
});

test("invalid draft reports exact details and retained display separately", () => {
  const invalid = { ...draft, status: "invalid" as const, diagnostic: {
    code: "kp.authoring.market-build-gap" as const, file: "article.ts", line: 3, column: 0,
    sourceCode: "article.invalid", path: "article.references", message: "Repair reference"
  } };
  const state = project(invalid, "draft.1");
  assert.equal(state.draftRevision, "draft.2");
  assert.equal(state.displayedRevision, "draft.1");
  assert.match(state.text, /article.ts:3:0 · article.invalid · article.references · Repair reference/);
  assert.match(state.text, /Last valid preview retained/);
  assert.match(project(invalid).text, /No valid preview is available yet/);
  assert.doesNotMatch(project(invalid).text, /Last valid preview retained/);
  assert.equal(project(draft, "draft.2").phase, "valid");
});

test("explicit historical inspection does not pretend an older display is still preparing", () => {
  const state = project(draft, "draft.1", true);
  assert.equal(state.phase, "historical");
  assert.match(state.text, /Draft draft.2: valid/);
  assert.match(state.text, /Inspecting displayed revision draft.1 \(read only\)/);
});

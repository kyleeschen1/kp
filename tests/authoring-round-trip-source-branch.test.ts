import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketSourceBranch as branch, readKpAuthoringMarketSourceBranch as read } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import type { KpAuthoringMarketBuildRevision } from "../src/experiments/authoring-market/authoring-market-preview-protocol.ts";

const revision = (): KpAuthoringMarketBuildRevision => ({ schemaVersion: "kp.authoring-market-build.v1",
  sourceRevision: "source.parent", sequence: 3, sourcePaths: ["model.ts", "article.ts"],
  status: "valid", preview: buildKpAuthoringMarketPreview("reference") });

test("explicit source variants preserve predecessor, prose and independent identity", () => {
  const parent = revision();
  const serializedParent = JSON.stringify(parent);
  const first = branch(parent, "first");
  const second = branch(parent, "second");
  assert.equal(first.parentSourceRevision, parent.sourceRevision);
  assert.notEqual(first.data.article.sourceId, second.data.article.sourceId);
  assert.equal(first.data.article.text, parent.preview!.article.text);
  assert.deepEqual(first.data.parameters, parent.preview!.parameters);
  assert.notEqual(first.data.parameters, parent.preview!.parameters);
  const edited = JSON.parse(JSON.stringify(first));
  edited.data.article.text = edited.data.article.text.replace("How does a tax reshape a market?", "A separate editorial branch");
  assert.match(read(edited).data.article.text, /A separate editorial branch/);
  assert.equal(JSON.stringify(parent), serializedParent);
  assert.equal(second.data.article.text, parent.preview!.article.text);
  assert.deepEqual(read(JSON.parse(JSON.stringify(first))), first);
});

test("branching rejects missing selection, unsafe names, stale bindings and mismatched identity", () => {
  assert.throws(() => branch({ ...revision(), status: "invalid" }, "draft"), /valid retained/);
  assert.throws(() => branch(revision(), "../overwrite"), /branch name/);
  const selected = branch(revision(), "draft");
  assert.throws(() => read({ ...selected, name: "another" }), /identity/);
  assert.throws(() => read({ ...selected, data: { ...selected.data,
    parameters: buildKpAuthoringMarketPreview("variation").parameters } }), /revision/);
  assert.throws(() => read({ ...selected, parentSourceRevision: "" }), /predecessor/);
});

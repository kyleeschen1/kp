import assert from "node:assert/strict";
import test from "node:test";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketSourceBranch, readKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

function source(selection: "reference" | "variation") {
  return createKpAuthoringMarketSourceBranch({ schemaVersion: "kp.authoring-market-build.v1",
    sourceRevision: "source.parent", sequence: 1, sourcePaths: ["model.ts", "article.ts"],
    status: "valid", preview: buildKpAuthoringMarketPreview(selection) }, selection);
}

test("market reports preserve both existing parameter/fact cohorts without claiming application", async () => {
  for (const selection of ["reference", "variation"] as const) {
    const selected = source(selection);
    const json = JSON.stringify(selected);
    const report = await checkAuthorTask("graph2d.supply-tax", json);
    assert.equal(report.status, "checked");
    assert.equal(report.authority, "report-only");
    assert.deepEqual(report.result, { status: "compiled", source: readKpAuthoringMarketSourceBranch(JSON.parse(json)) });
    assert.equal(JSON.stringify(selected), json);
  }
  assert.equal(supportedAuthorTasks["graph2d.supply-tax"].preview.kind, "local-source-build");
  assert.equal(supportedAuthorTasks["graph2d.supply-tax"].publication.command, "author:market-publication");
});

test("market route rejects stale parameter-to-Article bindings and mismatched branch identity", async () => {
  const selected = source("reference");
  for (const invalid of [
    { ...selected, data: { ...selected.data, parameters: source("variation").data.parameters } },
    { ...selected, name: "different-identity" },
    { ...selected, parentSourceRevision: "" }
  ]) {
    assert.throws(() => readKpAuthoringMarketSourceBranch(invalid));
    const report = await checkAuthorTask("graph2d.supply-tax", JSON.stringify(invalid));
    assert.equal(report.status, "repair-gap");
    assert.equal(report.result.status, "repair-gap");
    assert.ok("diagnostic" in report.result);
  }
});

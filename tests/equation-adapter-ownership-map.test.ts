import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpEquationAdapterOwnershipMap,
  validateKpEquationAdapterOwnershipMap
} from "../src/architecture/equation-adapter-ownership-map.ts";

test("equation adapter ownership dependencies are complete and acyclic", () => {
  assert.deepEqual(
    validateKpEquationAdapterOwnershipMap(kpEquationAdapterOwnershipMap),
    []
  );
  assert.equal(
    kpEquationAdapterOwnershipMap.owners.filter(
      ({ decision }) => decision === "extracted"
    ).length,
    2
  );
});

test("equation adapter ownership anchors remain grounded in the source", async () => {
  const sources = new Map<string, string>();
  for (const owner of kpEquationAdapterOwnershipMap.owners) {
    let source = sources.get(owner.sourcePath);
    if (source === undefined) {
      source = await readFile(owner.sourcePath, "utf8");
      sources.set(owner.sourcePath, source);
    }
    assert.ok(owner.inputs.length > 0, `${owner.id} has no measurable input.`);
    assert.ok(owner.outputs.length > 0, `${owner.id} has no measurable output.`);
    for (const anchor of owner.sourceAnchors) {
      assert.match(
        source,
        new RegExp(`\\b${anchor}\\b`),
        `${owner.id} lost source anchor ${anchor}.`
      );
    }
  }
});

test("planned extraction direction leaves the adapter as composition root", () => {
  const host = kpEquationAdapterOwnershipMap.owners.find(
    ({ id }) => id === "host-orchestration"
  );
  assert.ok(host);
  assert.equal(host.decision, "retain-in-host");
  assert.deepEqual(new Set(host.dependsOn), new Set(
    kpEquationAdapterOwnershipMap.owners
      .filter(({ id }) => id !== "host-orchestration")
      .map(({ id }) => id)
  ));
  assert.equal(
    kpEquationAdapterOwnershipMap.owners.some(
      ({ id, dependsOn }) =>
        id !== "host-orchestration" &&
        dependsOn.includes("host-orchestration")
    ),
    false
  );
});

test("the extracted frame planner is DOM-free behind the adapter facade", async () => {
  const [plannerSource, adapterSource] = await Promise.all([
    readFile("src/editor/equation-stage-frame.ts", "utf8"),
    readFile("src/editor/equation-surface-adapter.ts", "utf8")
  ]);
  for (const forbiddenDomAuthority of [
    "HTMLElement",
    "document.",
    "window.",
    "querySelector"
  ]) {
    assert.equal(
      plannerSource.includes(forbiddenDomAuthority),
      false,
      `frame planner acquired DOM authority through ${forbiddenDomAuthority}`
    );
  }
  assert.match(
    adapterSource,
    /export \{ createKpEditorEquationStageFrame \} from "\.\/equation-stage-frame\.ts";/
  );
  assert.doesNotMatch(
    adapterSource,
    /function create(?:RadicalSuccession|FunctionWrap|LinearRearrangement|DotProductTraversal|MatrixVectorComposition|MatrixMatrixComposition|DerivativePower)Frame\b/
  );
});

test("markup projection depends one-way on frames and not on the host", async () => {
  const [markupSource, adapterSource] = await Promise.all([
    readFile("src/editor/equation-stage-markup.ts", "utf8"),
    readFile("src/editor/equation-surface-adapter.ts", "utf8")
  ]);
  assert.match(markupSource, /from "\.\/equation-stage-frame\.ts"/);
  assert.doesNotMatch(markupSource, /from "\.\/equation-surface-adapter\.ts"/);
  assert.match(adapterSource, /from "\.\/equation-stage-markup\.ts"/);
  assert.doesNotMatch(adapterSource, /function renderStage\b/);
  assert.doesNotMatch(adapterSource, /function annotatedLatexForStates\b/);
  assert.doesNotMatch(adapterSource, /function bindStructuralMotionIds\b/);
});

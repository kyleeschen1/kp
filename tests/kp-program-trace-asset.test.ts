import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  sampleKpBehavior
} from "../src/semantic/asset-behavior.ts";
import {
  kpSemanticDiagramForwardPhases
} from "../src/semantic/asset-diagram.ts";
import {
  checkKpBehaviorDeterminism,
  checkKpDiagramRewindLaw
} from "../src/semantic/asset-laws.ts";
import {
  validateKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createAdditionProgramTraceKpAsset
} from "../src/semantic/program-trace-asset.ts";

test("createAdditionProgramTraceKpAsset wraps source and execution steps", () => {
  const asset = createAdditionProgramTraceKpAsset();

  assert.equal(asset.sourceFixtureId, "fixture.programming.add.execution-trace");
  assert.equal(asset.bundle.id, "asset.programming.add.execution-trace");
  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
  assert.deepEqual(
    asset.bundle.objects.map((object) => [object.id, object.objectType]),
    [
      ["source-file.programming.add", "source-file"],
      ["execution-step.programming.add.call", "execution-step"],
      ["execution-step.programming.add.evaluate-return", "execution-step"],
      ["execution-step.programming.add.return", "execution-step"],
      ["execution-step.programming.add.output", "execution-step"]
    ]
  );
  assert.deepEqual(
    asset.bundle.objects[0]?.selectors.map((selector) => selector.id),
    ["selector.programming.add.signature", "selector.programming.add.return"]
  );
  assert.deepEqual(asset.bundle.objects[0]?.selectors[1]?.metadata, {
    startLine: 2,
    startColumn: 3,
    endLine: 2,
    endColumn: 16,
    sourceFileId: "source-file.programming.add",
    sourceRangeProvenanceId:
      "provenance.source-file.programming.add.selector.programming.add.return",
    sourceRevisionId: "rev-1",
    sourceTextHash: "fnv1a-acab0c94"
  });
});

test("createAdditionProgramTraceKpAsset exposes execution transformations and behavior", () => {
  const asset = createAdditionProgramTraceKpAsset();

  assert.deepEqual(
    asset.transformations.map((transformation) => transformation.id),
    [
      "transform.programming.add.call",
      "transform.programming.add.evaluate-return",
      "transform.programming.add.return",
      "transform.programming.add.output"
    ]
  );
  assert.deepEqual(
    asset.transformations.flatMap((transformation) =>
      validateKpSemanticTransformation(transformation, asset.bundle)
    ),
    []
  );
  assert.deepEqual(kpSemanticDiagramForwardPhases(asset.diagram), [
    ["transform.programming.add.call"],
    ["transform.programming.add.evaluate-return"],
    ["transform.programming.add.return"],
    ["transform.programming.add.output"]
  ]);
  assert.deepEqual(checkKpDiagramRewindLaw(asset.diagram), {
    lawId: "diagram.rewind",
    passed: true,
    failures: []
  });
  assert.equal(sampleKpBehavior(asset.behavior, 600).stepId, "step.programming.add.evaluate-return");
  assert.deepEqual(checkKpBehaviorDeterminism(asset.behavior, [0, 600, 1200]), {
    lawId: "behavior.determinism",
    passed: true,
    failures: []
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  compileKpPlaceValueOnesEvaluation,
  isKpPlaceValueOnesEvaluation
} from "../src/rendering/place-value-addition-ones-evaluation.ts";

test("ones evaluation reuses the canonical executable operation program", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const evaluation = session.onesEvaluation;
  const presentationBeat = session.foundation.presentation.beats.find(
    ({ beatId }) => beatId === evaluation.beatId
  );
  const program = presentationBeat?.programs[0];

  assert.equal(isKpPlaceValueOnesEvaluation(evaluation), true);
  assert.equal(program?.kind, "operation-evaluation");
  assert.equal(evaluation.forward.programId, program?.executableProgram.id);
  assert.equal(evaluation.rewind.programId, program?.executableProgram.id);
  assert.equal(
    evaluation.forward.route.primitiveRoute,
    "native-katex-successor-synthesis"
  );
  assert.equal(evaluation.opacityPolicy, "opaque");
  assert.equal(
    evaluation.binding.layoutTopology,
    "separate-source-result-bands"
  );
});

test("both numeral inputs and the plus catalyst have exhaustive roles", () => {
  const { onesEvaluation: evaluation } =
    createKpPlaceValueAdditionRuntimeSession();
  const material = evaluation.binding.sourceAnnotations
    .filter(({ contribution }) => contribution === "material-input")
    .flatMap(({ selectorIds }) => selectorIds);
  const catalysts = evaluation.binding.sourceAnnotations
    .filter(({ contribution }) => contribution === "catalyst")
    .flatMap(({ selectorIds }) => selectorIds);
  const targets = evaluation.binding.targetAnnotations.flatMap(
    ({ selectorIds }) => selectorIds
  );

  assert.deepEqual(material, [
    "digit.first.ones",
    "digit.second.ones"
  ]);
  assert.deepEqual(catalysts, ["operator.add"]);
  assert.deepEqual(targets, [
    "evaluation.ones.total.tens",
    "evaluation.ones.total.ones"
  ]);
  assert.deepEqual(
    evaluation.binding.lineages[0]?.sourceAnnotationIds,
    ["annotation.ones.material.0", "annotation.ones.material.1"]
  );
  assert.ok(
    !evaluation.binding.lineages[0]?.sourceAnnotationIds.includes(
      "annotation.ones.plus"
    )
  );
});

test("forward and rewind expose inverse phase order over one absolute path", () => {
  const evaluation = compileKpPlaceValueOnesEvaluation(
    createKpPlaceValueAdditionRuntimeSession().foundation.presentation
  );
  const forward = evaluation.forward.samplePhaseTelemetry(0.5);
  const rewind = evaluation.rewind.samplePhaseTelemetry(0.5);

  assert.deepEqual(
    evaluation.rewind.phaseOrder,
    [...evaluation.forward.phaseOrder].reverse()
  );
  assert.equal(forward.progress, rewind.progress);
  assert.equal(forward.direction, "forward");
  assert.equal(rewind.direction, "rewind");
  assert.ok(
    forward.phases.every(({ progress }) => progress >= 0 && progress <= 1)
  );
  assert.ok(
    rewind.phases.every(({ progress }) => progress >= 0 && progress <= 1)
  );
});

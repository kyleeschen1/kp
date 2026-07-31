import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  compileKpPlaceValueColumnEvaluation,
  isKpPlaceValueColumnEvaluation
} from "../src/rendering/place-value-addition-column-evaluation.ts";
import {
  compileKpPlaceValueAdditionPositionPrograms
} from "../src/reader/compiler/place-value-addition-position-program.ts";

test("ones evaluation reuses the canonical executable operation program", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const evaluation = session.columnEvaluations[0]!;
  const presentationBeat = session.foundation.presentation.beats.find(
    ({ beatId }) => beatId === evaluation.beatId
  );
  const program = presentationBeat?.programs[0];

  assert.equal(isKpPlaceValueColumnEvaluation(evaluation), true);
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
  assert.equal(
    evaluation.binding.convergenceAnchor,
    "target-destination"
  );
  assert.equal(
    evaluation.writtenOwnership.contributionDestinationPolicy,
    "measured-evaluated-total-native-paint"
  );
});

test("semantic inputs compile to motion proxies beside stationary written cells", () => {
  const evaluation =
    createKpPlaceValueAdditionRuntimeSession().columnEvaluations[0]!;
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
    "proxy.place-value.decimal-position-0.contribution-0",
    "proxy.place-value.decimal-position-0.contribution-1"
  ]);
  assert.deepEqual(catalysts, [
    "proxy.place-value.decimal-position-0.addition-catalyst"
  ]);
  assert.deepEqual(
    evaluation.writtenOwnership.contributionProxies.map(
      ({ sourceCellId }) => sourceCellId
    ),
    ["digit.first.ones", "digit.second.ones"]
  );
  assert.equal(
    evaluation.writtenOwnership.catalystProxy.sourceCellId,
    "operator.add"
  );
  assert.deepEqual(evaluation.materialSelectorIds, [
    "digit.first.ones",
    "digit.second.ones"
  ]);
  assert.deepEqual(targets, [
    "proxy.place-value.decimal-position-0.evaluated-digit-0",
    "proxy.place-value.decimal-position-0.evaluated-digit-1"
  ]);
  assert.deepEqual(evaluation.targetSelectorIds, [
    "evaluation.ones.total.tens",
    "evaluation.ones.total.ones"
  ]);
  assert.deepEqual(
    evaluation.binding.lineages[0]?.sourceAnnotationIds,
    [
      "annotation.decimal-position-0.material.0",
      "annotation.decimal-position-0.material.1"
    ]
  );
  assert.ok(
    !evaluation.binding.lineages[0]?.sourceAnnotationIds.includes(
      "annotation.decimal-position-0.plus"
    )
  );
});

test("forward and rewind expose inverse phase order over one absolute path", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const evaluation = compileKpPlaceValueColumnEvaluation(
    session.foundation.presentation,
    compileKpPlaceValueAdditionPositionPrograms()[0]!
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

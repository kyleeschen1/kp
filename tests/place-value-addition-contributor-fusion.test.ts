import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  kpPlaceValueContributorFusionMotifKind,
  kpPlaceValueStandardEvaluationMotifKind,
  sampleKpPlaceValueContributorArc
} from "../src/rendering/place-value-addition-contributor-fusion-motif.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  compileKpPlaceValueEvaluationVisualMotifs
} from "../src/rendering/place-value-addition-shared-dom.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("approved contributor fusion compiles an exhaustive two-caller motif choice", () => {
  const motifs = compileKpPlaceValueEvaluationVisualMotifs(
    createKpPlaceValueAdditionRuntimeSession().columnEvaluations
  );

  assert.deepEqual(motifs.map(({ kind }) => kind), [
    kpPlaceValueContributorFusionMotifKind,
    kpPlaceValueContributorFusionMotifKind,
    kpPlaceValueStandardEvaluationMotifKind
  ]);
  const plans = motifs.flatMap((motif) =>
    motif.kind === kpPlaceValueContributorFusionMotifKind
      ? [motif.plan]
      : []
  );
  assert.deepEqual(plans.map(({ contributorArcs }) => contributorArcs.length), [
    2,
    3
  ]);
  const landmarks = (key: "dockProgress" | "seedProgress" | "resolveProgress") =>
    plans.map((plan) => Number(plan[key].toFixed(2)));
  assert.deepEqual(landmarks("dockProgress"), [0.66, 0.74]);
  assert.deepEqual(landmarks("seedProgress"), [0.76, 0.84]);
  assert.deepEqual(landmarks("resolveProgress"), [
    0.96,
    0.98
  ]);
  assert.ok(plans.every(({ ownershipPolicy }) =>
    ownershipPolicy === "opaque-lineage-with-canonical-handoffs"
  ));
});

test("every compiled contributor route is a stationary-endpoint arc", () => {
  const motifs = compileKpPlaceValueEvaluationVisualMotifs(
    createKpPlaceValueAdditionRuntimeSession().columnEvaluations
  );
  const epsilon = 0.001;
  for (const motif of motifs) {
    if (motif.kind !== kpPlaceValueContributorFusionMotifKind) continue;
    for (const arc of motif.plan.contributorArcs) {
      const midpoint = (arc.startProgress + arc.endProgress) / 2;
      assert.ok(
        Math.abs(sampleKpPlaceValueContributorArc(arc, arc.startProgress)) <
          1e-12
      );
      assert.ok(
        Math.abs(sampleKpPlaceValueContributorArc(arc, arc.endProgress)) <
          1e-12
      );
      assert.ok(sampleKpPlaceValueContributorArc(arc, midpoint) > 0.999);
      assert.ok(
        sampleKpPlaceValueContributorArc(
          arc,
          arc.startProgress + epsilon
        ) / epsilon < 0.1
      );
      assert.ok(
        sampleKpPlaceValueContributorArc(
          arc,
          arc.endProgress - epsilon
        ) / epsilon < 0.1
      );
    }
  }
});

test("canonical evaluation DOM cannot regress to an optional experiment path", () => {
  const evaluationSource = readFileSync(join(
    projectRoot,
    "src/rendering/place-value-addition-column-evaluation.ts"
  ), "utf8");
  const sharedSource = readFileSync(join(
    projectRoot,
    "src/rendering/place-value-addition-shared-dom.ts"
  ), "utf8");

  assert.doesNotMatch(evaluationSource, /visualExperiment|ink-union-experiment/u);
  assert.doesNotMatch(sharedSource, /visualExperiment|ink-union-experiment/u);
  assert.match(
    evaluationSource,
    /readonly visualMotif: KpPlaceValueEvaluationVisualMotif/u
  );
});

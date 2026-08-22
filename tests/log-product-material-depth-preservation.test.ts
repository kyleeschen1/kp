import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  sampleKpSemanticMotionChoreography
} from "../src/domain-ir/public-api.ts";
import type {
  SelectorCorrespondenceRecord
} from "../src/semantic/correspondence.ts";
import {
  readKpAnimationDevelopmentUrlState
} from "../src/editor/animation-development-url-state.ts";
import {
  kpCanonicalLogProductNativeEndpoints
} from "../src/rendering/log-product-native-endpoints.ts";
import {
  kpCanonicalCompiledLogProductSemanticMotion
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  kpCanonicalLogProductFamily
} from "../src/semantic/log-product-states.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("material-depth discovery preserves the approved binary semantic lineage", () => {
  const family = kpCanonicalLogProductFamily;
  const records = kpCanonicalCompiledLogProductOperation.transformation
    .correspondenceMap?.records;
  assert.ok(records !== undefined);

  assert.deepEqual(family.states.map(({ id, latex }) => ({ id, latex })), [
    { id: "log-product.state.product", latex: "\\ln(xy)" },
    { id: "log-product.state.sum", latex: "\\ln(x)+\\ln(y)" }
  ]);
  assert.deepEqual(family.factors.map((factor) => ({
    name: factor.name,
    semanticId: factor.semanticId,
    sourceOccurrenceId: factor.sourceOccurrenceId,
    targetOccurrenceId: factor.targetOccurrenceId
  })), [{
    name: "x",
    semanticId: "semantic.log-product.variable.x",
    sourceOccurrenceId: "source.product.x",
    targetOccurrenceId: "target.left.argument.x"
  }, {
    name: "y",
    semanticId: "semantic.log-product.variable.y",
    sourceOccurrenceId: "source.product.y",
    targetOccurrenceId: "target.right.argument.y"
  }]);

  for (const factor of family.factors) {
    const continuity: SelectorCorrespondenceRecord | undefined = records.find(
      ({ id }) =>
      id === `correspondence.log-product.${factor.name}-argument-continuity`
    );
    assert.equal(continuity?.relation, "role-change");
    assert.deepEqual(continuity?.sourceSelectorIds, [factor.sourceOccurrenceId]);
    assert.deepEqual(continuity?.targetSelectorIds, [factor.targetOccurrenceId]);
  }

  const applicationFission = records.find(({ id }) =>
    id === "correspondence.log-product.application-fission"
  );
  assert.equal(applicationFission?.relation, "fan-out");
  assert.deepEqual(applicationFission?.sourceSelectorIds, ["source.log"]);
  assert.deepEqual(applicationFission?.targetSelectorIds, [
    "target.left.log",
    "target.right.log"
  ]);
  assert.ok(family.factors.every((factor) =>
    factor.targetWrapper.application !== family.sourceWrapper.application
  ));
});

test("material-depth discovery preserves native endpoints and external clock", () => {
  assert.deepEqual(kpCanonicalLogProductNativeEndpoints.map((endpoint) => ({
    stateId: endpoint.stateId,
    latex: endpoint.annotated.rawLatex
  })), [
    { stateId: "log-product.state.product", latex: "\\ln(xy)" },
    { stateId: "log-product.state.sum", latex: "\\ln(x)+\\ln(y)" }
  ]);
  assert.equal(
    kpCanonicalCompiledLogProductSemanticMotion.clockCoupling,
    "external-shared-progress"
  );

  for (const progress of [0, 0.17, 0.5, 0.83, 1]) {
    const forward = sampleKpSemanticMotionChoreography({
      choreography: kpCanonicalCompiledLogProductSemanticMotion,
      progress,
      direction: "forward"
    });
    const rewind = sampleKpSemanticMotionChoreography({
      choreography: kpCanonicalCompiledLogProductSemanticMotion,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.equal(forward.semanticProgress, rewind.semanticProgress);
    assert.deepEqual(forward.tracks, rewind.tracks);
  }
});

test("material depth remains an opt-in presentation over the flat URL", () => {
  const base =
    "https://kp.invalid/?artifact=" +
    "animation.algebra.log-product.product-to-sum" +
    "&theme=dark&style=organic-subtle&view=animation-catalogue";
  const flat = readKpAnimationDevelopmentUrlState(`${base}&focus=flat`);
  const elevated = readKpAnimationDevelopmentUrlState(
    `${base}&focus=elevated`
  );
  const noDepth = readKpAnimationDevelopmentUrlState(
    `${base}&focus=no-depth`
  );

  assert.deepEqual(flat.display, {
    style: "organic-subtle",
    focus: "flat"
  });
  assert.equal(elevated.display.focus, "elevated");
  assert.equal(noDepth.display.focus, "no-depth");
  assert.equal(flat.artifactId, elevated.artifactId);
  assert.equal(flat.artifactId, noDepth.artifactId);
});

test("inline typography is local and inert until the exemplar selects it", () => {
  const css = readFileSync(new URL(
    "../src/editor/log-product-surface.css",
    import.meta.url
  ), "utf8");

  assert.match(
    css,
    /--kp-log-product-display-font-size:\s*clamp\(2\.25rem, 5vw, 4rem\)/u
  );
  assert.match(css, /--kp-log-product-inline-font-size:\s*1em/u);
  assert.match(
    css,
    /--kp-log-product-equation-font-size:\s*var\(--kp-log-product-display-font-size\)/u
  );
  assert.match(
    css,
    /\[data-kp-log-product-typography="inline"\][\s\S]*?--kp-log-product-equation-font-size:\s*var\(--kp-log-product-inline-font-size\)/u
  );
});

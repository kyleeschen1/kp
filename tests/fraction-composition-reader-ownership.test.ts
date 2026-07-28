import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  fractionCompositionDescriptor
} from "../src/reader/app/equation-lesson-descriptors/fraction-composition.ts";
import {
  compileKpReaderCanonicalTransitionPolicy
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  compileKpFractionCompositionEquationLesson
} from "../src/reader/compiler/fraction-composition-equation-lesson.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";
import {
  kpReaderRouteManifest
} from "../src/reader/compiler/reader-route-manifest.ts";

const markdown = await readFile(
  new URL("../content/lessons/fraction-composition.md", import.meta.url),
  "utf8"
);

test("fraction composition route owns every transition through one canonical scene", () => {
  const artifact = compileKpFractionCompositionEquationLesson(markdown);
  const animation = fractionCompositionDescriptor.createAnimation();
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: fractionCompositionDescriptor,
    animation
  });

  assert.equal(artifact.document.id, manifest.document.id);
  assert.deepEqual(policy?.transitionIds, manifest.steps.map(({ id }) => id));
  assert.equal(policy?.presentationIntent, "exclusive-native-scene");
  assert.equal(
    [...artifact.html.matchAll(/data-kp-reader-transition=/g)].length,
    manifest.steps.length
  );
  assert.equal(
    [...artifact.html.matchAll(/data-kp-reader-fold-node=/g)].length,
    5
  );
  assert.equal(
    [...artifact.html.matchAll(
      /data-kp-reader-accessible-equation-state=/g
    )].length,
    14
  );
  assert.match(
    artifact.html,
    /data-kp-reader-fold-node="evaluation\.fraction-composition\.subtract-and-simplify"/
  );
  assert.match(
    artifact.html,
    /role="math" aria-label="2 divided by 3 times the quantity x plus 6 equals 10"/
  );
  assert.equal(
    [...artifact.html.matchAll(
      /data-kp-reader-equation-material-layer="true"/g
    )].length,
    1
  );
  assert.equal(
    [...artifact.html.matchAll(
      /data-kp-reader-equation-measurement="true" aria-hidden="true"/g
    )].length,
    manifest.steps.length
  );
  assert.doesNotMatch(
    artifact.html,
    /whole-equation-fade|source-out-target-in|crossfade/
  );
});

test("fraction composition has one shared-runtime route and no compatibility route", () => {
  const routes = kpReaderRouteManifest.filter(
    ({ conformance }) => conformance.documentId === manifest.document.id
  );

  assert.equal(routes.length, 1);
  assert.equal(routes[0]?.route, manifest.route);
  assert.equal(routes[0]?.presentation.kind, "shared-certified-runtime");
  assert.equal(routes[0]?.conformance.rendererAdapterId, "renderer.equation-dom");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpAnimationCatalogueBootstrap
} from "../src/editor/animation-catalogue-bootstrap.ts";
import {
  KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM,
  KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM,
  KP_ANIMATION_CATALOGUE_VIEW,
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";

test("the empty query and explicit catalogue view resolve to the catalogue", () => {
  assert.deepEqual(readKpAnimationCatalogueRoute(""), {
    active: true,
    source: "default"
  });
  assert.deepEqual(
    readKpAnimationCatalogueRoute(`?view=${KP_ANIMATION_CATALOGUE_VIEW}`),
    { active: true, source: "explicit" }
  );
});

test("catalogue route round trips a bounded shareable playhead", () => {
  const search = writeKpAnimationCatalogueRoute("?utm_source=review", {
    artifactId: "animation.linear-solve.solve-x",
    playhead: 0.5534
  });
  const params = new URLSearchParams(search);

  assert.equal(params.get(KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM),
    "animation.linear-solve.solve-x");
  assert.equal(params.get(KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM), "0.55");
  assert.equal(params.get("utm_source"), "review");
  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: "animation.linear-solve.solve-x",
    playhead: 0.55
  });
});

test("zero and invalid catalogue playheads stay out of canonical state", () => {
  assert.equal(
    writeKpAnimationCatalogueRoute("?playhead=0.5", { playhead: 0 }),
    ""
  );
  assert.deepEqual(readKpAnimationCatalogueRoute("?playhead=continuous"), {
    active: true,
    source: "default"
  });
  assert.throws(
    () => writeKpAnimationCatalogueRoute("", { playhead: 1.1 }),
    /between zero and one/
  );
});

test("the catalogue route reads a nonblank selected artifact", () => {
  assert.deepEqual(
    readKpAnimationCatalogueRoute(
      `?${KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM}=%20animation.linear-solve.solve-x%20`
    ),
    {
      active: true,
      source: "default",
      artifactId: "animation.linear-solve.solve-x"
    }
  );
  assert.deepEqual(readKpAnimationCatalogueRoute("?artifact=%20%20"), {
    active: true,
    source: "default"
  });
});

test("preserved application views do not resolve to the catalogue", () => {
  for (const view of [
    "editor",
    "animation-workbench",
    "animation-library-host",
    "ftc-tutorial",
    "unknown"
  ]) {
    assert.deepEqual(readKpAnimationCatalogueRoute(`?view=${view}`), {
      active: false,
      source: "other-view"
    });
  }
});

test("the default route bootstrap is minimal and catalogue-owned", () => {
  const html = renderKpAnimationCatalogueBootstrap({
    status: "selected",
    animationId: "animation.linear-solve.solve-x",
    title: "Solve x + 3 = 7",
    packId: "algebra"
  });

  assert.match(html, /data-kp-animation-catalogue/);
  assert.match(html, /data-kp-animation-catalogue-state="selected"/);
  assert.match(html, /aria-busy="false"/);
  assert.match(
    html,
    /data-kp-animation-catalogue-stage-reservation="kp\.animation-catalogue\.stage-reservation\.v1"/
  );
  assert.doesNotMatch(
    html,
    /iframe|Animation Studio|Animation Workbench|representation|ontology/i
  );
});

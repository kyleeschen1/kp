import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpAnimationCatalogueBootstrap
} from "../src/editor/animation-catalogue-bootstrap.ts";
import {
  KP_ANIMATION_CATALOGUE_VIEW,
  readKpAnimationCatalogueRoute
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
  const html = renderKpAnimationCatalogueBootstrap();

  assert.match(html, /data-kp-animation-catalogue/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(
    html,
    /iframe|Animation Studio|Animation Workbench|representation|ontology/i
  );
});

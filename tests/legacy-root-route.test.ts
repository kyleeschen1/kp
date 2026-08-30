import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { generatedConceptCatalog } from "../content/public-api.ts";
import {
  kpLegacyRootRouteKinds,
  selectKpLegacyRootRoute
} from "../src/compatibility/legacy-root-route.ts";

test("legacy root classifies every supported route before its fallback", () => {
  assert.deepEqual(kpLegacyRootRouteKinds, [
    "scheme-factorial",
    "lisp-function-application",
    "economics-demand-shift",
    "kinetic-figure-log-product",
    "kinetic-figure-delta-epsilon",
    "kinetic-figure-supply-tax",
    "concept-room",
    "animation-coverage",
    "animation-catalogue",
    "internal-studio-fallback"
  ]);
  assert.equal(select("/tutorials/programming/scheme-factorial/"),
    "scheme-factorial");
  assert.equal(select("/tutorials/programming/lisp-function-application/"),
    "lisp-function-application");
  assert.equal(select("/tutorials/economics/demand-shift/"),
    "economics-demand-shift");
  assert.equal(select("/experiments/kinetic-figure/log-product/"),
    "kinetic-figure-log-product");
  assert.equal(select("/experiments/kinetic-figure/delta-epsilon/"),
    "kinetic-figure-delta-epsilon");
  assert.equal(select("/experiments/kinetic-figure/supply-tax/"),
    "kinetic-figure-supply-tax");
  assert.equal(select("/concepts/mathematics/linear-equations/unknown"),
    "concept-room");
  assert.equal(select("/", "?view=coverage"), "animation-coverage");
  assert.equal(select("/", "?catalogue=1"), "animation-catalogue");
  assert.equal(select("/"), "animation-catalogue");
  assert.equal(select("/", "?view=editor"), "internal-studio-fallback");
});

test("generated concept paths stay inside the lazy compatibility namespace", () => {
  for (const entry of generatedConceptCatalog) {
    assert.match(entry.canonicalPath, /^\/concepts\//u);
    for (const alias of entry.legacyAliases) assert.match(alias, /^\/concepts\//u);
  }
});

test("bootstrap owns routing and lifecycle but no concept composition", () => {
  const bootstrap = readFileSync("src/bootstrap.ts", "utf8");
  assert.match(bootstrap, /selectKpLegacyRootRoute/);
  assert.match(bootstrap, /registerPagehide/);
  assert.doesNotMatch(bootstrap, /content\/public-api|definePublicationEnvironment/);
  assert.doesNotMatch(bootstrap, /^import .*concept-room-shell/mu);
});

function select(pathname: string, search = "") {
  return selectKpLegacyRootRoute({ pathname, search });
}

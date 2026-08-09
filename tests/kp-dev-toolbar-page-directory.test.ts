import assert from "node:assert/strict";
import test from "node:test";

import {
  groupKpDevelopmentPages,
  kpDevelopmentPageGroupLabels,
  kpDevelopmentPages
} from "../src/dev-toolbar/development-page-directory.ts";
import {
  kpDevelopmentPageGroups
} from "../src/dev-toolbar/development-page-descriptor.ts";

test("the page directory contains the supported first-party development surfaces", () => {
  assert.equal(kpDevelopmentPages.length, 23);
  assert.deepEqual(kpDevelopmentPages.map(({ id }) => id), [
    "studio.catalogue",
    "studio.editor",
    "studio.dashboard",
    "studio.animation-library-host",
    "studio.animation-workbench",
    "tutorial.ftc",
    "tutorial.linear-equation-concept",
    "tutorial.economics-demand-shift",
    "tutorial.lisp-function-application",
    "reader.solve-x",
    "reader.generated-solve-x",
    "reader.solve-x-teacher-zero",
    "reader.solve-fractional-linear",
    "reader.divide-both-sides",
    "reader.split-merge-fractions",
    "reader.radical-succession",
    "reader.fraction-composition",
    "reader.foldable-distribution",
    "reader.fractional-transfer",
    "reader.distribution-area",
    "reader.quadratic-branching",
    "diagnostic.canonical-animation-review",
    "diagnostic.glyph-reconciliation"
  ]);
});

test("page IDs and canonical hrefs are unique and fixture-free", () => {
  assert.equal(
    new Set(kpDevelopmentPages.map(({ id }) => id)).size,
    kpDevelopmentPages.length
  );
  assert.equal(
    new Set(kpDevelopmentPages.map(({ href }) => href)).size,
    kpDevelopmentPages.length
  );
  for (const page of kpDevelopmentPages) {
    assert.ok(page.href.startsWith("/"));
    assert.doesNotMatch(page.href, /(?:tests|fixtures|tmp\/codex)/u);
  }
});

test("all canonical groups are labeled, ordered, and non-empty", () => {
  const grouped = groupKpDevelopmentPages();
  assert.deepEqual([...grouped.keys()], kpDevelopmentPageGroups);
  assert.deepEqual(Object.keys(kpDevelopmentPageGroupLabels), [
    "studio",
    "tutorials",
    "readers",
    "diagnostics"
  ]);
  for (const pages of grouped.values()) {
    assert.ok(pages.length > 0);
    assert.ok(Object.isFrozen(pages));
  }
});

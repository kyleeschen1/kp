import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.equal(kpDevelopmentPages.length, 25);
  assert.deepEqual(kpDevelopmentPages.map(({ id }) => id), [
    "studio.catalogue",
    "studio.editor",
    "studio.dashboard",
    "studio.animation-library-host",
    "studio.animation-workbench",
    "tutorial.ftc",
    "tutorial.linear-equation-concept",
    "tutorial.economics-demand-shift",
    "tutorial.algebra-fraction-composition",
    "tutorial.lisp-function-application",
    "tutorial.scheme-factorial",
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

test("the durable inspection ledger covers the executable directory", () => {
  const closeout = readFileSync(
    "docs/project/reviews/2026-08-09-kp-development-page-directory-closeout.md",
    "utf8"
  );

  for (const page of kpDevelopmentPages) {
    assert.match(
      closeout,
      new RegExp("\\| `" + escapeRegExp(page.id) + "` \\|")
    );
    assert.match(
      closeout,
      new RegExp(`http://localhost:5173${escapeRegExp(page.href)}[)]`)
    );
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

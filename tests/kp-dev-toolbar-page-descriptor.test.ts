import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpDevelopmentPage,
  isKpDevelopmentPageCurrent
} from "../src/dev-toolbar/development-page-descriptor.ts";

test("development page descriptors retain browser-safe canonical identity", () => {
  const page = defineKpDevelopmentPage({
    id: "tutorial.economics",
    label: " Economics ",
    group: "tutorials",
    href: "/tutorials/economics/demand-shift/?view=reader"
  });

  assert.deepEqual(page, {
    id: "tutorial.economics",
    label: "Economics",
    group: "tutorials",
    href: "/tutorials/economics/demand-shift/?view=reader"
  });
  assert.ok(Object.isFrozen(page));
});

test("page matching requires canonical query identity but permits incidental state", () => {
  const editor = defineKpDevelopmentPage({
    id: "studio.editor",
    label: "Editor",
    group: "studio",
    href: "/?view=editor"
  });

  assert.equal(isKpDevelopmentPageCurrent(editor, {
    pathname: "/",
    search: "?view=editor&animation=solve-x"
  }), true);
  assert.equal(isKpDevelopmentPageCurrent(editor, {
    pathname: "/",
    search: "?view=animation-workbench"
  }), false);
});

test("an absent query key distinguishes a default page from query-backed views", () => {
  const catalogue = defineKpDevelopmentPage({
    id: "studio.catalogue",
    label: "Animation catalogue",
    group: "studio",
    href: "/",
    absentQuery: ["view"]
  });

  assert.equal(isKpDevelopmentPageCurrent(catalogue, {
    pathname: "/",
    search: "?artifact=animation.example"
  }), true);
  assert.equal(isKpDevelopmentPageCurrent(catalogue, {
    pathname: "/",
    search: "?view=editor"
  }), false);
});

test("pathname matching tolerates a missing trailing slash", () => {
  const page = defineKpDevelopmentPage({
    id: "reader.solve-x",
    label: "Solve x",
    group: "readers",
    href: "/reader/solve-x/"
  });

  assert.equal(isKpDevelopmentPageCurrent(page, {
    pathname: "/reader/solve-x",
    search: "?kpProgress=500"
  }), true);
});

test("descriptor validation rejects unsafe or ambiguous identity", () => {
  assert.throws(() => defineKpDevelopmentPage({
    id: "Bad ID",
    label: "Bad",
    group: "studio",
    href: "/"
  }), /Invalid development page ID/u);
  assert.throws(() => defineKpDevelopmentPage({
    id: "studio.external",
    label: "External",
    group: "studio",
    href: "https://example.com"
  }), /root-relative/u);
  assert.throws(() => defineKpDevelopmentPage({
    id: "studio.conflict",
    label: "Conflict",
    group: "studio",
    href: "/?view=editor",
    absentQuery: ["view"]
  }), /invalid absent query/u);
});

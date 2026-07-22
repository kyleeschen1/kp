import assert from "node:assert/strict";
import test from "node:test";

import { compileKpReaderPageShell } from "../src/reader/compiler/reader-page-shell.ts";

test("reader page shell owns shared chrome without owning renderer content", () => {
  const html = compileKpReaderPageShell({
    title: "A < B",
    description: 'A "safe" reader',
    stylesheetHref: "/reader.css",
    bodyAttributes: [
      { name: "data-kp-reader", value: "test" },
      { name: "data-kp-version", value: "1" }
    ],
    modeLink: { href: "/reader/other/?a=1&b=2", label: "Other mode" },
    shareLink: { href: "#moment", label: "Link this moment", dataAttribute: "data-kp-share" },
    tocHtml: "<nav>Contents</nav>",
    articleHtml: "<article>Searchable prose</article>",
    afterMainHtml: ["<template>Renderer stage</template>"],
    hydration: { dataAttribute: "data-kp-hydration", json: '{"version":1}' },
    entryScriptSrc: "/entry.ts"
  });

  assert.match(html, /<title>A &lt; B<\/title>/);
  assert.match(html, /href="\/reader\/other\/\?a=1&amp;b=2"/);
  assert.match(html, /<main class="kp-reader-layout">\n<nav>Contents<\/nav>\n<article>Searchable prose<\/article>\n<\/main>/);
  assert.match(html, /<template>Renderer stage<\/template>\n<script type="application\/json" data-kp-hydration>/);
});

test("reader page shell rejects dynamic attribute-name injection", () => {
  assert.throws(() => compileKpReaderPageShell({
    title: "Test",
    description: "Test",
    stylesheetHref: "/reader.css",
    bodyAttributes: [{ name: 'data-safe onclick', value: "bad" }],
    modeLink: { href: "/", label: "Mode" },
    shareLink: { href: "#", label: "Share", dataAttribute: "data-share" },
    tocHtml: "",
    articleHtml: "",
    hydration: { dataAttribute: "data-hydration", json: "{}" },
    entryScriptSrc: "/entry.ts"
  }), /Invalid reader HTML attribute name/);
});

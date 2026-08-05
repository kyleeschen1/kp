import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const directory = new URL(
  "../src/tutorial/economics-demand-shift/",
  import.meta.url
);

const ownedStylesheets = [
  "economics-demand-shift-theme.css",
  "economics-demand-shift-publication.css",
  "economics-demand-shift-controls.css",
  "economics-demand-shift-graph.css",
  "economics-demand-shift-publication-responsive.css",
  "economics-demand-shift-inline-sticky.css",
  "economics-demand-shift-two-column.css",
  "economics-demand-shift-layout-responsive.css"
] as const;

function read(name: string): string {
  return readFileSync(new URL(name, directory), "utf8");
}

test("economics stylesheet entry preserves one explicit ownership cascade", () => {
  const entry = read("economics-demand-shift-tutorial.css");
  assert.equal(entry.includes("{"), false);
  assert.deepEqual(
    [...entry.matchAll(/@import "([^"]+)";/g)].map((match) => match[1]),
    [
      "../kp-tutorial-lesson-shell.css",
      ...ownedStylesheets.map((name) => `./${name}`)
    ]
  );
  for (const name of ownedStylesheets) {
    assert.match(read(name), /^\/\* [^\n]+ \*\//);
  }
});

test("economics style owners retain disjoint anchor responsibilities", () => {
  const theme = read("economics-demand-shift-theme.css");
  const publication = read("economics-demand-shift-publication.css");
  const controls = read("economics-demand-shift-controls.css");
  const graph = read("economics-demand-shift-graph.css");
  const responsive = read("economics-demand-shift-publication-responsive.css");
  const inline = read("economics-demand-shift-inline-sticky.css");
  const twoColumn = read("economics-demand-shift-two-column.css");
  const layoutFallbacks = read("economics-demand-shift-layout-responsive.css");

  assert.match(theme, /:root \{/);
  assert.doesNotMatch(theme, /__layout \{/);
  assert.match(publication, /__layout \{/);
  assert.doesNotMatch(publication, /editor-graph-stage/);
  assert.match(controls, /__bottom-controls \{/);
  assert.doesNotMatch(controls, /editor-graph-stage/);
  assert.match(graph, /__stage \{/);
  assert.match(graph, /editor-graph-stage/);
  assert.match(responsive, /@media \(max-width: 980px\)/);
  assert.doesNotMatch(responsive, /--inline-sticky/);
  assert.match(inline, /--inline-sticky/);
  assert.doesNotMatch(inline, /--two-column-scroll/);
  assert.match(twoColumn, /--two-column-scroll/);
  assert.match(layoutFallbacks, /prefers-reduced-motion/);
  assert.match(layoutFallbacks, /prefers-contrast/);
});

test("economics layout owners do not restate settled passage paint", () => {
  const inline = read("economics-demand-shift-inline-sticky.css");
  const twoColumn = read("economics-demand-shift-two-column.css");
  const layoutFallbacks = read("economics-demand-shift-layout-responsive.css");

  assert.doesNotMatch(
    inline,
    /\[data-kp-inline-sticky-cue\]\.kp-economics-tutorial__passage--active/
  );
  assert.doesNotMatch(
    twoColumn,
    /\[data-kp-two-column-scroll-paragraph\]\.kp-economics-tutorial__passage--active/
  );
  assert.doesNotMatch(
    twoColumn,
    /:not\(\[data-kp-two-column-scroll-paragraph\]\)\.kp-economics-tutorial__passage--active/
  );
  assert.equal(
    [...`${inline}\n${layoutFallbacks}`.matchAll(/\n\s*opacity: 1;/g)].length,
    1,
    "Only the base inline cue owner should force full prose opacity."
  );
});

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
      "../kp-tutorial-motion-bridge.css",
      ...ownedStylesheets.map((name) => `./${name}`)
    ]
  );
  for (const name of ownedStylesheets) {
    assert.match(read(name), /^\/\* [^\n]+ \*\//);
  }
});

test("motion bridge tokens and visual rail preserve progressive document flow", () => {
  const css = readFileSync(new URL(
    "../src/tutorial/kp-tutorial-motion-bridge.css",
    import.meta.url
  ), "utf8");

  assert.match(css, /--kp-tutorial-motion-bridge-distance-short-ratio: 0\.32;/);
  assert.match(css, /--kp-tutorial-motion-bridge-distance-standard-ratio: 0\.5;/);
  assert.match(css, /--kp-tutorial-motion-bridge-distance-extended-ratio: 0\.8;/);
  assert.match(css, /--kp-tutorial-ordinary-beat-approach-ratio: 0\.14;/);
  assert.match(css, /--kp-tutorial-motion-bridge-rail-width: 1px;/);
  assert.match(css, /block-size: var\(--kp-tutorial-motion-bridge-distance-px\);/);
  assert.match(css, /transform: scaleY\(var\(--kp-tutorial-motion-bridge-progress\)\);/);
  assert.match(css, /\.kp-tutorial-motion-bridge__rail \{\s*display: none;/);
  assert.doesNotMatch(css, /\b(?:vh|svh|dvh)\b|border-radius/);
});

test("economics learner entry loads one route-local stylesheet facade", () => {
  const entry = readFileSync(new URL(
    "economics-demand-shift-tutorial-entry.ts",
    directory
  ), "utf8");
  const cssImports = [...entry.matchAll(/import\s+"([^\"]+\.css)";/g)]
    .map((match) => match[1]!)
    .filter((path) => path.startsWith("./"));

  assert.deepEqual(cssImports, ["./economics-demand-shift-tutorial.css"]);
  assert.doesNotMatch(entry, /katex-adapter|from\s+["']katex/);
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

test("dark graph axes share the divider token without changing light axes", () => {
  const theme = read("economics-demand-shift-theme.css");

  assert.match(theme, /--kp-lesson-theme-graph-axis: #111319;/);
  assert.match(
    theme,
    /:root\[data-kp-lesson-theme="dark"\][\s\S]*?--kp-lesson-theme-stage-divider: #626775;[\s\S]*?--kp-lesson-theme-graph-axis: var\(--kp-lesson-theme-stage-divider\);/
  );
});

test("two-column progressive layout derives prose and graph from one latch", () => {
  const twoColumn = read("economics-demand-shift-two-column.css");

  assert.match(twoColumn, /--kp-two-column-stage-center-vh: 50;/);
  assert.match(twoColumn, /--kp-tutorial-persistent-top-inset: 0px;/);
  assert.match(twoColumn, /--kp-tutorial-persistent-bottom-inset: 0px;/);
  assert.match(
    twoColumn,
    /--kp-two-column-stage-top:\s*calc\(\s*var\(--kp-two-column-stage-center\)\s*-\s*var\(--kp-two-column-stage-block-size\) \/ 2\s*\)/
  );
  assert.match(
    twoColumn,
    /--kp-two-column-entry-offset:\s*calc\(var\(--kp-two-column-focus-top\) - var\(--kp-two-column-stage-top\)\)/
  );
  assert.match(
    twoColumn,
    /--kp-two-column-horizontal-boundary-offset:\s*calc\(var\(--kp-two-column-stage-block-size\) \+ var\(--kp-two-column-boundary-gap\)\)/
  );
  assert.match(
    twoColumn,
    /--kp-two-column-terminal-min-block:\s*calc\(\s*var\(--kp-two-column-horizontal-boundary-offset\)/
  );
  assert.match(
    twoColumn,
    /\[data-kp-inline-sticky-cue\]:first-child \{\s*margin-top: 0;/
  );
  assert.doesNotMatch(twoColumn, /--kp-two-column-stage-top-vh/);
});

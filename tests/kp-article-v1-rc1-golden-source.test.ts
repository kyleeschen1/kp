import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
  "utf8"
);

test("golden RC1 source exercises the complete bounded grammar", () => {
  assert.match(source, /^---\nkp:\n  schema: kp\.article\.v1-rc1\n/m);
  assert.match(source, /id: lesson\.economics\.demand-shift/);
  assert.match(source, /demandShift: vignette\.economics\.demand-shift@1/);

  assert.deepEqual(
    [...source.matchAll(/^:::(kp-[a-z]+)\{/gmu)].map((match) => match[1]),
    ["kp-stage", "kp-focus", "kp-passage", "kp-motion"]
  );
  assert.match(source, /^::after$/mu);
});

test("golden RC1 source keeps ordinary prose, math, and links portable", () => {
  assert.match(source, /^### When demand changes$/mu);
  assert.match(source, /^- A curve collects possible price–quantity combinations\.$/mu);
  assert.match(source, /\$Q\$/u);
  assert.match(source, /^\$\$$/mu);
  assert.match(source, /\[price axis\]\(kp-ref:market\/price-axis\)/u);
  assert.match(source, /\[demand schedule\]\(kp-ref:market\/demand\)/u);
});

test("golden RC1 source contains no executable or layout-specific escape hatch", () => {
  assert.doesNotMatch(source, /<!--\s*kp:/u);
  assert.doesNotMatch(source, /```\s*(?:kp|svelte|js|javascript|ts|typescript)\b/iu);
  assert.doesNotMatch(source, /<(?:script|svelte):?/iu);

  const directiveHeaders = [...source.matchAll(/^:::kp-[^{]+\{([^}]*)\}$/gmu)]
    .map((match) => match[1] ?? "")
    .join("\n");
  assert.doesNotMatch(
    directiveHeaders,
    /\b(?:layout|sticky|column|row|slide|scroll|viewport|vh)\b/iu
  );
});

test("motion prose remains searchable on both sides of the transition", () => {
  const motion = source.match(
    /^:::kp-motion\{[^}]+\}\n(?<before>[\s\S]+?)\n::after\n(?<after>[\s\S]+?)\n:::\s*$/mu
  );
  assert.ok(motion?.groups);
  assert.match(motion.groups["before"] ?? "", /At the same price/u);
  assert.match(motion.groups["after"] ?? "", /new intersection/u);
});

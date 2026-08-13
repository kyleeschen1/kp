import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewRoot = "docs/project/reviews";

test("canonical construction guide closes every released authority boundary", async () => {
  const guide = await readFile(
    `${reviewRoot}/2026-07-26-canonical-animation-construction-guide.md`,
    "utf8"
  );
  for (const section of [
    "## Authority map",
    "## Construction workflow",
    "## Governed model boundary",
    "## Renderer and product rules",
    "## Composition",
    "## Output parity",
    "## Review entrypoints",
    "## Promotion checklist",
    "## Safety utilities",
    "## Required release gates"
  ]) {
    assert.match(guide, new RegExp(escapeRegExp(section)));
  }
  assert.match(guide, /canonical-animation-public-api\.ts/);
  assert.match(guide, /canonical-animation-review\.html/);
  assert.match(
    guide,
    /A model may not provide:[\s\S]*DOM[\s\S]*keyframes[\s\S]*renderer sessions/
  );
});

test("current model guidance selects the released construction seam", async () => {
  const [entrypoint, assetSpec, vocabulary] = await Promise.all([
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8"),
    readFile(
      "docs/project/authoring/kp-animation-asset-llm-authoring-spec.md",
      "utf8"
    ),
    readFile("docs/project/principles/system-vocabulary.md", "utf8")
  ]);
  for (const source of [entrypoint, assetSpec, vocabulary]) {
    assert.match(source, /canonical-animation-public-api\.ts/);
    assert.match(source, /KpGovernedCanonicalConstructionRequest/);
  }
  assert.match(entrypoint, /compileKpGovernedCanonicalConstruction/);
  assert.match(entrypoint, /planKpGovernedConstructionRepairs/);
  assert.match(entrypoint, /Minimal Successful Construction/);
  assert.match(
    entrypoint,
    /compileKpGovernedCanonicalConstruction\(\{[\s\S]*request,[\s\S]*authority: verifiedSource\.authority/
  );
  assert.match(
    entrypoint,
    /validator accepts[\s\S]*\{ request, authority \}/
  );
  assert.doesNotMatch(
    entrypoint,
    /validateKpGovernedCanonicalConstructionCompilation\(result\)/
  );
  assert.match(entrypoint, /sharing an asset id|equal asset id/i);
  assert.match(assetSpec, /compatibility and research\s+evidence/);
  assert.doesNotMatch(
    entrypoint,
    /Propose a new semantic animation \| `kp\.llm-animation-draft\.v2`/
  );
  assert.doesNotMatch(
    assetSpec,
    /New model-authored work should target `kp\.llm-animation-draft\.v2`/
  );
});

test("closeout keeps one product migration and an explicit compatibility ledger", async () => {
  const closeout = await readFile(
    `${reviewRoot}/2026-07-26-canonical-animation-construction-governed-round-trip-closeout.md`,
    "utf8"
  );
  assert.match(closeout, /Outcome: PASS/);
  assert.match(closeout, /one exclusively migrated product exemplar/);
  assert.match(closeout, /Reader material layer \| compatibility-only/);
  assert.match(closeout, /Existing non-glyph equation animations \| retained guidance and coverage/);
  assert.match(closeout, /No second public renderer, runtime, material layer, or construction artifact/);
  assert.match(closeout, /No successor implementation queue is seeded/);
});

test("next-step review recommends one radical exemplar without hiding inbox state", async () => {
  const review = await readFile(
    `${reviewRoot}/2026-07-26-canonical-animation-construction-next-step-review.md`,
    "utf8"
  );
  assert.match(review, /One radical-succession reader exemplar/);
  assert.match(review, /Do next/);
  assert.match(review, /15 new and one verified/);
  assert.match(review, /review-note\.5\.mruqn4cq/);
  assert.match(review, /review-note\.20\.mrzhxsef/);
  assert.match(review, /No note status or review cursor event was appended/);
  assert.match(review, /not an approved run contract/);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

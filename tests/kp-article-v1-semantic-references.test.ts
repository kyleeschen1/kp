import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { scanKpArticleMarkdownLinks } from "../src/article/kp-article-markdown-links.ts";
import { resolveKpArticleSemanticReferences } from "../src/article/kp-article-semantic-references.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";

test("golden semantic addresses resolve through the article-local stage alias", () => {
  const resolution = resolveKpArticleSemanticReferences(goldenSource());

  assert.equal(resolution.valid, true);
  assert.deepEqual(resolution.stageBindings.map(({ ownerId, stageId }) => ({ ownerId, stageId })), [
    { ownerId: "read-curves", stageId: "market" },
    { ownerId: "raise-demand", stageId: "market" }
  ]);
  assert.deepEqual(resolution.references.map(({ origin, address }) => ({ origin, address })), [
    { origin: "focus-target", address: "market/demand" },
    { origin: "focus-target", address: "market/supply" },
    { origin: "focus-context", address: "market/axes" },
    { origin: "motion-run", address: "market/shift-demand" },
    { origin: "inline-link", address: "market/price-axis" },
    { origin: "inline-link", address: "market/demand" }
  ]);
  assert.ok(resolution.references.every(({ timelineAuthority }) => timelineAuthority === "none"));
  assert.equal(
    resolution.references[0]!.fullId,
    "lesson.economics.demand-shift#market/demand"
  );
  assert.equal(resolution.references[0]!.staticFragment, "kp-ref:market/demand");
});

test("CommonMark link parsing excludes code and retains link labels and source spans", () => {
  const source = sourceFromBody([
    ":::kp-stage{#market use=shift}",
    ":::",
    "",
    "[Demand *now*](kp-ref:market/demand \"preview\") and `[inert](kp-ref:market/supply)`.",
    "",
    "```md",
    "[also inert](kp-ref:market/supply)",
    "```"
  ].join("\n"));
  const links = scanKpArticleMarkdownLinks(source);
  const resolution = resolveKpArticleSemanticReferences(source);

  assert.deepEqual(links.map(({ label, url }) => ({ label, url })), [
    { label: "Demand now", url: "kp-ref:market/demand" }
  ]);
  assert.equal(source.text.slice(
    links[0]!.destinationSpan.start.offset,
    links[0]!.destinationSpan.end.offset
  ), "kp-ref:market/demand");
  assert.equal(resolution.valid, true);
  assert.equal(resolution.references[0]!.label, "Demand now");
});

test("unknown and non-stage aliases fail closed", () => {
  const unknown = resolveKpArticleSemanticReferences(sourceFromBody([
    ":::kp-focus{#look stage=missing target=missing/demand}",
    "Look.",
    ":::"
  ].join("\n")));
  assert.deepEqual(unknown.diagnostics.map(({ code }) => code), ["semantic-stage-unknown"]);

  const wrongKind = resolveKpArticleSemanticReferences(sourceFromBody([
    ":::kp-passage{#prose}",
    "Text.",
    ":::",
    "",
    ":::kp-motion{#move stage=prose run=prose/change}",
    "Move.",
    ":::"
  ].join("\n")));
  assert.deepEqual(wrongKind.diagnostics.map(({ code }) => code), ["semantic-stage-kind"]);
});

test("semantic paths are typed and must stay within their bound stage", () => {
  const resolution = resolveKpArticleSemanticReferences(sourceFromBody([
    ":::kp-stage{#market use=shift}",
    ":::",
    "",
    ":::kp-focus{#look stage=market target=other/demand context=market/Bad_Path}",
    "Look.",
    ":::",
    "",
    "[Timeline query](kp-ref:market/demand?at=settled)",
    "[Unknown](kp-ref:missing/demand)"
  ].join("\n")));

  assert.deepEqual(resolution.diagnostics.map(({ code }) => code), [
    "semantic-stage-mismatch",
    "semantic-address-invalid",
    "semantic-address-invalid",
    "semantic-stage-unknown"
  ]);
  assert.equal(resolution.references.length, 0);
});

test("motion ranges resolve both checkpoints without giving prose links seek authority", () => {
  const resolution = resolveKpArticleSemanticReferences(sourceFromBody([
    ":::kp-stage{#market use=shift}",
    ":::",
    "",
    ":::kp-motion{#move stage=market range=market/initial..market/settled}",
    "Before [the result](kp-ref:market/settled).",
    "::after",
    "After.",
    ":::"
  ].join("\n")));

  assert.equal(resolution.valid, true);
  assert.deepEqual(resolution.references.map(({ origin, objectPath, timelineAuthority }) => ({
    origin,
    objectPath,
    timelineAuthority
  })), [
    { origin: "motion-range-from", objectPath: "initial", timelineAuthority: "none" },
    { origin: "motion-range-to", objectPath: "settled", timelineAuthority: "none" },
    { origin: "inline-link", objectPath: "settled", timelineAuthority: "none" }
  ]);
});

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function sourceFromBody(body: string) {
  return createKpArticleSource("semantic.md", [
    "---",
    "kp:",
    "  schema: kp.article.v1",
    "  id: lesson.economics.semantic",
    "  imports:",
    "    shift: vignette.economics.shift@1",
    "---",
    "",
    body,
    ""
  ].join("\n"));
}

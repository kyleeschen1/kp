import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  applyKpArticleTextEdits,
  indexKpArticleIdentities,
  KpArticleIdentityError,
  renameKpArticleIdentity,
  suggestKpArticleLocalId
} from "../src/article/kp-article-identity.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { resolveKpArticleSemanticReferences } from "../src/article/kp-article-semantic-references.ts";
import { validateKpArticleRc1 } from "../src/article/kp-article-validation.ts";

test("identities are explicit, document scoped, and source located", () => {
  const source = goldenSource();
  const identities = indexKpArticleIdentities(source);

  assert.deepEqual(identities.map(({ localId, fullId, directiveKind }) => ({
    localId,
    fullId,
    directiveKind
  })), [
    {
      localId: "market",
      fullId: "lesson.economics.demand-shift#market",
      directiveKind: "stage"
    },
    {
      localId: "read-curves",
      fullId: "lesson.economics.demand-shift#read-curves",
      directiveKind: "focus"
    },
    {
      localId: "predict-shift",
      fullId: "lesson.economics.demand-shift#predict-shift",
      directiveKind: "passage"
    },
    {
      localId: "raise-demand",
      fullId: "lesson.economics.demand-shift#raise-demand",
      directiveKind: "motion"
    }
  ]);
  assert.equal(source.text.slice(identities[0]!.span.start.offset, identities[0]!.span.end.offset), "#market");
});

test("slug suggestions are readable and collisions receive deterministic suffixes", () => {
  assert.equal(suggestKpArticleLocalId("Why demand shifts", []), "why-demand-shifts");
  assert.equal(
    suggestKpArticleLocalId("Why demand shifts", ["why-demand-shifts", "why-demand-shifts-2"]),
    "why-demand-shifts-3"
  );
  assert.equal(suggestKpArticleLocalId("Élan & price", []), "elan-and-price");
  assert.equal(suggestKpArticleLocalId("$ 3", []), "section-3");
  assert.equal(suggestKpArticleLocalId("---", []), "section");
});

test("duplicate directive IDs fail publication at the second declaration", () => {
  const source = sourceFromBody([
    ":::kp-stage{#market use=shift}",
    ":::",
    "",
    ":::kp-passage{#market}",
    "A collision.",
    ":::"
  ].join("\n"));
  const validation = validateKpArticleRc1(source);

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.diagnostics.map(({ code }) => code), ["directive-id-collision"]);
  assert.equal(validation.diagnostics[0]!.span.start.line, 12);
});

test("stage rename returns one atomic edit set for declarations and references", () => {
  const source = createKpArticleSource("rename.md", goldenSource().text.replace(
    "follow the [demand schedule](kp-ref:market/demand) as it moves.",
    [
      "follow the [demand schedule](kp-ref:market/demand) as it moves.",
      "and [the stage](#market).",
      "`[inert](kp-ref:market/demand)`",
      "```md",
      "[also inert](kp-ref:market/demand)",
      "```"
    ].join("\n")
  ));
  const rename = renameKpArticleIdentity(source, "market", "market-model");
  const renamedText = applyKpArticleTextEdits(source, rename.edits);

  assert.equal(rename.documentId, "lesson.economics.demand-shift");
  assert.equal(rename.edits.length, 10);
  assert.match(renamedText, /#market-model use=demandShift/u);
  assert.equal((renamedText.match(/stage=market-model/gu) ?? []).length, 2);
  assert.match(renamedText, /target="market-model\/demand market-model\/supply"/u);
  assert.match(renamedText, /run=market-model\/shift-demand/u);
  assert.match(renamedText, /kp-ref:market-model\/demand/u);
  assert.match(renamedText, /\]\(#market-model\)/u);
  assert.match(renamedText, /`\[inert\]\(kp-ref:market\/demand\)`/u);
  assert.match(renamedText, /\[also inert\]\(kp-ref:market\/demand\)/u);
  const renamedSource = createKpArticleSource("renamed.md", renamedText);
  assert.equal(validateKpArticleRc1(renamedSource).valid, true);
  assert.equal(resolveKpArticleSemanticReferences(renamedSource).valid, true);
});

test("non-stage identities rename fragment links without changing prose-derived suggestions", () => {
  const source = createKpArticleSource(
    "fragment.md",
    goldenSource().text.replace(
      "Read the [price axis](kp-ref:market/price-axis) and compare the two schedules.",
      "See [the prediction](#predict-shift). Read the [price axis](kp-ref:market/price-axis) and compare the two schedules."
    )
  );
  const rename = renameKpArticleIdentity(source, "predict-shift", "predict-demand");
  const renamedText = applyKpArticleTextEdits(source, rename.edits);

  assert.equal(rename.edits.length, 2);
  assert.match(renamedText, /#predict-demand/u);
  assert.match(renamedText, /\]\(#predict-demand\)/u);
});

test("invalid, missing, and colliding renames fail before producing edits", () => {
  const source = goldenSource();
  assertIdentityError(() => renameKpArticleIdentity(source, "missing", "replacement"), "identity-unknown");
  assertIdentityError(() => renameKpArticleIdentity(source, "market", "Not Valid"), "identity-invalid");
  assertIdentityError(() => renameKpArticleIdentity(source, "market", "read-curves"), "identity-collision");
});

function assertIdentityError(action: () => unknown, code: KpArticleIdentityError["code"]): void {
  assert.throws(action, (error: unknown) => (
    error instanceof KpArticleIdentityError && error.code === code
  ));
}

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function sourceFromBody(body: string) {
  return createKpArticleSource("identity.md", [
    "---",
    "kp:",
    "  schema: kp.article.v1-rc1",
    "  id: lesson.economics.identity",
    "  imports:",
    "    shift: vignette.economics.shift@1",
    "---",
    "",
    body,
    ""
  ].join("\n"));
}

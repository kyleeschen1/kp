import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  renderKpFractionCompositionStaticPublication
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-static-publication.ts";

const source = readFileSync(
  "content/lessons/algebra-fraction-composition.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/algebra-fraction-composition.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;
const publication = renderKpFractionCompositionStaticPublication(
  compileKpFractionCompositionArticle({ text: source, lock })
);

test("algebra route declares a static-first publication shell", () => {
  const route = readFileSync(
    "tutorials/algebra/fraction-composition/index.html",
    "utf8"
  );
  assert.match(route, /kp:algebra-fraction-composition-static-publication/u);
  assert.match(route, /katex\.min\.css/u);
  assert.doesNotMatch(route, /<noscript/u);
});

test("static algebra publication contains all prose, links, and native math", () => {
  assert.match(publication, /data-kp-algebra-fraction-composition-publication/u);
  assert.match(publication, /What does the fraction multiply\?/u);
  assert.match(publication, /Read the grouped expression first/u);
  assert.match(publication, /Check the result in the original equation/u);
  assert.match(publication, /href="#kp-ref:solve\/factor"/u);
  assert.match(publication, /class="katex-mathml"/u);
  assert.equal(
    (publication.match(/data-kp-reader-exemplar-template/gu) ?? []).length,
    1
  );
  assert.doesNotMatch(publication, /<script|kp-static\//u);
});

test("six static figures resolve through canonical endpoint truth", () => {
  assert.equal(
    (publication.match(/data-kp-algebra-static-checkpoint=/gu) ?? []).length,
    6
  );
  assert.match(publication, /data-kp-algebra-static-checkpoint="factored"/u);
  assert.match(publication, /data-kp-algebra-static-checkpoint="solved"/u);
  assert.match(publication, /<svg[^>]+role="img"/u);
  assert.match(publication, /<foreignObject/u);
  assert.match(publication, /x equals 9/u);
});

test("attention-stage discovery is build-rendered over the same publication", () => {
  assert.equal(
    (publication.match(/data-kp-algebra-attention-beat=/gu) ?? []).length,
    7
  );
  assert.match(publication, /data-kp-algebra-attention-stage hidden/u);
  assert.match(publication, /data-kp-algebra-attention-visual/u);
  assert.match(publication, /data-kp-algebra-attention-player/u);
  assert.match(publication, /data-kp-algebra-attention-action="toggle"/u);
  assert.match(publication, /data-kp-algebra-attention-scrubber/u);
  assert.equal(
    (publication.match(/--kp-algebra-attention-marker:/gu) ?? []).length,
    6
  );
  assert.doesNotMatch(publication, /data-kp-algebra-attention-status/u);
  assert.match(publication, /data-kp-algebra-attention-range="distribute-and-normalize"/u);
  assert.match(publication, /class="katex-mathml"/u);
  assert.doesNotMatch(
    publication,
    /<\/div>,<div class="kp-algebra-attention-stage__passage"/u
  );
});

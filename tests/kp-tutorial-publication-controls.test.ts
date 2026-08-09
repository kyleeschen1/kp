import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { compileKpEconomicsDemandShiftArticlePublication } from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import { kpEconomicsMotionBlocks } from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";
import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";
import { kpLispLessonMotionBlocks } from "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";
import { compileKpTutorialPublicationControls } from "../src/tutorial/kp-tutorial-publication-controls.ts";

const economicsUrl = new URL("../content/lessons/economics-demand-shift.kp.md", import.meta.url);
const economicsLockUrl = new URL("../content/lessons/economics-demand-shift.kp.lock.json", import.meta.url);
const lispUrl = new URL("../content/lessons/programming-lisp-function-application.md", import.meta.url);

test("both lesson callers obey one shared publication contract", async () => {
  const [articleText, importLockText] = await Promise.all([
    readFile(economicsUrl, "utf8"),
    readFile(economicsLockUrl, "utf8")
  ]);
  const callers = [
    {
      publication: compileKpEconomicsDemandShiftArticlePublication({
        articleText,
        importLock: JSON.parse(importLockText) as KpArticleImportLock
      }),
      ids: kpEconomicsMotionBlocks.map(({ id }) => id)
    },
    {
      publication: compileKpLispFunctionApplicationPublication(
        await readFile(lispUrl, "utf8")
      ),
      ids: kpLispLessonMotionBlocks.map(({ id }) => id)
    }
  ];
  for (const { publication, ids } of callers) {
    assert.equal(publication.document.document.kind, "lesson-document");
    assert.equal(Object.isFrozen(publication.document.document), true);
    assert.equal(
      publication.document.document.blocks.every((block) =>
        block.kind !== "heading" || block.level === 3
      ),
      true
    );
    assert.deepEqual(
      publication.document.document.blocks.flatMap((block) =>
        block.kind === "animation-story" ? [block.id] : []
      ),
      ids
    );
    assert.match(publication.tocHtml, /^<kp-tutorial-toc/);
    assert.match(
      publication.tocHtml,
      /<details[^>]+data-kp-tutorial-toc-disclosure[^>]+open>/
    );
    assert.match(publication.tocHtml, /<summary[^>]*>In this lesson<\/summary>/);
    assert.equal(
      (publication.tocHtml.match(/data-kp-tutorial-destination-kind="checkpoint"/g) ?? []).length,
      0
    );
    assert.equal(
      (publication.tocHtml.match(/data-kp-tutorial-destination-kind="block"/g) ?? []).length,
      ids.length
    );
    assert.deepEqual(Object.keys(publication.motionScrubBarHtml), ids);
    for (const html of Object.values(publication.motionScrubBarHtml)) {
      assert.match(html, /data-kp-tutorial-scrub-enhancement="pending"/);
      assert.match(html, /data-kp-tutorial-scrub-static-boundary/);
      assert.match(html, /#kp-checkpoint-/);
      assert.match(html, /<a[^>]+data-action="rewind"/);
      assert.match(html, /<input[^>]+disabled/);
    }
  }
});

test("publication controls reject label drift from document motion truth", async () => {
  const publication = compileKpLispFunctionApplicationPublication(
    await readFile(lispUrl, "utf8")
  );
  assert.throws(() => compileKpTutorialPublicationControls({
    publication: publication.document,
    path: "/tutorials/programming/lisp-function-application/",
    motionBlockLabels: { structure: "Structure" }
  }), /label for motion block application/);
});

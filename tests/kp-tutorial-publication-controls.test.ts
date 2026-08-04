import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileKpEconomicsDemandShiftPublication } from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import { kpEconomicsMotionBlocks } from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";
import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";
import { kpLispLessonMotionBlocks } from "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";
import { compileKpTutorialPublicationControls } from "../src/tutorial/kp-tutorial-publication-controls.ts";

const economicsUrl = new URL("../content/lessons/economics-demand-shift.md", import.meta.url);
const lispUrl = new URL("../content/lessons/programming-lisp-function-application.md", import.meta.url);

test("both lesson callers obey one shared publication contract", async () => {
  const callers = [
    {
      publication: compileKpEconomicsDemandShiftPublication(
        await readFile(economicsUrl, "utf8")
      ),
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
    motionBlockLabels: { "bind-and-reconstruct": "Bind" }
  }), /label for motion block evaluate-and-gather/);
});

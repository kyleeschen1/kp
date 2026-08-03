import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";

const lessonUrl = new URL(
  "../content/lessons/programming-lisp-function-application.md",
  import.meta.url
);

test("local compiler preserves ordered prose and motion blocks", async () => {
  const publication = compileKpLispFunctionApplicationPublication(
    await readFile(lessonUrl, "utf8")
  );
  assert.equal(publication.lesson.sections.length, 4);
  assert.deepEqual(
    publication.lesson.sections.flatMap(({ blocks }) =>
      blocks.filter(({ kind }) => kind === "motion").map(({ id }) => id)
    ),
    ["bind-and-reconstruct", "evaluate-and-gather"]
  );
  const firstHtml = publication.lesson.sections[0]?.blocks[0]?.kind === "passage"
    ? publication.lesson.sections[0].blocks[0].paragraphs[0]?.html
    : undefined;
  assert.match(firstHtml ?? "", /<code class="kp-lisp-tutorial__inline-code">\(\(lambda/);
});

test("publication emits useful static TOC and scrubber geometry", async () => {
  const publication = compileKpLispFunctionApplicationPublication(
    await readFile(lessonUrl, "utf8")
  );
  assert.match(publication.tocHtml, /data-kp-tutorial-toc-enhancement="pending"/);
  assert.match(publication.tocHtml, /\/tutorials\/programming\/lisp-function-application\//);
  assert.match(publication.tocHtml, /data-kp-tutorial-destination-kind="checkpoint"/);
  for (const html of Object.values(publication.motionScrubBarHtml)) {
    assert.match(html, /data-kp-tutorial-scrub-static-boundary/);
    assert.match(html, /controls-disabled="true"/);
    assert.match(html, /<a[^>]+data-action="next"/);
    assert.doesNotMatch(html, /what to watch/i);
  }
});

test("compiler rejects missing, unintroduced, and unsafe motion content", async () => {
  const incomplete = `# T\nKicker: K\nAssumption: A\n### S\n<!-- kp:section s -->\n<!-- kp:passage p -->\nText.`;
  assert.throws(
    () => compileKpLispFunctionApplicationPublication(incomplete),
    /every local motion block/
  );
  assert.throws(
    () => compileKpLispFunctionApplicationPublication(
      incomplete.replace("Text.", "<script>alert(1)</script>")
    ),
    /Unsupported Lisp lesson HTML/
  );
  const source = await readFile(lessonUrl, "utf8");
  const unintroduced = source
    .replace("<!-- kp:motion bind-and-reconstruct -->", "")
    .replace(
      "<!-- kp:passage binding-before -->",
      "<!-- kp:motion bind-and-reconstruct -->\n\n<!-- kp:passage binding-before -->"
    );
  assert.throws(
    () => compileKpLispFunctionApplicationPublication(unintroduced),
    /follow an introducing passage/
  );
});

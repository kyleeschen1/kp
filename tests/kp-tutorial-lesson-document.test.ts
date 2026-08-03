import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateKpLessonDocument } from "../src/reader/document/lesson-document.ts";
import { compileKpEconomicsDemandShiftPublication } from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";

const economicsUrl = new URL(
  "../content/lessons/economics-demand-shift.md",
  import.meta.url
);
const lispUrl = new URL(
  "../content/lessons/programming-lisp-function-application.md",
  import.meta.url
);

test("economics adapts to the existing KpLessonDocument authority", async () => {
  const publication = compileKpEconomicsDemandShiftPublication(
    await readFile(economicsUrl, "utf8")
  );
  const { document, metadata } = publication.document;
  assert.deepEqual(validateKpLessonDocument(document), []);
  assert.equal(document.kind, "lesson-document");
  assert.equal(document.blocks.filter(({ kind }) => kind === "heading").length, 4);
  assert.deepEqual(
    document.blocks.filter(({ kind }) => kind === "animation-story").map(({ id }) => id),
    ["demand-shift", "supply-movement"]
  );
  assert.match(metadata.assumption, /equilibrium/i);
  const story = document.blocks.find(({ kind }) => kind === "animation-story");
  assert.deepEqual(
    story?.kind === "animation-story"
      ? story.beats.map(({ checkpoint }) => checkpoint.progressPermille)
      : [],
    [0, 720, 1000]
  );
});

test("Lisp adapts to the same document without losing native source syntax", async () => {
  const publication = compileKpLispFunctionApplicationPublication(
    await readFile(lispUrl, "utf8")
  );
  const { document } = publication.document;
  assert.deepEqual(validateKpLessonDocument(document), []);
  assert.equal(document.blocks.filter(({ kind }) => kind === "heading").length, 4);
  assert.deepEqual(
    document.blocks.filter(({ kind }) => kind === "animation-story").map(({ id }) => id),
    ["bind-and-reconstruct", "evaluate-and-gather"]
  );
  const text = document.blocks
    .filter((block) => block.kind === "paragraph")
    .flatMap(({ content }) => content)
    .flatMap((inline) => inline.kind === "text" ? [inline.value] : [])
    .join(" ");
  assert.match(text, /`\(\(lambda \(x\) \(\+ x 1\)\) 4\)`/);
});

test("both adapters preserve h3 headings and typed animation assets", async () => {
  const publications = await Promise.all([
    readFile(economicsUrl, "utf8").then(compileKpEconomicsDemandShiftPublication),
    readFile(lispUrl, "utf8").then(compileKpLispFunctionApplicationPublication)
  ]);
  for (const publication of publications) {
    const blocks = publication.document.document.blocks;
    assert.ok(blocks.filter(({ kind }) => kind === "heading")
      .every((block) => block.kind === "heading" && block.level === 3));
    assert.ok(blocks.filter(({ kind }) => kind === "animation-story")
      .every((block) => block.kind === "animation-story" &&
        block.asset.kind === "animation-asset" &&
        block.presentation === "scroll-scrub"));
  }
});

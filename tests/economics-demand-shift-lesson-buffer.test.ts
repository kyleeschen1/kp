import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpEconomicsLessonBufferSource,
  createKpEconomicsLessonBuffer,
  kpEconomicsLessonBufferSchema,
  parseKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer,
  type KpEconomicsLessonBuffer
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer.ts";
import {
  compileKpEconomicsTwoColumnParagraphs,
  kpEconomicsTwoColumnParagraphs
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-scroll.ts";
import {
  kpEconomicsTwoColumnSourceSchema,
  type KpEconomicsTwoColumnSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

const currentSource: KpEconomicsTwoColumnSource = Object.freeze({
  schemaVersion: kpEconomicsTwoColumnSourceSchema,
  passages: Object.freeze(kpEconomicsTwoColumnParagraphs.map((passage) =>
    Object.freeze({
      id: passage.id,
      role: passage.role,
      ...(passage.motionBlockId === undefined
        ? {}
        : { motionBlockId: passage.motionBlockId }),
      sourceText: passage.paragraphs[0]!.sourceText
    })
  ))
});

test("whole-lesson buffer round-trips current compiled narrative exactly", () => {
  const buffer = createKpEconomicsLessonBuffer(currentSource);
  const serialized = serializeKpEconomicsLessonBuffer(buffer);
  const parsed = parseKpEconomicsLessonBuffer(serialized);
  const reconstructed = compileKpEconomicsLessonBufferSource(parsed);

  assert.deepEqual(parsed, buffer);
  assert.deepEqual(reconstructed, currentSource);
  assert.deepEqual(
    compileKpEconomicsTwoColumnParagraphs(reconstructed),
    kpEconomicsTwoColumnParagraphs
  );
  assert.match(serialized, /<!-- kp:lesson /);
  assert.match(serialized, /<!-- kp:motion-passage /);
  assert.match(serialized, /<!-- kp:stage /);
  assert.match(serialized, /<!-- kp:motion-block /);
  assert.match(serialized, /<!-- kp:semantic-reference /);
  assert.doesNotMatch(serialized, /<script|<svelte|```\s*kp/u);
});

test("passage reorder preserves every stable semantic identity", () => {
  const buffer = createKpEconomicsLessonBuffer(currentSource);
  const [first, second, ...rest] = buffer.passages;
  const reordered: KpEconomicsLessonBuffer = {
    ...buffer,
    passages: [second!, first!, ...rest]
  };
  const parsed = parseKpEconomicsLessonBuffer(
    serializeKpEconomicsLessonBuffer(reordered)
  );

  assert.deepEqual(
    new Set(parsed.passages.map(({ id }) => id)),
    new Set(buffer.passages.map(({ id }) => id))
  );
  assert.deepEqual(parsed.motionBlocks, buffer.motionBlocks);
  assert.deepEqual(parsed.semanticReferences, buffer.semanticReferences);
  assert.equal(parsed.passages[0]!.id, second!.id);
  assert.equal(parsed.passages[1]!.id, first!.id);
});

test("directive-looking prose and existing backslashes escape reversibly", () => {
  const buffer = createKpEconomicsLessonBuffer(currentSource);
  const marker = [
    buffer.passages[0]!.sourceText,
    "<!-- kp:stage {\"id\":\"only-prose\"} -->",
    "\\<!-- kp:end-passage -->"
  ].join("\n");
  const escaped: KpEconomicsLessonBuffer = {
    ...buffer,
    passages: buffer.passages.map((passage, index) => index === 0
      ? { ...passage, sourceText: marker }
      : passage)
  };
  const serialized = serializeKpEconomicsLessonBuffer(escaped);
  const parsed = parseKpEconomicsLessonBuffer(serialized);

  assert.match(serialized, /\\<!-- kp:stage/);
  assert.match(serialized, /\\\\<!-- kp:end-passage/);
  assert.equal(parsed.passages[0]!.sourceText, marker);
});

test("schema versions and typed ownership fail closed", () => {
  const serialized = serializeKpEconomicsLessonBuffer(
    createKpEconomicsLessonBuffer(currentSource)
  );
  assert.throws(
    () => parseKpEconomicsLessonBuffer(serialized.replace(
      kpEconomicsLessonBufferSchema,
      "kp.economics.lesson-buffer.v2"
    )),
    /Unsupported lesson buffer schema/
  );
  assert.throws(
    () => parseKpEconomicsLessonBuffer(serialized.replace(
      '<!-- kp:stage {"id":"demand-shift-graph"',
      '<!-- kp:code {"id":"demand-shift-graph"'
    )),
    /Unexpected kp:code directive/
  );
  assert.throws(
    () => parseKpEconomicsLessonBuffer(serialized.replace(
      '"id":"initial-equilibrium","motionPassageId"',
      '"id":"graph-at-rest","motionPassageId"'
    )),
    /Duplicate passage id/
  );
  const buffer = createKpEconomicsLessonBuffer(currentSource);
  assert.throws(
    () => serializeKpEconomicsLessonBuffer({
      ...buffer,
      passages: buffer.passages.map((passage, index) => index === 0
        ? { ...passage, sourceText: "```kp\nrun()\n```" }
        : passage)
    }),
    /executable source/
  );
});

test("semantic references must stay attached to repository identities", () => {
  const buffer = createKpEconomicsLessonBuffer(currentSource);
  const invalid: KpEconomicsLessonBuffer = {
    ...buffer,
    semanticReferences: buffer.semanticReferences.map((reference) => ({
      ...reference,
      passageId: "missing-passage"
    }))
  };
  assert.throws(
    () => serializeKpEconomicsLessonBuffer(invalid),
    /unknown owner/
  );
});

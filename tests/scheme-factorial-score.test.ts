import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialScore } from
  "../src/semantic/scheme-factorial-score.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const trace = readKpSchemeFactorialTraceArtifact().trace;

test("canonical score follows the approved six-beat recursion story", () => {
  assert.deepEqual(kpSchemeFactorialScore.beats.map(({ id }) => id), [
    "scheme-factorial.beat.definition-seed",
    "scheme-factorial.beat.first-descent",
    "scheme-factorial.beat.repeated-descent",
    "scheme-factorial.beat.base-case",
    "scheme-factorial.beat.return-cascade",
    "scheme-factorial.beat.result"
  ]);
  assert.equal(kpSchemeFactorialScore.beats[2]?.kind, "summary");
  assert.ok(kpSchemeFactorialScore.beats[2]!.eventIds.length > 2);
  assert.equal(kpSchemeFactorialScore.omissions.length, 0);
});

test("only repeated middle descent is semantically compressed", () => {
  const summaries = kpSchemeFactorialScore.beats.filter(({ kind }) =>
    kind === "summary");
  assert.equal(summaries.length, 1);
  const groupedEvents = summaries[0]!.eventIds.map((id) =>
    trace.events.find((event) => event.id === id)!);
  assert.equal(groupedEvents.filter(({ kind }) =>
    kind === "parameter-bound").length, 2);
  assert.equal(groupedEvents.filter(({ kind }) =>
    kind === "call-suspended").length, 2);
  assert.equal(groupedEvents.some(({ kind }) =>
    kind === "evaluation-completed"), false);
});

test("base case and each return remain explicit factual events", () => {
  const base = kpSchemeFactorialScore.beats.find(({ id }) =>
    id.endsWith("base-case"))!;
  const returned = kpSchemeFactorialScore.beats.find(({ id }) =>
    id.endsWith("return-cascade"))!;
  const kinds = (eventIds: readonly string[]) => eventIds.map((id) =>
    trace.events.find((event) => event.id === id)!.kind);
  assert.ok(kinds(base.eventIds).includes("branch-selected"));
  assert.equal([...kinds(base.eventIds), ...kinds(returned.eventIds)].filter(
    (kind) => kind === "call-returned").length, 4);
  assert.equal(kinds(returned.eventIds).filter((kind) =>
    kind === "primitive-applied").length, 3);
});

test("score accounts for the complete trace once and in order", () => {
  const scored = kpSchemeFactorialScore.beats.flatMap(({ eventIds }) =>
    eventIds);
  assert.deepEqual(scored, trace.events.map(({ id }) => id));
  assert.equal(new Set(scored).size, trace.events.length);
});

test("captions state semantic claims rather than execution trivia", () => {
  const captions = kpSchemeFactorialScore.beats.map(({ caption }) => caption);
  assert.ok(captions.some((caption) => caption.includes("work waiting")));
  assert.ok(captions.some((caption) => caption.includes("descent stops")));
  assert.ok(captions.some((caption) => caption.includes("then 6")));
  assert.ok(captions.every((caption) =>
    !/event|snapshot|continuation id|environment id/i.test(caption)));
});

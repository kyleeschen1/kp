import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { kpDevelopmentBuildEntries } from
  "../src/dev-toolbar/development-page-build-entries.ts";
import { kpDevelopmentPages } from
  "../src/dev-toolbar/development-page-directory.ts";
import {
  isKpSchemeFactorialTutorialRoute,
  kpSchemeFactorialTutorialPath
} from "../src/tutorial/scheme-factorial/scheme-factorial-route.ts";
import {
  defineKpSchemeFactorialPublicationArtifact,
  renderKpSchemeFactorialFocusPublication,
  renderKpSchemeFactorialStaticPublication,
  serializeKpSchemeFactorialPublicationArtifact
} from "../src/tutorial/scheme-factorial/scheme-factorial-publication.ts";
import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import { kpSchemeFactorialChoreography } from
  "../src/animation/scheme-factorial-canonical-choreography.ts";
import { kpSchemeFactorialFirstExpansion } from
  "../src/animation/scheme-factorial-canonical-first-expansion.ts";
import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { findKpSchemeFactorialAdjacentCheckpoint } from
  "../src/tutorial/scheme-factorial/scheme-factorial-navigation.ts";

const artifact = defineKpSchemeFactorialPublicationArtifact({
  checkpoints: kpSchemeFactorialCheckpoints,
  timeline: kpSchemeFactorialTimeline,
  choreography: kpSchemeFactorialChoreography,
  firstExpansion: kpSchemeFactorialFirstExpansion
});

test("owns one parallel canonical route and development catalogue entry", () => {
  assert.equal(kpSchemeFactorialTutorialPath,
    "/tutorials/programming/scheme-factorial/");
  assert.equal(isKpSchemeFactorialTutorialRoute(kpSchemeFactorialTutorialPath), true);
  assert.equal(isKpSchemeFactorialTutorialRoute(
    kpSchemeFactorialTutorialPath.slice(0, -1)), true);
  assert.equal(isKpSchemeFactorialTutorialRoute(
    "/tutorials/programming/lisp-function-application/"), false);
  assert.ok(kpDevelopmentPages.some(({ id, href }) =>
    id === "tutorial.scheme-factorial" && href === kpSchemeFactorialTutorialPath));
  assert.deepEqual(kpDevelopmentBuildEntries.find(({ name }) =>
    name === "schemeFactorialTutorial"), {
    name: "schemeFactorialTutorial",
    htmlPath: "tutorials/programming/scheme-factorial/index.html"
  });
});

test("publishes a complete searchable no-JavaScript fallback", () => {
  const html = renderKpSchemeFactorialStaticPublication({
    document: parseKpSchemeFactorialSource(),
    artifact
  });
  assert.match(html, /\(define \(factorial n\)/u);
  assert.match(html, /<kp-tutorial-scrub-bar/u);
  assert.match(html, /controls-disabled="true"/u);
  assert.equal((html.match(/data-kp-scheme-checkpoint-transcript=/gu) ?? []).length,
    7);
  assert.match(html, /Open the animation library/u);
});

test("publishes one austere first-expansion review surface", () => {
  const html = renderKpSchemeFactorialFocusPublication({ artifact });
  assert.match(html, /Watch the call open/u);
  assert.match(html, /data-kp-scheme-factorial-focus-stage-host/u);
  assert.match(html, /data-action="focus-toggle"/u);
  assert.match(html, /Full factorial evaluation/u);
  assert.equal((html.match(/type="range"/gu) ?? []).length, 1);
  assert.doesNotMatch(html, /Evaluation outline|Previous|Next|Rewind/u);
});

test("embeds compact publication truth rather than a learner evaluator", async () => {
  const serialized = serializeKpSchemeFactorialPublicationArtifact(artifact);
  assert.ok(serialized.length < 100_000);
  assert.doesNotMatch(serialized, /snapshots|continuations|machine-state/u);
  assert.match(serialized, /binding-arc|branch-decision|return-step/u);
  const entry = await readFile(new URL(
    "../src/tutorial/scheme-factorial/scheme-factorial-tutorial-entry.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(entry, /scheme-factorial-evaluator|trace-artifact/u);
  assert.doesNotMatch(entry, /import "\.\.\/\.\.\/styles\.css"/u);
  assert.match(entry, /createKpReaderTimelinePlaybackClock/u);
  assert.match(entry, /kp-tutorial-scrub-bar/u);
});

test("HTML entry exposes both static fallback and embedded publication data", async () => {
  const html = await readFile(new URL(
    "../tutorials/programming/scheme-factorial/index.html",
    import.meta.url
  ), "utf8");
  assert.match(html, /data-kp-scheme-factorial-static-fallback/u);
  assert.match(html, /kp:scheme-factorial-static-fallback/u);
  assert.match(html, /data-kp-scheme-factorial-publication/u);
  assert.match(html, /kp:scheme-factorial-publication-data/u);
});

test("checkpoint controls move in the requested direction between states", () => {
  const checkpoints = Object.entries(artifact.timeline.checkpointSeeks)
    .map(([id, progress]) => ({ id, progress }))
    .sort((left, right) => left.progress - right.progress);
  const between = (checkpoints[2]!.progress + checkpoints[3]!.progress) / 2;
  assert.equal(findKpSchemeFactorialAdjacentCheckpoint(
    checkpoints, between, -1
  )?.id, checkpoints[2]!.id);
  assert.equal(findKpSchemeFactorialAdjacentCheckpoint(
    checkpoints, between, 1
  )?.id, checkpoints[3]!.id);
  assert.equal(findKpSchemeFactorialAdjacentCheckpoint(
    checkpoints, checkpoints[0]!.progress, -1
  ), null);
  assert.equal(findKpSchemeFactorialAdjacentCheckpoint(
    checkpoints, checkpoints.at(-1)!.progress, 1
  ), null);
});

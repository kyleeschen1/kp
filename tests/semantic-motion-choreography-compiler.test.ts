import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpSemanticMotionChoreography,
  isKpCompiledSemanticMotionChoreography,
  resolveKpSemanticMotionRecipe,
  sampleKpSemanticMotionChoreography,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionPrecedenceSpec,
  type KpVerifiedSemanticMotionPrecedence
} from "../src/domain-ir/public-api.ts";
import {
  cancellationSemanticMotionPrecedenceSpec,
  cancellationSemanticMotionStructureContract,
  compileSemanticMotionPrecedenceFixture,
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture,
  distributionSemanticMotionPrecedenceSpec,
  distributionSemanticMotionStructureContract,
  quotientSemanticMotionPrecedenceSpec,
  quotientSemanticMotionStructureContract,
  type KpSemanticMotionCompilerTestFixture
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("three recipes lower semantic DAGs into complete deterministic renderer-neutral tracks", () => {
  const choreographies = threeChoreographies();
  for (const choreography of choreographies) {
    assert.equal(isKpCompiledSemanticMotionChoreography(choreography), true);
    assert.equal(choreography.compilation.kind, "verified-semantic-motion-compilation");
    assert.equal(choreography.clockCoupling, "external-shared-progress");
    assert.deepEqual(
      new Set(choreography.tracks.map(({ eventId }) => eventId)),
      new Set(choreography.resolution.precedence.events.map(({ id }) => id))
    );
    const byEvent = new Map(choreography.tracks.map((track) => [track.eventId, track] as const));
    choreography.resolution.precedence.edges.forEach(({ beforeEventId, afterEventId }) => {
      assert.ok(byEvent.get(beforeEventId)!.window.end <= byEvent.get(afterEventId)!.window.start);
    });
    assert.equal(choreography.tracks.filter(({ eventKind }) => eventKind === "native-target-ready").length, 1);
    assert.equal(choreography.tracks.find(({ eventKind }) => eventKind === "native-target-ready")!.window.end, 1);
    assert.doesNotMatch(JSON.stringify(choreography.tracks), /renderer|dom|katex|svg|canvas|webgl|milliseconds|durationMs/i);
  }
  assert.notDeepEqual(choreographies[0]!.tracks.map(({ window }) => window), choreographies[1]!.tracks.map(({ window }) => window));
});

test("direct samples mirror exactly on rewind and reduced motion exposes only native endpoints", () => {
  for (const choreography of threeChoreographies()) {
    const request = choreography.resolution.precedence.structure.lifecycle.provenance.endpointFrontier.request;
    const source = sampleKpSemanticMotionChoreography({ choreography, progress: 0, direction: "forward" });
    const target = sampleKpSemanticMotionChoreography({ choreography, progress: 1, direction: "forward" });
    assert.equal(source.settledStateId, request.sourceState.id);
    assert.equal(target.settledStateId, request.targetState.id);
    for (const progress of [0, 0.01, 0.19, 0.37, 0.5, 0.73, 0.99, 1]) {
      const forward = sampleKpSemanticMotionChoreography({ choreography, progress, direction: "forward" });
      const rewind = sampleKpSemanticMotionChoreography({ choreography, progress: 1 - progress, direction: "rewind" });
      assert.equal(forward.semanticProgress, rewind.semanticProgress);
      assert.deepEqual(forward.tracks, rewind.tracks);
    }
    const reducedSource = sampleKpSemanticMotionChoreography({ choreography, progress: 0.49, direction: "forward", reducedMotion: true });
    const reducedTarget = sampleKpSemanticMotionChoreography({ choreography, progress: 0.5, direction: "forward", reducedMotion: true });
    assert.equal(reducedSource.settledStateId, request.sourceState.id);
    assert.equal(reducedTarget.settledStateId, request.targetState.id);
  }
});

test("incomparable semantic events overlap while every causal edge remains ordered", () => {
  const fixture = createQuotientSemanticMotionFixture();
  const spec = quotientSemanticMotionPrecedenceSpec();
  const ids = Object.fromEntries(spec.events.map((event) => [event.kind, event.id]));
  const parallelSpec: KpSemanticMotionPrecedenceSpec = {
    events: spec.events,
    edges: [
      { beforeEventId: ids["clearance"]!, afterEventId: ids["orient"]! },
      { beforeEventId: ids["clearance"]!, afterEventId: ids["departure"]! },
      { beforeEventId: ids["departure"]!, afterEventId: ids["arrival"]! },
      { beforeEventId: ids["orient"]!, afterEventId: ids["attachment"]! },
      { beforeEventId: ids["arrival"]!, afterEventId: ids["attachment"]! },
      { beforeEventId: ids["attachment"]!, afterEventId: ids["native-target-ready"]! }
    ]
  };
  const choreography = compile(fixture, quotientSemanticMotionStructureContract(), parallelSpec);
  const orient = choreography.tracks.find(({ eventKind }) => eventKind === "orient")!;
  const departure = choreography.tracks.find(({ eventKind }) => eventKind === "departure")!;
  assert.equal(orient.window.start, departure.window.start);
  assert.notEqual(orient.window.end, departure.window.end);
});

test("copied authority invalid progress and renderer coupling cannot enter the compiler waist", () => {
  const choreography = threeChoreographies()[0]!;
  assert.throws(
    () => sampleKpSemanticMotionChoreography({ choreography: { ...choreography }, progress: 0.5, direction: "forward" }),
    /original choreography authority/
  );
  assert.throws(
    () => sampleKpSemanticMotionChoreography({ choreography, progress: Number.NaN, direction: "forward" }),
    /progress must be finite/
  );
  const source = readFileSync("src/domain-ir/semantic-motion-choreography-compiler.ts", "utf8");
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:rendering|reader|svelte|canvas|webgl)/i);
  assert.doesNotMatch(source, /requestAnimationFrame|setTimeout|setInterval/);
});

function threeChoreographies() {
  return [
    compile(createQuotientSemanticMotionFixture(), quotientSemanticMotionStructureContract(), quotientSemanticMotionPrecedenceSpec()),
    compile(createDistributionSemanticMotionFixture(), distributionSemanticMotionStructureContract(), distributionSemanticMotionPrecedenceSpec()),
    compile(createCancellationSemanticMotionFixture(), cancellationSemanticMotionStructureContract(), cancellationSemanticMotionPrecedenceSpec())
  ] as const;
}

function compile(
  fixture: KpSemanticMotionCompilerTestFixture,
  contract: KpSemanticMotionOperationStructureContract,
  spec: KpSemanticMotionPrecedenceSpec
) {
  const precedence: KpVerifiedSemanticMotionPrecedence = compileSemanticMotionPrecedenceFixture(fixture, contract, spec);
  const resolution = resolveKpSemanticMotionRecipe(precedence);
  if (resolution.status !== "resolved") throw new Error(`Recipe ${fixture.request.id} failed.`);
  return compileKpSemanticMotionChoreography(resolution.resolution);
}

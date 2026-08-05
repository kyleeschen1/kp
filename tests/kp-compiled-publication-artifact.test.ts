import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCompiledPublicationArtifact,
  createKpCompiledPublicationArtifact
} from "../src/tutorial/kp-compiled-publication-artifact.ts";

const digest = `sha256:${"a".repeat(64)}` as const;

test("compiled publication artifact freezes deterministic static-math truth", () => {
  const artifact = createKpCompiledPublicationArtifact({
    artifactId: "publication.economics.demand-shift",
    source: {
      path: "content/lessons/economics-demand-shift.md",
      sha256: digest
    },
    compiler: { id: "kp.economics-demand-shift", version: "1" },
    math: {
      engine: "katex",
      engineVersion: "0.17.0",
      rendering: "build-time",
      output: "htmlAndMathml",
      trust: false,
      fragmentCount: 3,
      sourceLatex: ["D_0", "D_1"]
    },
    payloadSha256: digest,
    payload: { title: "Demand shifts" }
  });

  assert.equal(artifact.math.rendering, "build-time");
  assert.equal(artifact.math.trust, false);
  assert.ok(Object.isFrozen(artifact));
  assert.ok(Object.isFrozen(artifact.math.sourceLatex));
  assert.doesNotThrow(() =>
    assertKpCompiledPublicationArtifact(
      JSON.parse(JSON.stringify(artifact)) as unknown
    ));
});

test("compiled publication artifact rejects runtime or ambiguous math", () => {
  const base = {
    schemaVersion: "kp.compiled-publication-artifact.v1",
    kind: "compiled-publication-artifact",
    artifactId: "publication.economics.demand-shift",
    source: {
      path: "content/lessons/economics-demand-shift.md",
      sha256: digest
    },
    compiler: { id: "kp.economics-demand-shift", version: "1" },
    math: {
      engine: "katex",
      engineVersion: "0.17.0",
      rendering: "runtime",
      output: "htmlAndMathml",
      trust: false,
      fragmentCount: 2,
      sourceLatex: ["D_1", "D_0"]
    },
    payloadSha256: digest,
    payload: {}
  };

  assert.throws(
    () => assertKpCompiledPublicationArtifact(base),
    /build-time KaTeX/
  );
  assert.throws(
    () => assertKpCompiledPublicationArtifact({
      ...base,
      math: { ...base.math, rendering: "build-time" }
    }),
    /deterministically sorted/
  );
});

test("compiled publication artifact requires exact source and payload digests", () => {
  assert.throws(
    () => assertKpCompiledPublicationArtifact({
      schemaVersion: "kp.compiled-publication-artifact.v1",
      kind: "compiled-publication-artifact",
      artifactId: "publication.economics.demand-shift",
      source: { path: "lesson.md", sha256: "sha256:short" },
      compiler: { id: "compiler", version: "1" },
      math: {
        engine: "katex",
        engineVersion: "0.17.0",
        rendering: "build-time",
        output: "htmlAndMathml",
        trust: false,
        fragmentCount: 0,
        sourceLatex: []
      },
      payloadSha256: digest,
      payload: {}
    }),
    /source.sha256/
  );
});

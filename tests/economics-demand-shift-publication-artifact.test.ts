import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpEconomicsDemandShiftPublicationArtifact,
  serializeKpCompiledPublicationArtifact
} from "../scripts/compile-economics-demand-shift-publication.ts";
import {
  assertKpCompiledPublicationArtifact,
  type KpCompiledPublicationArtifact
} from "../src/tutorial/kp-compiled-publication-artifact.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";

const markdown = readFileSync(
  new URL("../content/lessons/economics-demand-shift.md", import.meta.url),
  "utf8"
);
const artifactSource = readFileSync(
  new URL(
    "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json",
    import.meta.url
  ),
  "utf8"
);
const artifact = JSON.parse(artifactSource) as KpCompiledPublicationArtifact<
  KpEconomicsDemandShiftPublication
>;

test("generated economics publication is an exact deterministic artifact", () => {
  assert.doesNotThrow(() => assertKpCompiledPublicationArtifact(artifact));
  const compiled = compileKpEconomicsDemandShiftPublicationArtifact({
    markdown,
    katexVersion: artifact.math.engineVersion
  });

  assert.equal(serializeKpCompiledPublicationArtifact(compiled), artifactSource);
  assert.equal(artifact.source.sha256, digest(markdown));
  assert.equal(artifact.payloadSha256, digest(JSON.stringify(artifact.payload)));
  assert.equal(artifact.math.rendering, "build-time");
  assert.equal(artifact.math.output, "htmlAndMathml");
  assert.equal(artifact.math.trust, false);
  assert.ok(artifact.math.fragmentCount > 0);
  assert.ok(artifact.math.sourceLatex.length > 0);
  assert.match(artifactSource, /katex-mathml/);
  assert.doesNotMatch(artifactSource, /generatedAt|timestamp|rendering\": \"runtime/);
});

function digest(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

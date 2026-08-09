import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpEconomicsRetainedMathArtifact,
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
import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";

const articleText = readFileSync(
  new URL("../content/lessons/economics-demand-shift.kp.md", import.meta.url),
  "utf8"
);
const importLock = JSON.parse(readFileSync(
  new URL("../content/lessons/economics-demand-shift.kp.lock.json", import.meta.url),
  "utf8"
)) as KpArticleImportLock;
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
const retainedMathSource = readFileSync(
  new URL(
    "../src/rendering/economics-equilibrium-retained-math.generated.json",
    import.meta.url
  ),
  "utf8"
);
const retainedMath = JSON.parse(retainedMathSource) as {
  readonly engineVersion: string;
  readonly sourceLatex: readonly string[];
  readonly fragments: Readonly<Record<string, string>>;
};
const routeEntrySource = readFileSync(
  new URL(
    "../src/tutorial/economics-demand-shift/economics-demand-shift-tutorial-entry.ts",
    import.meta.url
  ),
  "utf8"
);
const inlineMathSource = readFileSync(
  new URL(
    "../src/tutorial/economics-demand-shift/KpInlineMath.svelte",
    import.meta.url
  ),
  "utf8"
);

test("generated economics publication is an exact deterministic artifact", () => {
  assert.doesNotThrow(() => assertKpCompiledPublicationArtifact(artifact));
  const compiled = compileKpEconomicsDemandShiftPublicationArtifact({
    articleText,
    importLock,
    katexVersion: artifact.math.engineVersion
  });

  assert.equal(serializeKpCompiledPublicationArtifact(compiled), artifactSource);
  assert.equal(artifact.source.path, "content/lessons/economics-demand-shift.kp.md");
  assert.equal(artifact.compiler.version, "2");
  assert.equal(artifact.source.sha256, digest(articleText));
  assert.equal(artifact.payloadSha256, digest(JSON.stringify(artifact.payload)));
  assert.equal(artifact.math.rendering, "build-time");
  assert.equal(artifact.math.output, "htmlAndMathml");
  assert.equal(artifact.math.trust, false);
  assert.ok(artifact.math.fragmentCount > 0);
  assert.ok(artifact.math.sourceLatex.length > 0);
  assert.match(artifactSource, /katex-mathml/);
  assert.equal(artifact.payload.lesson.proseMotion?.length, 1);
  assert.equal(
    artifact.payload.semanticTransit.transits[0]?.id,
    "price-axis-correspondence"
  );
  assert.equal(
    artifact.payload.semanticTransit.textReferences[0]?.id,
    "price-axis-inline"
  );
  assert.equal(
    artifact.payload.semanticTransit.stageObjects[0]?.id,
    "axis-price"
  );
  assert.match(
    artifact.payload.motionBridgeHtml?.["demand-increase"] ?? "",
    /data-kp-motion-from-checkpoint="shift-ready"[^>]+data-kp-motion-to-checkpoint="shift-settled"/
  );
  assert.doesNotMatch(artifactSource, /generatedAt|timestamp|rendering\": \"runtime/);
});

test("economics learner route consumes the artifact rather than compiler inputs", () => {
  assert.match(
    routeEntrySource,
    /readKpEconomicsDemandShiftCompiledPublication\(\)/
  );
  assert.doesNotMatch(routeEntrySource, /economics-demand-shift\.md\?raw/);
  assert.doesNotMatch(routeEntrySource, /compileKpEconomicsDemandShiftPublication/);
  assert.doesNotMatch(inlineMathSource, /katex-adapter|renderLatexToHtml/);
  assert.match(inlineMathSource, /renderKpEconomicsRetainedInlineLatex/);
});

test("bounded dynamic economics math is an exact retained fragment bank", () => {
  const rebuilt = compileKpEconomicsRetainedMathArtifact(
    retainedMath.engineVersion
  );
  assert.equal(`${JSON.stringify(rebuilt, null, 2)}\n`, retainedMathSource);
  assert.deepEqual(
    Object.keys(retainedMath.fragments).sort(),
    [...retainedMath.sourceLatex].sort()
  );
  assert.deepEqual(
    ["15", "16", "17", "18", "19", "20"].filter(
      (latex) => retainedMath.fragments[latex] !== undefined
    ),
    ["15", "16", "17", "18", "19", "20"]
  );
  assert.ok(Object.values(retainedMath.fragments).every((html) =>
    html.includes("katex-mathml") && html.includes("katex-html")
  ));
});

function digest(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

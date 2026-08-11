import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  decodeKpFractionCompositionArticleLocation,
  encodeKpFractionCompositionArticleCheckpointLocation,
  encodeKpFractionCompositionArticleSemanticLocation
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-location.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-manifest.ts";
import {
  fractionCompositionCanonicalHostProvenance
} from "../src/reader/app/equation-lesson-descriptors/fraction-composition-host-provenance.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-ranges.ts";
import {
  kpFractionCompositionArticleSemanticReferences,
  projectKpFractionCompositionArticleFocusSnapshot,
  resolveKpFractionCompositionArticleSemanticReference
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-semantic-navigation.ts";
import {
  renderKpFractionCompositionStaticPublication
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-static-publication.ts";
import {
  isKpFractionCompositionAttentionStageRequested
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-attention-stage.ts";

const compiled = compileKpFractionCompositionArticle({
  text: readFileSync(
    "content/lessons/algebra-fraction-composition.kp.md",
    "utf8"
  ),
  lock: JSON.parse(readFileSync(
    "content/lessons/algebra-fraction-composition.kp.lock.json",
    "utf8"
  )) as KpArticleImportLock
});

test("browser runtime manifest equals the build-owned stage projection", () => {
  assert.deepEqual(
    kpFractionCompositionArticleRuntimeManifest,
    compiled.stageManifests[0]
  );
});

test("attention-stage selection is explicit and leaves Article as the default", () => {
  assert.equal(
    isKpFractionCompositionAttentionStageRequested("?view=attention-stage"),
    true
  );
  assert.equal(
    isKpFractionCompositionAttentionStageRequested("?view=article"),
    false
  );
  assert.equal(isKpFractionCompositionAttentionStageRequested(""), false);
});

test("the article locks the certified reader host, not only the animation id", () => {
  const provenance = fractionCompositionCanonicalHostProvenance;
  const catalogEntry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === provenance.animationId
  );
  const canonicalHost = catalogEntry?.representations.find(
    ({ role }) => role === "canonical-host"
  );

  assert.equal(
    kpFractionCompositionArticleRuntimeManifest.release.animationId,
    provenance.animationId
  );
  assert.deepEqual(
    canonicalHost === undefined
      ? undefined
      : {
          id: canonicalHost.id,
          kind: canonicalHost.kind,
          href: canonicalHost.href,
          role: canonicalHost.role
        },
    provenance.representation
  );
  assert.equal(
    catalogEntry?.primaryRepresentationId,
    provenance.representation.id
  );
  assert.deepEqual(provenance.runtime, {
    family: "reader-canonical-equation",
    lessonDescriptorId: "fraction-composition"
  });
});

test("five named ranges partition all thirteen canonical operations", () => {
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  assert.equal(ranges.length, 5);
  assert.equal(ranges[0]?.start, 0);
  assert.equal(ranges.at(-1)?.end, 1);
  assert.equal(ranges.flatMap(({ operationIds }) => operationIds).length, 13);
  for (let index = 1; index < ranges.length; index += 1) {
    assert.equal(ranges[index - 1]?.end, ranges[index]?.start);
  }
});

test("six checkpoint seeks derive from the same five canonical ranges", () => {
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  const checkpoints = createKpFractionCompositionArticleRuntimeCheckpoints();

  assert.deepEqual(checkpoints.map(({ path }) => path), [
    "factored",
    "normalized",
    "constant-quotient",
    "difference-simplified",
    "right-product-simplified",
    "solved"
  ]);
  assert.deepEqual(checkpoints.map(({ progress }) => progress), [
    0,
    ...ranges.map(({ end }) => end)
  ]);
});

test("static publication binds every authored motion to a canonical range", () => {
  const html = renderKpFractionCompositionStaticPublication(compiled);
  const markers = [...html.matchAll(
    /data-kp-algebra-motion-range="([^"]+)"/gu
  )].map((match) => match[1]);
  const slots = [...html.matchAll(
    /data-kp-algebra-motion-slot="([^"]+)"/gu
  )].map((match) => match[1]);
  const ranges = createKpFractionCompositionArticleRuntimeRanges()
    .map(({ path }) => path);

  assert.deepEqual(markers, ranges);
  assert.deepEqual(slots, ranges);
});

test("article semantic addresses resolve only through locked object bindings", () => {
  assert.equal(kpFractionCompositionArticleSemanticReferences.length, 12);
  const factor = resolveKpFractionCompositionArticleSemanticReference(
    "solve/factor"
  );
  assert.equal(factor?.address, "solve/factor");
  assert.equal(factor?.stageId, "solve");
  assert.equal(factor?.objectPath, "factor");
  assert.deepEqual(factor?.targetIds, ["fraction-fan-out.source.factor"]);
  assert.deepEqual(factor?.paintTargetIds, [
    "fraction-fan-out.source.factor.numerator",
    "fraction-fan-out.source.factor.denominator"
  ]);
  assert.equal(
    resolveKpFractionCompositionArticleSemanticReference("solve/not-authored"),
    undefined
  );
});

test("article focus resolves public addresses to native paint identities", () => {
  assert.deepEqual(projectKpFractionCompositionArticleFocusSnapshot({
    activeSource: "pointer",
    objectRefs: ["solve/factor", "solve/factor"],
    revision: 7
  }), {
    activeSource: "pointer",
    objectRefs: [
      "fraction-fan-out.source.factor.numerator",
      "fraction-fan-out.source.factor.denominator"
    ],
    revision: 7
  });
  assert.throws(
    () => projectKpFractionCompositionArticleFocusSnapshot({
      activeSource: "story",
      objectRefs: ["solve/not-authored"],
      revision: 8
    }),
    /Unknown fraction composition focus address/u
  );
});

test("article locations distinguish checkpoints from non-temporal object links", () => {
  assert.deepEqual(
    decodeKpFractionCompositionArticleLocation(
      "#kp-ref:solve/difference-simplified"
    ),
    { kind: "checkpoint", path: "difference-simplified" }
  );
  assert.deepEqual(
    decodeKpFractionCompositionArticleLocation("#kp-ref:solve/factor"),
    { kind: "semantic-reference", address: "solve/factor" }
  );
  assert.equal(
    decodeKpFractionCompositionArticleLocation("#read-the-expression"),
    undefined
  );
  assert.equal(
    decodeKpFractionCompositionArticleLocation("#kp-ref:solve/%E0%A4%A"),
    undefined
  );
});

test("article checkpoint URLs preserve route and query state", () => {
  assert.equal(
    encodeKpFractionCompositionArticleCheckpointLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/?review=1#old",
      "solved"
    ),
    "/tutorials/algebra/fraction-composition/?review=1#kp-ref:solve/solved"
  );
  assert.throws(
    () => encodeKpFractionCompositionArticleCheckpointLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/",
      "not-authored"
    ),
    /Unknown algebra article checkpoint/u
  );
});

test("semantic focus URLs are reconstructible without becoming seeks", () => {
  assert.equal(
    encodeKpFractionCompositionArticleSemanticLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/?review=1",
      "solve/factor"
    ),
    "/tutorials/algebra/fraction-composition/?review=1#kp-ref:solve/factor"
  );
  assert.equal(
    encodeKpFractionCompositionArticleSemanticLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/?review=1#kp-ref:solve/factor"
    ),
    "/tutorials/algebra/fraction-composition/?review=1"
  );
  assert.throws(
    () => encodeKpFractionCompositionArticleSemanticLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/",
      "solve/not-authored"
    ),
    /Unknown algebra article semantic address/u
  );
});

test("algebra forbids the rejected generic editor-player host", () => {
  const entry = readFileSync(
    "src/tutorial/algebra-fraction-composition/fraction-composition-progressive-entry.ts",
    "utf8"
  );
  const transport = readFileSync(
    "src/tutorial/algebra-fraction-composition/fraction-composition-article-transport.ts",
    "utf8"
  );
  const tutorialRoot = "src/tutorial/algebra-fraction-composition";
  const tutorialRuntime = readdirSync(tutorialRoot)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".css"))
    .map((name) => readFileSync(`${tutorialRoot}/${name}`, "utf8"))
    .join("\n");

  assert.equal(existsSync(
    "src/tutorial/algebra-fraction-composition/fraction-composition-runtime-capability.ts"
  ), false);
  assert.doesNotMatch(tutorialRuntime, /editor-animation-player/u);
  assert.doesNotMatch(tutorialRuntime, /createKpEditorAnimationDescriptor/u);
  assert.doesNotMatch(tutorialRuntime, /hydrateKpPreparedEditorAnimationPlayer/u);
  assert.doesNotMatch(tutorialRuntime, /renderKpEditorAnimationPlayerShell/u);
  assert.match(entry, /createKpChromeFreeCanonicalEquationSession/u);
  assert.match(entry, /mountKpCanonicalEquationStageShell/u);
  assert.match(entry, /fractionCompositionDescriptor/u);
  assert.doesNotMatch(entry, /requestAnimationFrame|setInterval|setTimeout/u);
  assert.match(transport, /createKpReaderTimelinePlaybackClock/u);
  assert.match(transport, /sampleKpReaderPlaybackRange/u);
  assert.doesNotMatch(tutorialRuntime, /requestAnimationFrame/u);
  assert.doesNotMatch(entry, /createKpReaderContinuousScrollClock/u);
  assert.doesNotMatch(entry, /seekCheckpoint\([^)]*kpFocus/u);
});

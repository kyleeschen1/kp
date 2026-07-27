import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpGovernedExponentAbsorptionFixture
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  assertKpCanonicalReaderPromotionCost,
  evaluateKpCanonicalReaderPromotionCost,
  type KpCanonicalReaderPromotionCostEvidence
} from "../src/architecture/canonical-reader-promotion-cost.ts";
import {
  compileKpReaderCanonicalTransitionPolicy,
  defineKpCanonicalEquationLessonDescriptor
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  compileKpCanonicalEquationLessonPromotion
} from "../src/reader/compiler/canonical-equation-lesson-promotion-kit.ts";
import {
  compileKpEquationExemplarLessonModel
} from "../src/reader/compiler/equation-exemplar-lesson-model.ts";
import {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../src/rendering/exponent-radical-selector-annotated-latex.ts";

const dryRunId = "unit-exponent-dry-run";
const dryRunMarker = `reader.${dryRunId}`;
const changedFiles = [
  "tests/canonical-reader-unit-exponent-cost-proof.test.ts",
  "docs/project/reviews/2026-07-27-unit-exponent-promotion-kit-cost-proof.md",
  "docs/theseus/events/2026-07-27.jsonl",
  "docs/theseus/nodes/next-actions/next-action.kp.radical-reader-promotion-kit-v0.json",
  "docs/theseus/nodes/run-contracts/run-contract.kp.radical-reader-promotion-kit-v0.json",
  "package.json"
] as const;

test("unit-exponent dry run compiles through the promotion kit without a route", async () => {
  const animation =
    createKpGovernedExponentAbsorptionFixture().authority.animation;
  assert.equal(animation.bundle.objects.length, 3);
  const model = compileKpEquationExemplarLessonModel({
    animation,
    sourceId: `test.${dryRunMarker}`,
    documentId: `lesson.${dryRunMarker}`,
    version: "1",
    title: "Unit exponent promotion dry run",
    language: "en",
    markdown: compileDryRunMarkdown(animation),
    diagnosticLabel: dryRunId
  });
  const artifact = compileKpCanonicalEquationLessonPromotion({
    model,
    compiledLessonId: `compiled.lesson.${dryRunMarker}`,
    description:
      "Compile the governed unit-exponent operation without product routing.",
    lessonVariant: dryRunId,
    modeLink: {
      href: "/reader/radical-succession/",
      label: "Return to the radical exemplar"
    },
    annotateState: (state) =>
      createKpExponentRadicalSelectorAnnotatedLatex({
        objectId: state.id,
        selectors: state.selectors
      })
  });
  const descriptor = defineKpCanonicalEquationLessonDescriptor({
    id: dryRunId,
    createAnimation: () => animation,
    compactTranscriptAvailable: false
  });
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor,
    animation
  });
  const [routes, descriptors, entry] = await Promise.all([
    readFile("src/reader/compiler/reader-route-manifest.ts", "utf8"),
    readFile("src/reader/app/equation-lesson-descriptor.ts", "utf8"),
    readFile("src/reader/app/exemplar-entry.ts", "utf8")
  ]);

  assert.equal(artifact.id, `compiled.lesson.${dryRunMarker}`);
  assert.match(
    artifact.html,
    /data-kp-reader-lesson-variant="unit-exponent-dry-run"/
  );
  assert.match(
    artifact.html,
    /transform\.generated\.exponent\.square-as-product\.unwrap-unit-exponent/
  );
  assert.match(
    artifact.html,
    /expression\.generated\.exponent\.square-as-product\.lowered\.residual-exponent/
  );
  assert.deepEqual(
    policy?.transitionIds,
    animation.transformations.map(({ id }) => id)
  );
  for (const source of [routes, descriptors, entry]) {
    assert.doesNotMatch(source, /unit-exponent-dry-run/);
  }
});

test("unit-exponent dry-run diff passes the post-kit cost ratchet", () => {
  const evidence: KpCanonicalReaderPromotionCostEvidence = {
    schemaVersion: "kp.canonical-reader-promotion-cost.v1",
    promotionId: "promotion.unit-exponent.dry-run",
    changedFiles,
    addedLifecycleCategories: [],
    addedSchedulerCategories: [],
    notationSpecificGeometryFiles: [],
    addedRuntimeArtifactIds: []
  };

  assert.deepEqual(evaluateKpCanonicalReaderPromotionCost(evidence), []);
  assert.doesNotThrow(() => assertKpCanonicalReaderPromotionCost(evidence));
});

function compileDryRunMarkdown(
  animation: ReturnType<
    typeof createKpGovernedExponentAbsorptionFixture
  >["authority"]["animation"]
): string {
  const progress = [0, 500, 1_000] as const;
  const beats = animation.bundle.objects.map((state, index) => ({
    id: `beat.${dryRunId}.${index + 1}`,
    title: state.title,
    content:
      index === 1
        ? "The residual unit exponent is now ready to leave."
        : "Read the governed exponent state.",
    progressPermille: progress[index]!,
    focusRefs: state.selectors.map(({ id }) => id)
  }));
  return [
    "# Unit exponent promotion dry run",
    "",
    "This fixture exercises canonical compilation without product routing.",
    "",
    "```kp-animation-story",
    JSON.stringify({
      id: `story.${dryRunMarker}`,
      asset: { id: animation.id, version: "1" },
      presentation: "scroll-scrub",
      beats
    }, null, 2),
    "```"
  ].join("\n");
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpReaderCanonicalTransitionPolicy
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  numeratorSplitMergeDescriptor
} from "../src/reader/app/equation-lesson-descriptors/numerator-split-merge.ts";
import {
  radicalSuccessionDescriptor
} from "../src/reader/app/equation-lesson-descriptors/radical-succession.ts";
import {
  compileKpNumeratorSplitMergeEquationLesson
} from "../src/reader/compiler/numerator-split-merge-equation-lesson.ts";
import {
  kpNumeratorSplitMergePreservationManifest
} from "../src/reader/compiler/numerator-split-merge-preservation-manifest.ts";
import {
  compileKpRadicalSuccessionEquationLesson
} from "../src/reader/compiler/radical-succession-equation-lesson.ts";
import {
  kpRadicalSuccessionPreservationManifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";

const promotionCases = [
  {
    id: "numerator-split-merge",
    sourcePath: "content/lessons/numerator-split-merge.md",
    compiledLessonId: "compiled.lesson.fractions.numerator-split-merge",
    compile: compileKpNumeratorSplitMergeEquationLesson,
    descriptor: numeratorSplitMergeDescriptor,
    manifest: kpNumeratorSplitMergePreservationManifest
  },
  {
    id: "radical-succession",
    sourcePath: "content/lessons/radical-succession.md",
    compiledLessonId: "compiled.lesson.exponents.radical-succession",
    compile: compileKpRadicalSuccessionEquationLesson,
    descriptor: radicalSuccessionDescriptor,
    manifest: kpRadicalSuccessionPreservationManifest
  }
] as const;

test("fraction and radical promotions share one reader assembly kit", async () => {
  for (const candidate of promotionCases) {
    const markdown = await readFile(candidate.sourcePath, "utf8");
    const artifact = candidate.compile(markdown);
    const animation = candidate.descriptor.createAnimation();
    const policy = compileKpReaderCanonicalTransitionPolicy({
      descriptor: candidate.descriptor,
      animation
    });

    assert.equal(artifact.id, candidate.compiledLessonId);
    assert.equal(artifact.document.id, candidate.manifest.document.id);
    assert.match(
      artifact.html,
      new RegExp(`data-kp-reader-lesson-variant="${candidate.id}"`)
    );
    assert.match(
      artifact.html,
      new RegExp(`data-kp-reader-document-id="${escapeRegex(
        candidate.manifest.document.id
      )}"`)
    );
    assert.deepEqual(
      policy?.transitionIds,
      candidate.manifest.animation.transformationIds
    );
    assert.equal(policy?.presentationIntent, "exclusive-native-scene");
    assert.equal(Object.isFrozen(candidate.descriptor), true);
  }
});

test("promotion wrappers retain only lesson-specific configuration", async () => {
  const wrappers = await Promise.all([
    readFile(
      "src/reader/compiler/numerator-split-merge-equation-lesson.ts",
      "utf8"
    ),
    readFile(
      "src/reader/compiler/radical-succession-equation-lesson.ts",
      "utf8"
    )
  ]);
  for (const wrapper of wrappers) {
    assert.match(wrapper, /compileKpCanonicalEquationLessonPromotion/);
    assert.doesNotMatch(wrapper, /compileKpEquationExemplarPage/);
    assert.doesNotMatch(wrapper, /createKpCompiledLessonArtifact/);
    assert.doesNotMatch(wrapper, /serializeKpReaderHydrationManifest/);
  }
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

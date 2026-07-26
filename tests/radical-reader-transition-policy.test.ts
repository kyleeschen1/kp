import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpReaderCanonicalTransitionPolicy
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  streamlinedDescriptor
} from "../src/reader/app/equation-lesson-descriptors/linear.ts";
import {
  numeratorSplitMergeDescriptor
} from "../src/reader/app/equation-lesson-descriptors/numerator-split-merge.ts";
import {
  radicalSuccessionDescriptor
} from "../src/reader/app/equation-lesson-descriptors/radical-succession.ts";
import {
  kpRadicalSuccessionPreservationManifest as manifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";

test("canonical transition policy is descriptor-owned across reader exemplars", () => {
  const policies = [
    streamlinedDescriptor,
    numeratorSplitMergeDescriptor,
    radicalSuccessionDescriptor
  ].map((descriptor) => {
    const animation = descriptor.createAnimation();
    return {
      descriptor,
      animation,
      policy: compileKpReaderCanonicalTransitionPolicy({
        descriptor,
        animation
      })
    };
  });

  assert.deepEqual(policies.map(({ descriptor, policy }) => ({
    id: descriptor.id,
    transitionIds: policy?.transitionIds
  })), [
    {
      id: "streamlined",
      transitionIds: ["transform.linear-solve.cancel-left-additive-inverse"]
    },
    {
      id: "numerator-split-merge",
      transitionIds: policies[1]!.animation.transformations.map(({ id }) => id)
    },
    {
      id: "radical-succession",
      transitionIds: manifest.animation.transformationIds
    }
  ]);
});

test("radical policy reuses clock lifecycle and exclusive-paint authorities", () => {
  const animation = radicalSuccessionDescriptor.createAnimation();
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: radicalSuccessionDescriptor,
    animation
  })!;

  assert.deepEqual(policy, {
    transitionIds: manifest.animation.transformationIds,
    timingAuthority: "runtime-frame-clock",
    lifecycleAuthority: "equation-transition-ir",
    presentationIntent: "exclusive-native-scene"
  });
  assert.doesNotMatch(
    JSON.stringify(policy),
    /duration|easing|keyframe|radical-hook|fraction-line/
  );
});

test("canonical transition policy rejects stale or ambiguous selections", () => {
  const animation = radicalSuccessionDescriptor.createAnimation();
  assert.throws(
    () => compileKpReaderCanonicalTransitionPolicy({
      descriptor: {
        ...radicalSuccessionDescriptor,
        canonicalTransitionSelection: ["missing.transition"]
      },
      animation
    }),
    /unknown canonical transition/
  );
  assert.throws(
    () => compileKpReaderCanonicalTransitionPolicy({
      descriptor: {
        ...radicalSuccessionDescriptor,
        canonicalTransitionSelection: []
      },
      animation
    }),
    /must be non-empty and unique/
  );
});

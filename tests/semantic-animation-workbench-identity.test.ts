import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCanonicalAnimationIdentities,
  createKpCanonicalAnimationIdentity
} from "../src/editor/semantic-animation-workbench-identity.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

test("canonical animation identity preserves one id and nested aliases", () => {
  const [radical] = createKpAnimationWorkbenchSeedCohort();
  const identity = createKpCanonicalAnimationIdentity({
    seed: radical!,
    aliases: [
      "radical rewrite",
      "power to radical",
      "radical rewrite"
    ],
    familyIds: ["family.radical-rewrite"]
  });

  assert.deepEqual(identity, {
    schemaVersion: "kp.canonical-animation-identity.v1",
    animationId: "animation.generated.radical.square-root-as-power",
    title: "Power to radical",
    aliases: ["radical rewrite", "power to radical"],
    familyIds: ["family.radical-rewrite"],
    provenance: radical!.source,
    availability: "concrete"
  });
});

test("canonical identity registry rejects alias collisions", () => {
  const [radical, derivative] = createKpAnimationWorkbenchSeedCohort();
  const left = createKpCanonicalAnimationIdentity({
    seed: radical!,
    aliases: ["shared-alias"]
  });
  const right = createKpCanonicalAnimationIdentity({
    seed: derivative!,
    aliases: ["shared-alias"]
  });

  assert.throws(
    () => assertKpCanonicalAnimationIdentities([left, right]),
    /collides between/
  );
});

test("canonical identities keep concrete and planned provenance honest", () => {
  const seeds = createKpAnimationWorkbenchSeedCohort();
  const identities = seeds.map((seed) =>
    createKpCanonicalAnimationIdentity({ seed })
  );

  assert.doesNotThrow(() => assertKpCanonicalAnimationIdentities(identities));
  assert.deepEqual(
    identities.map((identity) => identity.availability),
    ["concrete", "concrete", "planned"]
  );
  assert.throws(
    () =>
      createKpCanonicalAnimationIdentity({
        seed: {
          ...seeds[0]!,
          animationId: "not-an-animation"
        }
      }),
    /must start with animation/
  );
});

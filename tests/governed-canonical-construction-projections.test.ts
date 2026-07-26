import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpGovernedCanonicalProjectionBundle,
  projectKpGovernedCanonicalConstructionCohort,
  serializeKpGovernedCanonicalProjectionBundle
} from "../src/authoring/governed-canonical-construction-projections.ts";

test("all output targets reference one central canonical artifact set", () => {
  const bundle = projectKpGovernedCanonicalConstructionCohort();
  const artifactIds = bundle.artifacts.map(({ id }) => id);
  const checkpointIds = bundle.checkpoints.map(({ id }) => id);

  assert.deepEqual(
    bundle.targets.map(({ kind }) => kind),
    ["static-js", "headless", "iframe", "static-step"]
  );
  for (const target of bundle.targets) {
    assert.strictEqual(target.artifactIds, bundle.targets[0]!.artifactIds);
    assert.strictEqual(target.checkpointIds, bundle.targets[0]!.checkpointIds);
    assert.deepEqual(target.artifactIds, artifactIds);
    assert.deepEqual(target.checkpointIds, checkpointIds);
    assert.deepEqual(
      Object.keys(target).sort(),
      [
        "artifactIds",
        "checkpointIds",
        "delivery",
        "entrypoint",
        "id",
        "kind"
      ]
    );
  }
  assert.equal(bundle.artifacts.length, 3);
  assert.equal(bundle.artifacts.flatMap(({ operations }) => operations).length, 4);
});

test("static-step checkpoints are a total ordered projection of canonical checkpoints", () => {
  const bundle = projectKpGovernedCanonicalConstructionCohort();
  const canonicalPairs = bundle.artifacts.flatMap((artifact) =>
    artifact.checkpoints.map((checkpoint) =>
      `${artifact.id}:${checkpoint.id}`
    )
  );

  assert.deepEqual(
    bundle.checkpoints.map(({ artifactId, checkpointId }) =>
      `${artifactId}:${checkpointId}`
    ),
    canonicalPairs
  );
  assert.equal(bundle.checkpoints[0]!.progress, 0);
  assert.equal(bundle.checkpoints.at(-1)!.progress, 1);
  assert.equal(
    bundle.checkpoints.every((checkpoint, index, checkpoints) =>
      index === 0 || checkpoint.progress > checkpoints[index - 1]!.progress
    ),
    true
  );
});

test("projection serialization is stable and contains no renderer-session state", () => {
  const first = projectKpGovernedCanonicalConstructionCohort();
  const second = projectKpGovernedCanonicalConstructionCohort();
  const serialized = serializeKpGovernedCanonicalProjectionBundle(first);

  assert.deepEqual(auditKpGovernedCanonicalProjectionBundle(first), []);
  assert.equal(
    serialized,
    serializeKpGovernedCanonicalProjectionBundle(second)
  );
  assert.deepEqual(JSON.parse(serialized), JSON.parse(JSON.stringify(first)));
  for (const forbidden of [
    "rendererSession",
    "renderer-session",
    "sourceElement",
    "targetElement",
    "computedStyle",
    "fontRevision",
    "viewportKey",
    "paintAtoms",
    "nativeAtoms"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("serialization audit rejects nested renderer state regardless of alias style", () => {
  const bundle = projectKpGovernedCanonicalConstructionCohort();
  const unsafe = {
    ...bundle,
    extension: {
      nested: {
        "renderer-session": { active: true }
      }
    }
  };

  const issues = auditKpGovernedCanonicalProjectionBundle(
    unsafe as typeof bundle
  );
  assert.deepEqual(
    issues.map(({ path }) => path),
    ["$.extension.nested.renderer-session"]
  );
  assert.throws(
    () => serializeKpGovernedCanonicalProjectionBundle(
      unsafe as typeof bundle
    ),
    /contains runtime state/
  );
});

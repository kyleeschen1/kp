import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpRetiredSemanticAnimationCompatibilityPaths,
  kpSemanticAnimationCompatibilityLedger,
  type KpSemanticAnimationCompatibilityStatus
} from "../src/architecture/semantic-animation-compatibility-ledger.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const metadataKeyPattern =
  /\bequation[A-Z][A-Za-z]+(?:Recipe|Strategy)\b/g;

test("compatibility ledger references live owners, authors, and consumers", () => {
  for (const entry of kpSemanticAnimationCompatibilityLedger) {
    assert.match(entry.id, /^compatibility\./);
    for (const sourceRef of [
      entry.owner,
      ...entry.authors,
      ...entry.consumers
    ]) {
      const absolutePath = join(projectRoot, sourceRef.path);
      assert.equal(existsSync(absolutePath), true, `missing ${sourceRef.path}`);
      assert.ok(
        readFileSync(absolutePath, "utf8").includes(sourceRef.evidence),
        `${sourceRef.path} does not contain ${sourceRef.evidence}`
      );
    }
    assert.ok(entry.requiredClosureEvidence.includes("reference"));
    assert.ok(entry.retirementCondition.length >= 40);
    assert.ok(entry.sunsetEvidence.length > 0);
    for (const sourceRef of entry.sunsetEvidence) {
      const absolutePath = join(projectRoot, sourceRef.path);
      assert.equal(existsSync(absolutePath), true, `missing ${sourceRef.path}`);
      assert.ok(
        readFileSync(absolutePath, "utf8").includes(sourceRef.evidence),
        `${sourceRef.path} does not contain ${sourceRef.evidence}`
      );
    }
  }
});

test("every compatibility path has one enforced disposition and owner", () => {
  const allowed = new Set<KpSemanticAnimationCompatibilityStatus>([
    "canonical",
    "compatibility-only",
    "retirement-candidate",
    "retained-fixture"
  ]);
  const ids = kpSemanticAnimationCompatibilityLedger.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  for (const entry of kpSemanticAnimationCompatibilityLedger) {
    assert.equal(allowed.has(entry.status), true, entry.id);
    assert.match(entry.owner.path, /^src\/.+\.ts$/);
    assert.ok(entry.owner.evidence.length > 0);
  }
  assert.deepEqual(
    kpSemanticAnimationCompatibilityLedger
      .filter(({ status }) => status === "canonical")
      .map(({ id }) => id),
    ["compatibility.cross-surface-animation-projections"]
  );
  assert.deepEqual(
    kpSemanticAnimationCompatibilityLedger
      .filter(({ status }) => status === "retirement-candidate")
      .map(({ contractKey }) => contractKey),
    []
  );
  assert.deepEqual(
    kpRetiredSemanticAnimationCompatibilityPaths.map(
      ({ formerContractKey }) => formerContractKey
    ),
    [
      "equationSequenceEnvelopeRecipe",
      "equationFractionHierarchyRecipe"
    ]
  );
});

test("retired compatibility keys have complete production reference closure", () => {
  const sourceFiles = typescriptFilesBeneath("src").filter(
    (path) => !path.endsWith("semantic-animation-compatibility-ledger.ts")
  );

  for (const retired of kpRetiredSemanticAnimationCompatibilityPaths) {
    assert.ok(retired.removedFrom.length > 0);
    assert.ok(retired.replacement.startsWith("Typed "));
    assert.equal(
      sourceFiles.some((sourcePath) =>
        readFileSync(join(projectRoot, sourcePath), "utf8")
          .includes(retired.formerContractKey)
      ),
      false,
      `retired compatibility key remains live: ${retired.formerContractKey}`
    );
  }
});

test("presentation metadata ledger exactly closes over production recipe keys", () => {
  const metadataEntries = kpSemanticAnimationCompatibilityLedger.filter(
    ({ category }) => category === "presentation-metadata"
  );
  const expectedKeys = metadataEntries.map(({ contractKey }) => contractKey!);
  const actualKeys = new Set<string>();
  for (const sourcePath of typescriptFilesBeneath("src")) {
    if (sourcePath.endsWith("semantic-animation-compatibility-ledger.ts")) {
      continue;
    }
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    for (const match of source.matchAll(metadataKeyPattern)) {
      actualKeys.add(match[0]);
    }
  }

  assert.deepEqual([...actualKeys].sort(), [...expectedKeys].sort());
  assert.equal(new Set(expectedKeys).size, expectedKeys.length);
});

test("every production reference to a presentation key is classified", () => {
  const metadataEntries = kpSemanticAnimationCompatibilityLedger.filter(
    ({ category }) => category === "presentation-metadata"
  );
  const sourceFiles = typescriptFilesBeneath("src").filter(
    (path) => !path.endsWith("semantic-animation-compatibility-ledger.ts")
  );

  for (const entry of metadataEntries) {
    const referencedPaths = sourceFiles.filter((sourcePath) =>
      readFileSync(join(projectRoot, sourcePath), "utf8")
        .includes(entry.contractKey!)
    );
    const classifiedPaths = new Set([
      entry.owner.path,
      ...entry.authors.map(({ path }) => path),
      ...entry.consumers.map(({ path }) => path)
    ]);
    assert.deepEqual(
      referencedPaths.sort(),
      [...classifiedPaths].sort(),
      `unclassified reference to ${entry.contractKey}`
    );
    if (entry.consumers.length === 0) {
      assert.equal(entry.status, "retirement-candidate");
    }
  }
});

test("destructive compatibility candidates require replacement and fixture proof", () => {
  for (const entry of kpSemanticAnimationCompatibilityLedger) {
    if (
      entry.status === "retirement-candidate" ||
      entry.status === "compatibility-only"
    ) {
      assert.ok(entry.requiredClosureEvidence.includes("replacement"));
      assert.ok(entry.requiredClosureEvidence.includes("fixture"));
    }
  }
  const crossSurface = kpSemanticAnimationCompatibilityLedger.find(
    ({ id }) => id === "compatibility.cross-surface-animation-projections"
  )!;
  assert.deepEqual(crossSurface.requiredClosureEvidence, [
    "reference",
    "replacement",
    "route",
    "review",
    "export",
    "fixture"
  ]);
});

function typescriptFilesBeneath(relativeDirectory: string): string[] {
  const absoluteDirectory = join(projectRoot, relativeDirectory);
  return readdirSync(absoluteDirectory, {
    recursive: true,
    withFileTypes: true
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) =>
      join(
        relativeDirectory,
        entry.parentPath.slice(absoluteDirectory.length + 1),
        entry.name
      )
    );
}

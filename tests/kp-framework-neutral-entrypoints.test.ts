import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import type {
  KpTypescriptImportEdge,
  KpTypescriptImportGraph,
  KpTypescriptImportReference
} from "../scripts/typescript-import-extractor.ts";
import { collectKpTypescriptImportGraph } from
  "../scripts/typescript-import-extractor.ts";
import { auditKpFrameworkNeutralEntrypoints } from
  "../src/architecture/kp-framework-neutral-entrypoint-policy.ts";
import {
  defineKpFrameworkNeutralEntrypoints,
  kpFrameworkNeutralEntrypointIds,
  kpFrameworkNeutralEntrypoints
} from "../src/architecture/kp-framework-neutral-entrypoints.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("five immutable framework-neutral entrypoints exist with explicit exports", () => {
  assert.deepEqual(
    kpFrameworkNeutralEntrypoints.map(({ id }) => id),
    [...kpFrameworkNeutralEntrypointIds]
  );
  assert.ok(Object.isFrozen(kpFrameworkNeutralEntrypoints));
  for (const definition of kpFrameworkNeutralEntrypoints) {
    assert.ok(Object.isFrozen(definition));
    assert.ok(Object.isFrozen(definition.allowedOwnershipZones));
    assert.ok(Object.isFrozen(definition.allowedExternalPackages));
    assert.ok(existsSync(definition.modulePath));
    const source = readFileSync(definition.modulePath, "utf8");
    assert.doesNotMatch(source, /export\s+\*/u);
    assert.doesNotMatch(source, /\.svelte|["']svelte(?:\/|["'])/u);
  }
});

test("the live transitive closures remain outside framework and product hosts", () => {
  const graph = collectKpTypescriptImportGraph(repositoryRoot);
  assert.deepEqual(auditKpFrameworkNeutralEntrypoints(graph), []);
});

test("each public role resolves through its supported facade", async () => {
  const [semantic, runtime, renderer, authoring, publication] =
    await Promise.all([
      import("../src/public/semantic.ts"),
      import("../src/public/runtime.ts"),
      import("../src/public/renderer.ts"),
      import("../src/public/authoring.ts"),
      import("../src/public/publication.ts")
    ]);
  assert.equal(typeof semantic.createKpAssetBundle, "function");
  assert.equal(typeof runtime.sampleKpAnimationRuntimeFrame, "function");
  assert.equal(typeof renderer.projectGraphPoint3D, "function");
  assert.equal(typeof authoring.defineKpLessonDocument, "function");
  assert.equal(typeof publication.compileKpStaticLessonProse, "function");
});

test("negative policy rejects unregistered public modules and host reachability", () => {
  const graph = syntheticGraph({
    sourcePaths: [
      ...entrypointPaths(),
      "src/public/private-helper.ts",
      "src/editor/private-host.ts"
    ],
    edges: [edge(
      "src/public/semantic.ts",
      "../editor/private-host.ts",
      "src/editor/private-host.ts"
    )]
  });
  assert.deepEqual(
    auditKpFrameworkNeutralEntrypoints(graph)
      .map(({ kind }) => kind)
      .sort(),
    ["forbidden-transitive-module", "unregistered-public-entrypoint"].sort()
  );
});

test("negative policy rejects undeclared dependencies and unsupported public targets", () => {
  const external = reference("src/public/runtime.ts", "svelte");
  const privatePublicEdge = edge(
    "src/public-web/consumer.ts",
    "../public/private-helper.ts",
    "src/public/private-helper.ts"
  );
  const graph = syntheticGraph({
    sourcePaths: [
      ...entrypointPaths(),
      "src/public/private-helper.ts",
      "src/public-web/consumer.ts"
    ],
    references: [external],
    edges: [privatePublicEdge]
  });
  assert.deepEqual(
    auditKpFrameworkNeutralEntrypoints(graph)
      .map(({ kind }) => kind)
      .sort(),
    [
      "unregistered-public-entrypoint",
      "undeclared-external-package",
      "unsupported-public-target"
    ].sort()
  );
});

test("entrypoint declarations reject duplicates and incomplete role sets", () => {
  const entries = kpFrameworkNeutralEntrypoints.map((entry) => ({ ...entry }));
  assert.throws(() => defineKpFrameworkNeutralEntrypoints([
    ...entries.slice(0, -1),
    { ...entries.at(-1)!, id: "semantic" }
  ]), /duplicated/);
  assert.throws(() => defineKpFrameworkNeutralEntrypoints(
    entries.filter(({ id }) => id !== "publication")
  ), /every public role once/);
});

function entrypointPaths(): readonly string[] {
  return kpFrameworkNeutralEntrypoints.map(({ modulePath }) => modulePath);
}

function syntheticGraph(input: {
  readonly sourcePaths: readonly string[];
  readonly references?: readonly KpTypescriptImportReference[];
  readonly edges?: readonly KpTypescriptImportEdge[];
}): KpTypescriptImportGraph {
  const edges = input.edges ?? [];
  return {
    sourcePaths: input.sourcePaths,
    references: [...(input.references ?? []), ...edges],
    localEdges: edges,
    unresolvedLocalReferences: []
  };
}

function edge(
  importer: string,
  specifier: string,
  target: string
): KpTypescriptImportEdge {
  return {
    ...reference(importer, specifier),
    target
  };
}

function reference(
  importer: string,
  specifier: string
): KpTypescriptImportReference {
  return {
    importer,
    specifier,
    kind: "runtime",
    syntax: "import",
    line: 1,
    column: 1
  };
}

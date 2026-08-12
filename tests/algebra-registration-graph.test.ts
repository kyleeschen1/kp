import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const audit = JSON.parse(readFileSync(new URL(
  "./fixtures/algebra-registration-graph.json",
  import.meta.url
), "utf8")) as {
  readonly schemaVersion: string;
  readonly status: string;
  readonly pack: string;
  readonly sideEffectImports: readonly string[];
  readonly mutableRegistries: readonly {
    readonly owner: string;
    readonly register: string;
    readonly lookup: string;
    readonly registrationModule: string;
    readonly consumers: readonly string[];
  }[];
  readonly reverseRegistry: {
    readonly owner: string;
    readonly register: string;
    readonly lookup: string;
    readonly registrationModule: string;
    readonly consumer: string;
    readonly transformTypes: readonly string[];
  };
  readonly replacementOwners: readonly string[];
};

function source(path: string): string {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("the frozen algebra registration graph is retired without losing its inventory", () => {
  assert.equal(audit.schemaVersion, "kp.algebra.registration-graph.v2");
  assert.equal(audit.status, "retired");
  const pack = source(audit.pack);
  for (const importPath of audit.sideEffectImports) {
    assert.ok(
      !pack.includes(`import ${JSON.stringify(importPath)};`),
      `retired side-effect import remains: ${importPath}`
    );
  }
  assert.equal(audit.sideEffectImports.length, 4);
});

test("registration-only modules and mutable slots no longer exist", () => {
  for (const registry of audit.mutableRegistries) {
    assert.throws(() => source(registry.owner), registry.owner);
    assert.throws(() => source(registry.registrationModule), registry.registrationModule);
  }
  const production = sourceTree();
  assert.doesNotMatch(production, /\bregisteredRuntime\b/u);
  assert.doesNotMatch(production, /registerKp(?:FissionFusion|DistributionChoreography|FactoringChoreography)Runtime/u);
});

test("the reverse mutable map is replaced by one immutable eight-entry capability", () => {
  const registry = audit.reverseRegistry;
  assert.throws(() => source(registry.owner));
  assert.throws(() => source(registry.registrationModule));
  const replacement = source(
    "src/animation/catalog-packs/algebra-reverse-capability.ts"
  );
  for (const transformType of registry.transformTypes) {
    assert.match(
      replacement,
      new RegExp(`entry\\(\\s*${JSON.stringify(transformType)},`, "u"),
      `missing reverse registration ${transformType}`
    );
  }
  assert.equal(registry.transformTypes.length, 8);
});

test("every replacement owner exists and the pack exposes capability values", () => {
  for (const path of audit.replacementOwners) assert.ok(source(path).length > 0);
  const pack = source(audit.pack);
  assert.match(pack, /runtimeCapabilities: kpAlgebraChoreographyCapabilities/u);
});

function sourceTree(): string {
  return [
    source("src/animation/catalog-packs/algebra.ts"),
    source("src/animation/algebra-choreography-capabilities.ts"),
    source("src/animation/runtime-capabilities.ts"),
    source("src/rendering/semantic-equation-token-renderer.ts")
  ].join("\n");
}

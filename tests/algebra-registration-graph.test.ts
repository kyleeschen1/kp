import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const audit = JSON.parse(readFileSync(new URL(
  "./fixtures/algebra-registration-graph.json",
  import.meta.url
), "utf8")) as {
  readonly schemaVersion: string;
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
};

function source(path: string): string {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("the algebra pack owns four import-time registration edges", () => {
  assert.equal(audit.schemaVersion, "kp.algebra.registration-graph.v1");
  const pack = source(audit.pack);
  for (const importPath of audit.sideEffectImports) {
    assert.ok(
      pack.includes(`import ${JSON.stringify(importPath)};`),
      `missing side-effect import ${importPath}`
    );
  }
});

test("three choreography registries expose mutable module-scoped slots", () => {
  for (const registry of audit.mutableRegistries) {
    const owner = source(registry.owner);
    const registration = source(registry.registrationModule);
    assert.match(owner, /let registeredRuntime:/u, registry.owner);
    assert.ok(owner.includes(`function ${registry.register}(`), registry.register);
    assert.ok(owner.includes(`function ${registry.lookup}(`), registry.lookup);
    assert.ok(registration.includes(`${registry.register}({`), registry.registrationModule);
    for (const consumerPath of registry.consumers) {
      assert.ok(source(consumerPath).includes(registry.lookup), consumerPath);
    }
  }
});

test("reverse choreography is registered into a mutable map for eight transform types", () => {
  const registry = audit.reverseRegistry;
  const owner = source(registry.owner);
  const registration = source(registry.registrationModule);
  assert.match(owner, /new Map<string, KpCanonicalReverseChoreographyPlan>/u);
  assert.ok(owner.includes(`function ${registry.register}(`));
  assert.ok(owner.includes(`function ${registry.lookup}(`));
  assert.ok(registration.includes(`${registry.register}(`));
  assert.ok(source(registry.consumer).includes(registry.lookup));
  for (const transformType of registry.transformTypes) {
    assert.match(
      registration,
      new RegExp(`registration\\(\\s*${JSON.stringify(transformType)},`, "u"),
      `missing reverse registration ${transformType}`
    );
  }
});

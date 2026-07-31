import assert from "node:assert/strict";
import test from "node:test";

import { checkKpConceptRoomImports } from "../src/architecture/concept-room-import-fitness.ts";

test("architecture fitness allows declared dependencies through public APIs", () => {
  assert.deepEqual(checkKpConceptRoomImports([
    {
      path: "domains/algebra.ts",
      source: 'import type {} from "../src/kernel/public-api.ts";'
    },
    {
      path: "domains/exact-value.ts",
      source: 'import type {} from "../protocols/public-api.ts";'
    },
    {
      path: "src/app-adapters/room.ts",
      source: 'const projection = import("../projections/public-api.ts");'
    }
  ]), []);
});

test("domain packs cannot deep-import neutral protocol implementations", () => {
  assert.deepEqual(checkKpConceptRoomImports([
    {
      path: "domains/exact-value.ts",
      source: 'import {} from "../protocols/exact-rational.ts";'
    }
  ]), [
    {
      sourceFile: "domains/exact-value.ts",
      specifier: "../protocols/exact-rational.ts",
      sourceBoundary: "domains",
      targetBoundary: "protocols",
      kind: "cross-boundary-deep-import",
      message: "domains must import protocols/public-api.ts"
    }
  ]);
});

test("architecture fitness rejects reversed dependency direction", () => {
  assert.deepEqual(checkKpConceptRoomImports([
    {
      path: "protocols/linear-problem.ts",
      source: 'import type {} from "../src/kernel/public-api.ts";'
    }
  ]), [
    {
      sourceFile: "protocols/linear-problem.ts",
      specifier: "../src/kernel/public-api.ts",
      sourceBoundary: "protocols",
      targetBoundary: "kernel",
      kind: "dependency-direction",
      message: "protocols may not import kernel"
    }
  ]);
});

test("architecture fitness rejects cross-boundary deep imports", () => {
  assert.deepEqual(checkKpConceptRoomImports([
    {
      path: "domains/algebra.ts",
      source: 'import type {} from "../src/kernel/internal-state.ts";'
    }
  ]), [
    {
      sourceFile: "domains/algebra.ts",
      specifier: "../src/kernel/internal-state.ts",
      sourceBoundary: "domains",
      targetBoundary: "kernel",
      kind: "cross-boundary-deep-import",
      message: "domains must import src/kernel/public-api.ts"
    }
  ]);
});

test("content can consume authoring only through its public API", () => {
  assert.deepEqual(checkKpConceptRoomImports([
    {
      path: "content/mathematics/example/concept.ts",
      source: 'import {} from "../../../src/authoring/handles.ts";'
    }
  ]), [
    {
      sourceFile: "content/mathematics/example/concept.ts",
      specifier: "../../../src/authoring/handles.ts",
      sourceBoundary: "content",
      targetBoundary: "authoring",
      kind: "cross-boundary-deep-import",
      message: "content must import src/authoring/public-api.ts"
    }
  ]);
});

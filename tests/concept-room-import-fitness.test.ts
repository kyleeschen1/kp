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
      path: "src/app-adapters/room.ts",
      source: 'const projection = import("../projections/public-api.ts");'
    }
  ]), []);
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


import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const fixtureRoot = join(
  projectRoot,
  "fixtures/typescript/free-shipping-threshold"
);
const beforePath = join(fixtureRoot, "shipping-before.ts");
const afterPath = join(fixtureRoot, "shipping-after.ts");

test("the exact source fixtures match the frozen pedagogical contract", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;

  assert.equal(readSource(beforePath), contract.before.source);
  assert.equal(readSource(afterPath), contract.after.source);
  assert.deepEqual(
    {
      before: sha256(readFileSync(beforePath)),
      after: sha256(readFileSync(afterPath))
    },
    {
      before: "ee98ebef1292e0eb74b9a2eb8286f3d2fc5e34163bd3ff7b95bf83e95a9d3c2a",
      after: "7720c33152036f2c957a05076ebd57337b5bc0bbdd9f3eb995e7339fc0770274"
    }
  );
});

test("both source revisions are syntactically and semantically valid TypeScript", () => {
  const program = ts.createProgram([beforePath, afterPath], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: []
  });
  const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
    code: diagnostic.code,
    file: diagnostic.file?.fileName,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
  }));

  assert.deepEqual(diagnostics, []);
});

test("the serializable behavior fixture matches below at and above cases", () => {
  const cases = JSON.parse(readFileSync(
    join(fixtureRoot, "behavior-cases.json"),
    "utf8"
  ));

  assert.deepEqual(
    cases,
    kpTypeScriptFreeShippingRefactorContract.behaviorCases
  );
  assert.deepEqual(cases.map(({ total }: { total: number }) => total), [
    49,
    50,
    75
  ]);
});

function readSource(path: string): string {
  return readFileSync(path, "utf8").replace(/\n$/, "");
}

function sha256(source: Uint8Array): string {
  return createHash("sha256").update(source).digest("hex");
}

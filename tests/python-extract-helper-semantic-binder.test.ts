import assert from "node:assert/strict";
import test from "node:test";

import {
  proveKpPythonExtractHelperLegality
} from "../scripts/python-extract-helper-legality.ts";
import {
  recognizeKpPythonExtractHelperRoles
} from "../scripts/python-extract-helper-role-recognizer.ts";
import {
  bindKpPythonExtractHelperSemantics
} from "../scripts/python-extract-helper-semantic-binder.ts";
import { compileKpPythonFrontend } from "../scripts/python-refactor-frontend.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

function canonicalInput() {
  const contract = kpPythonFreeShippingRefactorContract;
  const source = compileKpPythonFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });
  const target = compileKpPythonFrontend({
    path: contract.after.path,
    revisionId: contract.after.revisionId,
    sourceText: contract.after.source
  });
  const roles = recognizeKpPythonExtractHelperRoles(source, target);
  const legality = proveKpPythonExtractHelperLegality(source, target, roles);
  assert.equal(legality.status, "accepted");
  if (legality.status !== "accepted") throw new Error("fixture must be legal");
  return { contract, source, target, roles, legality };
}

test("binds every authored Python semantic id to one AST record", () => {
  const input = canonicalInput();
  const result = bindKpPythonExtractHelperSemantics({
    entities: input.contract.entities,
    source: input.source,
    target: input.target,
    roles: input.roles,
    legality: input.legality
  });

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(
    result.bindings.map(({ semanticEntityId }) => semanticEntityId),
    input.contract.entities.map(({ id }) => id)
  );
  assert.equal(new Set(result.bindings.map(({ revision, syntaxRecordId }) =>
    `${revision}:${syntaxRecordId}`
  )).size, result.bindings.length);
});

test("Python call bindings separate lexical owner from called declaration", () => {
  const input = canonicalInput();
  const result = bindKpPythonExtractHelperSemantics({
    entities: input.contract.entities,
    source: input.source,
    target: input.target,
    roles: input.roles,
    legality: input.legality
  });
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;

  const costCall = result.bindings.find(({ semanticEntityId }) =>
    semanticEntityId === "call.shipping-cost.after"
  );
  assert.equal(costCall?.scopeOwnerEntityId, "function.shipping-cost.after");
  assert.equal(costCall?.declarationEntityId, "function.qualifies.after");
});

test("missing Python ownership is a typed binding repair", () => {
  const input = canonicalInput();
  const entities = input.contract.entities.map((entity) =>
    entity.id === "call.shipping-cost.after"
      ? { ...entity, ownerEntityId: "function.missing.after" }
      : entity
  );
  const result = bindKpPythonExtractHelperSemantics({
    entities,
    source: input.source,
    target: input.target,
    roles: input.roles,
    legality: input.legality
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.ambiguous-ownership");
  assert.equal(result.diagnostics[0]?.phase, "bind");
});

test("Python binding and compilation contain no exemplar-name switches", async () => {
  const sources = await Promise.all([
    "scripts/python-extract-helper-semantic-binder.ts",
    "scripts/python-refactor-semantic-compiler.ts"
  ].map((path) => import("node:fs/promises").then(({ readFile }) =>
    readFile(path, "utf8")
  )));
  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /functionNameFromText|function ownerFunctionName|shipping_cost|shipping_message|qualifies_for_free_shipping/u
    );
  }
});

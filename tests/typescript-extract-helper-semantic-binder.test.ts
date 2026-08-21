import assert from "node:assert/strict";
import test from "node:test";

import {
  proveKpTypeScriptExtractHelperLegality
} from "../scripts/typescript-extract-helper-legality.ts";
import {
  recognizeKpTypeScriptExtractHelperRoles
} from "../scripts/typescript-extract-helper-role-recognizer.ts";
import {
  bindKpTypeScriptExtractHelperSemantics
} from "../scripts/typescript-extract-helper-semantic-binder.ts";
import {
  compileKpTypeScriptFrontend
} from "../scripts/typescript-refactor-frontend.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function canonicalInput() {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const source = compileKpTypeScriptFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });
  const target = compileKpTypeScriptFrontend({
    path: contract.after.path,
    revisionId: contract.after.revisionId,
    sourceText: contract.after.source
  });
  const roles = recognizeKpTypeScriptExtractHelperRoles(source, target);
  const legality = proveKpTypeScriptExtractHelperLegality(source, target, roles);
  assert.equal(legality.status, "accepted");
  if (legality.status !== "accepted") throw new Error("fixture must be legal");
  return { contract, source, target, roles, legality };
}

test("binds every authored semantic id to one compiler record", () => {
  const input = canonicalInput();
  const result = bindKpTypeScriptExtractHelperSemantics({
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

test("call bindings declare lexical owner and called declaration separately", () => {
  const input = canonicalInput();
  const result = bindKpTypeScriptExtractHelperSemantics({
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

test("missing ownership is a typed binding repair", () => {
  const input = canonicalInput();
  const entities = input.contract.entities.map((entity) =>
    entity.id === "call.shipping-cost.after"
      ? { ...entity, ownerEntityId: "function.missing.after" }
      : entity
  );
  const result = bindKpTypeScriptExtractHelperSemantics({
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

test("the binder contains no canonical exemplar name switches", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("scripts/typescript-extract-helper-semantic-binder.ts", "utf8")
  );
  assert.doesNotMatch(
    source,
    /shippingCost|shippingMessage|qualifiesForFreeShipping|shipping-cost/u
  );
});

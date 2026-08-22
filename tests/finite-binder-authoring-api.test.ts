import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpFiniteBinderAuthoringApi,
  isKpVerifiedFiniteBinderAuthoringArtifact,
  KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA
} from "../src/authoring/finite-binder-authoring-api.ts";
import {
  evaluateKpFiniteBinderAuthoringCorpus,
  kpFiniteBinderAuthoringCorpus
} from "../src/authoring/finite-binder-authoring-corpus.ts";

const api = createKpFiniteBinderAuthoringApi();

test("family authoring corpus governs both operators and typed repairs", () => {
  assert.deepEqual(evaluateKpFiniteBinderAuthoringCorpus(), {
    status: "passed",
    acceptedCount: 4,
    repairCount: 2
  });
  assert.deepEqual(
    kpFiniteBinderAuthoringCorpus.cases.map(({ operator }) => operator),
    ["sum", "product", "sum", "product", "sum", "product"]
  );
  assert.doesNotMatch(JSON.stringify(kpFiniteBinderAuthoringCorpus),
    /geometry|trajectory|keyframe|duration|renderer/iu);
});

test("finite-binder discovery lists and resolves both registered operators", () => {
  assert.deepEqual(api.list().map(({ operator }) => operator),
    ["sum", "product"]);
  assert.equal(api.list("sigma")[0]?.operator, "sum");
  assert.equal(api.list("product")[0]?.operator, "product");
  assert.equal(api.inspect("expand pi")?.operator, "product");
  assert.equal(api.inspect("not a binder"), undefined);
});

test("canonical authoring compiles verified sum and product catalogue artifacts", () => {
  const sum = api.compile(request({
    id: "authoring.sum.canonical",
    operator: "sum",
    source: "\\sum_{i=1}^{3} a_i",
    target: "a_1+a_2+a_3"
  }));
  const product = api.compile(request({
    id: "authoring.product.canonical",
    operator: "product",
    source: "\\prod_{k=0}^{2} x_k",
    target: "x_0x_1x_2"
  }));
  assert.equal(sum.status, "accepted");
  assert.equal(product.status, "accepted");
  if (sum.status !== "accepted" || product.status !== "accepted") return;

  assert.equal(sum.artifact.catalogue.status, "canonical-asset");
  assert.equal(product.artifact.catalogue.status, "canonical-asset");
  assert.match(sum.artifact.catalogue.animationId ?? "", /finite-sum/u);
  assert.match(product.artifact.catalogue.animationId ?? "", /finite-product/u);
  assert.equal(isKpVerifiedFiniteBinderAuthoringArtifact(sum.artifact), true);
  assert.equal(isKpVerifiedFiniteBinderAuthoringArtifact(product.artifact), true);
});

test("valid variants remain semantic-only until a reviewed asset owns them", () => {
  const result = api.compile(request({
    id: "authoring.product.variant",
    operator: "product",
    source: "\\prod_{n=2}^{4} y_n",
    target: "y_2y_3y_4"
  }));
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(result.artifact.operation.rangeProof.values, [2, 3, 4]);
  assert.equal(result.artifact.catalogue.status, "semantic-only");
  assert.equal(result.artifact.catalogue.animationId, undefined);
});

test("authoring returns layer-specific repairs without fallback animation", () => {
  const mismatch = api.compile(request({
    id: "authoring.product.mismatch",
    operator: "product",
    source: "\\prod_{k=0}^{2} x_k",
    target: "x_0x_2x_1"
  }));
  const symbolic = api.compile(request({
    id: "authoring.sum.symbolic",
    operator: "sum",
    source: "\\sum_{i=1}^{n} a_i",
    target: "a_1+\\cdots+a_n"
  }));
  assert.equal(mismatch.status, "repair-required");
  assert.equal(symbolic.status, "repair-required");
  if (mismatch.status !== "repair-required" ||
      symbolic.status !== "repair-required") return;
  assert.equal(mismatch.diagnostics[0]?.code,
    "finite-binder-authoring.expansion-invalid");
  assert.equal(symbolic.diagnostics[0]?.code,
    "finite-binder-authoring.source-unsupported");
  assert.doesNotMatch(JSON.stringify([mismatch, symbolic]),
    /fallback.*animation|generic.*animation/iu);
});

test("requests cannot mint authority timing geometry or renderer instructions", () => {
  const result = api.compile({
    ...request({
      id: "authoring.sum.unsafe",
      operator: "sum",
      source: "\\sum_{i=1}^{3} a_i",
      target: "a_1+a_2+a_3"
    }),
    authority: "caller.minted",
    timing: { duration: 0.25 },
    renderer: "svg"
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.diagnostics.some(({ code, path }) =>
    code === "finite-binder-authoring.unknown-field" &&
    path === "$.authority"
  ));
  assert.ok(result.diagnostics.some(({ code }) =>
    code === "finite-binder-authoring.unsafe-authority"
  ));
});

test("compiler artifacts are fresh branded results rather than copyable claims", () => {
  const input = request({
    id: "authoring.sum.freshness",
    operator: "sum",
    source: "\\sum_{i=1}^{3} a_i",
    target: "a_1+a_2+a_3"
  });
  const left = api.compile(input);
  const right = api.compile(input);
  assert.equal(left.status, "accepted");
  assert.equal(right.status, "accepted");
  if (left.status !== "accepted" || right.status !== "accepted") return;
  assert.notEqual(left.artifact, right.artifact);
  assert.notEqual(left.artifact.operation, right.artifact.operation);
  assert.equal(isKpVerifiedFiniteBinderAuthoringArtifact({
    ...left.artifact
  }), false);
});

test("finite-binder authoring module stays free of presentation imports", async () => {
  const source = await readFile(new URL(
    "../src/authoring/finite-binder-authoring-api.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /src\/editor|\.\.\/editor|\.\.\/rendering|surface-adapter|motion\.ts|presentation-plan/u);
});

function request(input: {
  readonly id: string;
  readonly operator: "sum" | "product";
  readonly source: string;
  readonly target: string;
}) {
  return {
    schemaVersion: KP_FINITE_BINDER_AUTHORING_REQUEST_SCHEMA,
    ...input
  };
}

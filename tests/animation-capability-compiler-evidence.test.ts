import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpAnimationCapabilityCompilerEvidence,
  createKpAnimationCapabilityCompilerEvidence,
  KpAnimationCapabilityCompilerEvidenceError,
  type KpAnimationCapabilityCompilerAuthority
} from "../src/architecture/animation-capability-compiler-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";

test("compiler evidence projects exact extension-pack registrations", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const expected = new Map([
    ["requirement.equation.function-wrapping.operation", "semantic-operation"],
    ["requirement.equation.function-wrapping.recipe", "canonical-recipe"],
    ["requirement.equation.function-wrapping.motif", "motion-motif"]
  ]);
  for (const [requirementId, kind] of expected) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "matched", requirementId);
    assert.equal(requirement?.kind, kind);
    if (requirement?.status !== "matched") continue;
    assert.ok(requirement.evidence.some(({ source }) =>
      source === "equation-extension-pack"));
  }
  assert.ok(projection.authorities.some((authority) =>
    authority.kind === "renderer-capability" &&
    authority.authorityId ===
      "renderer-capability.equation.native-katex.v1"));
});

test("compiler evidence joins promoted operations and declared recipes", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const distributionOperation = projection.requirements.find(({ requirementId }) =>
    requirementId === "requirement.equation.distribution.operation"
  );
  const distributionRecipe = projection.requirements.find(({ requirementId }) =>
    requirementId === "requirement.equation.distribution.recipe"
  );
  const cancellationOperation = projection.requirements.find(({ requirementId }) =>
    requirementId === "requirement.equation.additive-cancellation.operation"
  );
  assert.equal(distributionOperation?.status, "matched");
  assert.equal(distributionRecipe?.status, "matched");
  assert.equal(cancellationOperation?.status, "matched");
  if (distributionOperation?.status === "matched") {
    assert.equal(distributionOperation.evidence[0]?.source,
      "llm-operation-catalogue");
  }
  if (distributionRecipe?.status === "matched") {
    assert.equal(distributionRecipe.evidence[0]?.source,
      "equation-authoring-catalogue");
  }
});

test("balanced operations expose exact family and causal recipe authority", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const expected = new Map([
    [
      "requirement.equation.balanced-operations.operation",
      [
        "operation.equation.apply-both-sides.v1",
        "authoring.equation.balanced-operation.v1"
      ]
    ],
    [
      "requirement.equation.balanced-operations.recipe",
      [
        "recipe.equation.balanced-operation.v1",
        "recipe.equation.balanced-operation.v1"
      ]
    ]
  ]);
  for (const [requirementId, [authorityId, sourceId]] of expected) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "matched", requirementId);
    assert.equal(requirement?.authorityId, authorityId);
    if (requirement?.status !== "matched") continue;
    assert.equal(requirement.evidence[0]?.sourceId, sourceId);
  }
});

test("one homomorphic recipe is exact authority for both logarithm laws", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const expectations = new Map([
    ["requirement.equation.log-homomorphism.product-operation", [
      "equation-pack.homomorphic-crossover.v1"
    ]],
    ["requirement.equation.log-homomorphism.quotient-operation", [
      "equation-pack.homomorphic-crossover.v1"
    ]],
    ["requirement.equation.log-homomorphism.recipe", [
      "recipe.equation.homomorphic-decomposition.v1",
      "equation-pack.homomorphic-crossover.v1"
    ]]
  ]);
  for (const [requirementId, sourceIds] of expectations) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "matched", requirementId);
    if (requirement?.status !== "matched") continue;
    assert.deepEqual(
      [...new Set(requirement.evidence.map(({ sourceId }) => sourceId))],
      sourceIds
    );
  }
});

test("reviewed alternative-base authorities are exact registrations", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const requirementIds = [
    "requirement.equation.logarithm-base.normalizer",
    "requirement.equation.logarithm-base.operation",
    "requirement.equation.logarithm-base.recipe",
    "requirement.equation.logarithm-base.motif",
    "requirement.equation.logarithm-base.corpus"
  ];
  for (const requirementId of requirementIds) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "matched", requirementId);
    if (requirement?.status !== "matched") continue;
    assert.equal(requirement.evidence[0]?.source,
      "verified-capability-authority");
  }
});

test("radical endpoint normalization is exact typed compiler authority", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const requirement = projection.requirements.find(({ requirementId }) =>
    requirementId === "requirement.equation.radical-inversion.normalizer"
  );
  assert.equal(requirement?.status, "matched");
  assert.equal(requirement?.authorityId, "normalizer.equation.radical.v1");
  if (requirement?.status !== "matched") return;
  assert.deepEqual(requirement.evidence.map(({ source, sourcePath }) => ({
    source,
    sourcePath
  })), [{
    source: "verified-capability-authority",
    sourcePath: "src/semantic/radical-endpoint-normalizer.ts"
  }]);
});

test("radical inversion operation includes strict typed semantic authority", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const requirement = projection.requirements.find(({ requirementId }) =>
    requirementId === "requirement.equation.radical-inversion.operation"
  );
  assert.equal(requirement?.status, "matched");
  assert.equal(requirement?.authorityId,
    "operation.equation.apply-inverse-power.v1");
  if (requirement?.status !== "matched") return;
  assert.ok(requirement.evidence.some(({ source, sourcePath }) =>
    source === "verified-capability-authority" &&
    sourcePath === "src/semantic/inverse-power-operation.ts"));
});

test("root promotion has exact plan recipe and corpus authorities", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  for (const [requirementId, authorityId] of [
    ["requirement.equation.radical-inversion.rewrite-plan",
      "compiler.equation.root-rewrite-plan.v1"],
    ["requirement.equation.radical-inversion.recipe",
      "recipe.equation.radical-inversion.v1"],
    ["requirement.equation.radical-inversion.corpus",
      "corpus.equation.radical-inversion.v1"]
  ] as const) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId);
    assert.equal(requirement?.status, "matched", requirementId);
    assert.equal(requirement?.authorityId, authorityId);
  }
});

test("code frontends expose exact operation recipe and corpus authorities", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  for (const requirementId of [
    "requirement.code.typescript-refactoring.operation",
    "requirement.code.typescript-refactoring.recipe",
    "requirement.code.typescript-refactoring.corpus",
    "requirement.code.python-refactoring.operation",
    "requirement.code.python-refactoring.recipe",
    "requirement.code.python-refactoring.corpus"
  ]) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "matched", requirementId);
    if (requirement?.status !== "matched") continue;
    assert.ok(requirement.evidence.every(({ sourcePath }) =>
      sourcePath.includes("code-") || sourcePath.includes("extract-helper")
    ));
  }
});

test("compiler evidence rejects duplicate source registrations", () => {
  const duplicate: KpAnimationCapabilityCompilerAuthority = {
    authorityId: "operation.wrap-function.v1",
    kind: "semantic-operation",
    source: "equation-extension-pack",
    sourceId: "equation-pack.function-wrap.v1",
    sourcePath: "src/animation/equation-extension-packs/function-wrap.ts"
  };
  assert.throws(() => compileKpAnimationCapabilityCompilerEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [duplicate, duplicate]
  }), (error: unknown) =>
    error instanceof KpAnimationCapabilityCompilerEvidenceError &&
    error.diagnostics[0]?.code === "compiler-evidence.duplicate-authority");
});

test("compiler projection remains a renderer-free read-only adapter", async () => {
  const source = await readFile(new URL(
    "../src/architecture/animation-capability-compiler-evidence.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /from\s+["'][^"']*render(?:er|ing)/u);
  assert.doesNotMatch(source, /from\s+["'][^"']*animation\/catalog/u);
  assert.doesNotMatch(source, /createKp(?:Equation)?(?:Operation|Recipe|Motif|RendererCapability|Family)Registry/u);
  assert.equal(Object.isFrozen(
    createKpAnimationCapabilityCompilerEvidence().requirements
  ), true);
});

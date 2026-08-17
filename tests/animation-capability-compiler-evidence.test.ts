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

test("planned alternative-base authorities remain exact compiler gaps", () => {
  const projection = createKpAnimationCapabilityCompilerEvidence();
  const requirementIds = [
    "requirement.equation.logarithm-base.operation",
    "requirement.equation.logarithm-base.recipe",
    "requirement.equation.logarithm-base.motif"
  ];
  for (const requirementId of requirementIds) {
    const requirement = projection.requirements.find((candidate) =>
      candidate.requirementId === requirementId
    );
    assert.equal(requirement?.status, "missing", requirementId);
    if (requirement?.status !== "missing") continue;
    assert.equal(requirement.reason, "no-exact-compiler-authority");
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

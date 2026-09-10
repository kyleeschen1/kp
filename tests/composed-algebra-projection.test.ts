import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { checkKpComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { createKpComposedAlgebraSemanticAsset } from "../src/semantic/composed-algebra-asset.ts";
import { projectKpIntegerMultipleFactoring } from "../src/semantic/integer-multiple-factoring-projection.ts";
import { projectKpContextualConstantSum } from "../src/semantic/contextual-constant-sum-projection.ts";
import { defineKpSemanticOperationProjector, composeKpSemanticOperationProjections } from "../src/semantic/semantic-operation-projection.ts";
import { isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "../src/semantic/composed-algebra-factoring.ts";
import { projectKpStructuredScalarLatex, KpScalarLatexProjectionGap } from "../src/semantic/structured-scalar-latex.ts";
import { validateCorrespondenceMap } from "../src/semantic/correspondence.ts";

test("registered operation owners compose exact endpoints and canonical total lineage", () => {
  const { chain } = checkKpComposedAlgebraProof(primary);
  const factoring = projectKpIntegerMultipleFactoring(chain.steps[0]), evaluation = projectKpContextualConstantSum(chain.steps[1]);
  assert.deepEqual(factoring.endpoints[1], evaluation.endpoints[0]);
  const asset = createKpComposedAlgebraSemanticAsset(chain);
  assert.deepEqual(asset.bundle.objects.map(o => o.value), [
    { latex: "2(x+3) + 3(x+3)" }, { latex: "(2 + 3)(x+3)" }, { latex: "5(x+3)" }
  ]);
  for (const projection of [factoring, evaluation]) assert.deepEqual(validateCorrespondenceMap(projection.transformation.correspondenceMap!, {
    sourceSelectorIds: projection.endpoints[0].object.selectors.map(s => s.id),
    targetSelectorIds: projection.endpoints[1].object.selectors.map(s => s.id)
  }), []);
  assert.equal(factoring.transformation.definitionId, "definition.generated.distribution.factor-common-term");
  assert.equal(evaluation.transformation.definitionId, chain.steps[1].localEvaluation.transformation.definitionId);
  assert.deepEqual(evaluation.endpoints[0].tokens.filter(t => t.metadata).map(t => t.metadata),
    chain.steps[1].localEvaluation.bundle.objects[0]!.selectors.map(s => s.metadata));
});

test("operation dispatch authenticates proofs and composition rejects endpoint drift", () => {
  const { chain } = checkKpComposedAlgebraProof(primary), proof = chain.steps[0];
  const project = defineKpSemanticOperationProjector<KpVerifiedComposedFactoring>({
    "verified-composed-factoring": { accepts: isKpVerifiedComposedFactoring, project: projectKpIntegerMultipleFactoring }
  });
  assert.deepEqual(project(proof), projectKpIntegerMultipleFactoring(proof));
  assert.throws(() => project({ ...proof }), TypeError);
  assert.throws(() => project({ kind: "unregistered" } as unknown as KpVerifiedComposedFactoring), TypeError);
  assert.throws(() => createKpComposedAlgebraSemanticAsset({ ...chain }), TypeError);
  const first = project(proof), second = projectKpContextualConstantSum(chain.steps[1]);
  assert.throws(() => composeKpSemanticOperationProjections("invalid", [second, first]), TypeError);
  const drift = structuredClone(second);
  Object.assign(drift.endpoints[0].object, { value: { latex: "wrong" } });
  assert.throws(() => composeKpSemanticOperationProjections("invalid", [first, drift]), TypeError);
});

test("shared scalar projection preserves supported notation and rejects unsupported shapes explicitly", () => {
  const { chain } = checkKpComposedAlgebraProof(primary);
  assert.equal(projectKpStructuredScalarLatex(chain.steps[0].factor, "display"), "(x+3)");
  assert.equal(projectKpStructuredScalarLatex(chain.endpoints[1].root, "explicit"), "((2+3)*(x+3))");
  const base = { id: "x", kind: "symbol" as const, name: "x" };
  assert.throws(() => projectKpStructuredScalarLatex({ id: "power", kind: "power", base,
    exponent: { id: "two", kind: "number", value: 2 } }, "display"), KpScalarLatexProjectionGap);
});

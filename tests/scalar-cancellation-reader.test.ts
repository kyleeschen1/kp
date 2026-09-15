import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkScalarCancellation, scalarCancellationSource, scalarCancellationView, checkMomentumEnergyDerivation,
  momentumEnergyDerivationSource } from "../domains/public-api.ts";
import { createScalarCancellationPlan, assertEnergyDerivationPlan, type EnergyDerivationPlan } from "../src/semantic/momentum-energy-derivation-plan.ts";
import { compileScalarCancellation } from "../src/authoring/momentum-energy-derivation-authoring.ts";
import { createDerivationOutline } from "../src/tutorial/mechanics-relations/energy-derivation-outline.ts";
import { renderCheckedDerivationPassage } from "../src/tutorial/mechanics-relations/momentum-energy-derivation-publication.ts";
import { compileScalarCancellationPublication, scalarCancellationArticlePath, scalarCancellationSourcePath } from "../src/tutorial/mechanics-relations/scalar-cancellation-publication.ts";

const checked = () => {
  const result = checkScalarCancellation(scalarCancellationSource);
  assert.equal(result.status, "checked");
  return result.model;
};
const chain = (states: readonly string[]) => String.raw`$$\begin{aligned}${states.join(String.raw`\\`)}\end{aligned}$$`;

test("scalar Article builds from files, and fresh source edits do not mutate an earlier publication", () => {
  const text = readFileSync(scalarCancellationArticlePath, "utf8");
  const source: unknown = JSON.parse(readFileSync(scalarCancellationSourcePath, "utf8"));
  const original = compileScalarCancellationPublication(text, source);
  assert.equal(original.document.id, "lesson.algebra.scalar-cancellation");
  const bytes = original.html;
  const edited = compileScalarCancellationPublication(text.replaceAll(/(?<![A-Za-z])x(?![A-Za-z])/g, "a").replace("Counting the factors", "Tracking the factors"),
    { ...scalarCancellationSource, factor: "a" });
  assert.notEqual(edited.revision, original.revision);
  assert.notEqual(edited.html, bytes);
  assert.equal(original.html, bytes);
  assert.ok(edited.html.includes('"factor":"a"'));
  assert.ok(edited.html.includes("data-derivation-source-revision"));
  assert.throws(() => compileScalarCancellationPublication(text, { ...scalarCancellationSource, factor: "a" }), /source changed/);
  assert.throws(() => compileScalarCancellationPublication(text, { ...scalarCancellationSource, factorDomain: "real" }), /unsupported-source at \$\.factorDomain/);
});

test("scalar authority is distinct, bounded, immutable and cannot be forged", () => {
  const model = checked();
  assert.ok(Object.isFrozen(model.source));
  for (const source of [null, {}, { ...scalarCancellationSource, factorDomain: "real" },
    { ...scalarCancellationSource, factor: "x^2" }, { ...scalarCancellationSource, factor: "y" },
    { ...scalarCancellationSource, numerator: "\\mathbf p" }, { ...scalarCancellationSource, proof: "trust me" }])
    assert.equal(checkScalarCancellation(source).status, "repair-required");
  let invoked = false;
  assert.equal(checkScalarCancellation({ ...scalarCancellationSource, get factor() { invoked = true; return "x"; } }).status, "repair-required");
  assert.equal(invoked, false);
  assert.throws(() => createScalarCancellationPlan({ ...model }), /original checked/);
  assert.throws(() => assertEnergyDerivationPlan({ ...createScalarCancellationPlan(model) }), /original proof-derived/);
  if (false) {
    // @ts-expect-error A source object is not checked mathematical authority.
    createScalarCancellationPlan(scalarCancellationSource);
    const physics = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
    if (physics.status === "checked") {
      // @ts-expect-error Vector authority cannot be repurposed as scalar authority.
      createScalarCancellationPlan(physics.model);
    }
    // @ts-expect-error An arbitrary record cannot issue renderer authority.
    const forged: EnergyDerivationPlan = {};
    void forged;
  }
});

test("scalar fine steps retain exact endpoints and original 1.1–1.3 outline", () => {
  const model = checked(), coarse = createScalarCancellationPlan(model), fine = createScalarCancellationPlan(model, "mass-refinement");
  assert.equal(fine.view.states[0], coarse.view.states[0]);
  assert.equal(fine.view.states.at(-1), coarse.view.states.at(-1));
  assert.equal(coarse.moves.length, 1);
  assert.deepEqual(createDerivationOutline(fine.view, coarse.majorSteps, coarse.operationPrefix).map(step => step.label), ["1.1", "1.2", "1.3"]);
  const compiled = compileScalarCancellation(model, "mass-refinement");
  for (const [i, move] of compiled.moves.entries()) {
    assert.equal(move.transformation.id, `algebra.scalar.${fine.moves[i]!.id}`);
    assert.deepEqual(move.persist, fine.moves[i]!.persist);
    assert.ok(move.annotated.every(latex => !latex.includes("energy.") && !latex.includes("\\mathbf")));
    for (const [side, roles] of [move.sourceRoles, move.targetRoles].entries()) {
      const selectors = [...move.annotated[side]!.matchAll(/kp-semantic-entity-id=([^,}]+)/g)].map(match => match[1]!);
      assert.deepEqual(new Set(selectors), new Set(roles.map(role => `scalar.${move.id}.${side}.${role}`)));
    }
  }
  assert.ok(fine.moves[1]!.persist.includes("factor-retain"));
});

test("source-only symbol/prose edits compile through the same scaffold, with mismatch rejection", () => {
  for (const source of [scalarCancellationSource, { ...scalarCancellationSource, result: "R", factor: "a", numerator: "b" }]) {
    const result = checkScalarCancellation(source);
    assert.equal(result.status, "checked");
    const model = result.model, coarse = createScalarCancellationPlan(model), fine = createScalarCancellationPlan(model, "mass-refinement");
    const markdown = `A new explanation.\n\n${chain(coarse.view.states)}\n\nThe remaining factor matters.`;
    const publication = renderCheckedDerivationPassage(markdown, "source-edit.v1", { coarse, fine });
    assert.ok(publication.includes("A new explanation."));
    assert.ok(publication.includes('data-step-label="1.3"'));
    assert.ok(publication.includes("data-refinement-anchor"));
    assert.ok(!publication.includes("momentum-definition"));
    assert.throws(() => renderCheckedDerivationPassage(chain(["Q=0", "Q=1"]), "bad", { coarse, fine }), /source changed/);
    assert.throws(() => renderCheckedDerivationPassage(markdown, "bad", { coarse, fine: createScalarCancellationPlan(checked(), "mass-refinement") }), /same checked source/);
    assert.equal(scalarCancellationView(model).states.length, 2);
  }
});

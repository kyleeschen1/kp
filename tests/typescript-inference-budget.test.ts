import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { typescriptInferenceBudget } from "../src/architecture/typescript-inference-budget.ts";
import ts from "typescript";
import { relative } from "node:path";
import { assertInferenceMembership, inferenceCohorts, coreInferenceFixtures, frontendInferenceFixtures, combinedInferenceBudget } from "../src/architecture/typescript-inference-cohorts.ts";

test("both approved cohorts retain exact fixture membership and active checking", () => {
  assertInferenceMembership(ts.sys.readDirectory("tests/type-fixtures", [".ts"]), inferenceCohorts[1].fixtures);
  for (const cohort of inferenceCohorts) {
    const config = ts.readConfigFile(cohort.config, ts.sys.readFile);
    assert.equal(config.error, undefined);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
    assert.deepEqual(parsed.errors, []);
    assert.notEqual(parsed.options.skipLibCheck, true);
    assert.notEqual(parsed.options.noCheck, true);
    assertInferenceMembership(parsed.fileNames.map(path => relative(process.cwd(), path)), cohort.fixtures);
  }
  assert.equal(coreInferenceFixtures.length, 49);
  assert.ok(coreInferenceFixtures.includes("tests/type-fixtures/native-katex-scene-contribution.ts"));
  assert.ok(coreInferenceFixtures.includes("tests/type-fixtures/bayesian-authoring.ts"));
  assert.deepEqual(frontendInferenceFixtures, ["tests/type-fixtures/authoring-entrypoint-consumers.ts", "tests/type-fixtures/composed-algebra-consumers.ts"]);
  assert.deepEqual(typescriptInferenceBudget.ceilings, { types: 117700, instantiations: 198900 });
  const budget = combinedInferenceBudget;
  assert.deepEqual(budget.measuredProject, { types: 178493, instantiations: 300444 });
  assert.deepEqual(budget.ceilings, { types: 182100, instantiations: 301600 });
  assert.ok(budget.ceilings.types > budget.measuredProject.types);
  assert.ok(budget.ceilings.types <= Math.ceil(budget.measuredProject.types * 1.02 / 100) * 100);
  // Keep passing caps tighter; only the exceeded cap receives fixed headroom.
  assert.ok(budget.ceilings.instantiations > budget.measuredProject.instantiations);
  assert.ok(budget.ceilings.instantiations <= Math.ceil(budget.measuredProject.instantiations * 1.03 / 100) * 100);
});

test("membership rejects omissions, unassigned fixtures, duplicates and cohort transfers", () => {
  const core = [...coreInferenceFixtures];
  assert.throws(() => assertInferenceMembership(core.slice(1), core), /missing=/);
  assert.throws(() => assertInferenceMembership([...core, "new-fixture.ts"], core), /unexpected=/);
  assert.throws(() => assertInferenceMembership([...core, core[0]!], core), /Duplicate/);
  assert.throws(() => assertInferenceMembership(core, [...core, core[0]!]), /Duplicate/);
  assert.throws(() => assertInferenceMembership([...core.slice(1), ...frontendInferenceFixtures], core), /drift/);
});

test("editorial cost coverage retains actual author, card, reading, prompt and extraction consumers", () => {
  const fixture = readFileSync("tests/type-fixtures/authoring-entrypoint-consumers.ts", "utf8");
  for (const owner of ["page", "readings", "prompts", "extraction", "authoring", "editorial-binding"])
    assert.ok(fixture.includes(`/bayesian-reasoning/${owner}.ts`), owner);
  const publication = readFileSync("tests/bayesian-reasoning-publication.test.ts", "utf8");
  assert.ok(publication.includes("buildBayesEdition(path)"));
  assert.ok(publication.includes("compileBayesPublication(bytes"));
});

test("inference ceilings retain measured, narrow structural headroom", () => {
  const { measuredProject, ceilings } = typescriptInferenceBudget;
  const ceilHundred = (value: number) => Math.ceil(value / 100) * 100;
  assert.ok(ceilings.types > measuredProject.types);
  assert.ok(ceilings.instantiations > measuredProject.instantiations);
  assert.ok(ceilings.types / measuredProject.types < 1.05);
  assert.ok(ceilings.instantiations / measuredProject.instantiations < 1.08);
  assert.equal(ceilings.types, ceilHundred(measuredProject.types * 1.02));
  assert.ok(ceilings.instantiations <= ceilHundred(measuredProject.instantiations * 1.03));
  assert.equal(typescriptInferenceBudget.fixtureCount, coreInferenceFixtures.length);

  const config = JSON.parse(readFileSync("tsconfig.inference.json", "utf8")) as {
    readonly compilerOptions?: { readonly skipLibCheck?: boolean };
  };
  assert.notEqual(config.compilerOptions?.skipLibCheck, true);
});

test("extended algebra cost coverage retains real consumers and negative authority checks", () => {
  const fixture = readFileSync("tests/type-fixtures/composed-algebra-consumers.ts", "utf8");
  for (const call of ["createKpComposedAlgebraAuthoringSessionV2({", "mountComposedAlgebraCardV2(extendedHost, value)",
    "renderAlgebraIntuitionPage(extended)", "projectComposedAlgebraReadingV2(extended,", "projectComposedAlgebraPromptsV2(extended, extendedReference)",
    "prepareComposedAlgebraPublicationSource(exportKpComposedAlgebraSourceV2(extended))", "checkKpComposedAlgebraAuthorSourceV2(",
    "mountComposedAlgebraCardV2(extendedHost, extendedReport)", "projectComposedAlgebraReadingV2(draft," ])
    assert.ok(fixture.includes(call), call);
});

test("factoring cost coverage retains series, structured proof and real asset consumers", () => {
  const fixture = readFileSync("tests/type-fixtures/authoring-entrypoint-consumers.ts", "utf8");
  for (const owner of ["compile-equation-transform-series", "structured-expression-rewrite", "distribution-adapter"])
    assert.ok(fixture.includes(`/${owner}.ts`), owner);
  assert.ok(fixture.includes("verifyKpDistributionRewrite(factoringBindings)"));
  assert.ok(fixture.includes("createDistributionFactoringAnimationAsset()"));
  assert.ok(fixture.includes("mountCommonFactorNativeSurface(factoringCard, factoringDraft)"));
  assert.ok(fixture.includes("renderCommonFactorCard(factoringDraft)"));
  assert.ok(fixture.includes("mountCommonFactorNativeSurface(factoringCard, factoringDraft.candidate)"));
});

test("owner-local inference laws avoid broad public barrels", () => {
  const imports = new Map([
    ["concept-room-theme-inference.ts", "../../src/app-adapters/concept-room-theme.ts"],
    ["concept-room-inference.ts", "../../src/authoring/handles.ts"],
    ["concept-manifest-inference.ts", "../../src/authoring/concept-manifest.ts"],
    ["concept-room-state-inference.ts", "../../src/kernel/concept-room-state.ts"],
    ["native-katex-executable-scene.ts", "../../src/rendering/native-katex-scene-compositor.ts"],
    ["semantic-state-composition-inference.ts", "../../src/semantic-state/state-family-composition-cohort-resolver.ts"],
    ["semantic-state-family-inference.ts", "../../src/semantic-state/state-family-evaluator.ts"]
  ]);

  for (const [fixture, owner] of imports) {
    const source = readFileSync(`tests/type-fixtures/${fixture}`, "utf8");
    assert.ok(source.includes(owner), `${fixture} imports its direct owner`);
    assert.equal(source.includes("/public-api.ts"), false, fixture);
  }

  const publicContract = readFileSync(
    "tests/type-fixtures/animation-authoring-public-api.ts",
    "utf8"
  );
  assert.ok(publicContract.includes("/public-api.ts"));
});

test("leaf paint contracts do not import the motion planner implementation", () => {
  const leafContracts = [
    "src/rendering/equation-material-layer-types.ts",
    "src/rendering/native-katex-scene-track-contract.ts"
  ];

  for (const path of leafContracts) {
    const source = readFileSync(path, "utf8");
    assert.equal(
      source.includes("equation-motion-path-planner"),
      false,
      `${path} must import lightweight occlusion types instead of the planner`
    );
    assert.ok(source.includes("equation-motion-occlusion-types"), path);
  }
});

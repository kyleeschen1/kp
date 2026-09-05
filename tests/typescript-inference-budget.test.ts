import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { typescriptInferenceBudget } from "../src/architecture/typescript-inference-budget.ts";

test("inference ceilings retain measured, narrow structural headroom", () => {
  const { measuredProject, ceilings } = typescriptInferenceBudget;
  const ceilHundred = (value: number) => Math.ceil(value / 100) * 100;
  assert.ok(ceilings.types > measuredProject.types);
  assert.ok(ceilings.instantiations > measuredProject.instantiations);
  assert.ok(ceilings.types / measuredProject.types < 1.05);
  assert.ok(ceilings.instantiations / measuredProject.instantiations < 1.08);
  assert.equal(ceilings.types, ceilHundred(measuredProject.types * 1.02));
  assert.equal(
    ceilings.instantiations,
    ceilHundred(measuredProject.instantiations * 1.03)
  );
  assert.equal(typescriptInferenceBudget.fixtureCount, 45);

  const config = JSON.parse(readFileSync("tsconfig.inference.json", "utf8")) as {
    readonly compilerOptions?: { readonly skipLibCheck?: boolean };
  };
  assert.notEqual(config.compilerOptions?.skipLibCheck, true);
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

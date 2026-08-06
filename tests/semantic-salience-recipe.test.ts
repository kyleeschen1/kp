import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpVisualSalienceRecipes,
  kpVisualSalienceRecipes
} from "../src/animation/semantic-visual-recipe.ts";
import { kpSalienceLevels } from
  "../src/animation/semantic-salience-state.ts";
import { kpSemanticVisualRoles } from
  "../src/animation/semantic-visual-role.ts";

test("every theme role and salience level has one bounded recipe", () => {
  let count = 0;
  for (const matrix of Object.values(kpVisualSalienceRecipes)) {
    assert.deepEqual(Object.keys(matrix), [...kpSemanticVisualRoles]);
    for (const role of kpSemanticVisualRoles) {
      assert.deepEqual(Object.keys(matrix[role]), [...kpSalienceLevels]);
      for (const level of kpSalienceLevels) {
        assert.equal(matrix[role][level].role, role);
        assert.equal(matrix[role][level].level, level);
        count += 1;
      }
    }
  }
  assert.equal(count, 84);
});

test("recipe endpoints preserve hierarchy and absence", () => {
  for (const matrix of Object.values(kpVisualSalienceRecipes)) {
    for (const role of kpSemanticVisualRoles) {
      const recipes = matrix[role];
      assert.ok(recipes.focus.opacity >= recipes.normal.opacity);
      assert.ok(recipes.normal.opacity >= recipes.context.opacity);
      assert.ok(recipes.context.opacity >= recipes.dim.opacity);
      assert.ok(recipes.dim.opacity >= recipes.ghost.opacity);
      assert.deepEqual(recipes.absent, {
        role,
        level: "absent",
        colorSource: role === "data-series"
          ? "identity.ghost"
          : role === "warning"
            ? "identity.rose.ghost"
            : role === "focus"
              ? "identity.cyan.ghost"
              : role === "page"
                ? "neutral.page"
                : role === "ink"
                  ? "neutral.inkGhost"
                  : "neutral.lineSubtle",
        opacity: 0,
        strokeScale: 0,
        detail: "none",
        labels: "hidden",
        rendered: false
      });
    }
  }
});

test("dark and light compilation is deterministic and optically distinct", () => {
  assert.deepEqual(compileKpVisualSalienceRecipes("dark"),
    kpVisualSalienceRecipes.dark);
  assert.deepEqual(compileKpVisualSalienceRecipes("light"),
    kpVisualSalienceRecipes.light);
  assert.notEqual(
    kpVisualSalienceRecipes.dark.ink.context.opacity,
    kpVisualSalienceRecipes.light.ink.context.opacity
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpVisualThemeContract,
  serializeKpVisualThemeContract,
  type KpVisualThemeContract,
  type KpVisualThemeId
} from "../src/animation/semantic-visual-theme.ts";

function theme(id: KpVisualThemeId): KpVisualThemeContract {
  return {
    id,
    roleSources: {
      page: "neutral.page",
      ink: "neutral.ink",
      structure: "neutral.line",
      "data-series": "identity.normal",
      relation: "neutral.secondary",
      warning: "identity.rose",
      focus: "identity.focus"
    },
    identitySources: {
      neutral: "neutral.ink",
      cyan: "identity.cyan",
      blue: "identity.blue",
      violet: "identity.violet",
      rose: "identity.rose",
      amber: "identity.amber",
      green: "identity.green"
    },
    optical: id === "dark"
      ? {
          hairlinePx: 1,
          strokePx: 1.5,
          contextOpacityFloor: 0.62,
          dimOpacityFloor: 0.36
        }
      : {
          hairlinePx: 1.25,
          strokePx: 1.8,
          contextOpacityFloor: 0.72,
          dimOpacityFloor: 0.5
        }
  };
}

test("dark and light contracts require complete role and identity coverage", () => {
  for (const id of ["dark", "light"] as const) {
    const contract = createKpVisualThemeContract(theme(id));
    assert.equal(contract.id, id);
    assert.equal(Object.keys(contract.roleSources).length, 7);
    assert.equal(Object.keys(contract.identitySources).length, 7);
    assert.equal(Object.isFrozen(contract), true);
  }
});

test("theme contracts reject missing extra and invalid optical authority", () => {
  const valid = theme("dark");
  const { focus: _focus, ...missingRole } = valid.roleSources;
  assert.throws(() => createKpVisualThemeContract({
    ...valid,
    roleSources: missingRole
  } as never), /role source coverage must be exact/);
  assert.throws(() => createKpVisualThemeContract({
    ...valid,
    identitySources: { ...valid.identitySources, orange: "identity.orange" }
  } as never), /identity source coverage must be exact/);
  assert.throws(() => createKpVisualThemeContract({
    ...valid,
    optical: { ...valid.optical, dimOpacityFloor: 0.8 }
  }), /opacity floors are invalid/);
});

test("theme contract serialization is deterministic", () => {
  const contract = createKpVisualThemeContract(theme("dark"));
  assert.equal(
    serializeKpVisualThemeContract(contract),
    serializeKpVisualThemeContract(createKpVisualThemeContract(theme("dark")))
  );
});

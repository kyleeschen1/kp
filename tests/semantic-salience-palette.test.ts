import assert from "node:assert/strict";
import test from "node:test";
import {
  kpPaletteIdentityFamilies,
  kpPaletteSalienceBands,
  kpVisualPaletteSources
} from "../src/animation/semantic-visual-palette.ts";

test("handoff palette preserves retained page backgrounds and dark accents", () => {
  assert.equal(kpVisualPaletteSources.dark.neutral.page, "#0d0e1c");
  assert.equal(kpVisualPaletteSources.light.neutral.page, "#f4f1e9");
  assert.deepEqual(kpVisualPaletteSources.dark.identities.cyan, {
    focus: "#07d0d8",
    normal: "#42a3a8",
    context: "#477f82",
    dim: "#4c6a6b",
    ghost: "#344040"
  });
  assert.equal(kpVisualPaletteSources.dark.identities.blue.focus, "#7cbdff");
  assert.equal(kpVisualPaletteSources.dark.identities.violet.focus, "#bda7ff");
  assert.equal(kpVisualPaletteSources.dark.identities.rose.focus, "#f990c4");
  assert.equal(kpVisualPaletteSources.dark.identities.amber.focus, "#fb9d59");
  assert.equal(kpVisualPaletteSources.dark.identities.green.focus, "#7acf7e");
});

test("both optical systems cover every family and salience band", () => {
  for (const palette of Object.values(kpVisualPaletteSources)) {
    assert.deepEqual(Object.keys(palette.identities), [...kpPaletteIdentityFamilies]);
    for (const family of kpPaletteIdentityFamilies) {
      assert.deepEqual(
        Object.keys(palette.identities[family]),
        [...kpPaletteSalienceBands]
      );
    }
  }
});

test("focus sources retain readable contrast on each approved page ground", () => {
  for (const palette of Object.values(kpVisualPaletteSources)) {
    assert.ok(contrast(palette.neutral.ink, palette.neutral.page) >= 7);
    for (const family of kpPaletteIdentityFamilies) {
      assert.ok(
        contrast(palette.identities[family].focus, palette.neutral.page) >= 4.5,
        `${palette.theme} ${family} focus is below 4.5:1`
      );
    }
  }
});

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((start) =>
    Number.parseInt(color.slice(start, start + 2), 16) / 255
  ).map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

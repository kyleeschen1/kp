import assert from "node:assert/strict";
import test from "node:test";
import {
  kpVisualPaletteSources
} from "../src/animation/semantic-visual-salience.ts";
import {
  projectKpSemanticVisualDomThemeProperties
} from "../src/rendering/semantic-visual-dom-theme.ts";

test("DOM theme properties are direct projections of shared palette sources", () => {
  const dark = projectKpSemanticVisualDomThemeProperties("dark");
  const light = projectKpSemanticVisualDomThemeProperties("light");

  assert.equal(dark["--kp-semantic-page"], kpVisualPaletteSources.dark.neutral.page);
  assert.equal(dark["--kp-semantic-ink"], kpVisualPaletteSources.dark.neutral.ink);
  assert.equal(
    dark["--kp-semantic-focus"],
    kpVisualPaletteSources.dark.identities.cyan.focus
  );
  assert.equal(light["--kp-semantic-page"], kpVisualPaletteSources.light.neutral.page);
  assert.equal(light["--kp-semantic-ink"], kpVisualPaletteSources.light.neutral.ink);
  assert.notDeepEqual(dark, light);
  assert.equal(Object.keys(dark).length, Object.keys(light).length);
});

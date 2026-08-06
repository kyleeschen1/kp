import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createKpSemanticSalienceState,
  kpVisualPaletteSources,
  resolveKpSemanticVisualTreatment
} from "../src/animation/semantic-visual-salience.ts";

test("the promoted seam resolves treatment without renderer authority", () => {
  const treatment = resolveKpSemanticVisualTreatment({
    theme: "dark",
    role: "data-series",
    state: createKpSemanticSalienceState({
      level: "focus",
      identityFamily: "red",
      presence: 0.5
    })
  });

  assert.deepEqual(treatment, {
    color: kpVisualPaletteSources.dark.identities.red.focus,
    opacity: 0.5,
    strokeScale: 1.2,
    detail: "full",
    labels: "visible",
    rendered: true
  });
});

test("the portable facade has no tutorial, framework, DOM, or CSS dependency", () => {
  const facade = readFileSync(
    new URL("../src/animation/semantic-visual-salience.ts", import.meta.url),
    "utf8"
  );
  const treatment = readFileSync(
    new URL("../src/animation/semantic-visual-treatment.ts", import.meta.url),
    "utf8"
  );
  const source = `${facade}\n${treatment}`;

  for (const forbidden of [
    "/tutorial/", "svelte", "document.", "window.", "HTMLElement",
    "CSSStyleDeclaration", "--kp-"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

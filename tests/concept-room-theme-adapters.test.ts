import assert from "node:assert/strict";
import test from "node:test";

import {
  applyConceptRoomTheme,
  conceptRoomReviewThemeCss,
  conceptRoomSvgTheme,
  conceptRoomThemeCss,
  conceptRoomThemeVariables,
  linearEquationExemplarTheme,
  structuralConceptRoomTheme
} from "../src/app-adapters/public-api.ts";

test("theme variables provide one deterministic DOM and KaTeX token source", () => {
  const variables = new Map(conceptRoomThemeVariables(linearEquationExemplarTheme));
  assert.equal(variables.get("--kp-concept-paper"), "#f7f3e8");
  assert.equal(variables.get("--kp-concept-font-math"), "KaTeX_Main");
  assert.equal(variables.get("--kp-concept-motion-act"), "520ms");
  assert.match(conceptRoomThemeCss(linearEquationExemplarTheme), /--kp-concept-focus:#1f6371/);
});

test("SVG adapter resolves the same semantic palette without renderer-owned values", () => {
  const svg = conceptRoomSvgTheme(linearEquationExemplarTheme);
  assert.equal(svg.focus, linearEquationExemplarTheme.tokens.color.focus);
  assert.equal(svg.variable, linearEquationExemplarTheme.tokens.color.variable);
  assert.equal(svg.unit, linearEquationExemplarTheme.tokens.color.unit);
  assert.equal(svg.mathFamily, "KaTeX_Main");
  assert.equal(Object.isFrozen(svg), true);
});

test("Review CSS includes print, reduced-motion, and forced-color projections", () => {
  const css = conceptRoomReviewThemeCss(linearEquationExemplarTheme);
  assert.match(css, /@media print/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /\.katex\{color:inherit\}/);
});

test("structural-only themes cannot silently emit invented visual values", () => {
  assert.throws(
    () => conceptRoomThemeVariables(structuralConceptRoomTheme),
    /does not define visual tokens/
  );
});

test("DOM adapter applies exactly the generated variables and theme identity", () => {
  const properties = new Map<string, string>();
  const element = {
    dataset: {},
    style: { setProperty: (name: string, value: string) => properties.set(name, value) }
  } as unknown as HTMLElement;
  applyConceptRoomTheme(element, linearEquationExemplarTheme);
  assert.equal(element.dataset["kpTheme"], linearEquationExemplarTheme.id);
  assert.equal(properties.get("--kp-concept-accent"), "#df7047");
  assert.equal(properties.get("--kp-concept-font-math"), "KaTeX_Main");
});

import { compileExpression, differentiate, expressionToLatex, type MathExpression } from "../../math/expression.ts";
import { parseLatexExpression, type ParsedLatexExpression } from "../../math/latex-parser.ts";
import { parsedLatexExpressionToMathExpression } from "../../math/latex-to-expression.ts";
import { sha256 } from "../../kernel/sha256.ts";

export const changeSteps = ["input", "inner", "outer", "compose", "limit"] as const;
export type ChangeStep = typeof changeSteps[number];
export interface ChangeSource {
  readonly title: string;
  readonly inner: string;
  readonly outer: string;
  readonly x: number;
  readonly h: number;
  readonly steps: readonly { readonly id: ChangeStep; readonly title: string; readonly text: string }[];
}
export interface ChangeModel {
  readonly revision: string;
  readonly source: ChangeSource;
  readonly latex: { readonly inner: string; readonly outer: string; readonly innerDerivative: string; readonly outerDerivative: string };
  sample(x: number, h: number): ChangeSample;
  scales(x: number): readonly [number, number, number];
}
export interface ChangeSample {
  readonly x: number; readonly h: number; readonly u: number; readonly y: number;
  readonly deltaU: number; readonly deltaY: number; readonly du: number; readonly dy: number;
  readonly firstScale: number; readonly secondScale: number; readonly derivative: number;
  readonly error: number; readonly errorPerH: number | null;
}
export type ChangeCompilation = { readonly status: "checked"; readonly model: ChangeModel }
  | { readonly status: "repair-gap"; readonly path: string; readonly message: string };

class SourceGap extends Error {
  readonly path: string;
  constructor(path: string, message: string) { super(message); this.path = path; }
}
const gap = (path: string, message: string): never => { throw new SourceGap(path, message); };
const record = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return gap(path, "Expected an object.");
  return Object.fromEntries(Object.entries(value));
};
function keys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) gap(`${path}.${key}`, "Unsupported field; no renderer or motion fallback is available.");
}
function text(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) return gap(path, `Expected nonempty text of at most ${max} characters.`);
  return value;
}
function bounded(value: unknown, path: string, low: number, high: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < low || value > high) return gap(path, `Expected a finite number from ${low} to ${high}.`);
  return value;
}

export function compileChangeSource(bytes: string): ChangeCompilation {
  try {
    if (bytes.length > 16000) gap("source", "Source exceeds the 16 KB authoring limit.");
    let input: unknown;
    try { input = JSON.parse(bytes); } catch { return { status: "repair-gap", path: "source", message: "Expected valid JSON." }; }
    const raw = record(input, "source");
    keys(raw, ["title", "inner", "outer", "x", "h", "steps"], "source");
    const rawSteps = raw["steps"];
    if (!Array.isArray(rawSteps) || rawSteps.length !== changeSteps.length) return { status: "repair-gap", path: "steps", message: "Supply the five ordered input, inner, outer, compose and limit explanations." };
    const steps = changeSteps.map((id, index) => {
      const step = record(rawSteps[index], `steps[${index}]`);
      keys(step, ["id", "title", "text"], `steps[${index}]`);
      if (step["id"] !== id) gap(`steps[${index}].id`, `Expected ${id}; this bounded explanation has a fixed semantic order.`);
      return Object.freeze({ id, title: text(step["title"], `steps[${index}].title`, 100), text: text(step["text"], `steps[${index}].text`, 1000) });
    });
    const source: ChangeSource = Object.freeze({ title: text(raw["title"], "title", 100), inner: text(raw["inner"], "inner", 160),
      outer: text(raw["outer"], "outer", 160), x: bounded(raw["x"], "x", -2, 2), h: bounded(raw["h"], "h", -.5, .5), steps: Object.freeze(steps) });
    const inner = expression(source.inner, "x", "inner"), outer = expression(source.outer, "u", "outer");
    const df = differentiate(inner, "x"), dg = differentiate(outer, "u");
    const f = compileExpression(inner), g = compileExpression(outer), first = compileExpression(df), second = compileExpression(dg);
    // Interval bounds, not a grid of samples, certify finite supported controls.
    const uBounds = interval(inner, [-2.5, 2.5]);
    const bounds = [...uBounds, ...interval(outer, uBounds), ...interval(df, [-2.5, 2.5]), ...interval(dg, uBounds)];
    if (bounds.some(value => !Number.isFinite(value) || Math.abs(value) > 1000)) gap("functions", "These functions exceed the bounded comparison range (1000). Use smaller coefficients or powers.");
    return { status: "checked", model: Object.freeze<ChangeModel>({
      source, revision: `sha256:${sha256(JSON.stringify(source))}`,
      latex: Object.freeze({ inner: expressionToLatex(inner), outer: expressionToLatex(outer), innerDerivative: expressionToLatex(df), outerDerivative: expressionToLatex(dg) }),
      sample(x, h) {
        bounded(x, "x", -2, 2); bounded(h, "h", -.5, .5);
        const u = f({ x }), y = g({ u }), deltaU = f({ x: x + h }) - u;
        const deltaY = g({ u: f({ x: x + h }) }) - y;
        const firstScale = first({ x }), secondScale = second({ u }), derivative = firstScale * secondScale;
        const du = firstScale * h, dy = derivative * h, error = deltaY - dy;
        return { x, h, u, y, deltaU, deltaY, du, dy, firstScale, secondScale, derivative, error, errorPerH: h === 0 ? null : error / h };
      },
      scales(x) {
        bounded(x, "x", -2, 2);
        const u = f({ x }), y = g({ u }), ur = interval(inner, [x - .5, x + .5]), yr = interval(outer, ur);
        return [.5, Math.max(.01, Math.abs(ur[0] - u), Math.abs(ur[1] - u), Math.abs(first({ x })) * .5),
          Math.max(.01, Math.abs(yr[0] - y), Math.abs(yr[1] - y), Math.abs(first({ x }) * second({ u })) * .5)];
      }
    }) };
  } catch (error) {
    if (error instanceof SourceGap) return { status: "repair-gap", path: error.path, message: error.message };
    throw error;
  }
}

function expression(source: string, variable: string, path: string): MathExpression {
  let parsed: ParsedLatexExpression;
  try { parsed = parseLatexExpression(source); } catch (error) { return gap(path, error instanceof Error ? error.message : "Invalid expression."); }
  let count = 0;
  // Validate before simplification: 0 * unknown and 0 / x cannot hide an
  // unsupported symbol or a singularity behind the expression constructors.
  function visit(node: ParsedLatexExpression, depth: number): void {
    if (++count > 32 || depth > 8) gap(path, "Use an expression with at most 32 nodes and depth 8.");
    switch (node.kind) {
      case "number":
        bounded(node.value, path, 0, 10);
        // The existing notation formatter rounds decimal constants. Keep this
        // exemplar's symbolic coefficients exact rather than silently rounding
        // a function that the numerical evaluator would treat differently.
        if (!Number.isInteger(node.value)) gap(path, "Use integer coefficients; decimal symbolic constants need an exact notation boundary first.");
        break;
      case "identifier": if (node.name !== variable) gap(path, `Only the bound variable ${variable} is supported here.`); break;
      case "unary": visit(node.value, depth + 1); break;
      case "call":
        if (node.name !== "sin" && node.name !== "cos") gap(path, "Only sin and cos are supported functions in this exemplar.");
        visit(node.argument, depth + 1); break;
      case "binary":
        if (node.operator === "/") gap(path, "Division requires domain handling that this exemplar does not yet support.");
        if (node.operator === "^" && (node.right.kind !== "number" || !Number.isInteger(node.right.value) || node.right.value > 4)) gap(path, "Use an integer power from 0 to 4.");
        visit(node.left, depth + 1); visit(node.right, depth + 1); break;
    }
  }
  visit(parsed, 0);
  return parsedLatexExpressionToMathExpression(parsed);
}

type Interval = readonly [number, number];
function product(a: Interval, b: Interval): Interval {
  const values = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return [Math.min(...values), Math.max(...values)];
}
function interval(e: MathExpression, variable: Interval): Interval {
  switch (e.kind) {
    case "constant": return [e.value, e.value];
    case "variable": return variable;
    case "negate": { const a = interval(e.value, variable); return [-a[1], -a[0]]; }
    case "add": return e.terms.reduce<Interval>((a, term) => { const b = interval(term, variable); return [a[0] + b[0], a[1] + b[1]]; }, [0, 0]);
    case "multiply": return e.factors.reduce<Interval>((a, factor) => product(a, interval(factor, variable)), [1, 1]);
    case "sin": case "cos": return [-1, 1];
    case "power": {
      const a = interval(e.base, variable), endpoints = [a[0] ** e.exponent, a[1] ** e.exponent];
      return [e.exponent % 2 === 0 && a[0] <= 0 && a[1] >= 0 ? 0 : Math.min(...endpoints), Math.max(...endpoints)];
    }
    case "divide": throw new Error("Division escaped the change-propagation source boundary.");
  }
}

/** Every route samples the same semantic state; reverse never replays effects. */
export function projectChange(model: ChangeModel, x: number, trialH: number, position: number) {
  bounded(position, "position", 0, 4);
  const t = Math.max(0, position - 3), shrink = t * t * (3 - 2 * t);
  return model.sample(x, trialH * (1 - .9 * shrink));
}
export function formatChangeNumber(value: number | null): string {
  if (value === null) return "—";
  if (!Number.isFinite(value)) throw new Error("Cannot display a nonfinite change.");
  const rounded = Math.abs(value) < .000005 ? 0 : value;
  return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded).toFixed(5)}`;
}

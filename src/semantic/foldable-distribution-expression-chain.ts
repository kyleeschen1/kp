import { defaultAffineCollection, assertAffineCollection, type AffineCollectionDerivation } from "./affine-collection-source.ts";
import {
  createKpStructuredExpression,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

export interface KpFoldableDistributionExpressionState {
  readonly id: string;
  readonly latex: string;
  readonly expression: KpStructuredExpression;
}

export interface KpLinearExpressionNormalForm {
  readonly coefficients: Readonly<Record<string, number>>;
  readonly constant: number;
}

export interface KpFoldableDistributionExpressionVerification {
  readonly ok: boolean;
  readonly expected: KpLinearExpressionNormalForm;
  readonly stateNormalForms: readonly KpLinearExpressionNormalForm[];
  readonly diagnostics: readonly string[];
}

export function createKpFoldableDistributionExpressionChain(d: AffineCollectionDerivation = defaultAffineCollection):
  readonly KpFoldableDistributionExpressionState[] {
  assertAffineCollection(d);
  return Object.freeze([
    state(
      "expression.foldable-distribution.factored",
      d.latex[0]!,
      sum("factored.root",
        product("factored.left-product",
          number("factored.left-factor", d.a),
          sum("factored.left-group",
            symbol("factored.left-x", d.x),
            number("factored.left-constant", d.b)
          )
        ),
        product("factored.right-product",
          number("factored.right-factor", d.c),
          sum("factored.right-group",
            symbol("factored.right-x", d.x),
            negate(
              "factored.right-negative-one",
              number("factored.right-one", -d.d)
            )
          )
        )
      )
    ),
    state(
      "expression.foldable-distribution.distributed",
      d.latex[2]!,
      sum("distributed.root",
        product("distributed.term-3x",
          number("distributed.coefficient-3", d.a),
          symbol("distributed.x-from-left", d.x)
        ),
        number("distributed.constant-6", d.p),
        product("distributed.term-2x",
          number("distributed.coefficient-2", d.c),
          symbol("distributed.x-from-right", d.x)
        ),
        negate(
          "distributed.negative-2",
          number("distributed.constant-2", -d.q)
        )
      )
    ),
    state(
      "expression.foldable-distribution.grouped",
      d.latex[3]!,
      sum("grouped.root",
        sum("grouped.coefficients",
          product("grouped.term-3x",
            number("grouped.coefficient-3", d.a),
            symbol("grouped.x-from-left", d.x)
          ),
          product("grouped.term-2x",
            number("grouped.coefficient-2", d.c),
            symbol("grouped.x-from-right", d.x)
          )
        ),
        sum("grouped.constants",
          number("grouped.constant-6", d.p),
          negate(
            "grouped.negative-2",
            number("grouped.constant-2", -d.q)
          )
        )
      )
    ),
    state(
      "expression.foldable-distribution.coefficient-factored",
      d.latex[4]!,
      sum("coefficient-factored.root",
        product("coefficient-factored.variable-term",
          sum("coefficient-factored.coefficients",
            number("coefficient-factored.coefficient-3", d.a),
            number("coefficient-factored.coefficient-2", d.c)
          ),
          symbol("coefficient-factored.x", d.x)
        ),
        sum("coefficient-factored.constants",
          number("coefficient-factored.constant-6", d.p),
          negate(
            "coefficient-factored.negative-2",
            number("coefficient-factored.constant-2", -d.q)
          )
        )
      )
    ),
    state(
      "expression.foldable-distribution.collected",
      d.latex[5]!,
      sum("collected.root",
        product("collected.term-5x",
          number("collected.coefficient-5", d.coefficient),
          symbol("collected.x", d.x)
        ),
        number("collected.constant-4", d.constant)
      )
    )
  ]);
}

export function verifyKpFoldableDistributionExpressionChain(
  chain: readonly KpFoldableDistributionExpressionState[],
  d: AffineCollectionDerivation = defaultAffineCollection
): KpFoldableDistributionExpressionVerification {
  assertAffineCollection(d);
  const expected = freezeNormalForm({ coefficients: { [d.x]: d.coefficient }, constant: d.constant });
  const diagnostics: string[] = [];
  if (chain.length !== 5) {
    diagnostics.push(`Expected 5 expression states, received ${chain.length}.`);
  }

  const stateNormalForms = chain.map(({ id, expression }) => {
    try {
      const normalForm = normalizeLinearExpression(expression.root);
      if (!sameNormalForm(normalForm, expected)) {
        diagnostics.push(
          `${id} normalizes to ${describeNormalForm(normalForm)}, expected ` +
          `${describeNormalForm(expected)}.`
        );
      }
      return normalForm;
    } catch (error) {
      diagnostics.push(
        `${id} is not an exact linear expression: ${errorMessage(error)}`
      );
      return freezeNormalForm({ coefficients: {}, constant: Number.NaN });
    }
  });

  return Object.freeze({
    ok: diagnostics.length === 0,
    expected,
    stateNormalForms: Object.freeze(stateNormalForms),
    diagnostics: Object.freeze(diagnostics)
  });
}

function state(
  id: string,
  latex: string,
  root: KpStructuredExpressionNode
): KpFoldableDistributionExpressionState {
  return Object.freeze({
    id,
    latex,
    expression: createKpStructuredExpression({ root })
  });
}

function normalizeLinearExpression(
  node: KpStructuredExpressionNode
): KpLinearExpressionNormalForm {
  switch (node.kind) {
    case "number":
      return freezeNormalForm({ coefficients: {}, constant: node.value });
    case "symbol":
      return freezeNormalForm({
        coefficients: { [node.name]: 1 },
        constant: 0
      });
    case "negate":
      return scaleNormalForm(normalizeLinearExpression(node.value), -1);
    case "sum":
      return node.terms
        .map(normalizeLinearExpression)
        .reduce(addNormalForms, emptyNormalForm());
    case "product": {
      const factors = node.factors.map(normalizeLinearExpression);
      const nonconstant = factors.filter(hasVariableTerm);
      if (nonconstant.length > 1) {
        throw new Error(`product ${node.id} is nonlinear`);
      }
      const scalar = factors
        .filter((factor) => !hasVariableTerm(factor))
        .reduce((value, factor) => value * factor.constant, 1);
      return nonconstant.length === 0
        ? freezeNormalForm({ coefficients: {}, constant: scalar })
        : scaleNormalForm(nonconstant[0]!, scalar);
    }
    case "quotient":
    case "power":
      throw new Error(`${node.kind} ${node.id} is outside the linear fixture`);
  }
}

function emptyNormalForm(): KpLinearExpressionNormalForm {
  return freezeNormalForm({ coefficients: {}, constant: 0 });
}

function addNormalForms(
  left: KpLinearExpressionNormalForm,
  right: KpLinearExpressionNormalForm
): KpLinearExpressionNormalForm {
  const symbols = new Set([
    ...Object.keys(left.coefficients),
    ...Object.keys(right.coefficients)
  ]);
  return freezeNormalForm({
    coefficients: Object.fromEntries(
      [...symbols].sort().map((symbolId) => [
        symbolId,
        (left.coefficients[symbolId] ?? 0) +
          (right.coefficients[symbolId] ?? 0)
      ])
    ),
    constant: left.constant + right.constant
  });
}

function scaleNormalForm(
  form: KpLinearExpressionNormalForm,
  scalar: number
): KpLinearExpressionNormalForm {
  return freezeNormalForm({
    coefficients: Object.fromEntries(
      Object.entries(form.coefficients).map(([symbolId, coefficient]) => [
        symbolId,
        coefficient * scalar
      ])
    ),
    constant: form.constant * scalar
  });
}

function freezeNormalForm(
  input: KpLinearExpressionNormalForm
): KpLinearExpressionNormalForm {
  return Object.freeze({
    coefficients: Object.freeze({ ...input.coefficients }),
    constant: input.constant
  });
}

function hasVariableTerm(form: KpLinearExpressionNormalForm): boolean {
  return Object.values(form.coefficients).some(
    (coefficient) => coefficient !== 0
  );
}

function sameNormalForm(
  left: KpLinearExpressionNormalForm,
  right: KpLinearExpressionNormalForm
): boolean {
  return describeNormalForm(left) === describeNormalForm(right);
}

function describeNormalForm(form: KpLinearExpressionNormalForm): string {
  return JSON.stringify({
    coefficients: Object.fromEntries(
      Object.entries(form.coefficients)
        .filter(([, coefficient]) => coefficient !== 0)
        .sort(([left], [right]) => left.localeCompare(right))
    ),
    constant: form.constant
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function number(id: string, value: number): KpStructuredExpressionNode {
  return { id, kind: "number", value };
}

function symbol(id: string, name: string): KpStructuredExpressionNode {
  return { id, kind: "symbol", name };
}

function sum(
  id: string,
  ...terms: readonly KpStructuredExpressionNode[]
): KpStructuredExpressionNode {
  return { id, kind: "sum", terms };
}

function product(
  id: string,
  ...factors: readonly KpStructuredExpressionNode[]
): KpStructuredExpressionNode {
  return { id, kind: "product", factors };
}

function negate(
  id: string,
  value: KpStructuredExpressionNode
): KpStructuredExpressionNode {
  return { id, kind: "negate", value };
}

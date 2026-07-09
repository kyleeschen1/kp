export type KatexTransformFixtureFamily = "fraction";

export type KatexFractionTransformIntent =
  | "makeFraction"
  | "splitFraction"
  | "combineFractions";

export type KatexTransformFixtureTokenRole =
  | "artifact"
  | "operator"
  | "semantic";

export interface KatexTransformFixtureToken {
  readonly text: string;
  readonly signature: string;
  readonly role: KatexTransformFixtureTokenRole;
  readonly row: number;
  readonly column: number;
}

export interface KatexTransformFixtureSide {
  readonly latex: string;
  readonly tokens: readonly KatexTransformFixtureToken[];
}

export interface KatexTransformFixture {
  readonly id: string;
  readonly family: KatexTransformFixtureFamily;
  readonly intent: KatexFractionTransformIntent;
  readonly source: KatexTransformFixtureSide;
  readonly target: KatexTransformFixtureSide;
  readonly expectedStructuralTokens: {
    readonly source: readonly string[];
    readonly target: readonly string[];
  };
  readonly summary: string;
}

export const fractionTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "fraction.make.inline-to-stacked",
    family: "fraction",
    intent: "makeFraction",
    source: {
      latex: "x / 3",
      tokens: [
        semanticToken("x", 0, 0),
        operatorToken("/", 0, 1),
        semanticToken("3", 0, 2)
      ]
    },
    target: {
      latex: "\\frac{x}{3}",
      tokens: [
        semanticToken("x", 0, 0),
        artifactToken("structural:frac-line", "frac-line", 1, 0),
        semanticToken("3", 2, 0)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: ["structural:frac-line"]
    },
    summary:
      "Inline slash notation becomes a stacked fraction; the fraction bar is a target-only render artifact."
  },
  {
    id: "fraction.split.stacked-to-inline",
    family: "fraction",
    intent: "splitFraction",
    source: {
      latex: "\\frac{x}{3}",
      tokens: [
        semanticToken("x", 0, 0),
        artifactToken("structural:frac-line", "frac-line", 1, 0),
        semanticToken("3", 2, 0)
      ]
    },
    target: {
      latex: "x / 3",
      tokens: [
        semanticToken("x", 0, 0),
        operatorToken("/", 0, 1),
        semanticToken("3", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: ["structural:frac-line"],
      target: []
    },
    summary:
      "Stacked fraction notation becomes inline slash notation; the fraction bar is a source-only render artifact."
  },
  {
    id: "fraction.combine.common-denominator",
    family: "fraction",
    intent: "combineFractions",
    source: {
      latex: "\\frac{a}{b} + \\frac{c}{d}",
      tokens: [
        semanticToken("a", 0, 0),
        artifactToken("structural:frac-line", "frac-line", 1, 0),
        semanticToken("b", 2, 0),
        operatorToken("+", 1, 1),
        semanticToken("c", 0, 2),
        artifactToken("structural:frac-line", "frac-line", 1, 2),
        semanticToken("d", 2, 2)
      ]
    },
    target: {
      latex: "\\frac{ad + bc}{bd}",
      tokens: [
        semanticToken("a", 0, 0),
        semanticToken("d", 0, 1),
        operatorToken("+", 0, 2),
        semanticToken("b", 0, 3),
        semanticToken("c", 0, 4),
        artifactToken("structural:frac-line", "frac-line", 1, 1),
        semanticToken("b", 2, 1),
        semanticToken("d", 2, 2)
      ]
    },
    expectedStructuralTokens: {
      source: ["structural:frac-line", "structural:frac-line"],
      target: ["structural:frac-line"]
    },
    summary:
      "Two stacked fractions combine into one stacked fraction; bars need explicit artifact handling instead of semantic identity."
  }
];

export function findKatexTransformFixture(id: string): KatexTransformFixture {
  const fixture = fractionTransformFixtures.find((candidate) => candidate.id === id);

  if (fixture === undefined) {
    throw new Error(`Unknown KaTeX transform fixture: ${id}`);
  }

  return fixture;
}

function semanticToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "semantic",
    row,
    column
  };
}

function operatorToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mbin",
    role: "operator",
    row,
    column
  };
}

function artifactToken(
  text: string,
  signature: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature,
    role: "artifact",
    row,
    column
  };
}

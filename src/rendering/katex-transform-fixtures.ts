export type KatexTransformFixtureFamily =
  | "fraction"
  | "large-operator"
  | "radical"
  | "script"
  | "wrapper";

export type KatexFractionTransformIntent =
  | "makeFraction"
  | "splitFraction"
  | "combineFractions";

export type KatexScriptTransformIntent =
  | "combineRepeatedFactorAsPower"
  | "expandPower"
  | "changeIndex";

export type KatexRadicalTransformIntent =
  | "rewritePowerAsRoot"
  | "rewriteRootAsPower"
  | "unwrapIndexedRoot";

export type KatexWrapperTransformIntent =
  | "wrapWithDelimiter"
  | "unwrapDelimiter"
  | "wrapWithFunction";

export type KatexLargeOperatorTransformIntent =
  | "addSummationBounds"
  | "changeProductBounds"
  | "addIntegralBounds"
  | "changeLimitApproach";

export type KatexTransformFixtureIntent =
  | KatexFractionTransformIntent
  | KatexLargeOperatorTransformIntent
  | KatexRadicalTransformIntent
  | KatexScriptTransformIntent
  | KatexWrapperTransformIntent;

export type KatexTransformFixtureTokenRole =
  | "artifact"
  | "base"
  | "body"
  | "differential"
  | "factor"
  | "integrand"
  | "large-operator"
  | "limit-approach"
  | "lower-limit"
  | "operator"
  | "radicand"
  | "root-index"
  | "semantic"
  | "subscript"
  | "superscript"
  | "upper-limit";

export type KatexTransformFixtureLayoutRole =
  | "baseline"
  | "lower-limit"
  | "upper-limit";

export interface KatexTransformFixtureToken {
  readonly text: string;
  readonly signature: string;
  readonly role: KatexTransformFixtureTokenRole;
  readonly layoutRole?: KatexTransformFixtureLayoutRole;
  readonly row: number;
  readonly column: number;
}

export interface KatexTransformFixtureSide {
  readonly latex: string;
  readonly tokens: readonly KatexTransformFixtureToken[];
}

export interface KatexTransformRoleChangeExpectation {
  readonly sourceRole: KatexTransformFixtureTokenRole;
  readonly targetRole: KatexTransformFixtureTokenRole;
  readonly sourceText: string;
  readonly targetText: string;
}

export interface KatexTransformFixture {
  readonly id: string;
  readonly family: KatexTransformFixtureFamily;
  readonly intent: KatexTransformFixtureIntent;
  readonly source: KatexTransformFixtureSide;
  readonly target: KatexTransformFixtureSide;
  readonly expectedStructuralTokens: {
    readonly source: readonly string[];
    readonly target: readonly string[];
  };
  readonly expectedRoleChanges: readonly KatexTransformRoleChangeExpectation[];
  readonly summary: string;
}

export interface KatexTransformFixtureDiagnostics {
  readonly id: string;
  readonly family: KatexTransformFixtureFamily;
  readonly sourceTokenCount: number;
  readonly targetTokenCount: number;
  readonly sourceStructuralTokenCount: number;
  readonly targetStructuralTokenCount: number;
  readonly roleChangeCount: number;
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
    expectedRoleChanges: [],
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
    expectedRoleChanges: [],
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
    expectedRoleChanges: [],
    summary:
      "Two stacked fractions combine into one stacked fraction; bars need explicit artifact handling instead of semantic identity."
  }
];

export const radicalTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "radical.rewrite-power-as-root",
    family: "radical",
    intent: "rewritePowerAsRoot",
    source: {
      latex: "x^{1/2}",
      tokens: [
        baseToken("x", 0, 0),
        operatorToken("^", -1, 1),
        superscriptToken("1/2", -1, 2)
      ]
    },
    target: {
      latex: "\\sqrt{x}",
      tokens: [
        artifactToken("structural:hide-tail", "hide-tail", 0, 0),
        artifactToken("structural:sqrt-line", "sqrt-line", -1, 1),
        artifactToken("\\sqrt", "sqrt", 0, 1),
        radicandToken("x", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: ["structural:hide-tail", "structural:sqrt-line"]
    },
    expectedRoleChanges: [
      {
        sourceRole: "base",
        targetRole: "radicand",
        sourceText: "x",
        targetText: "x"
      }
    ],
    summary:
      "Power notation becomes radical notation; radical SVG and overbar artifacts enter around the persisted radicand."
  },
  {
    id: "radical.rewrite-root-as-power",
    family: "radical",
    intent: "rewriteRootAsPower",
    source: {
      latex: "\\sqrt{x}",
      tokens: [
        artifactToken("structural:hide-tail", "hide-tail", 0, 0),
        artifactToken("structural:sqrt-line", "sqrt-line", -1, 1),
        artifactToken("\\sqrt", "sqrt", 0, 1),
        radicandToken("x", 0, 2)
      ]
    },
    target: {
      latex: "x^{1/2}",
      tokens: [
        baseToken("x", 0, 0),
        operatorToken("^", -1, 1),
        superscriptToken("1/2", -1, 2)
      ]
    },
    expectedStructuralTokens: {
      source: ["structural:hide-tail", "structural:sqrt-line"],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "radicand",
        targetRole: "base",
        sourceText: "x",
        targetText: "x"
      }
    ],
    summary:
      "Radical notation becomes power notation; radical artifacts exit while the radicand becomes the base."
  },
  {
    id: "radical.unwrap-indexed-root",
    family: "radical",
    intent: "unwrapIndexedRoot",
    source: {
      latex: "\\sqrt[3]{x^3}",
      tokens: [
        rootIndexToken("3", -1, 0),
        artifactToken("structural:hide-tail", "hide-tail", 0, 0),
        artifactToken("structural:sqrt-line", "sqrt-line", -1, 1),
        artifactToken("\\sqrt", "sqrt", 0, 1),
        radicandToken("x", 0, 2),
        superscriptToken("3", -1, 3)
      ]
    },
    target: {
      latex: "x",
      tokens: [baseToken("x", 0, 0)]
    },
    expectedStructuralTokens: {
      source: ["structural:hide-tail", "structural:sqrt-line"],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "radicand",
        targetRole: "base",
        sourceText: "x",
        targetText: "x"
      }
    ],
    summary:
      "An indexed root unwraps to its base value; the root index, radical artifacts, and exponent need explicit fixture roles."
  }
];

export const scriptTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "script.combine-factor-as-power",
    family: "script",
    intent: "combineRepeatedFactorAsPower",
    source: {
      latex: "x \\cdot x",
      tokens: [
        baseToken("x", 0, 0),
        operatorToken("\\cdot", 0, 1),
        factorToken("x", 0, 2)
      ]
    },
    target: {
      latex: "x^2",
      tokens: [baseToken("x", 0, 0), superscriptToken("2", -1, 1)]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "factor",
        targetRole: "superscript",
        sourceText: "x",
        targetText: "2"
      }
    ],
    summary:
      "A repeated factor becomes exponent notation; one factor moves into superscript geometry as a derived script token."
  },
  {
    id: "script.expand-power-to-factor",
    family: "script",
    intent: "expandPower",
    source: {
      latex: "x^2",
      tokens: [baseToken("x", 0, 0), superscriptToken("2", -1, 1)]
    },
    target: {
      latex: "x \\cdot x",
      tokens: [
        baseToken("x", 0, 0),
        operatorToken("\\cdot", 0, 1),
        factorToken("x", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "superscript",
        targetRole: "factor",
        sourceText: "2",
        targetText: "x"
      }
    ],
    summary:
      "Exponent notation expands into repeated-factor notation; the script token leaves superscript geometry."
  },
  {
    id: "script.change-subscript-index",
    family: "script",
    intent: "changeIndex",
    source: {
      latex: "a_i",
      tokens: [baseToken("a", 0, 0), subscriptToken("i", 1, 1)]
    },
    target: {
      latex: "a_{i+1}",
      tokens: [
        baseToken("a", 0, 0),
        subscriptToken("i", 1, 1),
        operatorToken("+", 1, 2),
        subscriptToken("1", 1, 3)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "subscript",
        targetRole: "subscript",
        sourceText: "i",
        targetText: "i"
      }
    ],
    summary:
      "A subscript index changes in place; the subscript baseline and scale must remain explicit in fixtures."
  }
];

export const wrapperTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "wrapper.parentheses.wrap",
    family: "wrapper",
    intent: "wrapWithDelimiter",
    source: {
      latex: "x+1",
      tokens: [
        semanticToken("x", 0, 0),
        operatorToken("+", 0, 1),
        semanticToken("1", 0, 2)
      ]
    },
    target: {
      latex: "(x+1)",
      tokens: [
        artifactToken("(", "mopen", 0, 0),
        semanticToken("x", 0, 1),
        operatorToken("+", 0, 2),
        semanticToken("1", 0, 3),
        artifactToken(")", "mclose", 0, 4)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "An expression is wrapped in parentheses; delimiter artifacts enter around persisted child tokens."
  },
  {
    id: "wrapper.absolute-value.unwrap",
    family: "wrapper",
    intent: "unwrapDelimiter",
    source: {
      latex: "|x|",
      tokens: [
        artifactToken("|", "mopen", 0, 0),
        semanticToken("x", 0, 1),
        artifactToken("|", "mclose", 0, 2)
      ]
    },
    target: {
      latex: "x",
      tokens: [semanticToken("x", 0, 0)]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "Absolute-value delimiters unwrap; delimiter artifacts exit while the child token persists."
  },
  {
    id: "wrapper.norm.wrap",
    family: "wrapper",
    intent: "wrapWithDelimiter",
    source: {
      latex: "v",
      tokens: [semanticToken("v", 0, 0)]
    },
    target: {
      latex: "\\lVert v \\rVert",
      tokens: [
        artifactToken("\\lVert", "mopen", 0, 0),
        semanticToken("v", 0, 1),
        artifactToken("\\rVert", "mclose", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "A vector symbol is wrapped in norm delimiters; large delimiter artifacts are explicit fixture tokens."
  },
  {
    id: "wrapper.function.wrap",
    family: "wrapper",
    intent: "wrapWithFunction",
    source: {
      latex: "x",
      tokens: [semanticToken("x", 0, 0)]
    },
    target: {
      latex: "f(x)",
      tokens: [
        artifactToken("f", "mop", 0, 0),
        artifactToken("(", "mopen", 0, 1),
        semanticToken("x", 0, 2),
        artifactToken(")", "mclose", 0, 3)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "An expression is wrapped as a function argument; function name and delimiters are notation artifacts."
  }
];

export const largeOperatorTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "large-operator.sum.add-bounds",
    family: "large-operator",
    intent: "addSummationBounds",
    source: {
      latex: "\\sum a_i",
      tokens: [
        largeOperatorToken("\\sum", 0, 0),
        bodyToken("a_i", 0, 1)
      ]
    },
    target: {
      latex: "\\sum_{i=1}^{n} a_i",
      tokens: [
        upperLimitToken("n", -1, 0),
        largeOperatorToken("\\sum", 0, 0),
        lowerLimitToken("i=1", 1, 0),
        bodyToken("a_i", 0, 1)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "An unbounded summation gains lower and upper bounds; the operator and summand persist while limit tokens enter in under/over geometry."
  },
  {
    id: "large-operator.product.change-bounds",
    family: "large-operator",
    intent: "changeProductBounds",
    source: {
      latex: "\\prod_{i=1}^{n} a_i",
      tokens: [
        upperLimitToken("n", -1, 0),
        largeOperatorToken("\\prod", 0, 0),
        lowerLimitToken("i=1", 1, 0),
        bodyToken("a_i", 0, 1)
      ]
    },
    target: {
      latex: "\\prod_{i=0}^{n-1} a_i",
      tokens: [
        upperLimitToken("n-1", -1, 0),
        largeOperatorToken("\\prod", 0, 0),
        lowerLimitToken("i=0", 1, 0),
        bodyToken("a_i", 0, 1)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "upper-limit",
        targetRole: "upper-limit",
        sourceText: "n",
        targetText: "n-1"
      },
      {
        sourceRole: "lower-limit",
        targetRole: "lower-limit",
        sourceText: "i=1",
        targetText: "i=0"
      }
    ],
    summary:
      "A product changes its bounds; the operator and product body persist while upper and lower limit slots morph."
  },
  {
    id: "large-operator.integral.add-bounds",
    family: "large-operator",
    intent: "addIntegralBounds",
    source: {
      latex: "\\int f(x)\\,dx",
      tokens: [
        largeOperatorToken("\\int", 0, 0),
        integrandToken("f(x)", 0, 1),
        differentialToken("dx", 0, 2)
      ]
    },
    target: {
      latex: "\\int_{a}^{b} f(x)\\,dx",
      tokens: [
        upperLimitToken("b", -1, 0),
        largeOperatorToken("\\int", 0, 0),
        lowerLimitToken("a", 1, 0),
        integrandToken("f(x)", 0, 1),
        differentialToken("dx", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "An indefinite integral gains bounds; bound tokens enter around a persisted integral operator, integrand, and differential."
  },
  {
    id: "large-operator.limit.change-approach",
    family: "large-operator",
    intent: "changeLimitApproach",
    source: {
      latex: "\\lim_{x \\to 0} f(x)",
      tokens: [
        largeOperatorToken("\\lim", 0, 0),
        limitApproachToken("x \\to 0", 1, 0),
        bodyToken("f(x)", 0, 1)
      ]
    },
    target: {
      latex: "\\lim_{h \\to 0} f(h)",
      tokens: [
        largeOperatorToken("\\lim", 0, 0),
        limitApproachToken("h \\to 0", 1, 0),
        bodyToken("f(h)", 0, 1)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "limit-approach",
        targetRole: "limit-approach",
        sourceText: "x \\to 0",
        targetText: "h \\to 0"
      }
    ],
    summary:
      "A limit changes its approach expression; the approach is semantically distinct from generic bounds but still occupies lower-limit layout geometry."
  }
];

export const katexTransformFixtures: readonly KatexTransformFixture[] = [
  ...fractionTransformFixtures,
  ...largeOperatorTransformFixtures,
  ...radicalTransformFixtures,
  ...scriptTransformFixtures,
  ...wrapperTransformFixtures
];

export function findKatexTransformFixture(id: string): KatexTransformFixture {
  const fixture = katexTransformFixtures.find(
    (candidate) => candidate.id === id
  );

  if (fixture === undefined) {
    throw new Error(`Unknown KaTeX transform fixture: ${id}`);
  }

  return fixture;
}

export function summarizeKatexTransformFixtureDiagnostics(
  fixture: KatexTransformFixture
): KatexTransformFixtureDiagnostics {
  return {
    id: fixture.id,
    family: fixture.family,
    sourceTokenCount: fixture.source.tokens.length,
    targetTokenCount: fixture.target.tokens.length,
    sourceStructuralTokenCount: fixture.expectedStructuralTokens.source.length,
    targetStructuralTokenCount: fixture.expectedStructuralTokens.target.length,
    roleChangeCount: fixture.expectedRoleChanges.length
  };
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

function bodyToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "body",
    row,
    column
  };
}

function baseToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "base",
    row,
    column
  };
}

function factorToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "factor",
    row,
    column
  };
}

function integrandToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "integrand",
    row,
    column
  };
}

function differentialToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "differential",
    row,
    column
  };
}

function largeOperatorToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mop op-symbol large-op",
    role: "large-operator",
    layoutRole: "baseline",
    row,
    column
  };
}

function upperLimitToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "upper-limit",
    layoutRole: "upper-limit",
    row,
    column
  };
}

function lowerLimitToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "lower-limit",
    layoutRole: "lower-limit",
    row,
    column
  };
}

function limitApproachToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "limit-approach",
    layoutRole: "lower-limit",
    row,
    column
  };
}

function radicandToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "radicand",
    row,
    column
  };
}

function rootIndexToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "root-index",
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

function subscriptToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "subscript",
    row,
    column
  };
}

function superscriptToken(
  text: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "superscript",
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

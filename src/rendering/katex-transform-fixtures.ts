import type { EquationVisualMotifKind } from "./visual-motif.ts";

export type KatexTransformFixtureFamily =
  | "fraction"
  | "large-operator"
  | "matrix"
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

export type KatexMatrixTransformIntent =
  | "changeMatrixDelimiter"
  | "updateMatrixEntry"
  | "swapMatrixRows"
  | "transposeVector";

export type KatexTransformFixtureIntent =
  | KatexFractionTransformIntent
  | KatexLargeOperatorTransformIntent
  | KatexMatrixTransformIntent
  | KatexRadicalTransformIntent
  | KatexScriptTransformIntent
  | KatexWrapperTransformIntent;

export type KatexTransformDefinitionFamily =
  | KatexTransformFixtureFamily
  | "accent"
  | "distribution"
  | "factoring"
  | "function"
  | "log-trig";

export type KatexIdentityPreservationPolicy =
  | "semantic-identity"
  | "semantic-derived"
  | "role-preserved"
  | "structure-preserved"
  | "visual-artifact-only";

export type KatexArtifactPolicy =
  | "none"
  | "source-only"
  | "target-only"
  | "replace"
  | "mixed";

export type KatexTransformDefinitionMaturity =
  | "fixture-backed"
  | "planned-template";

export interface KatexTransformDefinition {
  readonly id: string;
  readonly family: KatexTransformDefinitionFamily;
  readonly intent: string;
  readonly semanticTransform: string;
  readonly identityPreservation: readonly KatexIdentityPreservationPolicy[];
  readonly artifactPolicy: KatexArtifactPolicy;
  readonly defaultVisualMotifs: readonly EquationVisualMotifKind[];
  readonly geometryChallenges: readonly string[];
  readonly representativeFixtureIds: readonly string[];
  readonly maturity: KatexTransformDefinitionMaturity;
  readonly summary: string;
}

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
  | "matrix-column"
  | "matrix-entry"
  | "matrix-row"
  | "operator"
  | "radicand"
  | "root-index"
  | "semantic"
  | "subscript"
  | "superscript"
  | "upper-limit"
  | "vector-entry";

export type KatexTransformFixtureLayoutRole =
  | "baseline"
  | "lower-limit"
  | "matrix-column"
  | "matrix-entry"
  | "matrix-left-bracket"
  | "matrix-right-bracket"
  | "matrix-row"
  | "upper-limit";

export interface KatexTransformFixtureMatrixPosition {
  readonly row: number;
  readonly column: number;
}

export interface KatexTransformFixtureToken {
  readonly text: string;
  readonly signature: string;
  readonly role: KatexTransformFixtureTokenRole;
  readonly layoutRole?: KatexTransformFixtureLayoutRole;
  readonly selectorId?: string;
  readonly matrixPosition?: KatexTransformFixtureMatrixPosition;
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

export const katexFixtureBackedTransformDefinitions: readonly KatexTransformDefinition[] = [
  {
    id: "definition.fraction.make-fraction",
    family: "fraction",
    intent: "makeFraction",
    semanticTransform: "rewriteInlineDivisionAsFraction",
    identityPreservation: [
      "semantic-identity",
      "role-preserved",
      "visual-artifact-only"
    ],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["artifact-enter", "wrap"],
    geometryChallenges: ["fraction-bar", "numerator-baseline", "denominator-baseline"],
    representativeFixtureIds: ["fraction.make.inline-to-stacked"],
    maturity: "fixture-backed",
    summary:
      "Inline division becomes stacked fraction notation while numerator and denominator identity persists."
  },
  {
    id: "definition.fraction.split-fraction",
    family: "fraction",
    intent: "splitFraction",
    semanticTransform: "rewriteFractionAsInlineDivision",
    identityPreservation: [
      "semantic-identity",
      "role-preserved",
      "visual-artifact-only"
    ],
    artifactPolicy: "source-only",
    defaultVisualMotifs: ["artifact-exit", "unwrap"],
    geometryChallenges: ["fraction-bar", "baseline-rejoin"],
    representativeFixtureIds: ["fraction.split.stacked-to-inline"],
    maturity: "fixture-backed",
    summary:
      "Stacked fraction notation becomes inline division while source-only fraction artifacts exit."
  },
  {
    id: "definition.fraction.combine-fractions",
    family: "fraction",
    intent: "combineFractions",
    semanticTransform: "combineFractionsWithCommonDenominator",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "mixed",
    defaultVisualMotifs: ["simplify-into", "artifact-replace"],
    geometryChallenges: ["multiple-fraction-bars", "derived-numerator", "derived-denominator"],
    representativeFixtureIds: ["fraction.combine.common-denominator"],
    maturity: "fixture-backed",
    summary:
      "Multiple fractions combine into one derived fraction with explicit source and target artifact handling."
  },
  {
    id: "definition.radical.rewrite-power-as-root",
    family: "radical",
    intent: "rewritePowerAsRoot",
    semanticTransform: "rewritePowerAsRadical",
    identityPreservation: ["semantic-identity", "role-preserved"],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["wrap", "artifact-enter"],
    geometryChallenges: ["radical-glyph", "overbar", "script-to-radicand"],
    representativeFixtureIds: ["radical.rewrite-power-as-root"],
    maturity: "fixture-backed",
    summary:
      "Power notation becomes radical notation while the base persists as the radicand."
  },
  {
    id: "definition.radical.rewrite-root-as-power",
    family: "radical",
    intent: "rewriteRootAsPower",
    semanticTransform: "rewriteRadicalAsPower",
    identityPreservation: ["semantic-identity", "role-preserved"],
    artifactPolicy: "source-only",
    defaultVisualMotifs: ["unwrap", "artifact-exit"],
    geometryChallenges: ["radical-glyph", "overbar", "radicand-to-base"],
    representativeFixtureIds: ["radical.rewrite-root-as-power"],
    maturity: "fixture-backed",
    summary:
      "Radical notation becomes power notation while radical artifacts exit."
  },
  {
    id: "definition.radical.unwrap-indexed-root",
    family: "radical",
    intent: "unwrapIndexedRoot",
    semanticTransform: "cancelRootWithMatchingPower",
    identityPreservation: ["semantic-derived", "role-preserved"],
    artifactPolicy: "source-only",
    defaultVisualMotifs: ["simplify-into", "artifact-exit"],
    geometryChallenges: ["root-index", "radical-glyph", "script-cancelation"],
    representativeFixtureIds: ["radical.unwrap-indexed-root"],
    maturity: "fixture-backed",
    summary:
      "An indexed root simplifies to its base after root index, exponent, and radical artifacts resolve."
  },
  {
    id: "definition.script.combine-repeated-factor-as-power",
    family: "script",
    intent: "combineRepeatedFactorAsPower",
    semanticTransform: "rewriteRepeatedFactorAsPower",
    identityPreservation: ["semantic-derived", "role-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["simplify-into"],
    geometryChallenges: ["superscript-baseline", "operator-fade"],
    representativeFixtureIds: ["script.combine-factor-as-power"],
    maturity: "fixture-backed",
    summary:
      "Repeated multiplication becomes exponent notation with a derived superscript."
  },
  {
    id: "definition.script.expand-power",
    family: "script",
    intent: "expandPower",
    semanticTransform: "rewritePowerAsRepeatedFactors",
    identityPreservation: ["semantic-derived", "role-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["simplify-into"],
    geometryChallenges: ["superscript-baseline", "operator-enter"],
    representativeFixtureIds: ["script.expand-power-to-factor"],
    maturity: "fixture-backed",
    summary:
      "Exponent notation expands into repeated factors with explicit script-to-inline geometry."
  },
  {
    id: "definition.script.change-index",
    family: "script",
    intent: "changeIndex",
    semanticTransform: "updateScriptIndex",
    identityPreservation: ["semantic-identity", "role-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift"],
    geometryChallenges: ["subscript-baseline", "script-scale"],
    representativeFixtureIds: ["script.change-subscript-index"],
    maturity: "fixture-backed",
    summary:
      "A script index changes while remaining in script geometry."
  },
  {
    id: "definition.wrapper.wrap-with-delimiter",
    family: "wrapper",
    intent: "wrapWithDelimiter",
    semanticTransform: "wrapExpressionWithDelimiter",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["wrap", "artifact-enter"],
    geometryChallenges: ["delimiter-sizing", "child-settle"],
    representativeFixtureIds: ["wrapper.parentheses.wrap", "wrapper.norm.wrap"],
    maturity: "fixture-backed",
    summary:
      "Delimiter notation wraps a persistent child expression with target-only visual artifacts."
  },
  {
    id: "definition.wrapper.unwrap-delimiter",
    family: "wrapper",
    intent: "unwrapDelimiter",
    semanticTransform: "unwrapExpressionDelimiter",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "source-only",
    defaultVisualMotifs: ["unwrap", "artifact-exit"],
    geometryChallenges: ["delimiter-sizing", "child-settle"],
    representativeFixtureIds: ["wrapper.absolute-value.unwrap"],
    maturity: "fixture-backed",
    summary:
      "Delimiter notation unwraps while child expression identity persists."
  },
  {
    id: "definition.wrapper.wrap-with-function",
    family: "wrapper",
    intent: "wrapWithFunction",
    semanticTransform: "wrapExpressionWithFunctionCall",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["wrap", "artifact-enter"],
    geometryChallenges: ["function-name-enter", "parenthesis-settle"],
    representativeFixtureIds: ["wrapper.function.wrap"],
    maturity: "fixture-backed",
    summary:
      "Function-call notation wraps a persistent argument with function and delimiter artifacts."
  },
  {
    id: "definition.large-operator.add-summation-bounds",
    family: "large-operator",
    intent: "addSummationBounds",
    semanticTransform: "addLargeOperatorBounds",
    identityPreservation: ["semantic-identity", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift"],
    geometryChallenges: ["under-over-limits", "large-operator-baseline"],
    representativeFixtureIds: ["large-operator.sum.add-bounds"],
    maturity: "fixture-backed",
    summary:
      "A large operator gains bounds while the operator and body persist."
  },
  {
    id: "definition.large-operator.change-product-bounds",
    family: "large-operator",
    intent: "changeProductBounds",
    semanticTransform: "changeLargeOperatorBounds",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["simplify-into"],
    geometryChallenges: ["under-over-limits", "paired-bound-updates"],
    representativeFixtureIds: ["large-operator.product.change-bounds"],
    maturity: "fixture-backed",
    summary:
      "Large-operator bounds change while the product operator and body persist."
  },
  {
    id: "definition.large-operator.add-integral-bounds",
    family: "large-operator",
    intent: "addIntegralBounds",
    semanticTransform: "addIntegralBounds",
    identityPreservation: ["semantic-identity", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift"],
    geometryChallenges: ["integral-limits", "differential-spacing"],
    representativeFixtureIds: ["large-operator.integral.add-bounds"],
    maturity: "fixture-backed",
    summary:
      "An indefinite integral gains bounds while integrand and differential persist."
  },
  {
    id: "definition.large-operator.change-limit-approach",
    family: "large-operator",
    intent: "changeLimitApproach",
    semanticTransform: "changeLimitApproach",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["simplify-into"],
    geometryChallenges: ["lower-limit-layout", "function-argument-rename"],
    representativeFixtureIds: ["large-operator.limit.change-approach"],
    maturity: "fixture-backed",
    summary:
      "A limit approach expression changes inside lower-limit geometry."
  },
  {
    id: "definition.matrix.change-delimiter",
    family: "matrix",
    intent: "changeMatrixDelimiter",
    semanticTransform: "changeMatrixDelimiterStyle",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "replace",
    defaultVisualMotifs: ["artifact-replace"],
    geometryChallenges: ["large-delimiters", "entry-grid-persistence"],
    representativeFixtureIds: ["matrix.bracket.change-delimiter"],
    maturity: "fixture-backed",
    summary:
      "Matrix delimiter artifacts replace each other while entry selector identity persists."
  },
  {
    id: "definition.matrix.update-entry",
    family: "matrix",
    intent: "updateMatrixEntry",
    semanticTransform: "updateMatrixEntry",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["simplify-into"],
    geometryChallenges: ["entry-grid-persistence", "cell-local-morph"],
    representativeFixtureIds: ["matrix.entry.update"],
    maturity: "fixture-backed",
    summary:
      "A matrix entry changes while the matrix grid and unaffected entries persist."
  },
  {
    id: "definition.matrix.swap-rows",
    family: "matrix",
    intent: "swapMatrixRows",
    semanticTransform: "swapMatrixRows",
    identityPreservation: ["semantic-identity", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift"],
    geometryChallenges: ["row-layout-shift", "entry-grid-persistence"],
    representativeFixtureIds: ["matrix.row.swap"],
    maturity: "fixture-backed",
    summary:
      "Matrix rows swap positions while row and entry identities persist."
  },
  {
    id: "definition.matrix.transpose-vector",
    family: "matrix",
    intent: "transposeVector",
    semanticTransform: "transposeVectorView",
    identityPreservation: ["semantic-identity", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift"],
    geometryChallenges: ["row-column-role-change", "delimiter-sizing"],
    representativeFixtureIds: ["vector.transpose.column-to-row"],
    maturity: "fixture-backed",
    summary:
      "A vector changes orientation while vector entry identities persist."
  }
];

export const katexPlannedTransformDefinitions: readonly KatexTransformDefinition[] = [
  {
    id: "definition.distribution.distribute-product",
    family: "distribution",
    intent: "distributeProductOverSum",
    semanticTransform: "distributeProductOverSum",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "none",
    defaultVisualMotifs: ["append-after-shift", "simplify-into"],
    geometryChallenges: ["duplicated-factor-provenance", "operator-entry"],
    representativeFixtureIds: [],
    maturity: "planned-template",
    summary:
      "Distribution duplicates a factor over summed terms and needs explicit provenance for copied tokens."
  },
  {
    id: "definition.factoring.factor-common-term",
    family: "factoring",
    intent: "factorCommonTerm",
    semanticTransform: "factorCommonTerm",
    identityPreservation: ["semantic-derived", "structure-preserved"],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["simplify-into", "wrap"],
    geometryChallenges: ["term-grouping", "parenthesis-enter", "copied-factor-collapse"],
    representativeFixtureIds: [],
    maturity: "planned-template",
    summary:
      "Factoring gathers repeated structure into a wrapped product with explicit shared provenance."
  },
  {
    id: "definition.function.apply-log-or-trig",
    family: "log-trig",
    intent: "applyFunction",
    semanticTransform: "wrapExpressionWithNamedFunction",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "target-only",
    defaultVisualMotifs: ["wrap", "artifact-enter"],
    geometryChallenges: ["function-name-enter", "argument-parens", "operator-precedence"],
    representativeFixtureIds: [],
    maturity: "planned-template",
    summary:
      "Log and trig function applications wrap an argument while function names and delimiters enter as notation artifacts."
  },
  {
    id: "definition.accent.add-or-strip-accent",
    family: "accent",
    intent: "toggleAccent",
    semanticTransform: "toggleAccentNotation",
    identityPreservation: ["semantic-identity", "visual-artifact-only"],
    artifactPolicy: "mixed",
    defaultVisualMotifs: ["artifact-enter", "artifact-exit"],
    geometryChallenges: ["overline-height", "bar-length", "accent-owner"],
    representativeFixtureIds: [],
    maturity: "planned-template",
    summary:
      "Accents, bars, and overlines are visual artifacts owned by an annotated expression."
  }
];

export const katexTransformDefinitions: readonly KatexTransformDefinition[] = [
  ...katexFixtureBackedTransformDefinitions,
  ...katexPlannedTransformDefinitions
];

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

export const matrixTransformFixtures: readonly KatexTransformFixture[] = [
  {
    id: "matrix.bracket.change-delimiter",
    family: "matrix",
    intent: "changeMatrixDelimiter",
    source: {
      latex: "\\begin{bmatrix}1 & 0 \\\\ 0 & 1\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        matrixEntryToken("1", "entry.r0.c0", 0, 0),
        matrixEntryToken("0", "entry.r0.c1", 0, 1),
        matrixEntryToken("0", "entry.r1.c0", 1, 0),
        matrixEntryToken("1", "entry.r1.c1", 1, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    target: {
      latex: "\\begin{pmatrix}1 & 0 \\\\ 0 & 1\\end{pmatrix}",
      tokens: [
        matrixBracketToken("(", "matrix-left-bracket", 0, -1),
        matrixEntryToken("1", "entry.r0.c0", 0, 0),
        matrixEntryToken("0", "entry.r0.c1", 0, 1),
        matrixEntryToken("0", "entry.r1.c0", 1, 0),
        matrixEntryToken("1", "entry.r1.c1", 1, 1),
        matrixBracketToken(")", "matrix-right-bracket", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [],
    summary:
      "A matrix changes delimiter style; bracket artifacts swap while stable entry selectors keep their grid positions."
  },
  {
    id: "matrix.entry.update",
    family: "matrix",
    intent: "updateMatrixEntry",
    source: {
      latex: "\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        matrixEntryToken("1", "entry.r0.c0", 0, 0),
        matrixEntryToken("2", "entry.r0.c1", 0, 1),
        matrixEntryToken("3", "entry.r1.c0", 1, 0),
        matrixEntryToken("4", "entry.r1.c1", 1, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    target: {
      latex: "\\begin{bmatrix}1 & 2 \\\\ 6 & 4\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        matrixEntryToken("1", "entry.r0.c0", 0, 0),
        matrixEntryToken("2", "entry.r0.c1", 0, 1),
        matrixEntryToken("6", "entry.r1.c0", 1, 0),
        matrixEntryToken("4", "entry.r1.c1", 1, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "matrix-entry",
        targetRole: "matrix-entry",
        sourceText: "3",
        targetText: "6"
      }
    ],
    summary:
      "A single matrix entry changes in place; the fixture keeps the cell selector and grid position explicit."
  },
  {
    id: "matrix.row.swap",
    family: "matrix",
    intent: "swapMatrixRows",
    source: {
      latex: "\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        matrixRowToken("row-0", "row.0", 0),
        matrixEntryToken("a", "entry.a", 0, 0),
        matrixEntryToken("b", "entry.b", 0, 1),
        matrixRowToken("row-1", "row.1", 1),
        matrixEntryToken("c", "entry.c", 1, 0),
        matrixEntryToken("d", "entry.d", 1, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    target: {
      latex: "\\begin{bmatrix}c & d \\\\ a & b\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        matrixRowToken("row-1", "row.1", 0),
        matrixEntryToken("c", "entry.c", 0, 0),
        matrixEntryToken("d", "entry.d", 0, 1),
        matrixRowToken("row-0", "row.0", 1),
        matrixEntryToken("a", "entry.a", 1, 0),
        matrixEntryToken("b", "entry.b", 1, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "matrix-row",
        targetRole: "matrix-row",
        sourceText: "row-0",
        targetText: "row-1"
      },
      {
        sourceRole: "matrix-row",
        targetRole: "matrix-row",
        sourceText: "row-1",
        targetText: "row-0"
      }
    ],
    summary:
      "Two matrix rows swap; entry identities persist while their grid-relative positions change with the row."
  },
  {
    id: "vector.transpose.column-to-row",
    family: "matrix",
    intent: "transposeVector",
    source: {
      latex: "\\begin{bmatrix}x \\\\ y\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        vectorEntryToken("x", "vector.x", 0, 0),
        vectorEntryToken("y", "vector.y", 1, 0),
        matrixBracketToken("]", "matrix-right-bracket", 0, 1)
      ]
    },
    target: {
      latex: "\\begin{bmatrix}x & y\\end{bmatrix}",
      tokens: [
        matrixBracketToken("[", "matrix-left-bracket", 0, -1),
        vectorEntryToken("x", "vector.x", 0, 0),
        vectorEntryToken("y", "vector.y", 0, 1),
        matrixBracketToken("]", "matrix-right-bracket", 0, 2)
      ]
    },
    expectedStructuralTokens: {
      source: [],
      target: []
    },
    expectedRoleChanges: [
      {
        sourceRole: "vector-entry",
        targetRole: "vector-entry",
        sourceText: "x",
        targetText: "x"
      },
      {
        sourceRole: "vector-entry",
        targetRole: "vector-entry",
        sourceText: "y",
        targetText: "y"
      }
    ],
    summary:
      "A column vector transposes into a row vector; vector entry selectors persist while row and column coordinates change."
  }
];

export const katexTransformFixtures: readonly KatexTransformFixture[] = [
  ...fractionTransformFixtures,
  ...largeOperatorTransformFixtures,
  ...matrixTransformFixtures,
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

export function findKatexTransformDefinition(
  family: KatexTransformDefinitionFamily,
  intent: string
): KatexTransformDefinition {
  const definition = katexTransformDefinitions.find(
    (candidate) =>
      candidate.family === family && candidate.intent === intent
  );

  if (definition === undefined) {
    throw new Error(
      `Unknown KaTeX transform definition: ${family}.${intent}`
    );
  }

  return definition;
}

export function definitionForKatexTransformFixture(
  fixture: KatexTransformFixture
): KatexTransformDefinition {
  return findKatexTransformDefinition(fixture.family, fixture.intent);
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

export function summarizeKatexTransformDefinition(
  definition: KatexTransformDefinition
): Pick<
  KatexTransformDefinition,
  | "id"
  | "family"
  | "intent"
  | "semanticTransform"
  | "identityPreservation"
  | "artifactPolicy"
  | "defaultVisualMotifs"
  | "maturity"
> {
  return {
    id: definition.id,
    family: definition.family,
    intent: definition.intent,
    semanticTransform: definition.semanticTransform,
    identityPreservation: [...definition.identityPreservation],
    artifactPolicy: definition.artifactPolicy,
    defaultVisualMotifs: [...definition.defaultVisualMotifs],
    maturity: definition.maturity
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

function matrixBracketToken(
  text: string,
  layoutRole: "matrix-left-bracket" | "matrix-right-bracket",
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "delimsizing",
    role: "artifact",
    layoutRole,
    row,
    column
  };
}

function matrixEntryToken(
  text: string,
  selectorId: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "matrix-entry",
    layoutRole: "matrix-entry",
    selectorId,
    matrixPosition: { row, column },
    row,
    column
  };
}

function vectorEntryToken(
  text: string,
  selectorId: string,
  row: number,
  column: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "mord",
    role: "vector-entry",
    layoutRole: "matrix-entry",
    selectorId,
    matrixPosition: { row, column },
    row,
    column
  };
}

function matrixRowToken(
  text: string,
  selectorId: string,
  row: number
): KatexTransformFixtureToken {
  return {
    text,
    signature: "matrix-row",
    role: "matrix-row",
    layoutRole: "matrix-row",
    selectorId,
    row,
    column: -1
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

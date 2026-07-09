# KaTeX Transform Taxonomy Design

Date: 2026-07-09
Theseus run: `run.semantic-katex-transform-v1`
Target: `frontier.docs.katex-transform-taxonomy-v1`
Status: proposal

## Purpose

This document lists the unusual KaTeX transitions KP must learn to animate
reliably as equation animation moves from visual diffs to authored
`SemanticTransformation` and `NotationTransform` records.

The durable rule is:

```txt
semantic transformation -> correspondence map -> visual motif -> measured KaTeX
```

KaTeX remains the typography and layout engine. KP should not infer algebraic
truth from rendered spans. Instead, semantic objects and transformations provide
identity, provenance, and intended relations, while the renderer measures the
resulting KaTeX and samples visual tracks.

Use `SemanticTransformation` when the operation creates a derived semantic
object or proof step. Use `NotationTransform` when the same semantic object is
rendered in a different notation, such as inline slash to stacked fraction,
radical to exponent, or implicit to explicit multiplication.

## Scope

In scope:

- equation and expression transformations rendered with KaTeX;
- text, symbol, and structural layout cases that affect motion;
- semantic intent names, selector requirements, and visual motif needs;
- fixture priorities for future tests.

Out of scope:

- a full arbitrary LaTeX parser;
- replacing KaTeX layout with custom WebGL text layout;
- complete CAS simplification;
- broad graph, code, or diagram animation cases except where they share motifs.

## Taxonomy Summary

| Family | Examples | Semantic intent | Visual challenge |
| --- | --- | --- | --- |
| Additive edits | `x + 3`, `x - 3`, `-x` | add, subtract, cancel, normalize sign | binary vs unary operator identity |
| Multiplicative edits | `2x`, `2 \cdot x`, `(2)(x)` | multiply, divide, factor, distribute | implicit glyphs and spacing have no token |
| Group wrapping | `(x+1)`, `\left(...\right)` | wrap, unwrap, regroup | delimiters resize and may not correspond one-to-one |
| Fractions | `\frac{x}{3}`, `x/3` | lift to fraction, split, combine, cancel | numerator, bar, denominator move on different baselines |
| Scripts | `x^2`, `a_i`, `x_i^2` | exponentiate, index, move into/out of script | scale, baseline, and attachment point change together |
| Radicals | `\sqrt{x}`, `\sqrt[3]{x}` | apply root, unwrap root, rationalize | radical glyph and overbar are composite artifacts |
| Functions | `\log(x)`, `\sin^2 x` | apply/invert/wrap function | function name may persist while argument layout changes |
| Constants and evaluation | `7 - 3 -> 4` | evaluate constant expression | many source tokens correspond to one target token |
| Distribution/factoring | `2(x+3) -> 2x+6` | distribute, factor | one selector fans out or many selectors merge |
| Powers and logs | `a^x`, `\log_a x` | inverse transform, base change | base/exponent/script roles can swap |
| Trig identities | `\sin^2 x+\cos^2 x -> 1` | replace by identity | whole subtrees may collapse into one value |
| Inequalities and relations | `<`, `\le`, `=`, `\iff` | transform relation, preserve logical relation | relation glyph may flip or change width |
| Matrices and arrays | `\begin{bmatrix}...\end{bmatrix}` | row operation, transpose, multiply | brackets, rows, columns, and entries all have separate identity |
| Cases and piecewise | `\begin{cases}...\end{cases}` | split domain, merge cases | left brace and row alignment are artifacts |
| Sums/integrals/limits | `\sum_{i=1}^n`, `\int_a^b` | expand, evaluate, change bounds | large operators own attached scripts and limits |
| Accents and bars | `\bar{x}`, `\vec{v}`, `\hat{\theta}` | annotate, strip annotation | accent glyphs are artifacts, not semantic values |
| Color/focus overlays | `\color{red}{x}` | focus, emphasize, annotate | visual state should not change the semantic object |
| Alignment and multiline | `aligned`, line breaks | step derivation, align relation | vertical layout and relation columns must remain stable |

## Semantic Transformation Families

### Add Or Subtract On Both Sides

Examples:

- `x + 3 = 7 -> x + 3 - 3 = 7 - 3`
- `x - a = b -> x - a + a = b + a`

Semantic intent:

- `addBothSides(term)`
- `subtractBothSides(term)`
- `moveTermAcrossEquals(term, inverse)`

Selector requirements:

- equation side selectors;
- introduced inverse term selectors;
- relation selector;
- provenance from operation term to both inserted terms.

Challenges:

- the inserted term should not appear before persisted tokens shift if it would
  collide with existing layout;
- repeated constants need explicit authored selectors, not text matching;
- unary minus and binary minus must be distinguished before rendering.

### Cancelation

Examples:

- `+3 - 3 -> 0` then removed;
- `\frac{x}{x} -> 1` under a nonzero assumption.

Semantic intent:

- `cancelAdditiveInverse`
- `cancelMultiplicativeInverse`
- `cancelCommonFactor`

Selector requirements:

- source selectors for both canceling sides;
- relation such as `cancelled-by`;
- assumptions when cancellation changes domains.

Visual motif:

- source tokens converge to a shared locus;
- tokens shrink uniformly to the configured minimum;
- tokens rapidly fade or dissolve;
- remaining tokens settle after the disappearance beat.

Challenges:

- terms may live in different geometry contexts, such as numerator and
  denominator;
- cancellation strokes or annotations are visual overlays and should not become
  semantic tokens;
- multiplicative cancellation can change domain assumptions.

### Evaluate Constant Expression

Examples:

- `7 - 3 -> 4`
- `2 \cdot 6 -> 12`
- `\sqrt{9} -> 3`

Semantic intent:

- `evaluateConstantExpression`
- `simplifySide(rule)`

Selector requirements:

- source expression group selector;
- target constant selector;
- provenance from source group to target value;
- optional execution evidence for arithmetic.

Visual motif:

- source group shrinks and fades toward a shared locus;
- target token grows and fades in from the same locus.

Challenges:

- many-to-one correspondence is not persistence;
- exact arithmetic, units, and branch rules must be encoded before animation;
- the result token may have very different width from the source group.

### Wrap And Unwrap

Examples:

- `x+1 -> (x+1)`
- `x -> \sqrt{x}`
- `x -> f(x)`
- `x -> |x|`

Semantic intent:

- `wrapWithDelimiter`
- `wrapWithFunction`
- `wrapWithRadical`
- `unwrap`

Selector requirements:

- child expression persists;
- wrapper artifact selectors are entered or exited;
- function/operator selector if the wrapper has semantic content.

Challenges:

- delimiters may grow based on child height;
- wrappers introduce layout artifacts that have no source identity;
- child expression can shift baseline or scale while preserving semantic identity.

### Fraction Transformations

Examples:

- `x/3 -> \frac{x}{3}`
- `\frac{x}{3}=4 -> x=12`
- `\frac{a}{b}+\frac{c}{d} -> \frac{ad+bc}{bd}`
- `\frac{xy}{x} -> y`

Semantic intent:

- `makeFraction`
- `splitFraction`
- `multiplyBothSidesByDenominator`
- `combineFractions`
- `cancelCommonFactor`

Selector requirements:

- numerator, denominator, fraction bar, and whole-fraction selectors;
- explicit correspondence for terms lifted into numerator or denominator;
- domain assumptions for nonzero denominators.

Challenges:

- fraction bars are visual artifacts but need render-node ids;
- inline slash notation and stacked fraction notation do not share geometry;
- nested fractions need stable parent/child paths;
- numerator and denominator can independently reflow.

### Script Role Changes

Examples:

- `x \cdot x -> x^2`
- `\sqrt{x^2} -> |x|`
- `a_i -> a_{i+1}`
- `x^2 = 9 -> x = \pm 3`

Semantic intent:

- `combineRepeatedFactorAsPower`
- `expandPower`
- `addSubscript`
- `changeIndex`
- `takeRoot`

Selector requirements:

- base selector;
- exponent/subscript selector;
- role relation for selectors moving into or out of script position.

Challenges:

- KaTeX scales script content and changes baseline;
- superscript and subscript attachment points differ by glyph;
- towers such as `a^{b^c}` require nested role paths;
- exponent simplification can introduce branch conditions.

### Radical Transformations

Examples:

- `x^{1/2} -> \sqrt{x}`
- `\sqrt{x^2} -> |x|`
- `\sqrt[3]{x^3} -> x`

Semantic intent:

- `rewritePowerAsRoot`
- `unwrapRadical`
- `rationalizeDenominator`

Selector requirements:

- radicand selector;
- root index selector when present;
- radical artifact selector for glyph and overbar.

Challenges:

- KaTeX renders radical pieces with SVG or generated spans depending on case;
- the radical glyph and overbar should enter as one artifact group;
- index roots use a small script-like position outside the radicand box;
- branch and absolute-value semantics are not visual details.

### Function Wrapping And Inverses

Examples:

- `x -> \log(x)`
- `\log(x)=2 -> x=e^2`
- `\sin^{-1}(y) -> \arcsin(y)`
- `e^{\log x} -> x`

Semantic intent:

- `applyFunction`
- `applyInverseFunction`
- `composeFunctions`
- `simplifyInversePair`

Selector requirements:

- function name selector;
- argument selector;
- inverse-pair correspondence.

Challenges:

- function names can be multi-glyph operators;
- parentheses can be implicit or explicit;
- inverse notation may use superscript `-1` without meaning reciprocal;
- argument identity persists while wrapper tokens appear or vanish.

### Distribution And Factoring

Examples:

- `2(x+3) -> 2x+6`
- `x^2+3x -> x(x+3)`
- `(x+1)(x-1) -> x^2-1`

Semantic intent:

- `distribute`
- `factorCommonTerm`
- `expandProduct`
- `collectLikeTerms`

Selector requirements:

- source factor selector;
- target copies or merged factors;
- provenance for fan-out and fan-in.

Challenges:

- a single semantic value may generate several target render tokens;
- visual fan-out can imply copying, not persistence;
- like terms need authored grouping to avoid ambiguous text matches;
- multiplication may be implicit in the source or target.

### Matrices, Arrays, And Cases

Examples:

- matrix row operation `R_2 <- R_2 - 3R_1`;
- transpose `A -> A^T`;
- matrix multiplication as dot products;
- piecewise split or merge.

Semantic intent:

- `applyRowOperation`
- `transposeMatrix`
- `matrixMultiply`
- `splitCases`

Selector requirements:

- matrix, row, column, entry, bracket, and delimiter artifact selectors;
- nested transformation tree for composed operations;
- row/column provenance when entries move or are recomputed.

Challenges:

- large delimiters are renderer artifacts but must move with the matrix view;
- entry positions are grid-relative, not token-flow-relative;
- matrix multiplication composes many dot-product transformations;
- cases braces and alignment columns are layout artifacts.

## Visual Motif Inventory

These motifs sit below semantic transformations. They communicate persistence
and structure but do not own mathematical truth.

- `persist`: selector survives and moves to its measured target pose.
- `shift`: existing render nodes move after layout makes room.
- `enter`: new selectors appear after persisted tokens shift when needed.
- `exit`: old selectors leave before remaining tokens settle when needed.
- `vanish`: source group converges, shrinks, and fades.
- `reveal`: target group grows from a shared locus.
- `simplify-into`: `vanish` plus `reveal` with many-to-one provenance.
- `wrap`: child persists while wrapper artifacts enter around it.
- `unwrap`: wrapper artifacts exit while child persists.
- `split`: one source group fans out into multiple target groups.
- `merge`: multiple source groups converge into one target group.
- `role-change`: selector moves between baseline, numerator, denominator,
  superscript, subscript, or operator-limit geometry.
- `focus`: semantic-preserving visual emphasis with reversible state.

## Renderer Risks

### Selector Ambiguity

KaTeX often emits repeated glyphs with identical text. `x+x`, `3+3`, and
repeated matrix entries cannot be matched by text order. Semantic transformations
must attach stable selector ids before rendering.

### Artifact Identity

Fraction bars, radical glyphs, large delimiters, accents, matrix brackets, and
alignment columns are not semantic values, but they are visible render nodes.
They need artifact ids derived from semantic view paths.

### Baseline And Scale Changes

Scripts, fractions, radicals, limits, and arrays change baseline and local
scale. The sampler must interpolate measured poses, not assume a constant
baseline.

### Layout-Then-Enter Ordering

When a command adds an object and existing tokens must shift, persisted tokens
should shift first, then the new token should enter. Because tracks are
sampleable, this should be encoded as beats inside one command, not as separate
CSS-only choreography.

### Many-To-One And One-To-Many

Simplification and distribution are not persistence. The correspondence map
should say when a group influences another group without claiming the same
identity.

### Domain And Branch Assumptions

Cancellation, roots, logs, division, absolute values, and inverse functions can
change domains. These assumptions belong in the semantic transformation record
and can be surfaced visually as annotations.

### KaTeX Internal Instability

KP should avoid depending on private KaTeX class shapes except for measurement
and artifact detection. Semantic ids and render-node ids should be emitted by
KP wrappers around KaTeX fragments whenever possible.

## Fixture Priority

### Tier 1

1. `x + 3 = 7`: subtract both sides, cancel additive inverse, evaluate `7-3`.
2. `\frac{x}{3} = 4`: multiply both sides and unwrap denominator.
3. `2(x + 3) = 10`: distribute, then simplify.
4. `x^2 = 9`: take roots and introduce plus/minus branches.
5. `\log(x) = 2`: apply exponential inverse.

### Tier 2

1. Rational expression cancellation across numerator and denominator.
2. Inline slash to stacked fraction.
3. Nested fraction simplification.
4. Radical wrapping and unwrapping.
5. Function inverse pair simplification.
6. Matrix row operation with entry-level provenance.

### Tier 3

1. Matrix multiplication as nested dot products.
2. Chain rule with nested function identity.
3. Trig identity replacement.
4. Piecewise split or merge.
5. Summation expansion.
6. Aligned multi-line derivation with relation-column persistence.

## Implementation Implications

1. Build `SemanticObject` and `SemanticTransformation` records before trying to
   solve visual matching for arbitrary rendered KaTeX.
2. Define `CorrespondenceMap` relations for persistence, provenance, fan-out,
   fan-in, cancelation, wrapper artifacts, and role changes.
3. Add fixture tests by geometry family, starting with fractions, scripts, and
   radicals.
4. Keep visual motifs reusable and semantic-free so equation, graph, matrix,
   diagram, and programming animations can share them.
5. Treat arbitrary unannotated KaTeX diffing as a fallback, not the primary API.

## Fixture Registry Checkpoint

Slice 11 added `src/rendering/katex-transform-fixtures.ts` with the first
fraction fixture records:

- `fraction.make.inline-to-stacked`
- `fraction.split.stacked-to-inline`
- `fraction.combine.common-denominator`

These fixtures encode expected structural tokens for fraction bars and provide
synthetic row/column token layouts for matcher tests. They are not yet semantic
transform implementations; they are geometry fixtures that make future
`makeFraction`, `splitFraction`, and `combineFractions` transitions testable.

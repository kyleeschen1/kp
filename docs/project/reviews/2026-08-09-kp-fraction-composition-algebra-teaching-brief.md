# KP Fraction Composition Algebra Teaching Brief

Date: 2026-08-09
Status: approved run scope; semantic audit complete

## Teaching Objective

Teach one exact solution of

$$
\frac{2}{3}(x+6)=10
$$

without treating symbolic rearrangement as replacement magic. The learner
should see that the fraction acts on the complete grouped sum, that equivalent
operations preserve the same solution, and that isolating the fractional term
before clearing its denominator keeps each move legible. The verified result
is $x=9$.

This article is the structurally different second `kp.article.v1` caller. It
must test reuse of an existing equation animation, not redesign the canonical
reader or broaden the article grammar.

## Semantic Authority And Preservation

The article owns only prose, source order, sparse attention associations, and
which named checkpoint ranges to explain. It does not own algebraic truth or
frame timing.

- `createKpLawfulFractionSolveMacro()` owns the exact 14-state, 13-operation
  trace and proves that every state has solution $9$.
- `createKpFractionCompositionEvaluationTree()` owns the five ordered
  operation groups and the two intentional inspection pauses.
- `createKpFractionCompositionSalienceInventory()` owns stable endpoint,
  transition, selector, envelope, and default-focus identities.
- `animation.fraction-composition.two-thirds-solve` owns the canonical native
  KaTeX renderer, one clock, protected transit, seek, rewind, and folding.
- `createKpFractionCompositionStaticStepExport()` owns all 14 exact static
  endpoint truths. The article selects six explanatory checkpoints from those
  truths; it does not reconstruct equations from visible glyphs.

Preserve native KaTeX endpoint ownership, opaque structural fraction bars,
one runtime clock, the certified stage layout, direct sampling, exact rewind,
and the existing `/reader/fraction-composition/` route unchanged.

## Claims

1. In $\frac{2}{3}(x+6)$, the multiplier applies to both terms inside the
   grouped sum.
2. Distribution and numerator normalization produce two fractional terms over
   the same denominator without changing the solution set.
3. The constant term simplifies from $\frac{2\cdot6}{3}$ to $4$.
4. Subtracting $4$ from both sides preserves equality and isolates
   $\frac{2x}{3}$.
5. Multiplying both sides by $3$ clears the denominator only after the
   fractional term is isolated, yielding $2x=18$.
6. Dividing both sides by $2$ yields the exact solution $x=9$.

The prose must not imply that terms “move” across the equals sign by changing
sign, that cancellation erases unsupported material, or that a visual
crossfade constitutes an algebraic operation.

## Explanatory Checkpoints

The article exposes this compact six-state spine while the vignette retains
all 14 verified endpoints internally.

| Path | Canonical state | Accessible reading | Teaching role |
| --- | --- | --- | --- |
| `factored` | `fraction-solve.state.factored` | Two thirds times the quantity x plus six equals ten. | Read the scope of the multiplier. |
| `normalized` | `fraction-solve.state.normalized` | Two x over three plus two times six over three equals ten. | Inspect both distributed terms. |
| `constant-quotient` | `fraction-solve.state.constant-quotient` | Two x over three plus four equals ten. | Separate the variable fraction from the simplified constant. |
| `difference-simplified` | `fraction-solve.state.difference-simplified` | Two x over three equals six. | Confirm equality after subtracting four from both sides. |
| `right-product-simplified` | `fraction-solve.state.right-product-simplified` | Two x equals eighteen. | Confirm the denominator has been cleared on both sides. |
| `solved` | `fraction-solve.state.solved` | x equals nine. | State and check the exact solution. |

## Named Motion Ranges

Each range is a vignette transition between certified checkpoints. A motion
block may run a complete named range or address its endpoints directly; prose
links never become timeline authority.

| Transition path | From | To | Canonical operations |
| --- | --- | --- | --- |
| `distribute-and-normalize` | `factored` | `normalized` | distribute; normalize fraction numerators |
| `evaluate-constant` | `normalized` | `constant-quotient` | form the constant product; evaluate the quotient |
| `subtract-and-simplify` | `constant-quotient` | `difference-simplified` | subtract four from both sides; cancel additive inverses; simplify ten minus four |
| `clear-denominator` | `difference-simplified` | `right-product-simplified` | multiply both sides by three; cancel multiplicative inverses; simplify six times three |
| `divide-and-solve` | `right-product-simplified` | `solved` | divide both sides by two; cancel the coefficient; simplify eighteen divided by two |

The first article should use at least `distribute-and-normalize` and
`subtract-and-simplify` as independently addressable motion blocks. Using all
five is preferred because it makes each equivalence-preserving group available
for URL restoration and later re-explanation without exposing every microstep
as prose.

## Article Rhythm

The source should remain a normal, searchable article:

1. A short opening paragraph frames the equation and asks what the fraction
   multiplies.
2. One stage introduces the factored checkpoint.
3. A focus passage names the complete grouped sum and the fraction as context.
4. Five compact motion blocks explain the named ranges above, each with
   before text that predicts the lawful action and optional after text that
   interprets the settled equation.
5. Ordinary prose between motion blocks explains why the same solution is
   preserved; it is not forced into a focus or motion directive.
6. A final reading passage substitutes $x=9$ into the original equation:
   $\frac{2}{3}(9+6)=\frac{2}{3}(15)=10$.

The article may link to semantic objects such as the grouped sum, variable
fraction, both sides, denominator, coefficient, and solution. Those authoring
paths must map to existing selector or envelope authority in the vignette;
they cannot be invented from rendered coordinates.

## Static And Accessible Reading

- The title, prose, TeX source, captions, and all six checkpoint readings are
  present in static output and searchable without JavaScript.
- Server/build-time KaTeX supplies HTML and MathML; learner routes do not ship
  a KaTeX runtime merely to read the article.
- Every motion range has a meaningful start and settled static checkpoint.
- Reduced motion seeks directly to range endpoints.
- Moving paint remains `aria-hidden` and inert while the article owns one live
  structured-math reading.
- A reader who never activates the stage can still follow the complete proof
  and verify $x=9$ from the static article.

## Promotion Boundary

The exemplar is ready to promote only if the new article compiles through the
frozen four-directive grammar, imports one versioned vignette and exact lock,
reuses the canonical runtime lazily, supports deterministic direct state
reconstruction, and preserves the existing reader closure. Any need for a new
directive, a duplicate semantic trace, a second clock, glyph-inferred object
identity, or a fraction-specific renderer fork is a stop condition.

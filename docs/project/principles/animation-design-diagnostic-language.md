# Animation Design Diagnostic Language

“Something feels off” should be translated into a claim about what the viewer
is being asked to perceive. Review one transition at a time and name the first
broken layer.

## Diagnostic Dimensions

1. **Semantic correspondence** — Can every visible part be described as
   persisting, changing role, splitting, merging, appearing, or disappearing?
2. **Object constancy** — Does a persistent mathematical object retain one
   visual owner, or does an old copy fade while a new copy appears?
3. **Causal staging** — Do preview, invariant reflow, causal action,
   recognition, and release occur in an intelligible order?
4. **Representation granularity** — Are source and target roles decomposed
   finely enough to state which part becomes which?
5. **Geometric continuity** — Are paths monotone, collision-free, motivated by
   meaning, and settled exactly into native geometry?
6. **Temporal phrasing** — Is enough time allocated to reflow and action, with
   useful stagger and recognition dwell rather than uniform crossfade?
7. **Attention continuity** — Is there always a clear explanatory subject, and
   does salience transfer only when the target is legible?
8. **Typographic integrity** — Do font, baseline, glyph dimensions, and
   structural geometry remain stable throughout motion?

## Motion Routing And Reception Defaults

Use the shortest clear trajectory that preserves semantic identity and
ordering. Same-baseline continuants with an unobstructed corridor move
directly. Curvature requires one named reason: collision clearance,
correspondence disambiguation, or expression of a real structural operation.
Decorative curvature is a diagnostic failure because it implies a relationship
the semantic transformation does not contain.

Function reception follows this causal phrase:

```text
material transit -> enclosure reception -> operational syntax resolution
```

The phases may overlap to preserve continuity, but the enclosure must not lead
unsettled material and the function/operator syntax must not make an empty
wrapper readable. Operators and connectors resolve in one cohort when they
jointly complete the target grammar and neither has a separate instructional
role. Enclosure reception is outside-in: typed leading and trailing delimiters
begin farther apart and slightly oversized, then contract onto their exact
native endpoint rectangles. The semantic operation owns enclosure roles; the
renderer owns measured offsets and scale and may not infer those roles from
glyphs or DOM order. Exact timing, easing, and geometry remain owned by the
reviewed motif profile rather than becoming semantic truth.

Within typographic integrity, distinguish a glyph's **layout bounds** from its
**ink bounds**. Layout bounds position the token and reserve advance width.
Ink bounds include every painted pixel, including italic overhangs, radical
strokes, antialiasing, outlines, and shadows. Motion may use layout bounds for
alignment, but a visual clone must not clip to them unless the notation
explicitly requires a structural crop.

## Ease attention without prolonging ambiguous overlap

Slow starts can orient attention; they are not themselves a defect. When one
object branches into copies, distinguish preparation, perceptually clear
separation, travel, and arrival. Avoid lingering with independently moving ink
almost coincident, where antialiased contours read as a smear instead of two
objects. Shorten that ambiguous interval while preserving continuous position
and velocity, meaningful grouping, and eased arrival. Reverse must sample the
same treatment, not introduce a second choreography.

This is a diagnostic principle, not a universal easing curve or permission to
fade semantic continuants. Exact departures remain motif-owned and subject to
exemplar review. The fraction Focus Card tests a bounded early departure
adjustment; generic copy/fan-out timing and semantic authoring remain unchanged.

## Critique Sentence

Use this form:

> During **[phase]**, **[semantic part]** should **[perceptual role]**, but it
> instead **[observed behavior]**, causing **[viewer inference or confusion]**.
> Evidence: **[measured or inspectable fact]**. Repair:
> **[specific choreography or representation constraint]**.

Avoid “jerky,” “unclear,” or “just a fade” without naming the affected part,
phase, and violated expectation.

## Strategy Classes

- **Operation-specific** — the runtime has correspondence plus a choreography
  that expresses this operation’s mechanism.
- **Lifecycle-generic** — token relations exist, but they use generic
  enter/exit/split/merge motion without an operation-specific visual phrase.
- **Whole-equation fallback** — selector correspondence is missing, so the
  renderer can only replace source and target layers.

## Measurable Probes

Use these probes to turn critique into a regression test:

- **Correspondence coverage:** visible selectors with a declared lifecycle /
  total visible selectors. Target: `100%`.
- **Fade-dominance ratio:** visible semantic parts whose only changing channel
  is opacity / all changing semantic parts. Target: `0%` for continuants and
  derived parts; opacity-only motion is reserved for true artifacts.
- **Stable-owner coverage:** continuants rendered by one visual owner across
  the transition / all continuants. Target: `100%`.
- **Granularity delta:** largest difference between the number of meaningful
  source and target roles on one lineage relation. Any unexplained delta is a
  design gap.
- **Minimum path clearance:** smallest measured distance between independently
  moving semantic groups. It must remain above the declared typography-safe
  clearance.
- **Boundary displacement and velocity:** pose and velocity difference around
  operation boundaries. Both must remain within continuity budgets.
- **Phase occupancy:** percentage of time allocated to preview, reflow, act,
  settlement, and release. A transition with only source/target opacity has no
  meaningful causal occupancy.
- **Recognition dwell:** stable time after the result becomes legible and
  before attention releases.
- **Typographic drift:** font, width, height, and baseline change for a
  persistent glyph. Target: zero except browser subpixel rounding.
- **Ink-bound clearance:** minimum visible bleed beyond a token's layout box
  before an ancestor clips it. Ordinary glyph owners must preserve their
  source overflow contract; intentional structural clips must be named and
  tested separately.

## Canonical Examples

### Derivative power rule

During the causal-action phase, the source exponent should split into a
coefficient and a decremented exponent while the base persists. Instead, the
entire derivative expression fades into `3x²`, so the viewer cannot see why the
coefficient is `3` or why the exponent becomes `2`. Evidence: the generated
transformation has no correspondence map and resolves to whole-equation
`artifact-replace`. Repair: encode exponent-to-coefficient/decrement lineage,
preserve the base, then implement an exponent-drop choreography.

### Rational exponent to radical

During representational succession, numerator, fraction rule, and denominator
should have explicit destinations or intentional eliminations. Instead, three
source roles map to one monolithic radical-symbol role, requiring the renderer
to invent hook and overbar correspondence. Evidence:
`exponent-becomes-radical` maps three source selectors to one target selector.
Repair: expose radical hook, overbar, index, and radicand roles at comparable
granularity and bind each source fragment explicitly.

### Premature glyph clipping

During persistent motion, a glyph should retain all of its painted ink even
when its layout rectangle is used to position the visual owner. Instead, the
clone clips to that rectangle, shearing italic terminals, antialiased edges,
or structural strokes. Evidence: the moving clone has `overflow: hidden`
while its native KaTeX source has `overflow: visible`. Repair: preserve the
source element's computed overflow contract, reserving hidden overflow for
named KaTeX structural crops such as radical tails.

## Executable obligations: force–energy candidate

Governing prose is not enforcement. The force–energy exemplar binds collection,
matched-factor cancellation and scalar reassociation through
`src/semantic/derivation-local-rewrite.ts`. Its discriminated operations require
roles at compile time; runtime validation rejects missing or replaced survivors.
The physics issuer supplies mathematical authority, not the visual binding checker.

`src/rendering/derivation-local-rewrite-motion.ts` lowers these roles through the
existing native compositor. Collection retains the first common-term lineage;
only the declared cancellation pair withdraws; reassociation is a separate child.
Direct paths are checked after compilation. Intentional contact is limited to
equal terms consolidating or the named carrier entering its fraction bar; other
paint remains subject to compositor collision checks. Missing mechanisms fail
with a typed repair gap, never generic fusion.

`tests/force-energy-derivation.test.ts` checks role and type obligations;
`npm run visual:mechanics-relations` exercises the real native path, reverse,
endpoints and expansion. These checks do not prove perceived clarity or certify
all mathematical shapes. Timing, consolidation and handoff still require human
review; these bindings remain exemplar-local until a different caller establishes
the reusable boundary. Do not treat this candidate as a catalogue-wide policy.

## Review Order

Fix problems in this order:

1. missing correspondence;
2. false object replacement;
3. representation granularity;
4. causal phase order;
5. collisions and discontinuities;
6. timing and attention;
7. stylistic polish.

Later polish cannot rescue a transition whose semantic parts or visual owners
are undefined.

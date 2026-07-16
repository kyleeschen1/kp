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

# Source-authored change propagation: first card candidate

Canonical preview: <http://localhost:8000/experiments/change-propagation/>.
Source: `examples/calculus/change-propagation.json`.
Run: `run-contract.kp.explanation-authoring-v1`, card-caller package.
Status: implementation candidate; human review required before publication or
promotion. The preceding authored rail was accepted by the user.

Subsequent user feedback: the card is busy and its pedagogical value and intended
destination are unclear. It has **not** passed the human checkpoint. The
[research synthesis and learner-context direction](../decisions/2026-10-13-learner-context-and-chain-rule.md)
supersede treating this candidate as the recommended introductory explanation.
Its source-authoring evidence remains valid; publication promotion is still gated.

## What is new

The author now controls the functions and each intermediate explanation. The
source's `inner` expression binds x and its `outer` expression binds u. Existing
expression parsing, evaluation and differentiation derive native notation,
local scales, finite changes, linear predictions and error. A source-only
`x^3` followed by `u^2` produces the derivative `6x^5` numerically and corresponding
factor notation without renderer edits. This is more than editorial selection
among fixed derivations, but remains a bounded composition format.

The top-text horizontal Focus Deck retains one stage and native KaTeX owners.
Input, intermediate and output intervals compare filled finite-change markers
with outlined local predictions. The final passage smoothly reduces h to one
tenth of its trial value. Parameter controls, keyboard, continuous scrubbing,
native horizontal travel, interrupted playback and URL restoration use the
existing reader clock/input boundaries. No new general renderer or clock was
introduced. Authoring loads the KaTeX renderer lazily; ordinary reading uses
pre-rendered native HTML and MathML. Editing is local to the tab; download retains
the draft. Reload uses the versioned source again.

## Inspect

1. Read across the five passages with the arrows or horizontal travel. Does the
   persistent comparison clarify the two local scales, or feel too much like a
   dashboard? Only the last transition changes h automatically; earlier passages
   direct attention through the existing composition.
2. Change h, including negative values. Each column has its own scale; those
   scales stay fixed while h changes. Do not compare apparent lengths across
   columns as though they share units. Base-point changes recompute scale bounds.
3. Try x = 0. The differential prediction vanishes while a finite change can still
   produce a nonzero output. At h = 0, error/h is undefined, not zero.
4. Scrub into and out of the final passage. h shrinks continuously and reversal
   restores the same mathematical state. The trial slider and current h differ
   during this final shrink, intentionally.
5. Open the source editor; change both functions and prose, then preview. A bad
   draft reports a located gap and retains the last valid card. Prose is not a
   machine-checked proof. The static reading includes the finite-difference
   definitions and differentiability argument.

## Boundaries and evidence

- Supported: sums, explicit products, sin/cos, integer coefficients up to 10,
  integer powers 0–4; x in [-2, 2], trial h in [-0.5, 0.5]. Parsing has source,
  node and depth bounds. Interval arithmetic bounds the complete allowed control
  domain and rejects excessive ranges; it does not infer safety from samples.
- Unsupported: division/domain exclusions, logarithms, fractional powers,
  arbitrary symbolic rewrites, arbitrary beat order, and decimal symbolic
  coefficients. The last restriction prevents the existing six-decimal notation
  formatter from silently displaying a different function from the evaluator.
  Unsupported source returns a typed located repair, never substitute motion.
- Float readouts use five decimals and stable sign handling. Rounded numerical
  products use an approximation sign. Displayed agreement is not proof of the
  limit, and “actual” means the finite-change definition, not exact arithmetic.
- Native math and numeric leaves remain mounted during travel. Focus is a
  semantic selection projected as an underline; required context stays legible.
  This is parameter/comparison animation, **not** a new glyph-by-glyph chain-rule
  choreography or certified symbolic compositor.
- Desktop and phone screenshots were inspected. Phone uses a long stacked
  reading, not a certified single-viewport presentation; reducing information
  density and strengthening the sense of propagation remain review questions.

Verification commands: `npm run test:change-propagation` (8 mathematical/source
tests), `npm run visual:change-propagation` (4 Chromium tests),
`npm run test:rail-authoring` (35 preservation tests), full `npm run typecheck`,
`npm run check:architecture`, and `npm run build:bundle`. Theseus workspace
validation is recorded on the run. Broad browser promotion and the full unit
corpus were deliberately not run for this first subjective exemplar.

Initial checks found an unsupported erasable-TypeScript parameter property, an
implicit-multiplication test outside the parser grammar, and an invalid DOM
dataset key that interrupted mounting. These were repaired; regression checks
require complete mount, live author editing and the actual stage-position
attribute, not just partial paint. Input rejection occurs before AST
simplification, so `0*z` and `0/x` cannot hide unsupported meaning.

`npm run measure:change-propagation` after the production build reports declared
initial assets: roughly 73 KB JavaScript (24 KB gzip), 40 KB CSS (11 KB gzip), and
59 KB HTML (6 KB gzip). Fonts and lazy authoring imports are excluded; this is
not a network waterfall or a total cold-cache claim. The KaTeX authoring chunk
is about 258 KB raw / 77 KB gzip and is shared with other consumers.

Smallest rollback unit: the new calculus source, host, adapter, scoped styles and
Vite registration. Existing mechanics, matrix and algebra hosts are unchanged.

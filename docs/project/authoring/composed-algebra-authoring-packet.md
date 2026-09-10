# Composed algebra authoring

Canonical bounded task: `equation.composed-algebra`. Start with
`llm-generation-entrypoint.md`. This is local compiler/workflow evidence, not
a live-model or learning-outcome benchmark.

## Source and limits

Use `src/authoring/examples/composed-algebra-primary.json` as the complete starter:
`2(x+3)+3(x+3)` → `(2+3)(x+3)` → `5(x+3)`.
The retained second source, `src/authoring/examples/composed-algebra-product.json`,
uses `(x*y)*2+(x*y)*4` → `(x*y)(2+4)` → `(x*y)*6`.
It changes the shared subtree and orientation without renderer glue.

Supply `kp.composed-algebra-source.v1`: one lesson ID, `real-scalars`, declared
single-letter symbols, exactly three distinct state IDs with LaTeX/narration,
and editorial title/setup/summary. Keep source below 20,000 characters, each
expression at most 512 characters, and at most twelve declarations. The proof
also enforces bounded tree size/depth and exact nonnegative safe-integer operands
and result. These are safety bounds, not a promise of legibility for every large
expression. Unsupported native preparation preserves the previous valid card.

The first deduction must collect two integer multiples of the same unchanged
compound sum/product, in explicit left or right order. The second evaluates only
the integer sum. Preserve grouping, addend order and factor order; do not assume
commutativity, divide by the factor, or simplify the surrounding expression.
Zero coefficients and a zero-valued common expression are allowed. Atomic factors
belong to the separate M1a task or produce `unsupported-presentation` here.
Fractions, powers, functions, negative coefficients and arbitrary chains are not
supported by this task. Author prose as editorial claims, never mathematical proof.

Ordinary scalar juxtaposition and explicit `*`/`\\cdot` multiplication use the
existing scalar parser. A number after a closed group is unambiguous, but `x2`
or separated numeric literals require explicit multiplication. No geometry,
timing, renderer, proof or operation-authority fields are accepted from source.

## Check, apply, reuse

```sh
npm run author:check -- --list
npm run author:check -- --task equation.composed-algebra --example
npm run author:check -- --task equation.composed-algebra --request src/authoring/examples/composed-algebra-primary.json
npm run author:check -- --task equation.composed-algebra --request src/authoring/examples/composed-algebra-product.json
```

A checked report is `report-only`; it cannot be mounted or fed back as source.
Preview on the shared server:
<http://localhost:8000/experiments/reusable-reasoning/?example=composed-algebra>.
Paste the chosen source in the JSON editor and press **Apply**. Opening the URL
alone loads the primary, not the second source. Download exports the displayed
revision, even when the editor contains an unapplied or invalid draft.

The Focus Card has three stops and two animated transitions, with continuous
scrubbing and one-step arrows. Canonical factoring moves complete groups;
coefficient addition uses certified ink-glyph evaluation. Both use the shared
native KaTeX compositor, operation-owned plans and one deterministic clock.
Full/Compact readings and Predict/Reconstruct refer to that same revision;
Return restores the exact prior position. No automatic answer grading is claimed.

```sh
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-product.json
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-product.json --check
```

The builder prints a content-addressed local directory. Its static reading and
self-checks are not an animated edition. Shared-form changes affect future builds;
previously exported bytes stay immutable. No deployment is performed.

## Repairs and preservation

| Source edit to the primary | Owner repair | Corrective edit |
| --- | --- | --- |
| Middle becomes `(2+4)(x+3)` | `invalid-factorization` at `$.states[1].latex` | Restore `(2+3)(x+3)` |
| Final becomes `6(x+3)` | `invalid-evaluation` at `$.states[2].latex` | Restore `5(x+3)` |
| Final changes the shared subtree | `invalid-evaluation` | Keep the original subtree unchanged |
| Missing state, extra proof or geometry fields | `source` | Supply only the complete declared schema |
| Valid but unsupported paint shape | `unsupported-presentation` | Select an evidenced shape; never substitute a fade |

Repair source and recheck. Invalid, superseded or unprepared revisions cannot
replace displayed content. These boundaries are enforced by private proof and
presentation capabilities, exact endpoint checks, typed owner registration and
runtime preparation—not by trusting an LLM's labels.

## Executable evidence

`npm run check:composed-algebra-workflow` reports both retained source sizes,
scripted invalid/repair attempts, revision changes, canonical owners and static
publication reproduction. It does not measure human time or comprehension.

`npm run test:composed-algebra-authoring` covers source, proof, presentation,
projection, repair and publication coherence. `npm run visual:composed-algebra`
traverses the real native compositor for both callers, checking group ownership,
fusion, native seams, reverse replay and controls. Finite samples are not a
continuous-time proof or universal mathematical-animation certification.
`npm run visual:composed-algebra:cohort` runs those checks in Chromium, Firefox
and WebKit, including narrow layouts, reduced motion, repeated Apply and both
static editions without JavaScript. It reuses the shared localhost:8000 server.
Follow `../principles/motif-composition-contracts.md`: transit contacts are
diagnostics, not permission to inflate the accepted arcs. Broader extension
coverage remains a separate successor obligation.

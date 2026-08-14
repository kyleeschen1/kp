# Normal-Matrix Proof Memory Exemplar Specification

Date: 2026-08-14
Status: human checkpoint
Source decision: `../decisions/2026-08-14-kp-proof-memory-product-experiment.md`
Canonical reference: Michael Nielsen's
[spaced-repetition mathematics essay](https://cognitivemedium.com/srs-mathematics)

## Decision Summary

Build one bounded exemplar around the proof that every complex normal matrix
is unitarily diagonalizable. The exemplar must test a product claim, not merely
produce another animation:

> Can one durable semantic proof help a learner recover notation, inspect the
> decisive inference, reconstruct the argument later, and re-enter the exact
> context of a forgotten step?

The proof remains a normal searchable document. One progressively enhanced
native-KaTeX stage explains the decisive row/column-norm inference. A small set
of prompts projects exact proof states for later reconstruction. No scheduler,
account system, generic matrix renderer, SVD sequence, or new lesson layout is
part of this exemplar.

## Canonical Exemplar And Rollback

- **Canonical exemplar:** `/learn/math/normal-matrices/`, backed by one Article
  v1 source and one versioned normal-matrix vignette.
- **Observable acceptance:** a learner can explain why the off-diagonal row
  block must vanish, reconstruct the induction, and return from a prompt to the
  exact proof state without replaying the lesson.
- **Preservation boundary:** Article v1, build-time KaTeX, existing semantic
  addresses, one deterministic clock, native settled paint, current flashcard
  projection, approved public exemplars, and uncommitted economics work.
- **Rollback unit:** the Article, route, vignette, local proof fixture, and
  prompt set. They must be independently removable without shared-runtime or
  renderer changes.
- **Promotion criterion:** human approval plus a structurally different second
  proof that reuses the boundary without matrix-specific concepts leaking into
  shared infrastructure.

## Audience

The first reader has already encountered:

- matrix multiplication;
- conjugate transpose;
- vector norms and inner products;
- eigenvalues and eigenvectors;
- orthonormal bases and unitary change of basis; and
- induction on matrix dimension.

The article supplies terse, searchable reminders of those prerequisites but
does not teach a linear-algebra course. A learner missing several prerequisites
should get honest links or definitions, not a misleadingly effortless proof.

## Learning Outcomes

After reading and later reviewing the exemplar, the learner should be able to:

1. state normality and unitary diagonalizability;
2. explain why the diagonal entries of `MM†` and `M†M` are squared row and
   column norms;
3. explain why an eigenvector-first orthonormal basis gives the required first
   column;
4. derive `r = 0` from normality in that basis;
5. justify why the lower-right block is normal and induction applies;
6. identify where the proof uses complex scalars; and
7. explain why matching diagonal entries in one arbitrary basis is weaker than
   full normality.

## Mathematical Authority

Let `M` be an `n × n` complex normal matrix:

```text
MM† = M†M.
```

For `n = 1`, the result is immediate. For `n > 1`, the characteristic
polynomial has a complex root, so `M` has an eigenvalue `lambda` and a unit
eigenvector `v`. Extend `v` to an orthonormal basis. In that basis,

```text
    [ lambda   r ]
M = [            ],
    [   0      B ]
```

where `r` is a `1 × (n - 1)` row and `B` is `(n - 1) × (n - 1)`. The first
column has this form because `Mv = lambda v`.

Now inspect only the top-left entries of the normality equation:

```text
(MM†)11 = |lambda|² + rr† = |lambda|² + ||r||²,
(M†M)11 = |lambda|².
```

Normality equates them, so `||r||² = 0`, hence `r = 0`. Therefore

```text
M = lambda ⊕ B.
```

The block equality in `MM† = M†M` then gives `BB† = B†B`, so `B` is normal.
Apply the induction hypothesis to `B`. Combining the eigenvector-first basis
with the unitary diagonalization of `B` produces a unitary diagonalization of
`M`.

This proof, including basis invariance of normality and the inheritance of
normality by `B`, must receive explicit mathematical review. The animation may
reorder disclosure but may not become proof authority.

## Content Architecture

Use these provisional stable identifiers:

| Concern | Identifier |
| --- | --- |
| Article | `lesson.linear-algebra.normal-matrix-proof.article` |
| Asset | `asset.linear-algebra.normal-matrix-proof` |
| Vignette | `vignette.linear-algebra.normal-matrix-proof@1` |
| Stage | `normal-proof` |
| Public route | `/learn/math/normal-matrices/` |

The Article is the complete content authority. The vignette supplies semantic
objects, transformations, checkpoints, static projections, and the lazy stage
capability. Review prompts reference that same asset; they do not copy the
proof into a second content model.

The initial projection is deliberately conventional:

- normal document flow;
- full searchable prose and server-rendered KaTeX;
- one inline stage at the decisive inference;
- no sticky layout, scroll-scrubbing, autoplay, or duplicated stage;
- one compact scrub track with semantic checkpoint stops;
- direct checkpoint and semantic-object links; and
- a separate prompt projection that restores the same stage and proof state.

This is a local exemplar projection, not the universal Public Web layout.

## Article Outline

1. **The theorem.** State normality and unitary diagonalization, then explain
   why the equivalence is useful.
2. **The two hinges.** Preview: diagonal product entries are norms; an
   eigenvector-first basis exposes a zero column.
3. **Rows and columns inside the products.** Establish the diagonal-entry
   interpretation for a general row and column.
4. **Choose the useful basis.** Introduce the block form with `lambda`, `r`,
   zero column, and `B`.
5. **The decisive comparison.** Embed the stage and ask the learner to predict
   what normality forces.
6. **Finish the induction.** Show `r = 0`, prove `B` is normal, and recurse.
7. **Pressure the proof.** Explain the complex-scalar dependency and the
   arbitrary-basis diagonal trap.
8. **Reconstruct it.** Offer a compact proof map and links into the prompt set.

All definitions, proof steps, prompt wording, and answers remain in static
HTML somewhere in the article or prompt publication. Interaction may conceal
an answer during recall, but search and indexing must not depend on running
JavaScript.

## Semantic Ledger

Every address below is relative to `normal-proof/`. Labels may repeat; IDs may
not be inferred from glyph text.

| Object path | Meaning | Continuity role |
| --- | --- | --- |
| `matrix` | The same matrix `M` throughout the proof | Persistent identity |
| `normality` | The relation `MM† = M†M` | Governing assumption |
| `eigenbasis` | An orthonormal basis beginning with `v` | Chosen representation |
| `matrix/eigenvalue` | The scalar `lambda` in the top-left block | Persistent term |
| `matrix/row-remainder` | The unknown row block `r` | Decisive target |
| `matrix/zero-column` | The zeros below `lambda` | Eigenvector consequence |
| `matrix/lower-block` | The block `B` | Recursive subproblem |
| `product-left` | `MM†` | Left comparison context |
| `product-left/first-entry` | `|lambda|² + ||r||²` | First-row norm evidence |
| `product-right` | `M†M` | Right comparison context |
| `product-right/first-entry` | `|lambda|²` | First-column norm evidence |
| `inference/norm-equality` | Equality of the two first entries | Decisive relation |
| `inference/remainder-zero` | `||r||² = 0`, hence `r = 0` | Derived conclusion |
| `matrix/block-diagonal` | `M = lambda ⊕ B` | Settled endpoint |
| `proof/recursive-subproblem` | Normality and diagonalization of `B` | Inductive continuation |

Required semantic relations:

- `normality` equates `product-left` and `product-right`;
- the first row produces `product-left/first-entry`;
- the first column produces `product-right/first-entry`;
- `eigenbasis` explains `matrix/zero-column`;
- comparing the first entries forces `inference/remainder-zero`; and
- `matrix/block-diagonal` transmits normality to
  `proof/recursive-subproblem`.

## Transformations And Checkpoints

The local asset owns these semantic transformations:

1. `interpret-left-first-entry`;
2. `interpret-right-first-entry`;
3. `choose-eigenvector-first-basis`;
4. `compare-first-entries`;
5. `force-row-remainder-zero`; and
6. `restrict-normality-to-lower-block`.

The public timeline exposes these settled checkpoints:

| Checkpoint | Stable state | Learner question |
| --- | --- | --- |
| `statement` | The theorem and normality equation | What must be proved? |
| `row-column-norms` | Both diagonal-entry interpretations | What does each entry measure? |
| `eigenbasis` | `M = [[lambda, r], [0, B]]` | Why is the first column sparse? |
| `norm-equation` | `|lambda|² + ||r||² = |lambda|²` | Which contribution is unmatched? |
| `remainder-zero` | `r = 0` and block-diagonal `M` | What did normality force? |
| `recursion` | `B` is normal and selected as the subproblem | Why can the argument repeat? |

Checkpoint endpoints are semantic authority. Durations and easing remain local
presentation tuning. Existing flashcard `timeMs` bindings should be derived
from the checkpoint map rather than creating a second authored timeline.

## Essential Attention Sequence

This is the only choreography that must beat a static proof. It uses two
complete orient/act/settle/inspect cycles on the existing deterministic clock.

### Cycle A: see what the two product entries contain

1. **Orient:** hold the block matrix stable. Name the first row and first
   column; keep the complete normality equation readable.
2. **Act:** transmit the first-row factors to the top-left entry of `MM†`, then
   the first-column factors to the top-left entry of `M†M`. The contributions
   must remain semantically selectable.
3. **Settle:** show native KaTeX for
   `|lambda|² + ||r||² = |lambda|²` without changing the matrix footprint.
4. **Inspect:** compare the two `|lambda|²` contributions and leave
   `||r||²` as the unmatched term. Hold here for prediction.

### Cycle B: force the row remainder to vanish

1. **Orient:** ask what a nonnegative squared norm must be if adding it changes
   nothing. Motion remains held until the learner advances or scrubs.
2. **Act:** carry the matched `|lambda|²` terms through the equality, resolve
   `||r||² = 0`, then resolve `r = 0`. The `r` block must complete its motion
   into its settled zero state before any transient copy disappears.
3. **Settle:** preserve one native block-diagonal matrix with the same outer
   geometry. Reserved space prevents a jump when `r` becomes zero.
4. **Inspect:** focus `B` while retaining `lambda` as readable context, then
   expose `BB† = B†B` as the reason induction applies.

The authoring layer expresses `notice`, `compare`, `transmit`, `predict`,
`reveal`, and `supporting-context` intents over the semantic IDs. It must not
encode color, opacity, coordinates, DOM selectors, SVG paths, keyframes, or
timing tables.

## Visual And Motion Requirements

- Native KaTeX is the sole settled paint and accessibility owner.
- Semantic wrappers bind fragments; incidental KaTeX DOM structure is never
  identity authority.
- The block matrix keeps a stable footprint through every checkpoint.
- `lambda`, `r`, and `B` retain identity across products, inference, and the
  settled matrix.
- A moving term may not fade before reaching its destination and completing
  ownership handoff.
- Presence changes are explicit. Salience does not make required proof context
  disappear.
- No font-weight, line-height, or geometry animation is used for emphasis.
- Opacity is not the only focus cue; final treatment must also use an approved
  structural or local-contrast cue.
- Dark, light, high-contrast, and reduced-motion modes resolve the same
  semantic hierarchy through their own optical systems.
- Reduced motion jumps directly between the six settled endpoints.
- The stage is austere: one matrix workspace, the two relevant product entries,
  and the current inference. No decorative 3D, particles, grids, or unrelated
  theorem metadata.

Exact colors, response curves, and timing remain provisional until the human
visual checkpoint. This exemplar cannot establish a catalogue-wide matrix
palette or motif by itself.

## Prompt Set

The first prompt suite contains eleven original prompt intents. Each becomes
an existing `KpFlashcardSpec` over the same asset.

| Prompt ID | Kind | Prompt intent | State and expected answer |
| --- | --- | --- | --- |
| `define-normality` | `cloze` | Recall the equation defining a normal matrix. | `statement`; `MM† = M†M` |
| `read-left-entry` | `focus-relationship` | Interpret the top-left entry of `MM†`. | `row-column-norms`; squared norm of the first row |
| `read-right-entry` | `focus-relationship` | Interpret the top-left entry of `M†M`. | `row-column-norms`; squared norm of the first column |
| `connect-normality-to-norms` | `explain-transform` | Explain why the corresponding row and column norms agree. | `row-column-norms`; equality of the products equates their diagonal entries |
| `explain-sparse-column` | `explain-transform` | Explain why the eigenvector-first basis produces zeros below `lambda`. | `eigenbasis`; `Mv = lambda v` |
| `predict-row-remainder` | `predict-next` | Predict what normality forces `r` to be. | hold at `norm-equation`; expect `force-row-remainder-zero` |
| `explain-zero-norm` | `explain-transform` | Explain why `||r||² = 0` implies `r = 0`. | `remainder-zero`; positive-definiteness of the norm |
| `inherit-normality` | `focus-relationship` | Explain why the lower block `B` is normal. | `recursion`; compare lower-right blocks of the normality equation |
| `reconstruct-proof` | `explain-transform` | Reconstruct the proof from eigenvector to induction in a few sentences. | `recursion`; complete proof spine |
| `why-complex` | `explain-transform` | Identify the step that can fail over the real numbers. | `eigenbasis`; existence of an eigenvalue/eigenvector in the field |
| `diagonal-only-trap` | `focus-relationship` | Explain why matching diagonal entries in one arbitrary basis is insufficient. | `row-column-norms`; the comparison is needed in an eigenvector-containing basis, while full normality survives the unitary basis change |

The prompt title, wording, answer, object IDs, transformation IDs, and derived
checkpoint time are validated together. An unresolved semantic address or an
unsupported prompt kind is a typed error, never a generic card or fade.

## Proof Re-Entry And URLs

A review location contains three independent pieces of state:

```text
checkpoint ID + optional prompt ID + optional semantic address
```

A representative share link is:

```text
/learn/math/normal-matrices/
  ?checkpoint=norm-equation
  &review=predict-row-remainder
  #kp-ref:normal-proof/matrix/row-remainder
```

The exact serializer may use the existing route codec, but it must preserve
these semantics. Resolution performs one projection and one paint. It does not
scroll through prior steps, replay motion, synthesize input, or infer state
from current DOM styles.

An ordinary semantic link may request focus but does not own timeline state.
The route/checkpoint state owns the timeline, matching the current Article
contract.

## Delayed-Return Rehearsal

The first experiment is intentionally manual:

- **Initial session:** read the proof, use both attention cycles, and attempt
  `predict-row-remainder` before reveal.
- **Next day:** open four direct prompt links without first rereading the
  article; record which answers required proof re-entry.
- **After one week:** reconstruct the proof, answer the two boundary prompts,
  and note whether the exact semantic links recover context faster than a
  static article.

Record elapsed recovery time, incorrect or incomplete dependencies, rewritten
prompts, voluntary revisits, and whether the learner could explain the visual
inference. Do not build scheduling persistence or analytics for this rehearsal.

## Static Comparison

An internal `static` evidence mode uses the same Article and settled KaTeX but
creates no animation session. A `motion` evidence mode progressively enhances
the single stage. The comparison asks:

- Does motion reveal the row/column-to-product correspondence more clearly?
- Does prediction improve because the unmatched `||r||²` term is perceptually
  obvious?
- Does direct prompt re-entry preserve context better than a disconnected
  flashcard?

If the answer is no, retain the static proof and stop. Do not add animation to
defend the experiment.

## Accessibility And Responsive Fit

- Initial HTML includes the theorem, proof, prompt text, semantic anchors,
  native KaTeX HTML and MathML, and a useful static stage frame.
- Controls have explicit labels, keyboard operation, visible focus, and stable
  placement.
- The stage exposes a textual description of each settled checkpoint.
- Hidden recall answers remain available in the complete article and become
  perceivable when explicitly revealed.
- Color is never the sole carrier of row/column, matched/unmatched, or
  current/historical distinctions.
- At 390 CSS pixels, the proof remains in normal document flow with no page
  overflow. The matrix stage may scale within its reserved box, but surrounding
  prose and inline KaTeX retain normal readable size.
- Screen readers can navigate the proof without activating the animation.

## Performance Budget

- Build-time KaTeX only; no client KaTeX runtime.
- One on-demand stage, activated by a direct address or near-viewport trigger.
- No active sampling loop while idle, settled, hidden, or offscreen.
- Direct seek performs one semantic projection and one batched paint.
- Common reader runtime stays below the existing `145,000` gzip-byte ceiling.
- Initial route HTML stays at or below `10,000` gzip bytes.
- Startup JavaScript and CSS stay at or below `40,000` gzip bytes.
- Active stage closure does not exceed the current fraction-composition
  activation ceiling, and normal-matrix-specific code contributes no more than
  `20,000` additional gzip bytes within that closure.
- Cumulative layout shift stays at or below `0.001` in the focused route check.
- No authoring, CodeMirror, catalogue, economics, Graph3D, or unrelated
  language implementation enters the route closure.

The active-stage ceiling is a containment gate, not an endorsement of the
current symbolic closure size. Measure and attribute it before proposing
shared-runtime slimming.

## Discovery Verification

Before the human checkpoint, run only the focused checks that protect durable
truth:

1. mathematical fixture and expert proof review;
2. Article validation, import lock, static HTML, and build-time KaTeX;
3. every semantic entity, relation, transformation, checkpoint, and prompt
   reference resolves;
4. direct seek, reverse, and interruption settle identically;
5. the static and interactive modes share the same Article and endpoint truth;
6. no-JavaScript, reduced-motion, keyboard, and 390-pixel smoke checks;
7. stable matrix geometry and native settlement at all six checkpoints;
8. focused route attribution, idle-clock, and CLS budgets; and
9. regressions for premature fade, duplicate settled paint, and endpoint jump.

Do not build a broad browser matrix, visual golden suite, shared matrix type
family, or catalogue-wide motif during discovery.

## Human Checkpoint Questions

1. Can the learner tell immediately which row, column, and product entry are
   related?
2. Does the learner predict `r = 0` before reveal for the right reason?
3. Does `M` feel like one persistent object rather than a sequence of replaced
   formulas?
4. Is the handoff from the norm equation to the zero row smooth and
   semantically legible?
5. Does focusing `B` make the inductive step feel earned rather than asserted?
6. Do prompt links feel like entrances into one proof rather than a shuffled
   external deck?
7. Is the motion materially better than the exact static comparison?

Failure on questions 2, 5, or 7 blocks promotion even if implementation and
performance checks pass.

## Implementation Slices After Approval

1. Freeze the original proof, prerequisites, semantic ledger, and mathematical
   review fixture.
2. Author and compile the Article with static KaTeX, anchors, and static
   evidence mode.
3. Build the local semantic asset, transformation graph, checkpoints, and
   versioned vignette without shared API changes.
4. Implement the one native-KaTeX stage and stable endpoint geometry.
5. Add the two attention cycles and direct state restoration on the existing
   clock.
6. Bind and validate the eleven prompt projections and manual review links.
7. Run focused accessibility, responsive, performance, and regression checks.
8. Stop at the human visual and product checkpoint before any promotion or
   second proof.

## Copyright Boundary

Nielsen's essay is a research and product-design reference. KP will use the
mathematical facts and independently author its proof, prompts, diagrams, and
interaction. The essay's CC BY-NC license does not authorize copying its prose
or card set into a commercial KP artifact.

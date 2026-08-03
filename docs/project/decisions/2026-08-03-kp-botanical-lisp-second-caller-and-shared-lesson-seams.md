# Botanical Lisp second caller and shared lesson seams

Date: 2026-08-03
Status: accepted; exact Theseus contract approved and active

## Context

The economics demand-shift tutorial has completed its two-motion-block,
progressive-navigation loop and the follow-up layout refinements requested in
human review. It now provides a strong reference caller for continuous prose,
a persistent stage, semantic URLs, progressively enhanced TOC and scrubber
elements, cumulative scroll-controlled motion, responsive projection, and
bounded delivery evidence.

The earlier tutorial order named generated solve-x as the second caller because
it was the cheapest way to pressure publication reuse. The user now prefers a
more structurally different caller that expands the internal catalogue and
exposes abstraction seams. The botanical Lisp design supplies that pressure:
recursive structure, code-as-data, binding provenance, native code paint, and
subject-specific choreography differ materially from an economics graph while
still needing the same lesson-reading behavior.

## Decision

Build a botanical Lisp animation and tutorial next. The canonical semantic
example is:

```lisp
((lambda (x) (+ x 1)) 4)
-> (+ 4 1)
-> 5
```

The learner-facing tutorial asks how function application can transform code
into a value without losing where each part came from. It uses two motion
blocks:

1. open the application, bind `4` to `x`, and reconstruct `(+ 4 1)`; and
2. evaluate the reconstructed form and gather it into `5`.

The first botanical renderer remains an experimental presentation projection.
Semantic S-expression identity, occurrences, binding provenance, environments,
substitution destinations, and evaluation results remain independent of
rendered text and of the botanical metaphor. Native selectable code is the
settled authority. Every visible fragment must satisfy material conservation:
it persists, gathers into or emerges from an ancestor, or enters/exits for an
explicit semantic reason.

Use the completed economics tutorial and the completed Lisp tutorial as two
callers for a shared lesson layer. Generalize through comparison, not by moving
economics-local files before Lisp exists. Reuse the already portable URL, TOC,
and scrubber candidates directly. After both callers pass their local proofs,
extract only lifecycle-identical seams.

## Shared lesson boundary

The caller-proven shared layer may own:

- a framework-neutral lesson publication/document projection that reconciles
  with the existing `KpLessonDocument` rather than creating a peer schema;
- semantic section, motion-block, and checkpoint destinations;
- ordered motion-block metadata and pure cumulative-state projection;
- viewport-corridor mapping and one host-neutral scroll coordinator;
- static final-geometry TOC and scrubber payloads plus their existing custom
  element intent events;
- deterministic deep-link and navigation transaction mechanics;
- shared typography, three-column reader geometry, reading pointer, motion
  divider, page-salience, responsive, and reduced-motion tokens; and
- a replaceable Svelte 5 lesson shell with domain prose and stage slots.

The shared layer does not own:

- Lisp or economics semantics, validation, claims, or parameters;
- botanical, graph, equation, or code-stage choreography;
- renderer-specific geometry, focus targets, aperture layouts, or stage paint;
- animation clocks or semantic runtime truth;
- lesson prose, pedagogical sequencing, or domain-specific salience profiles;
- catalogue-wide rollout, a universal scene graph, or a universal motif pack;
  or
- SvelteKit, Public Web, or public/internal editors in this tranche.

Svelte may own first-party host composition, but animation assets, semantic
state, cumulative projections, URL meaning, custom-element contracts, and
renderers remain framework-neutral. Changes to shared lesson layout or control
presentation should reach both economics and Lisp through one source; domain
stage changes should remain isolated.

## Canonical references and acceptance

- **Economics reference:** `/tutorials/economics/demand-shift/`, including its
  approved graph, prose cadence, fixed left TOC, solid reading pointer, wide
  column spacing, and current performance ceilings.
- **Lisp reference:** `/tutorials/programming/lisp-function-application/` over
  the exact lambda-application fixture above.
- **Observable acceptance:** exact Lisp identity and rewind laws; native
  settled code; calm reversible botanical motion; two cumulative motion
  blocks; semantic URLs and transactional navigation; meaningful pre-upgrade
  controls; wide, phone, reduced/static, accessibility, performance, and
  visual evidence; and one shared lesson seam used by both callers without
  observable economics regression.
- **Preservation:** the economics route and asset, current programming trace,
  catalogue hostability, existing `KpLessonDocument`, shared runtime clock,
  review capture, and tabled matrix frontier.
- **Rollback:** one verified slice commit. Shared extraction begins only after
  the local Lisp tutorial is complete enough for a field-by-field comparison.

Approval of the exact long-loop contract waives a separate mid-loop human
pause for lesson-shell extraction. It does not promote the botanical visual
language: botanical motif selection and any language-pack generalization stay
experimental until the final human checkpoint.

## Ordering effect

Botanical Lisp replaces generated solve-x as the next tutorial caller because
the user chose stronger cross-domain evidence over the smallest tranche.
Generated solve-x remains the recommended third caller: it can test that the
shared lesson layer has not overfit two unusually visual domains. This decision
does not alter the animation-library promotion ledger or resume the tabled
matrix frontier.

Execution is owned by
`run-contract.kp.botanical-lisp-shared-lesson-v0`, backed by
`../reviews/2026-08-03-botanical-lisp-shared-lesson-long-loop-proposal.md`.

## Sources

- `docs/project/reviews/2026-08-03-botanical-lisp-tutorial-next-step-review.md`
- `docs/superpowers/specs/2026-07-21-semantic-programming-language-theater-design.md`
- `docs/project/decisions/2026-08-02-kp-motion-blocks-and-progressive-tutorial-navigation.md`
- `docs/project/reviews/2026-08-02-economics-motion-block-publication-human-checkpoint.md`
- `docs/project/threads/explanation-attention.md`

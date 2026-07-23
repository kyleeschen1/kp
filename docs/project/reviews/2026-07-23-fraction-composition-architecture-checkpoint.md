# Fraction composition architecture checkpoint

Status: `HUMAN_CHECKPOINT`

## Recommendation

Accept the pressure test as evidence that the structured-algebra boundary can
carry opaque fractions through distribution, schedule-independent numerator
normalization, distributed-sum composition, lawful reverse factoring, and a
complete solve trace without new renderer authority. Keep the 14-state solve
macro exemplar-local while the next governed-authoring slices test whether its
schema deserves promotion.

Do not yet promote the fraction-specific constructors or the macro's private
exact-affine verifier as universal authoring APIs. The pressure test succeeded,
but its 952 production lines expose consolidation opportunities that need a
second exemplar before becoming shared contracts.

## Canonical reference

- Visual reference: the accepted fractional-linear reader at
  `/reader/solve-fractional-linear/`, documented by
  `docs/project/reviews/2026-07-21-fractional-linear-equation-baseline.md`.
- Semantic reference: structured expression identities, role bindings,
  verified distribution, and typed normal-form intent in `src/semantic/`.
- New pressure-test equation: `2/3(x+6)=10`, ending at `x=9`.

The pressure test intentionally adds no route or new visual realization. The
existing reader is the preservation exemplar because all new work remains
renderer-neutral.

## Observable acceptance criteria

1. Distribution copies the complete `2/3` quotient subtree and rejects drift
   in either copied denominator.
2. Parallel and sequential policies end at the same immutable normalized
   numerator expressions.
3. Independently normalized quotient terms compose into one ordered sum with
   explicit identity lineage.
4. Reverse factoring is accepted only when redistributing the factored target
   reconstructs the exact source subtrees.
5. Every adjacent state in the 14-state solve macro has named semantic
   authority and independently verifies the exact solution `x=9`.
6. Semantic records contain no LaTeX, selectors, routes, CSS, pixels,
   keyframes, or duration ownership.
7. The accepted fractional-linear reader retains exact fraction-rule
   alignment, collision freedom, native settlement, responsive conformance,
   and production build behavior.

## Preservation boundary

This tranche does not change accepted semantic documents, reader routes,
renderer projection, measured-motion ownership, URL state, accessibility,
review placement, or native KaTeX settlement. Existing visual surfaces remain
the rendering authority. New code is limited to structured semantic fixtures,
verification, composition, and tests.

## Primitive amortization result

Reused successfully:

- structured expression identity and topology validation;
- distribution role bindings, verified subtree lineage, and normal-form intent;
- indexed progress scheduling for parallel and sequential presentation;
- the distribution verifier as the authority for reverse factoring;
- existing balance, cancellation, and exact-arithmetic law identifiers; and
- existing reader routes and visual gates without a bespoke renderer or check.

Still exemplar-local:

- fraction numerator normalization constructors;
- the ordered distributed-sum assembler;
- canonical fixture role IDs in the reverse-factoring adapter; and
- the solve macro's private exact-affine solution verifier.

The result is therefore positive for renderer and semantic-boundary
amortization, but deliberately incomplete for universal authoring-schema
promotion.

## Verification evidence

- `npm test`: 1,947 passed before adding the checkpoint-only assertions.
- `node --disable-warning=ExperimentalWarning --test tests/fraction-composition-architecture.test.ts`:
  2 passed; the final repository typecheck also passed.
- `npm run build`: production build passed after full typecheck.
- `npm run test:browser:reader-conformance`: 8 passed.
- `npm run visual:fractional-linear-equation`: 31 samples, 0 failures,
  zero material collisions, and fraction-rule edge alignment within the
  0.5-pixel budget.
- `npm run visual:contact-sheet`: 8 deterministic reference captures produced
  and visually inspected without an observed regression.
- `theseus workspace validate`: graph and event history valid.

## Rollback units

- `7478ecfd` — opaque fraction fan-out;
- `2d26120a` — schedule-independent numerator normalization;
- `7a733a97` — normalized distributed-sum composition;
- `a79931ed` — verified reverse fraction factoring; and
- `43a28b6b` — lawful fraction solve macro.

Each unit is independently reversible. The mandatory checkpoint commit adds
only durable architecture evidence and does not promote the exemplar.

## Human decision

Recommended: approve the checkpoint and proceed to the governed semantic
authoring schema while retaining the fraction macro as an exemplar. A stricter
alternative is to insert a consolidation slice first; rejection can roll back
the five commits above without touching the accepted reader.

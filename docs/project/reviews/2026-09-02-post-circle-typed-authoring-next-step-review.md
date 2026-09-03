# Post-Circle Typed Authoring Next-Step Review

Date: 2026-09-02
Status: ACCEPTED SEQUENCE
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Restore the repository-wide test signal in one bounded maintenance slice, then
execute the already accepted unit-scalar differentiable-map helper experiment.
The helper remains the right authoring direction: the market and circle callers
repeat the same space, identity, unit-guard, derivative-map, law-evidence, and
unit-LaTeX plumbing. However, the circle slice also exposed 34 committed
closed-world ledger failures outside that caller. Repairing or explicitly
reclassifying those expectations first gives the helper checkpoint a meaningful
broad regression gate.

Do not combine the two slices. The maintenance work may update stale test
inventories and assertions after checking them against canonical production
truth; it may not change product behavior merely to satisfy an old ledger. The
helper slice may change only the two pressure callers and one internal utility.

## Candidate Comparison

Scores run from 1 (low) to 5 (high). Higher slice scores mean smaller and more
reversible work; higher risk scores mean more speculative complexity.

| Candidate | Authoring | Stale reduction | Reliability/demo | Reuse | Slice | Risk | Continuity | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Restore the broad test ledger | 1 | 5 | 5 | 3 | 4 | 1 | 5 | Do first |
| Test the unit-scalar map helper | 5 | 3 | 4 | 5 | 4 | 2 | 5 | Do second |
| Reconcile typed and exact-rational economics | 4 | 4 | 5 | 4 | 3 | 3 | 4 | Do after helper review |
| Add a read-only scenario inspector | 3 | 1 | 5 | 3 | 4 | 4 | 3 | Wait for semantic parity |
| Run an LLM authoring pressure set | 5 | 2 | 3 | 4 | 4 | 3 | 4 | Wait for the helper/API checkpoint |
| Add derived-unit algebra or broader CAS behavior | 4 | 1 | 2 | 5 | 1 | 5 | 2 | Defer |

The four-card Focus Deck human checkpoint remains available as a separate human
action. It does not need to block either implementation slice and must not turn
into unbounded layout work.

## Ordered Next Steps

### 1. Restore the repository-wide test signal

Inventory the 34 failures by ownership class: catalogue and asset counts,
generated import order, current-direction assertions, renderer/source
inventories, and architecture audit ledgers. For each failure, compare the test
with the current committed canonical owner and classify it as a stale
expectation, a real regression, or intentionally deferred debt.

Update only stale expectations or their generating manifests. Do not loosen a
ceiling, delete an assertion, or change runtime behavior merely to make the
suite green. Commit independently by coherent failure class so any mistaken
rebaseline is easy to revert.

Done means the complete repository test command passes, or a genuine product
regression is isolated and returned as a named blocker instead of being
relabelled as ledger drift. Architecture, inference, and typecheck must remain
green.

### 2. Implement the bounded internal helper

Implement the accepted experimental helper described in
`../decisions/2026-09-02-unit-scalar-differentiable-map-helper-boundary.md`,
approximately:

```ts
defineKpAuthoredUnitScalarMap(author, {
  path,
  domainUnit,
  codomainUnit,
  evaluateMagnitude,
  derivativeMagnitudeAt
});
```

It may derive deterministic domain and codomain spaces, map and derivative
IDs, runtime unit guards, pointwise linear-map wrapping, source identity,
named tested-law evidence, and derivative-unit LaTeX. The caller must still
author the function and derivative rules.

Migrate only the linear supply-demand and nonlinear circle pressure callers.
Preserve their object shapes, exact inferred unit IDs, stable semantic IDs,
values, derivative behavior, runtime diagnostics, source identity, and law
evidence. Measure authored setup lines and the focused TypeScript inference
delta. Stop if the helper merely moves visible repetition into hard-to-infer
generic machinery.

### 3. Hold an API checkpoint

Compare the before and after callers as hand-authored TypeScript. Keep the
helper only if autocomplete remains clear, error messages stay local, the
mathematical rules remain visible, and the mechanical setup falls materially.
At this checkpoint choose one of three outcomes: retain it as an internal
utility, revise its input shape in one more bounded experiment, or delete it
and keep both callers explicit.

Do not promote the helper through the public facade at this checkpoint.

### 4. Establish one economics source of truth

After the helper decision, reconcile the typed market experiment with the
canonical exact-rational supply-tax model through an explicit adapter or shared
formula boundary. Add parity and negative tests for equilibrium, incidence,
welfare, units, and source identity. Keep exact-rational runtime authority and
do not connect the experimental price-floor semantics unless the canonical
model adopts the same rationing contract.

### 5. Add one reversible developer-visible inspector

Only after semantic parity, add a read-only experimental route that exposes
baseline, seller-tax, and price-floor inputs, derived values, and stable entity
IDs. The existing supply-tax Focus Deck card is the canonical visible
reference, but this slice must not modify its Article, animation, clock,
renderer, or reviewed layout. Stop for human review before any animation or
Article-authoring integration.

### 6. Pressure LLM authoring

Ask a model to author a small fixed corpus of valid variations and deliberately
unsupported compositions using only curated imports. Measure compile success,
diagnostic locality, manual repairs, and typed-gap behavior. The model may
choose semantic inputs; it may not mint unit identities, law evidence, domain
formulas, renderer choices, geometry, or timing.

## Preservation Boundary

- Preserve the promoted typed value, function, optics, bounded-LaTeX, and scene
  recovery contracts.
- Preserve the market and circle pressure callers' observable behavior during
  helper extraction.
- Preserve exact-rational economics authority and every approved Focus Deck
  caller.
- Keep matrices basis-dependent and derivatives coordinate-free.
- Keep derived-unit products, physical-domain predicates, public facade
  promotion, broad domain packs, Article grammar, automatic animation
  generation, and CAS expansion outside these slices.

## Approval Boundary

The user accepted this ordering on 2026-09-02. Approval authorizes one
test-ledger recovery slice followed by the existing bounded helper experiment
and its API checkpoint. Economics reconciliation, the visible inspector, and
LLM pressure remain later independently approved steps. The executable Theseus
queue remains thin until the recovery action and later run contracts are
materialized deliberately.

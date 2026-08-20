# Native KaTeX mechanism conformance gate

Date: 2026-08-20
Status: accepted

## Decision

Amortize Native KaTeX paint-continuity debugging by certifying reusable
renderer mechanisms rather than individual glyph spellings or animations.

The certification signature is the materially relevant combination of:

```text
paint class
× ownership topology
× context mutation
× lifecycle action
```

A mechanism is certified only when a representative traverses the real
canonical source-native → material → target-native compositor path and passes
realized-paint continuity plus exclusive-ownership laws. Ordinary callers may
reuse a certified signature. A new mechanism or unrepresented interaction must
add one bounded executable representative before promotion.

## Evidence boundary

The current 24-shape registry, KaTeX parse checks, risk tags, context mutation
descriptors, matrix and compound fixtures, and pairwise manifests are bounded
inventory and scenario-planning evidence. The canonical digit `2` and italic
`x` carriers are the only shapes currently exercised through complete
supported-browser realized-paint seam traces.

Do not use `certified`, `supported`, or `promoted` for a wider shape family
until its planned representative executes through the canonical compositor.

## Required implementation

After `run-contract.kp.carrier-preserving-simplification-v4` closes and before
another notation shape-family expansion:

1. Build one descriptor-driven runtime conformance fixture over the existing
   canonical compositor, observer, seam trace, laws, and deterministic clock.
2. Make the existing pairwise and explicit higher-order risk plans feed that
   fixture rather than terminate at a manifest.
3. Exercise one representative for each materially distinct paint/ownership
   mechanism, including atomic descender/style/script, rule, compound subtree,
   stretchy delimiter, persistent matrix cell, and whole multirow compound.
4. Keep routine unit checks cheap, run a bounded reusable-page Chromium canary
   for compositor changes, and reserve the representative supported-browser
   cohort for promotion and release.
5. Make new callers derive or declare their coverage signature. Return a typed
   conformance-required gap when the signature lacks executable evidence.

## Failure policy

When a new representative fails, repair the shared measurement, ownership, or
lifecycle seam and add or refine a feature-class risk. Do not add glyph-,
equation-, fixture-, or caller-specific offsets or bespoke browser tests.

This gate certifies continuity and ownership, not choreography aesthetics,
semantic correctness, or pedagogical quality; those retain their existing
exemplar and second-caller review gates.

## Ordering

The six remaining carrier/discoverability slices continue first because both
of their real carriers already pass executable `2`/`x` seam coverage. The
descriptor-driven runner is the next infrastructure boundary before fractions,
scripts, matrices, roots, delimiters, or other notation families claim broader
support.

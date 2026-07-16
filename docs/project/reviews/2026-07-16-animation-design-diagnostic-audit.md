# Animation Design Diagnostic Audit

Date: 2026-07-16

## Finding

The editor’s equation catalog is not suffering from one visual defect. It
contains three implementation strata:

- **operation-specific choreography** for the strongest proof-cohort examples;
- **lifecycle-generic token motion** where correspondence exists but the
  operation has no characteristic visual phrase;
- **whole-equation fallback** where correspondence is absent and the renderer
  can only replace source and target layers.

Across 20 unique equation animations, the current audit finds animations in
the following overlapping strategy cohorts:

- 6 with at least one operation-specific transformation;
- 8 with lifecycle-generic transformations;
- 7 with whole-equation fallback transformations.

Issue incidence by animation:

- 7 missing selector correspondence and therefore fade-dominant;
- 12 using generic artifact replacement;
- 15 lacking operation-specific staging;
- 2 with an explicit source/target representation-granularity mismatch.

An animation can appear in more than one cohort when it contains multiple
transformations or mixed surfaces.

## Priority 1: Eliminate Whole-Equation Fallback

Start with transformations whose mathematical mechanism is already clear:

1. derivative power rule;
2. derivative sum rule;
3. antiderivative power rule.

Then address comparison/presentation assets:

- Jacobian versus Hessian;
- Fundamental Theorem of Calculus forms;
- Fourier transform pairs;
- programming-trace steps inside the comparison animation.

The calculus rules need selector correspondence and lineage. The comparison
assets may need a different contract: introducing and relating two forms is not
the same visual act as rewriting one equation into another.

## Priority 2: Replace Generic Lifecycle Motion

These assets have enough semantic structure to avoid whole-expression fades,
but still lack operation-specific phrasing:

- fraction factoring and simplification;
- exponent expansion and unit-exponent removal;
- distribution and factoring;
- inequality sign flip;
- additive identity simplification;
- matrix-vector and matrix-matrix multiplication.

For each family, define its characteristic visual verb before tuning paths:
factor extraction, exponent drop, operator fan-out, relation pivot, identity
absorption, row-column traversal, or entry accumulation.

## Priority 3: Repair Representation Granularity

### Rational exponent and radical

The current relation maps numerator, fraction rule, and denominator to one
radical-symbol role. The visual runtime synthesizes hook and overbar fragments,
but the semantic map cannot say which exponent part becomes which radical
part. Expose:

- radical hook;
- overbar;
- optional root index;
- radicand;
- intentional elimination or absorption of unit numerator notation.

Then recreate the original corner-transfer phrase using explicit fragment
lineage rather than a renderer-invented bundle.

### Dot product

The specialized traversal makes the animation legible, but the semantic target
is still one scalar role. Expose product terms and partial sums as intermediate
representations so accumulation is authored rather than inferred.

## Canonical Derivative Power-Rule Design

For `d/dx(x³) → 3x²`:

1. focus the derivative operator and exponent;
2. preserve `x` as one visual owner and reserve coefficient space;
3. split the exponent’s lineage:
   - one copy drops on an arc into coefficient position;
   - one copy remains in the superscript region;
4. introduce a small `−1` cause beside the retained exponent;
5. reconcile `3 − 1` into `2`;
6. remove derivative and enclosure artifacts only after their causal role has
   been understood;
7. settle exactly into native `3x²`, dwell, then release focus.

The critical claim is not “animate the exponent.” It is “show why one `3`
becomes a coefficient while the other representation becomes `2`.”

## Enforcement

Promotion should eventually require:

- complete selector correspondence;
- zero fade dominance for continuants and derived semantic parts;
- an operation-specific motif for promoted canonical operations;
- explicit representation fragments when a renderer would otherwise have to
  invent correspondence;
- passing clearance, continuity, typography, direct-seek, and rewind probes.

The editor now exposes **Visual strategy** and **Design issues** so reviewers
can cite these failure classes directly while scrubbing an animation.

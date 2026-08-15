# Decision 2026-08-15: Motion Literal Governance Ratchet

Date: 2026-08-15
Status: accepted

## Decision

Perceptual constants in animation code must live in a named, typed authority
when they govern timing, geometry, thresholds, checkpoints, or policy. Call
sites and tests should refer to those names rather than repeat unexplained
numbers.

Apply this rule as a ratchet:

- govern the files changed while developing a motif;
- keep arithmetic identities, collection cardinalities, and simple indexes
  local when their meaning is self-evident;
- group values that must tune together into one versioned profile;
- derive test checkpoints from the same public profile when the test is
  certifying phase behavior;
- do not mechanically replace every numeric literal in the repository.

The cancellation pressure exemplar establishes the first gate with
`kpCounterOrbitCancellationTiming` and
`kpCanonicalCancellationPressureTimelinePolicy`. Witnessed annihilation keeps
its separate typed profile for teaching goals that explicitly expose an
identity; preserve-flow cancellation does not inherit that recipe. The
repository command `npm run check:motion-literal-ratchet` rejects new
unexplained motion literals in the governed files.

## Why

Numbers such as phase boundaries, dwell windows, pixel offsets, and duration
budgets encode perceptual policy. Anonymous literals make that policy hard to
review, tune, compare across motifs, or keep synchronized with tests. A typed
profile exposes which values form one choreography without pretending that
every number is globally reusable.

A rough inventory found fractional numeric literals across 193 production
files. That is evidence for a deliberate consolidation pass, not evidence of
193 defects: many values describe math, SVG coordinates, fixtures, or local
algorithms and should remain local.

## Consequences

- New or materially revised motion motifs should join the ratchet once their
  canonical exemplar is stable enough to name its policy.
- Test-only geometry should use named fixtures rather than anonymous layout
  numbers when those values explain an observed motion result.
- Shared profiles are promoted only when multiple approved callers need the
  same tuning boundary; semantic invariants remain separate from perceptual
  values.
- A later inventory pass should classify existing numeric literals by domain,
  identify duplicated perceptual policies, and add files to the ratchet in
  bounded families. It must not become a repository-wide rename campaign.

## Non-Goals

- Banning numeric literals.
- Centralizing mathematical constants or fixture values without a shared
  policy.
- Treating timing and geometry as semantic authority.
- Migrating unrelated animation families during the current three-operation
  pressure run.

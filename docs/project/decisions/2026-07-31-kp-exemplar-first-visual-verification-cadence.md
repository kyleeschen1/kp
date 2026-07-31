# Exemplar-First Visual Verification Cadence

Date: 2026-07-31
Status: accepted

## Decision

KP uses a hybrid development cadence for visual motifs:

```text
durable truth tests
→ one reversible visual exemplar
→ human visual selection
→ approved motif formalization
→ second structurally different caller
→ promotion and release matrix
```

Strict test-driven development remains appropriate for semantic correctness,
typed authority, lifecycle and paint ownership, deterministic seek and rewind,
native endpoint settlement, accessibility, and known regressions. It is not the
default for unselected choreography, timing, shape, or visual language.

## Why

Visual inspection finds aesthetic and pedagogical failures that an anticipated
assertion matrix cannot enumerate. Building exhaustive browser, geometry, and
type certification around an unapproved treatment makes experiments expensive
to discard and can accidentally freeze the wrong design.

Deferring every test until approval is also unsafe: a visually attractive
prototype can depend on duplicate paint, an unstable clock, non-native
typography, or an operation-specific renderer. Each spike therefore retains
the smallest existing architectural and endpoint gates necessary to make the
human decision meaningful.

## Discovery Boundary

Before coding, name the canonical reference, observable acceptance criteria,
preservation boundary, and smallest rollback unit. During the spike:

- change only one canonical exemplar;
- preserve semantic models, authoring contracts, clocks, native endpoints,
  accessibility, and established lifecycle ownership;
- add no general type family or renderer category merely to support an
  unapproved appearance;
- use focused unit or single-browser checks rather than a full release matrix;
  and
- stop for human review before applying the treatment to sibling operations.

## After Approval

Formalize only the behavior the human approved. Motif-specific tests should
cover continuous ownership, prohibited fades or gaps, endpoint equivalence,
deterministic seeking, responsive constraints, and every regression observed
during review. A second structurally different caller must demonstrate that
the abstraction is real before catalog-wide rollout. Full cross-browser,
responsive, performance, resource, and product checks belong at promotion or
release boundaries.

## Current Exemplar

The first application of this cadence is the source-derived contributor-fusion
motif for ordered-position evaluation in `278 + 156 = 434`. Human review
approved the canonical `8 + 6 → 14` exemplar. Its continuous contributor arcs,
opaque lineage handoffs, measured-ink body, and dock-before-pinch schedule are
now a compiled motif plan rather than an optional renderer experiment.

The structurally different second caller is `1 + 7 + 5 → 13`: it has three
contributors, including a carried input, and therefore compiles a later docking
boundary from the same schedule. The final ordered position remains on the
standard successor-synthesis treatment as a rollback comparator until this
second caller passes human review. The motif still may not add a clock, renderer
session, WebGL lease, semantic operation, or parallel endpoint owner.

## Links

- `docs/project/threads/animation-library-promotion.md`
- `docs/project/decisions/2026-07-30-kp-persistent-workspace-composition-sequence.md`
- `docs/project/reviews/2026-07-31-place-value-persistent-workspace-repair-closeout.md`

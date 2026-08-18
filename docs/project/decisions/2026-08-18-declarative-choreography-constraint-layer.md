# Declarative Choreography Constraint Layer

Date: 2026-08-18
Status: accepted as the next architectural priority after the current
change-of-base visual checkpoint and release closeout

## Decision

Add a first-class declarative choreography constraint layer between verified
semantic correspondence and renderer-ready track planning.

The layer exists to prevent recurring classes of animation errors rather than
to encode one accepted visual treatment. Every animation will pass through
universal correctness invariants. Only motif laws whose declared semantic
shape matches the transformation will be selected. Renderer geometry, exact
timing, easing, and optical tuning remain downstream presentation policy.

## Failure That Motivated The Layer

The change-of-base exemplar preserved the base `2` semantically, but its
source role was a small logarithm base and its target role was a normal-sized
denominator argument. Position followed the semantic transit while typography
followed the global playhead, allowing a visible endpoint size correction.

It also authored parentheses directly into the endpoint and independently
declared enclosure roles to the function-wrap motif. The desired numeric-log
notation was bare application. Because notation and motif roles had two
authorities, the renderer consistently animated punctuation that should not
have existed. The declarative layer must compile endpoint notation and motif
roles from one typed application-notation decision.

The exemplar also needed causal timing rules that were visible only as local
numeric windows:

- retire obsolete source syntax before structural assembly;
- move persistent material before receiving target wrappers;
- overlap fraction construction and wrapper reception;
- settle material, fraction rule, operators, and enclosures together;
- permit an argument to contact its own receiving enclosure without weakening
  collision protection for unrelated paint.

These are typed relationships, not arbitrary timing suggestions. Leaving them
implicit makes LLM generation and later callers rediscover the same bugs.

## Authority Boundary

```text
verified semantic states and correspondence
-> applicable motif declarations
-> declarative phase constraints
-> conflict validation and deterministic scheduling
-> renderer-ready tracks and measured geometry
-> one canonical renderer session
-> exact native endpoint settlement
```

The new layer must compose the existing semantic correspondence,
function-wrap, operation-choreography, track-projection, protected-transit,
and native-settlement authorities. It must not create another semantic model,
clock, compositor, renderer, or global state store.

## Universal Invariants

Every compiled animation must prove:

1. Semantic identity is neither invented nor silently lost.
2. Direct seek, reverse, replay, interruption, and URL restoration are
   deterministic.
3. Every visible fragment has explicit paint ownership.
4. Persistent role changes interpolate required metrics before settlement.
5. Application notation and motif roles come from one declaration; omitted
   punctuation cannot reappear as independently authored enclosure roles.
6. The last material frame is paint-equivalent to the native target; endpoint
   correction is forbidden.
7. Accessibility exposes one coherent semantic endpoint.
8. Unsupported or contradictory choreography fails closed with a typed repair.

## Conditional Relation Laws

The compiler derives permitted behavior from verified correspondence:

| Relation | Required behavior |
| --- | --- |
| `identity` | Preserve the same object through continuous transit. |
| `role-change` | Preserve identity and interpolate changed metrics such as size, baseline, orientation, or representation role. |
| `derivation` | Introduce a causally related successor without claiming identity. |
| `introduction` | Enter target structure without inventing a source. |
| `removal` | Retire source structure without inventing a destination. |
| `merge` | Converge verified contributors into a derived or identity-preserving target according to the governing law. |
| `split` | Diverge one verified source into successors without treating glyph copies as mathematical proof. |

## Constraint Vocabulary

Begin with a deliberately narrow, data-only vocabulary:

```ts
type KpChoreographyConstraint =
  | { kind: "before"; first: PhaseId; second: PhaseId }
  | { kind: "overlap"; first: PhaseId; second: PhaseId }
  | { kind: "co-terminate"; phases: readonly PhaseId[] }
  | { kind: "hold-until"; phase: PhaseId; event: EventId }
  | { kind: "application-notation"; applicationId: EntityId; enclosure: "bare" | "paired" }
  | { kind: "interpolate-metrics"; correspondenceId: CorrespondenceId }
  | { kind: "intentional-contact"; cohortId: CohortId; entityIds: readonly EntityId[] }
  | { kind: "settle-to-native"; entityIds: readonly EntityId[] };
```

Constraints name semantic phases, correspondences, and cohorts. They never
contain DOM selectors, coordinates, measured rectangles, CSS, renderer nodes,
or absolute milliseconds.

## Motif Selection

Motifs register through tree-shakable data packs. A declaration names:

- supported semantic operation kinds;
- required correspondence shapes and evidence;
- emitted phase roles and constraints;
- mutually exclusive motif authorities;
- renderer capabilities required for realization;
- typed repairs for incomplete or incompatible input.

The compiler selects only applicable declarations. New animations do not run
every motif. They always run universal invariants and then the smallest
compatible motif set. Unknown shapes settle as an explicit static checkpoint
or typed unsupported result; they never fall through to guessed animation.

Do not add a central operation switch. Registration, composition, conflict
checking, and selection must be extensible without modifying a core dispatch
function for each new motif.

## Conflict Resolution

Resolve authority in this order:

1. mathematical truth and domain evidence;
2. semantic identity and correspondence;
3. deterministic ownership and native-settlement invariants;
4. selected motif constraints;
5. instructional intent;
6. tunable timing and optical preferences.

Hard contradictions produce deterministic diagnostics. A later rule cannot
silently overwrite an earlier one. Multiple valid presentation recipes require
an explicit author choice or one declared deterministic default.

Example diagnostic:

```text
Cannot compile persistent operator transit:
source log and target ln operators are derivational successors, not identity.

Applicable motif: derived-structure-convergence
```

## Compilation Trace

Every compiled animation exposes an inspectable trace suitable for authors,
tests, dashboards, and LLM repair:

```text
selected
- identity transit: argument 7
- role-change metric interpolation: base 2
- fraction construction
- derived-structure convergence
- function-wrap reception

rejected
- persistent operator transit: no operator identity
- cancellation: no inverse relation
```

This trace explains why a motif was chosen and prevents the LLM from treating
motif names as unenforced suggestions.

## Delivery Order

1. Inventory the current semantic-relation, notation, phase, timing, contact,
   metric, settlement, and diagnostic seams; freeze the accepted change-of-base
   exemplar as the motivating case.
2. Define the data-only constraint and declaration types with invalid-state
   and no-renderer-field tests.
3. Implement deterministic partial-order composition, cycle/conflict
   detection, and typed repairs without choosing geometry or milliseconds.
4. Compile the change-of-base plan through the layer and remove its equivalent
   caller-local ordering logic while preserving reviewed frames.
5. Pressure a structurally different caller before promoting any motif-wide
   defaults.
6. Expose the compilation trace to governed authoring and the capability
   dashboard so natural-language or LaTeX requests receive explicit motif
   selection or repair evidence.

## Promotion Gates

- The change-of-base exemplar remains visually unchanged after migration.
- A second caller uses the same constraint types without domain leakage.
- Role-change typography settles before native ownership with no endpoint snap.
- Invalid phase cycles, false identity, notation/enclosure disagreement,
  missing metric interpolation, and unrelated contact cohorts fail
  deterministically.
- Direct seek and reverse sample the same compiled plan.
- The renderer remains operation-agnostic and uses one clock.
- Family packs remain lazy and tree-shakable.
- No core closed switch grows with each registered motif.

## Non-Goals

- Canonizing the current exemplar's exact timing values.
- Making all motifs apply to every animation.
- Moving mathematical authority into presentation declarations.
- Generalizing to an arbitrary computer algebra system.
- Replacing measured renderer geometry with semantic coordinates.
- Promoting `derived-structure-convergence` before human approval and a second
  caller.

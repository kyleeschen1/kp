# Solve-x human checkpoint follow-up

Date: 2026-07-21
Status: discussion only; no implementation authorized

## Checkpoint assessment

The revised symbolic animation is visually strong, but the human exemplar
checkpoint remains open pending three follow-ups. This is not approval to
generalize the solve-x presentation recipes across animation families.

## Current observations

1. The developer review inbox still occludes the animation card. On desktop,
   the preferred placement is the left prose rail, away from the animation
   card. A separate narrow-screen behavior will be needed because the stacked
   layout has no persistent non-animation side.
2. The moving material appears to fade gradually as it synchronizes with and
   is replaced by static anchor correspondents. The desired effect is material
   continuity without a visible moving/static crossfade. This is an
   observation, not yet a confirmed diagnosis of DOM ownership or handoff.
3. Long prose, KaTeX, matrices, and code need a principled overflow policy.
   Arbitrary wrapping during a motion phase would change coordinates and
   complicate identity-preserving choreography.

The append-only developer review store was audited before this note. It is
byte-stable and identity/order-stable. Its five current unread notes are the
earlier rejected-checkpoint captures, not these new conversation observations;
their statuses and the `codex.main` cursor were left unchanged.

## Proposed overflow principle

Overflow should be resolved by compiling a stable layout plan for an asset,
viewport class, and typography realization. The selected line breaks and
alignment anchors remain fixed for the animation's timeline, including rewind.
The compiler should try, in order:

1. native single-line fit at the canonical font size;
2. bounded shared typographic fitting across every checkpoint and swept motion
   envelope;
3. explicit semantic multiline composition at legal operator, group, syntax,
   or statement boundaries;
4. semantic condensation, focus-plus-context, or staged disclosure for content
   that cannot remain legible as one composition.

Clipping, accidental nested scrolling, per-frame font changes, and automatic
browser wrapping are not acceptable fallbacks for the motion plane. Prose may
reflow normally outside that plane. Equations need authored or inferred
semantic breakpoints and persistent alignment anchors. Code needs syntax-aware
line identities, stable wrapping or folding for the whole timeline, and
explicit refactoring moves between those identities. Matrices and other dense
structures may require semantic zoom or focus-plus-context rather than global
shrinking.

## Cross-domain primitive basis to discuss

Before expanding by school subject, the reusable material-motion basis should
cover persistence and reflow; introduction and retirement; copy/fission and
fusion; cancellation; substitution; reordering with lane reservation;
grouping and reparenting; distribution and factoring; operator wrapping and
unwrapping; dimensional reshaping such as fractions, radicals, and matrices;
counter-convergence and evaluation; and atomic native-anchor handoff. Every
primitive needs forward, rewind, direct-seek, focus, clearance, layout-plan,
and cross-representation correspondence laws.

High-value domain families include:

- algebra: equal operations on both sides, cancellation and like terms,
  distribution/factoring with an area model, fraction rewrites, exponent/log
  inverse laws, inequalities with a number line, substitution, and polynomial
  factor/root correspondence;
- calculus: limits, secant-to-tangent derivatives, product and chain rules,
  accumulation and the Fundamental Theorem of Calculus, substitution, Taylor
  approximation, gradient/directional derivative, Jacobian local maps, and
  Hessian curvature;
- linear algebra: vector addition/scaling, dot product/projection,
  matrix-vector and matrix-matrix composition, row operations, determinant and
  inverse, span/rank/null space, change of basis, eigen behavior and
  diagonalization, least squares, and eventually SVD.

The selection criterion is not topical completeness. A promoted exemplar must
make the same semantic objects visibly persist between symbolic and geometric
representations on one reversible, linkable clock. That is the Kinetic Press
distinction rather than a generic interactive-lesson catalog.

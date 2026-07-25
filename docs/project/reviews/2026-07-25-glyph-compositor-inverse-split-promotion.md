# Glyph compositor inverse-split promotion

Date: 2026-07-25
Status: promoted as one experiment exemplar

## Decision

Promote the query-selected
`\frac{x+y}{2}\rightarrow\frac{x}{2}+\frac{y}{2}` experiment card to the
generic total-scene compositor.

The exemplar reverses the existing real-KaTeX fraction endpoints while using
the governed numerator-split lineage. One source denominator and structural
rule bifurcate into two exact native target structures. Direct seek, rewind,
normal motion, and reduced motion share the same stateless sampler.

This decision promotes only the inverse fraction experiment card. It does not
authorize a reader or fraction-family rollout.

Canonical reference:
`docs/project/reviews/2026-07-25-glyph-compositor-promotion-long-loop-proposal.md`.

Preservation boundary: canonical semantic identity and reverse law, native
KaTeX endpoint authority, accessibility, annotations, focus, Cloze, static-JS
behavior, export seams, and all routes outside the selected experiment remain
unchanged.

Rollback unit: revert the inverse-card scene helper and route wiring in commit
`55bd03e9`; the canonical fraction asset and previously promoted merge
compositor remain intact.

## Architecture result

The split required no new runtime category:

- Atom lifecycles remain `persist`, `merge`, `split`, `introduce`,
  `eliminate`, and `unsupported`.
- The structural rule uses the existing `split` lifecycle and generic
  `rule-length` sizing mode.
- Denominator multiplicity comes from canonical semantic relations rather
  than DOM order, visual matching, or a fraction-specific matcher.
- Scheduling retains the shared reconciliation and scene-track timing. No
  operation-, fraction-, viewport-, or expression-specific timing was added.
- The experiment controller remains below its ratcheted `40,000` byte ceiling
  at `39,541` bytes; the isolated reversible scene helper is `4,145` bytes.
- Renderer-session DOM nodes, geometry, tracks, and correlations remain absent
  from durable animation and Cloze projections.

At the native target, the two authored denominator wrappers carry the exact
canonical selector IDs, focusability, annotations, and Cloze state. Every
material owner is inert and has no semantic selector or tab stop.

## Observable evidence

- `npm run test:glyph-reconciliation-experiment`: 63 semantic and architecture
  checks pass.
- `npm run test:real-katex-glyph-compositor`: 37 compositor and complexity
  checks pass.
- `npm run test:browser:real-katex-glyph-compositor`: 34 Chromium checks pass,
  including total split ownership, exact endpoints, seek/rewind equality,
  rule bifurcation, normal/reduced motion, native affordances, and merge
  regressions.
- `npm run visual:glyph-reconciliation-experiment`: 10 overview, 14 dense
  endpoint, and six isolated split frames pass. Wide and phone source,
  midpoint, and target captures are readable and contained.
- `npm run perf:glyph-reconciliation-experiment`: cold planning p95 is
  `3.442ms`, cached planning p95 is `0.248ms`, generic frame sampling p95 is
  `0.006ms`, full-scene sampling p95 is `0.034ms`, maximum planner work is 35
  operations, the largest serialized plan is 2,573 bytes, and route gzip
  growth is 10,535 bytes. Every frozen budget passes.
- `npm run build` and `npm run check:reader-production` pass; all eight
  manifest reader routes remain closed for production.
- `npm run test:browser:reader-conformance` passes all nine shared reader
  checks. The first sandboxed attempt could not bind the local test server;
  the identical scoped command passed outside the filesystem sandbox.
- `theseus workspace validate` passes.

## Retained risk and next gate

The previously recorded merge endpoint paint-style jerk remains a bounded
known risk; the inverse split does not expand it or create a new endpoint
category. The split midpoint and native settlement are visually
unambiguous, so the approved radical-succession audit may proceed.

The radical exemplar must still prove that its path, rule, index, and
radicand paint can use the same generic atom kinds and lifecycle vocabulary.
A radical-specific paint kind, matcher, lifecycle, authored keyframe, or
scheduler remains a hard stop.

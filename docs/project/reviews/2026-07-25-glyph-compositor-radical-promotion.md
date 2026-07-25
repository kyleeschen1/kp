# Glyph compositor radical-succession promotion

Date: 2026-07-25
Status: promoted as one experiment exemplar

## Decision

Promote the query-selected
`x^{1/2}\rightarrow\sqrt{x}` experiment card to the generic total-scene
compositor.

The governed transformation preserves the base `x`, eliminates the source
index glyphs and fraction rule, and introduces the complete native KaTeX
radical SVG as one intact path atom. The compositor does not morph the path or
substitute characters. Direct seek, rewind, normal motion, and reduced motion
share the same stateless sampler.

This decision promotes only the isolated radical experiment card. It does not
authorize reader integration or a notation-family rollout.

Canonical reference:
`docs/project/reviews/2026-07-25-glyph-compositor-promotion-long-loop-proposal.md`.

Preservation boundary: canonical semantic identity and reverse law, native
KaTeX endpoint authority, accessibility, annotations, focus, static-JS
behavior, export seams, and every route outside the selected experiment remain
unchanged.

Rollback unit: revert the isolated integration in `519bbe2e`, then the generic
structural sampling support in `3f6a852e` if required. The governed radical
asset and previously promoted fraction compositor remain intact.

## Architecture result

Structurally different notation required no new runtime category:

- Atom kinds remain generic glyph, rule, path, delimiter, and accent paint.
- Lifecycles remain `persist`, `merge`, `split`, `introduce`, `eliminate`, and
  `unsupported`.
- The radicand uses `persist`; source index glyphs and fraction rule use
  `eliminate`; the exact native radical SVG uses `introduce`.
- Track compilation retains the shared rectangle and `rule-length` sizing
  modes plus the common lifecycle timing. There is no radical, exponent,
  viewport, or expression scheduler.
- Canonical semantic and representational lineage supplies identity. Runtime
  paint observation does not infer algebra from KaTeX structure.
- The shared experiment controller remains below its ratcheted 40,000-byte
  ceiling at 39,693 bytes. The 14,467-byte radical harness is query-isolated
  in its own dynamic chunk and is the independently reversible exemplar.
- The four production compositor modules and six lifecycle primitives remain
  at their frozen ceilings. The architecture ratchet now rejects `radical`,
  `exponent`, and `root-notation` vocabulary in those production modules.
- Renderer-session DOM nodes, geometry, tracks, and playback remain absent
  from durable animation artifacts.

Computed-style cloning gained generic SVG-element support. The material layer
clones an SVG path with its native owning SVG because a detached path has no
paint context. This preserves the native `viewBox`, path data, and clipping
contract without notation-specific behavior.

## Observable evidence

- `npm run test:glyph-reconciliation-experiment`: 66 semantic and architecture
  checks pass, including governed radical identity, reverse law, and
  renderer-independent fixture closure.
- `npm run test:real-katex-glyph-compositor`: 38 compositor and complexity
  checks pass after extending the production-vocabulary ratchet.
- `npm run test:browser:real-katex-glyph-compositor`: 38 Chromium checks pass.
  Wide and phone, normal and reduced-motion profiles cover total ownership,
  exact endpoints, direct seek, play, rewind, inert transit, selector
  affordances, SVG viewport clipping, and page containment.
- `npm run visual:glyph-reconciliation-experiment`: 10 overview, 14 dense
  fraction-endpoint, six inverse-split, and eight radical frames pass. The
  radical set captures source, midpoint, 99.9%, and native target at wide and
  phone sizes. Visual review found coherent formation and no endpoint flash.
- `npm run perf:glyph-reconciliation-experiment`: cold planning p95 is
  2.285ms, cached planning p95 is 1.313ms, generic frame sampling p95 is
  0.007ms, full-scene sampling is 0.011ms, maximum planner work is 35
  operations, the largest serialized plan is 2,573 bytes, and route gzip
  growth is 5,558 bytes. Every frozen budget passes.
- `npm run build`, `npm run check:reader-production`, and
  `npm run test:browser:reader-conformance` pass. All eight production reader
  routes remain closed and all nine shared browser-conformance checks pass.
- `theseus workspace validate` passes.

## Retained risk and next gate

The original fraction-merge endpoint risk remains bounded and unchanged: its
persistent plus clone has a known font-scale/baseline mismatch that one common
translation cannot correct. The radical exemplar does not use that plus glyph,
does not add an endpoint category, and shows matching 99.9% material and 100%
native settlement at both reviewed sizes.

The architecture therefore passes the structural-notation gate. Reader
integration may proceed behind one adapter seam, but promotion remains limited
to the experiment until native accessibility, annotations, hover, focus,
Cloze, static-JS playback, and export behavior are certified on one real
reader card.

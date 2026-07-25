# Glyph compositor reader seam

Date: 2026-07-25

Status: promoted for one query-selected gold reader card only

## Decision

The generic total-scene compositor may run behind
`kpGlyphCompositor=1` for the solve-x cancellation card. This is an isolated
reader exemplar, not a default reader path or a family rollout.

The adapter consumes the existing reader render plan, material plan, and
correspondence records. DOM observations, computed styles, reconciliation,
tracks, cloned paint, and playback remain in a `renderer-session`. They are
not written into canonical animation assets, reader plans, hydration,
static-JS frames, Cloze projections, or export artifacts.

## Authority boundary

| Concern | Authority |
|---|---|
| Semantic identity and lineage | Canonical animation and reader plans |
| Settled equation DOM | Native reader KaTeX source and target |
| Interior moving paint | Inert, `aria-hidden` compositor clones |
| Annotation and semantic focus | Native reader selector nodes |
| Cloze and flashcard identity | Canonical selector projections |
| Static and headless output | Existing static-JS and compiler paths |
| Iframe and static-step export | Existing tutorial export artifacts |

Material clones strip IDs, roles, ARIA, links, tab stops, motion IDs, reader
anchor/selector IDs, semantic entity/group IDs, and focus references. The
native selector surface therefore remains the only target for reader focus,
annotation, and interaction code.

## Evidence

- Five compositor reader Chromium checks cover opt-in isolation,
  normal/reduced motion, deterministic direct seek and rewind, inert clone
  authority, native selector/focus retention, and ordinary-route chunk
  exclusion.
- The stable reader compositor capture produces wide and phone images for
  full and reduced motion. Each contains nine owned paint atoms and zero
  horizontal overflow.
- The gold equation parity capture retains all eight named editor/reader
  frames.
- Twenty-nine focused tests preserve reader-plan serialization, static math
  and MathML, static-JS playback, Cloze/flashcard projections, and iframe and
  static-step export fallbacks.
- Nine shared reader conformance routes, the production closure, architecture
  checks, build/typecheck, and Theseus workspace validation pass.

## Payload note

The absolute reader budget command already failed at the pre-integration
commit `aa92d7f8`: solve-x measured 4,788 bytes of HTML gzip and 130,472 bytes
of runtime gzip against older approved baselines. The integrated state
measures 4,814 and 132,087 bytes respectively, increases of 0.54% and 1.24%.
Every measured reader route remains within 2% of the isolated pre-integration
build, below the budget gate's 5% regression policy. No compositor asset is
present in an ordinary reader route's static runtime closure.

This slice does not rewrite global route baselines. Resolving that pre-existing
budget debt remains separate from this one-card promotion.

## Retained boundaries

- The earlier fraction-plus endpoint paint mismatch remains a bounded known
  risk and is unchanged by reader integration.
- Global reader rollout is deferred.
- Moving clones never become semantic, accessibility, annotation, hover,
  focus, Cloze, serialization, or export authority.

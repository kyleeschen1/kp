# KP lesson seam comparison and extraction map

Date: 2026-08-03
Status: executable extraction gate for slices 21–25

## Outcome

Economics and botanical Lisp now prove six lifecycle-identical seams worth
extracting: ordered motion metadata, corridor projection and rebase,
cumulative block status, one-owner scroll coordination, navigation
transactions, publication-control compilation, and the reader shell/tokens.
The URL, TOC renderer, and scrubber renderer are already shared and should be
reused rather than replaced.

The tutorials do **not** prove a shared domain scene, inline renderer, focus
vocabulary, or semantic runtime. Those similarities stop at an adapter
boundary. KaTeX and native Lisp code remain separate renderers; graph and
botanical salience remain domain projections.

`src/tutorial/kp-lesson-seam-ledger.ts` is the executable inventory. Its tests
require every extraction candidate to cite both real callers, require the
document reconciliation to cite `KpLessonDocument`, and prevent domain-local
entries from acquiring an extraction slice.

## Document reconciliation

The existing `KpLessonDocument` remains the sole general lesson ontology. The
two local compilers currently emit convenient publication shapes rather than
that artifact:

- economics nests passages under sections and attaches a motion block to a
  passage;
- Lisp keeps an ordered union of passage and motion references;
- both store rendered paragraph HTML, whereas `KpLessonDocument` owns
  structured inline content and provenance;
- both express progress on `[0, 1]`, whereas document checkpoints use integer
  permille; and
- both have `kicker` and `assumption`, which should become optional publication
  metadata rather than a second document root.

Slice 21 should therefore add a framework-neutral publication projection and
two adapters to `KpLessonDocument`. It must not weaken existing reader
validation or force older reader callers through either tutorial compiler.

## Ordered extraction map

1. **Slice 21 — document seam.** Adapt both local lesson results into an
   ordered `KpLessonDocument`-compatible publication projection. Keep inline
   rendering and domain focus payloads behind adapters.
2. **Slice 22 — motion/scroll.** Extract generic block/checkpoint/corridor
   metadata, pure cumulative block projection, numeric corridor/rebase
   functions, and one-rAF registration lifecycle. Domain callbacks paint.
3. **Slice 23 — navigation.** Extract the transaction ordering and browser
   listener lifecycle. Each caller resolves a semantic destination and
   restores its own state before shared history/TOC/scroll work.
4. **Slice 24 — static controls.** Compile TOC and scrubber models once from
   the shared publication projection, reusing the existing final-geometry
   renderers and custom-element events.
5. **Slice 25 — shell/tokens.** Share only layout and interaction presentation:
   three columns, typography, pointer, motion dividers, salience wash, and
   responsive/reduced-motion behavior. Stages and focus geometry remain slots.

## Preservation boundary

Keep current economics URLs, first-paint state, graph appearance, parameter
controls, and performance ceilings. Keep Lisp semantic identity, material
lineage, native settled code, botanical choreography, and cumulative handoff.
Do not introduce Svelte, renderer, graph, or Lisp imports into shared semantic
mechanics. Each extraction slice is its own rollback unit.

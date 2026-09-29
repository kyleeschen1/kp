# Symbolic inspection: first exemplar review

Status: ready for human judgment; not visually accepted or promoted.
Authority: [approved proposal](../2026-09-29-symbolic-inspection-long-loop-proposal.md).
Execution: `run-contract.kp.symbolic-inspection-v1`; Theseus owns live progress.

## Review the actual host

Open [the opt-in inspector](http://localhost:8000/experiments/authoring-distribution-focus-card/?inspection=true).
The shared development server was checked with HTTP 200 on September 29.
Compare [the ordinary card](http://localhost:8000/experiments/authoring-distribution-focus-card/).
This remains a development experiment backed by the prepared authoring API;
the isolated production-entry build measures its closure, not a deployable route.

1. At the source, select **Source 1: 2** from Occurrence. Two target occurrences
   are available. Follow either, then follow its source back. These are distinct
   semantic occurrences despite the identical glyphs.
2. Drag the scrubber into the transition. Choose an occurrence and open **Audit
   evidence**. Following correspondence changes the inspected occurrence without
   moving the animation. During transit use the chooser; direct equation clicks
   apply only to the native endpoint that currently owns the visible ink.
3. Read the declared law, source/target revisions and selected provenance.
   Reference, endpoint-membership and correspondence-shape checks are executed.
   Named laws are declarations; this inspector does not prove equivalence or
   independently discharge assumptions. A canonical fixture match is narrower
   than general mathematical validation.
4. Use **Clear inspection**, or Escape within the panel, then continue scrubbing
   forward and backward. Escape returns focus to the scrubber at the held position.
5. Compare the ordinary endpoint views. Judge whether tracing a particular part
   adds enough understanding to justify the extra controls and space.

Please judge identity/lineage clarity, the honesty and readability of the audit,
competition with the animation, and value beyond a static source/target pair.
Acceptance unlocks the already approved variation/factoring work; it does not
establish learning efficacy or endorse a content-library strategy.

## Implemented boundary

Canonical artifact, native renderer and semantic source remain those pinned in
[the baseline](2026-09-29-symbolic-inspection-baseline.md). Read-only immutable
evidence derives from existing selectors, authored correspondence and exact
prepared revisions. Invalid inputs produce typed gaps; replaced, foreign or
disposed snapshots cannot satisfy an inspection request. Selection uses the
existing reader semantic-focus service and the existing clock, with no second
renderer, global semantic registry or playhead.

The local panel is opt-in and lazy-loaded. Raw identifiers are kept in the audit
disclosure; occurrence labels distinguish source/target and ordinal position.
Provenance is object-level where that is all the source supplies; no token spans
or independent proofs are invented. Existing authored phrases such as “verified
factor” are source descriptions, not additional proof supplied by the inspector.

The smallest visual rollback is the local panel and opt-in host wiring. Shared
semantic evidence modules are independent of that treatment. No factoring,
source-variation reuse, arbitrary importer or catalogue promotion is delivered
at this checkpoint.

## Reproducible evidence

- `npm run test:symbolic-inspection`: 13 tests cover malformed references,
  declared-versus-checked evidence, equal glyphs, fan-out/reverse lookup,
  introduction/removal, snapshot replacement/disposal, focus precedence and
  exact-preview rejection.
- `npm run visual:symbolic-inspection`: four Chromium checks cover ordinary-route
  opt-in isolation, direct seek/reverse, actual native endpoint clicks, held-position
  selection, keyboard counterpart activation/Escape and review captures at
  desktop and phone widths. No page errors or horizontal document overflow.
  Native dropdown choice uses Playwright's selection API: headless popup key
  simulation did not change its value. OS-native dropdown keyboard behavior is
  not certified by this test.
- `npm run typecheck`, `npm run check:architecture`, and
  `npm run build:symbolic-inspection` pass. The build retains the existing
  static/dynamic module import warning; no error was suppressed.
- `npm run visual:authoring-distribution-card -- --grep 'preserves native motion and passage at 1100'`
  passes in Chromium and Firefox. Its first Firefox run observed 19 intermediate
  frames against a >20 threshold while compilation was active; an unchanged
  rerun with the compiler idle passed both browsers. This is evidence of timing
  sensitivity, not a repaired or waived gate. The ordinary route remained
  opt-out throughout; inspector cross-browser promotion is still pending.
- `npm run visual:contact-sheet -- --base-url http://127.0.0.1:8000 --exemplar split-merge-fractions --output tmp/codex/symbolic-inspection-canonical-reference`
  captures the existing 20-checkpoint reference. This is supporting canonical
  evidence, not inspector approval.

The stable inspector browser command produces `inspection-contact-sheet.png`,
six endpoint/flow/phone captures, and `inspection-held.png` with the expanded
audit under `tmp/codex/symbolic-inspection-review/`. Captures are disposable;
the committed browser test is the durable reproduction source. The contact
sheet was visually inspected: the panel stacks below the card on phone, and
opening the desktop audit keeps the card bounding box unchanged. Readability,
ordinal naming, mobile scrolling cost and explanatory usefulness need human
judgment. Full cross-browser/accessibility promotion remains after acceptance.

The impact selector has no narrow mapping for these new files and recommends
the broad default. This discovery packet follows the approved focused Chromium
cadence plus complete types, architecture and entry closure; the full repository
suite and integrated release matrix remain in the conditional release slices.

## Measured cost

Run `npm run build:symbolic-inspection` then `npm run measure:symbolic-inspection`.
This uses the actual host JavaScript entry and manifest closure, because the
ordinary production build does not emit this development middleware route.

| Gzipped emitted closure | Baseline | Inspector | Change |
|---|---:|---:|---:|
| Initial static entry | 140,602 B / 4 files | 142,000 B / 5 files | +1,398 B |
| Activated transitive closure | 234,875 B / 17 files | 240,686 B / 22 files | +5,811 B |

The activated figure includes all manifest dynamic dependencies, not a measured
HTTP waterfall. Both figures exclude HTML, host-loaded KaTeX stylesheet, fonts,
images, prepared API data, server work, HTTP overhead and execution/paint cost.
The ordinary route does not request the inspection bridge in the browser test.
The added control/audit reading cost is unmeasured; bytes alone cannot establish
that inspection earns its place.

# Contextual inspection and provenance: away review

Outcome: **HUMAN_CHECKPOINT**, not product completion. The approved independent
work is exhausted; two opt-in visual candidates await one batched review.
Theseus owns live status in `run-contract.kp.relational-reader-away-v1`.

## Review the candidate

Shared server:

http://localhost:8000/experiments/mechanics-relations/?derivation-motion=contextual&derivation-provenance=local#energy-from-momentum

1. Drag the gutter handle down and back through the three moves. The complete
   working expression travels with the transformation; semantic participants
   receive the existing blue emphasis. Supporting structure is no longer hidden.
   Permanent source/destination equations stay readable and geometrically fixed.
2. Open **Recall the momentum definition** beneath the first substitution.
   It shows the earlier premise and the positive-mass condition for division.
3. Hold the animation partway through a move, then choose **Visit the original
   definition**. Use **Return to your derivation** at the source. The bookmark
   preserves the selected transition, progress, disclosures, focus and a row's
   viewport position without resuming playback.

Context-only comparison:

http://localhost:8000/experiments/mechanics-relations/?derivation-motion=contextual#energy-from-momentum

Previous extraction experiment (preserved, not visually accepted):

http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum

Previous whole-expression comparison:

http://localhost:8000/experiments/mechanics-relations/?derivation-motion=equation#energy-from-momentum

The new candidates are not the default. No catalogue-wide promotion occurred.

## Batched decisions

- **Context:** does the full working expression now make the transformation
  intelligible, while its permanent records still feel distinct? Recommendation:
  prefer contextual inspection over isolated fragments if this review confirms it.
- **Provenance:** does local recall plus an exact return make it worthwhile to
  follow the earlier premise? The interaction works programmatically; its
  explanatory usefulness and discoverability are not established by tests.
- **Phone limitation:** a 390px viewport has no horizontal page overflow, but
  the reserved equation lane makes expanded prose too narrow. Do not accept
  this as a finished mobile design. A later local full-width inspection treatment
  needs its own design decision, not a silent layout change during away mode.

## What was and was not delivered

Context restoration uses the existing whole-expression scene and semantic
cohorts. The only new handoff behavior is applying the existing continuous
departure/docking envelope on every edge in the opt-in treatment. No change to
mathematical truth, motifs, clock ownership or native KaTeX composition.

Provenance is a bounded same-document adapter, not a universal navigator. The
existing reusable-reasoning navigator was inspected but not imported: it owns
another source schema and parent/reason timeline. This adapter borrows the
physics reader's existing clock, binds an original Article passage, and pins
bookmarks to a hash of the published Article document. Unknown/stale frames,
nonfinite progress, wrong anchors and invalid focus/disclosure references fail
before restoration. Bookmarks are held in the mounted document, not persisted
across reloads or arbitrary source revisions. Source navigation is explicit;
there is no new interception of browser Back, page scrolling or global keys.

The **granularity investigation completed with a capability gap**. It did not
deliver expandable cancellation. See
[the executable refinement diagnosis](2026-09-15-energy-cancellation-refinement-gap.md).
The existing source authorizes one coarse cancellation but not the finer
power-expansion/inverse-pair edges. Registered motifs cannot substitute for
source-bound proof and lineage. No new operation pack was created.

The optional evaluation worksheet was not needed. The old v2 r3-r5 and mechanics
loop remain deferred, with incomplete history preserved. No new lessons, public
promotion, deployment, merge or push occurred.

## Verification and cost

Reproduce from the repository root:

```sh
node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts
npm run visual:mechanics-relations
npm run typecheck
npm run build:bundle
npm run measure:mechanics-relations-closure
npm run theseus -- workspace validate
```

The focused unit suite has 20 tests. The scoped Chromium suite has 15, including
the unchanged extraction comparison and the combined context/return candidate.
Coverage includes native docks, reverse/hold, fixed records, keyboard, no-JS
reading, print, narrow captures, reflow restoration and stale bookmark rejection.
Full types pass after repairing an initial strict-property-access failure in the
new validator. The production build passes with its existing large-chunk warning;
the limit was not changed. This is not a full repository test suite or Safari/
Firefox certification, nor evidence of improved comprehension or physical-device
frame rate. Impact discovery had no focused rules for these local paths; the
approved discovery/standard cadence used the explicit exemplar checks and full
types, followed by production build at integration.

Measured production JS/CSS reachable closure is approximately **32.8 KB gzip
initially**, **135.7 KB with dynamic imports**, with **102.9 KB additional lazy
closure**. Run the committed measurement command for exact current bytes and
per-file attribution. It excludes HTML, fonts, images, HTTP overhead and browser
parse/execution/paint cost. The earlier review's 28.4/130.8 KB readings predate
several visual iterations; their difference is not an isolated cost of this
away run. Some unrelated choreography remains reachable through existing
compositor imports; no bundler surgery was authorized here.

No new package dependency or CSS was added. One roughly 114-line local return
module and narrow host/publication wiring account for the main runtime addition;
one small measurement entrypoint reuses existing bundle-closure attribution.
Tests extend the existing two exemplar suites, rather than adding a new test
framework. Granularity added diagnostic tests/documentation only. This was host
engineering, not a source-only authoring success or live-model benchmark.

Implementation boundaries: `c83bbcfb8` (context and approved control amendment),
`c8806d7bb` (provenance and return); subsequent evidence/closeout commit retains
the executable gap probe and final validation. The four-hour limit was a ceiling,
not a target. No extra portfolio was invented to spend unused capacity.

## Resume

First review the two candidates above. If accepted, explicitly select their
adoption and reconcile the remaining v2 scope; do not mark old r2-r5 complete
because an away candidate exists. Finer cancellation needs approval for the
bounded semantic extension described in the gap report.

Retrieve exact state with:

```sh
npm run theseus -- work context run-contract.kp.relational-reader-away-v1 --mode brief
```

The parked visual packages must remain nonterminal until accepted. Successful
investigation means the uncertainty was resolved, not that its missing feature
was shipped.

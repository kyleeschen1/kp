# R1 combined authoring checkpoint

Status: HUMAN_CHECKPOINT — visual/interaction approval required, not granted
Date: 2026-09-07
Implementation: `68013ccd3` on `feature/20260907-authoring-round-trip`
Authority: `2026-09-07-authoring-round-trip-long-loop-proposal.md`
Execution: `run-contract.kp.authoring-round-trip-v1`; Theseus owns live progress.
The contract and target are blocked specifically on human acceptance. The
generic status command therefore reports no active loop. After approval,
reactivate this existing contract/target, record s20 acceptance and continue;
do not create a replacement plan or skip to another roadmap lane.

## Working review destinations

The existing shared development server is running from this repository on
port 8000. No second persistent server was started.

- Equation authoring card:
  <http://127.0.0.1:8000/experiments/authoring-market/#equation-authoring>
- Market source status, history inspection and branch export:
  <http://127.0.0.1:8000/experiments/authoring-market/>
- Concrete selected reading edition:
  <http://127.0.0.1:8000/tmp/codex/authoring-market-editions/round-trip-review/index.html>
- Preserved canonical reader:
  <http://127.0.0.1:8000/experiments/kinetic-figure/supply-tax/>

These routes were fetched successfully from the existing server. The live
market endpoint reports valid source revision
`c2455993ff7c456c3c2d6ab0369df078a2202bb474c7dd21fa1655e331c4ecee`.
The equation deep link and its actual mounted compositor were exercised by the
scoped browser command against its isolated test server.

## What to approve

This is approval of the bounded authoring interaction and its readable output,
not a new mathematical family, motif, editor architecture or catalogue rollout.

1. In the equation card, try both arrows, the slider, keyboard arrows and a
   partial horizontal passage swipe. Resize to a narrow window. The equation
   should remain on-stage, move continuously and settle into native endpoints.
2. In the second JSON state, add
   `"narration": "The base supplies the denominator."` (with the necessary
   comma). Choose **Compile equation draft**. The second passage should change
   without replacing or resetting the equation compositor.
3. Change the second state's `latex` to `x+1` and compile. The invalid draft
   should stay in the editor; repair guidance should explain the rejected
   source/endpoint mismatch; the last valid equation should remain visible.
4. Choose **Restore displayed request** or correct the draft and compile again.
   Restoration is explicit and changes no source file. Notice whether the
   draft/display distinction and repair wording are understandable.
5. Open the reading edition. Its prose, exact market facts (including revenue
   12), and the ordered logarithm deduction should be legible. It deliberately
   omits graphical motion rather than showing a stale reference diagram.

The real source-file edit/history/export/build sequence is already automated;
the human checkpoint does not require repeating terminal or file operations.
For hands-on source work and explicit equation inclusion in a branch, use
`../authoring/authoring-round-trip-packet.md`.

## Identity and preservation boundaries

The equation is `animation.equation.logarithm-change-of-base.v1`, not the
log/exponent-solving sibling. Trusted semantics remain
`kpCanonicalLogarithmChangeOfBase`, bound by the existing governed compiler.
The preview composes its two states through `renderKpFocusDeckScaffold`, the
existing editor player clock, and the canonical change-of-base native-KaTeX
surface/transit session. Native formatting remains canonical, not a promise to
preserve every equivalent lexical LaTeX spelling.

Narration edits change authored passages; unsupported mathematical changes
return repairs. The optional source packet `equationRequest` is included only
by explicit selection and revalidated during publication. Dirty or invalid
equation drafts cannot silently export the retained valid request.

Integration exposed two shared surface defects: raw-clock rewind paint and
stale responsive geometry/typography. Both were repaired at the existing
surface lifecycle/measurement seam. Geometry replacement invalidates frozen
clones before the native factory's handoff calibration. No choreography,
duration, easing, domain model or semantic authoring contract was replaced.

Rollback units: the bounded authoring card and its opt-in imports/inclusion
tests; separately, the surface rewind/geometry repair. Do not roll back domain
models or the accepted canonical reader to undo this authoring UI.

## Reproducible edition and evidence

Selected source: `content/authoring/market-round-trip.market.json`.

```sh
npm run author:market-publication -- --source content/authoring/market-round-trip.market.json
npm run author:market-publication -- --source content/authoring/market-round-trip.market.json --check
```

The generated edition contains 63 local files, including KaTeX fonts/CSS.
Source digest:
`sha256:bc29bc489b3625d78a7885b3ac33f6fab1a69d91019618ccb050550917e3e093`.
Payload digest:
`sha256:eeed35f0c44fd7862a0a3c742bd92569b53dd5e29a1e634da8c0b783c29e98e8`.
Freshness verifies actual bytes and reproduction from the selected source.
The generated HTML needs no JavaScript; Vite adds its development hot-reload
client when serving that file, not an edition rendering dependency.

Executed evidence is recorded in Theseus:

- `npm run test:authoring-round-trip`: 46 passing tests.
- `npm run test:authoring-integration`: 88 passing tests.
- `npm run test:focus-deck-multi-card`: 19 passing tests.
- `npm run visual:authoring-market`: 11 passing browser checks, including a
  real source edit/break/repair/inspection/export/filesystem-build/no-JS round trip.
- The equation-focused browser check was rerun after the responsive repair;
  it checks actual native/material ink bounds, reverse, partial swipes,
  keyboard controls, invalid-draft export rejection and the review deep link.
  Desktop/mobile screenshots were visually inspected after that repair.
- `npm run test:browser:logarithm-change-of-base`: three canonical compositor
  checks rerun and passing after the final repair.
- Full `npm run typecheck`, canonical source freshness, edition freshness and
  `theseus workspace validate` pass.

This is not full R1 release certification or an actual live LLM trial. After
approval, continue the already-approved feedback, second-variant pressure,
live-model trial, measured-friction repair and release/closeout work. Do not
ask for another routine resume; stop only at a named contract condition.

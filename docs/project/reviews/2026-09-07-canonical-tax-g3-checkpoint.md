# Canonical supply-tax adoption: G3 checkpoint

Outcome: HUMAN_CHECKPOINT. Machine release passed; canonical visual parity
requires human approval. Theseus owns live progress under
`run-contract.kp.structural-authoring-canonical-tax-v2`; this report does not
replace its slice table. Scope is the original
`2026-09-05-structural-authoring-canonical-tax-long-loop-proposal.md`, including
the explicitly accepted bounded four-card production-adoption amendment.

## G3 feedback follow-up — keyboard navigation

The user reports that all but the code example work well, and arrows work only
on supply-demand. This is not complete G3 approval. A regression test reproduces
one concrete interpretation across all three browsers: with the state slider
focused, tax moves a whole step while log/exponent, surface/contour and code do
not. The baseline is three tax passes and nine sibling failures. Their native
range increment was `0.01`, while tax alone translated keys into semantic steps.
The earlier release tests exercised buttons and scripted slider input, missing
this keyboard path. This is a control inconsistency, not a semantic-schema fault.

The repair shares only the key-to-step intent resolver in the Focus Deck shell.
All four cards retain their own navigation, timeline and renderer. Arrow keys
now select whole steps; Home/End select endpoints; pointer scrubbing remains
continuous. Focused checks pass: 21 browser tests across Chromium/Firefox/WebKit,
19 Focus Deck unit tests and 81 authoring integration tests.
The full typecheck/build and architecture gates also pass. The expanded
`npm run visual:canonical-tax-production -- --project=firefox --project=webkit`
passes 12 checks, now exercising keyboard navigation on every built card.
Reader closure/budgets and 68-root reachability remain unchanged. The bounded
repair adds 130 gzip bytes to the canonical static JS/CSS closure (367,522 total);
HTML is 24,029 raw / 3,202 gzip bytes. Measurement exclusions below still apply.

The separate code-card report remains unresolved pending clarification. Existing
button-driven code animation/interruption and direct-seek tests pass in all
three engines, but that is not proof of the reported visual experience. The
code card explicitly disables passage swiping in its earlier implementation
(`5a4426158`), rather than losing it during production adoption. No swipe feature
or new choreography was silently added. Ask whether the remaining problem is
passage swiping, on-card buttons, or the animation/rendering itself; review the
repaired keyboard behavior at the same URL. The s27 release record below is
historical evidence before this bounded control repair, not a fresh full-suite
claim for the changed code.

## What to review

Open the existing shared server:
<http://127.0.0.1:8000/experiments/kinetic-figure/supply-tax/>.
It responded HTTP 200 during this release. No second persistent server is
required. The ordinary build serves the same route; its separate automated
preview is temporary test infrastructure, not a new authoring service.

This is a preservation review, not a proposed redesign. Check:

1. Tax: swipe in both directions, use arrows and the slider, and visit all eight
   states. Prose and graph should agree; no instant unintended jumps, stale snap
   corrections, or half-settled states should appear.
2. Passage typography, equation loading and stage/passage layout should retain
   the approved appearance. Check a narrow window or phone as well as desktop.
3. The log/exponent, surface/contour and TypeScript sibling cards should retain
   their approved content, motion and navigation when moving between cards.

Approval means canonical-page parity is accepted after framework and build
adoption. It does not approve a universal motion rule, public API, catalogue
migration, merge or deployment. Automated screenshots and endpoint checks do
not substitute for this judgment. G0, G1 and G2 remain accepted.

## What is now integrated

The canonical artifact is the four-card Focus Deck at the route above. Its
production host is now under `src/tutorial/kinetic-figure-supply-tax/`.
Tax still uses the existing SVG/KaTeX renderer, domain mathematics, semantic
score, attention and native interaction owners. The framework-derived reference
model and its exact facts/history supply the semantic truth; checked generated
JSON is a delivery artifact, not a second model authority.

The tax source has one revision-local frame query session. The old host default
Article/score/asset/sampler wiring was retired atomically in `236603e11`.
The deferred native-snap race was repaired at its existing host in `467c71212`,
without changing the clock, thresholds or semantic schema.

The approved repair moved the exact four-card runtime dependency set into
existing tutorial ownership. Experiment pages remain callers; production no
longer imports their runtime implementations. Article compilation and prose
HTML generation occur at build time. No production-erasure exceptions or
payload/inference budget increases were added. Shared Focus Card form remains
owned by `src/tutorial/focus-deck-scaffold.ts` and its stylesheet; domain
renderers retain their own responsibilities. Static outputs inherit future
source/form changes through rebuilding, not by updating already-distributed
files remotely.

Key commits: `a043eff88` records approval; `954099452` implements production
ownership/build-time instructions; `d52929da5` proves preview/canonical lifetime
isolation; `90a0214d9` records release evidence and reproducible delivery costs.
The bounded production promotion is a cross-file rollback unit: its entrypoint,
ownership moves and generated instructions must stay coherent. Do not roll back
semantic models to repair a presentation-only defect.

## Source workflow and its limits

For local authoring, edit
`src/experiments/authoring-market/authoring-market-model-source.ts` and the
explicit fact-binding template in `authoring-market-article-source.ts`.
The existing preview rebuilds on trusted local saves. Invalid drafts retain
the last valid mount; subsequent repairs produce a new revision. Demand change
is settled history; tax is the supported animated operation.

The canonical build deliberately selects the reference specimen and preserves
`content/lessons/economics-supply-tax-scroll-score.kp.md`. Temporary preview
selection cannot silently publish a variation. The instruction binder rejects
a non-reference model with a typed instruction gap rather than attaching stale
literal prose. This is not automatic verification or rewriting of arbitrary
natural-language claims.

Run `npm run compile:canonical-tax-source`, inspect generated changes, then
`npm run build`. The build checks freshness of the tax source/static reading and
the sibling instruction artifacts. Both canonical and preview delivery call
`prepareKpAuthoredMarketSource`; they own separate frame/revision/disposal
lifetimes. The preview compiler/transport is absent from the production reader.
No-JavaScript delivery includes the eight tax phrases and exact facts, not a
complete four-card static graphical publication.

## Executed evidence

The s27 release passed:

| Command | Result |
| --- | --- |
| `npm test` | 6,610 passed; no failures, cancellations or skips; architecture and inference gates passed |
| `npm run build` | Full app/Node/test/Svelte/domain types and ordinary production build passed |
| `npm run visual:authoring-structural -- --project=firefox --project=webkit` | 24 passed, including real native ownership/continuity and phone/reverse/reduced-motion preservation |
| `npm run test:browser:economics-supply-tax -- --project=firefox --project=webkit` | 39 passed on the canonical source and existing URL |
| `npm run visual:canonical-tax-production -- --project=firefox --project=webkit` | 9 passed against built output, including no-JavaScript reading |
| `npm run visual:reader-production -- --project=firefox --project=webkit` | 39 passed on existing built reader routes |
| `npm run check:reader-production` | Production closure passed for 12 manifest routes |
| `npm run check:dev-review-production` | 453 artifacts / 12 forbidden markers passed |
| `npm run check:reader-budgets` | All 12 fixed budgets passed unchanged |
| `npm run check:equation-reachability` | Generated graph current, 68 roots |

Each browser command above includes Chromium plus Firefox and WebKit. Earlier
in this same adoption repair, s26 passed 81 authoring integration tests, eight
live save/error/repair preview checks, and nine same-document multi-card
navigation/remount checks across the three engines. The full suite includes
the deterministic source/Article/bundle-closure checks. Theseus preserves the
intermediate failures and their final passing reruns; none remain open.

## Costs and remaining work

`npm run report:canonical-tax-delivery` reports 24,029 raw / 3,206 gzip bytes of
HTML and 367,392 gzip bytes across 69 static JS/CSS files, with 19 discoverable
dynamic roots. This excludes fonts, images and later activation; it is not full
wire transfer or a frame-rate claim. The new route has no invented budget.
Existing equation-reader static startup is 138,001 gzip bytes against its
unchanged 145,000-byte ceiling. Consumer inference remains 112,090 types and
191,101 instantiations; headroom remains limited. Existing large-chunk build
warnings are not suppressed.

The long loop was warranted for proving structural authority/history/native
paint and then real reader adoption. Actual build execution exposed an ownership
gap that development-only tests could not establish; the accepted bounded
amendment resolved it. The result protects existing domain authority while
connecting authoring to an ordinary reader build. It does not establish that
every future animation needs a loop of this size.

After G3 approval, close this contract without merging or deploying. Recommend a
separately reviewed next contract for everyday source authoring and diagnostics,
then explicit versioned publication and durable last-valid artifacts. Broader
knowledge/procedure modeling and LaTeX/LLM/domain expansion follow the roadmap.
Public facade promotion, general CAS/ontology, new rendering families, editor
redesign and catalogue-wide migration remain deferred.

Resume after review with “approve G3 and resume”; tracked CLI entry:
`theseus work start next-action.kp.structural-authoring-canonical-tax --mode brief`.
The existing larger resume packet exceeds its fixed budget, so use the bounded
brief entry rather than raising that budget. The persistent nonvisual
continuation rule remains in force; it does not waive this visual checkpoint.

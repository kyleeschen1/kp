# Code card promotion: centroid and shipping

Scope: `code-transfer` in `run-contract.kp.passage-consolidation-v2`, and the first
slice of the approved September 22 sequence. Both visual treatments were accepted
by the user before this verification. No new motion or reading layout is proposed.

Canonical hosts remain `/experiments/centroid-reasoning/?reading=focus#extract`
and `/experiments/code-reasoning/?reading=focus#before`. Checked language source,
the existing native/token renderers and the existing clocks retain authority.
The promoted boundary is the shared card layout, navigation, viewport adaptation
and source-copy interaction used by these two callers. Larger-code co-visibility
and source-only code authoring remain unproved; this is not a universal code UI.

## Repairs revealed by promotion

- WebKit requires the prefixed native text-selection property. Native source now
  gets both spellings, while moving token layers remain nonselectable. Browser
  checks exercise actual word selection and touch-scroll preservation.
- Closed disclosures remained invisible in WebKit printing even with explicit
  `::details-content` CSS. The publication now emits a print-only projection of
  the identical static body outside the disclosure. Screen and print expose one
  copy each, without JavaScript. The helper rejects document IDs and interactive
  elements to avoid duplicated identities/lifecycle. Regression checks cover
  exact source, supporting case tables and return to screen mode.
- Browser tests now distinguish Chromium's real system clipboard from the other
  engines' captured write transport and explicit copy-event ownership. Firefox
  does not support the requested clipboard permission grant and protects synthetic
  DataTransfer stores. The tests still check real native selections, partial-copy
  noninterception, complete-source payloads and manual fallback in every engine.
  Firefox/WebKit OS clipboard transport is not claimed certified by this harness.
- Geometry checks use a 0.1 CSS pixel bound for native line-box/document-coordinate
  rounding (observed differences 0.0334 and 0.000031 pixels), preserving every
  compared dimension. Rail clicks round driver coordinates to integer pixels;
  the existing playhead tolerance remains unchanged. This addresses browser-driver
  truncation rather than relaxing the product's playhead behavior.

The print helper adds serialized static content, not a second semantic source or
runtime. Vite's server-side centroid publication needed a config reload to consume
its changed compiler; an initial test against stale markup is not product evidence.

## Compiler-cost amendment

The full gate exposed a pre-existing inference overage from accepted fraction
renderer integration. [Attribution and exact bounded policy amendment](2026-09-22-code-promotion-inference-cost.md)
retain all consumers and negative checks; no optimization is claimed.

## Verification

Stable promotion command: `npm run visual:code-reasoning:cohort` (both callers,
Chromium, Firefox and WebKit). Focused no-JS/print checks passed on all three
engines after the repair. The complete promotion cohort and project gates are
recorded in the owning Theseus contract at slice completion.

The complete cohort passed 57/57. Full app/node/test/Svelte/domain types,
architecture, inference, production bundle and 17 focused publication/budget
tests passed. Integrated release subsequently passed all 7,195 repository tests;
see [closeout and repaired inventory evidence](2026-09-22-consolidation-closeout.md).

Production measurements through `measure:mechanics-relations-closure` with
`code --summary` and `centroid --summary`: shipping initial/activated compressed
JS/CSS 7,298 / 38,113 bytes and HTML 4,946 compressed bytes; centroid 35,797 /
35,797 and HTML 7,706. Fonts, images, HTTP and execution/paint are excluded.
These establish current costs, not a before/after speedup.

Rollback unit: prefixed selection styling, print publication helper and scoped
browser harness changes. Semantic models, motion tracks and source pins are
unchanged. Test adapters make their transport limits explicit; they do not imply
arbitrary moving-text selection or mathematical fragment support.

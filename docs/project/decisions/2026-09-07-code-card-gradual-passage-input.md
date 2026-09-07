# G3 clarification: enable gradual code-card passage input

Date: 2026-09-07
Status: bounded implementation requested; human G3 review remains required

The user clarified the remaining report: "code card still doesn't allow gradual
swiping". In the resumed repair context this requests enabling gradual passage
input, not merely rechecking buttons or keyboard arrows. It supersedes the
earlier need to ask which code-card interaction was failing.

## Canonical target and preservation boundary

- Artifact: `animation.programming.typescript-free-shipping-refactor`, projected
  into the TypeScript Focus Card on `/experiments/kinetic-figure/supply-tax/`.
- Host: `src/tutorial/kinetic-figure-typescript-focus-card/` within the existing
  ordinary four-card production route.
- Truth: the existing TypeScript free-shipping runtime projection, canonical
  seven-stage score, and generated Article instruction bindings.
- Paint and time: existing refactor motion/token-theater samplers, DOM renderer,
  and reader timeline clock. No new semantics, renderer or animation clock.
- Rollback unit: code-card passage event ownership and CSS plus their regression
  tests; do not roll back the semantic framework or other cards.

## Cause and bounded repair

The earlier caller deliberately set `overflow-x: hidden` and did not install a
passage-scroll handler. This was deferred interaction support, not a semantic
schema regression. The slider already supplied fractional code frames.

Enable native horizontal overflow and let physical passage motion sample that
same fractional timeline. While a gesture is held, preserve the viewport's
position rather than rounding it back to a prose page. Existing slider/button
behavior still presents complete prose beats. At gesture completion, settle
to the nearest semantic beat and update its URL.

Explicit pointer/horizontal-wheel intent acquires passage ownership. Controls
and disposal cancel pending passage work. Programmatic writes and late scroll
corrections cannot reopen the clock. Input frames are coalesced with animation
frames; a bounded quiet-input timer only settles the gesture. It does not
advance the code animation. The prior blanket no-timeout source test is refined
to permit exactly that fallback while still excluding recurring timer playback.

A real-wheel regression exposed Chromium scrollend arriving before a queued
intermediate paint. Debounced settlement preserves the intermediate frame.
No change to the canonical motion's duration, easing, token identities, prose,
shared Focus Card typography, or sibling renderers was needed.

## Acceptance and evidence

Held fractional passage positions, reverse travel, slider/playhead agreement,
gesture settlement, URL update, and stale-scroll protection have regression
coverage. Actual horizontal wheel input must produce intermediate frames.
Built phone-width checks cover normal and reduced-motion preferences through
the same ordinary production route. These checks distinguish sampled progress
from a claimed physical-device visual approval.

Stable commands:

```sh
npm run test:focus-deck-multi-card
npm run test:browser:focus-deck-multi-card -- --grep 'TypeScript passage swiping|TypeScript native horizontal'
npm run visual:canonical-tax-production -- --project=firefox --project=webkit
npm run typecheck
npm test
npm run build:bundle
npm run check:reader-production
npm run check:reader-budgets
```

Theseus retains actual executed results and any failed-to-passing reruns.
The existing loop may close only after G3 acceptance; this request is not
approval of the resulting interaction, a new successor loop, merge or deploy.

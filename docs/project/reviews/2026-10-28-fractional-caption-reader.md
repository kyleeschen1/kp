# Document-backed captions for the fractional reader

Status: user accepted the card and confirmed Cmd+F works; the latest fixed-spacing,
unfaded departure awaits visual review. Nocturne remains the requested theme.

The user prefers explanations that behave like closed captions. The latest
revision addresses the missing anticipation: captions sit above the equation
on a phone-width card. The user found the rail unhelpful; a faint approaching
caption now supplies anticipation directly.
Text remains still during its operation, then rises beyond the card edge as the next
caption materializes. Native search and ordinary document scrolling remain
explicit requirements. This supersedes the local rising/fading presentation in
[the preceding experiment](2026-10-28-fractional-rising-passages.md), not its
mathematical programs or the broader reader architecture.

## Authority and scope

- Canonical host: `/reader/solve-fractional-linear/`.
- Canonical artifact and mathematical source:
  `src/semantic/fractional-linear-equation-asset.ts`.
- Rendering remains the existing mixed native KaTeX/material and legacy
  introduction path. No new equation renderer, copied equation, math motion motif,
  semantic state, or clock is introduced.
- Rollback unit: this caption candidate commit. Its local layout/geometry
  adapter and reader hooks can be reverted together. Other lessons do not adopt
  the caption presentation. Print lifecycle protection is a reader-host fix.
- Promotion requires human acceptance here, followed by one structurally
  different caller. No format-wide rollout or pedagogical effectiveness claim.

## Behavior

The latest local candidate uses a centered card up to 440px wide. Per the user's
correction it restores the spec's Nocturne palette: `#121826` page and `#1B2535`
card, through the existing shared tutorial palette variables. Mathematical ink
and typography remain unchanged. All caption text and card controls use the
foreground color. The separator is removed; captions retain their bottom
alignment just above the mathematical region. The native equation renderer uses a compact 96px workspace at the
top of its region, retaining its existing fit and motion clearance. The rail
and its labels are removed. The final caption remains with the solved equation.

Each operation gets 14% of available-height scroll distance for reading, 32%
for its unchanged mathematical program, then holds its result. The final 18%
of available-height scrolling before the next instruction exchanges captions.
During the preceding 8%, the next explanation appears at the bottom of the card
and begins rising, at no more than 3.5% opacity, while the current caption stays
fully legible. Both captions use the same translation from the moment the preview
appears, preserving their geometric separation throughout travel. The outgoing
text stays at full opacity; its clipping box now begins at the card's top edge,
so it disappears by crossing that edge, not by fading. The preview remains extremely faint through the
mathematical area and becomes readable only in the final 8% of its travel,
near its settled caption position. The original caption remains clipped to
the card's top edge; the inert preview is clipped to the card interior.
The outgoing copy is clipped away before the arriving copy reaches full contrast. The equation holds
throughout the preview and exchange; its
next operation starts only after the new caption has settled and received its
reading interval. Geometry reserves a result hold before exchange even for
shorter measured slots. These are provisional local choices, not reusable
timing policy. Reverse motion samples the same geometry. Reduced-motion users
get a clean caption replacement without preview, translation or fading.

All explanations remain their original HTML nodes, in document order. Stable
in-flow step slots own scroll measurement; pinned caption rectangles cannot
change the semantic clock during resize or search. The Steps menu opens an
instruction before its operation. Existing mathematical progress and local
`kpReading` URL coordinates preserve reading positions within holds.

Inactive captions use `hidden="until-found"`; the native `beforematch` event
reveals the actual authored node and aligns its slot with the corresponding
source equation. No key is intercepted and no search UI is reimplemented.
The approaching preview is a single reused visual copy marked `inert` and
`aria-hidden`, with descendant IDs removed. It is not a second searchable or
accessible transcript. Its original remains hidden-until-found until arrival,
so searching during a clipped preview can reveal the complete instruction and
seek its source equation. The preview is rebuilt only when its source changes,
and removed on disposal; original nodes retain their identity and bindings.
**Read all** exposes every passage in flow, including for assistive-technology
reading. Browsers without `beforematch` support default to that mode, preserving
searchability rather than hiding unsupported content. Print exposes all prose;
without JavaScript a noscript stylesheet exposes all original text in normal flow.

The compiler now emits the caption frame, intro and beat wrappers directly.
Previously runtime imports completed before wrapping the old article, producing
the reported startup flash. A local fail-closed adapter accepts only this
compiler's flat beat structure; count/shape drift raises an error. Enhancement
binds those existing nodes. The initial static equation uses the compact stage
without its old nested card. This does not remove hydration or font-loading cost.

References: [HTML native find and hidden-until-found contract](https://html.spec.whatwg.org/multipage/interaction.html#interaction-with-details-and-hidden=until-found),
[hidden attribute behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden).

## Invariants repaired while exercising navigation

1. Native scrolling must supersede a controlled sample after leaving its
   commanded position. Previously the reader relied on wheel/key/pointer events
   to release a menu/URL sample. The fractional host now checks actual scroll
   displacement, retaining rounding tolerance at the commanded position. The
   browser regression scrolls after a menu jump without synthesizing an input
   event and asserts that mathematical progress advances.
2. A compositor must not measure the interactive surface while print deliberately
   removes it. Print can trigger scroll/resize and leave queued frames. The host
   suspends these updates during print, guards queued writes, and remeasures on
   return. The browser check enters and exits print and rejects page errors.

3. A persisted `pagehide` must preserve the live runtime for browser restoration.
   The old unconditional disposal unwrapped captions into an article, while a
   bfcache return does not rerun module initialization. Disposal now occurs only
   for nonpersisted navigation and also removes scroll/resize listeners.

These are runtime lifecycle guards, not claims that types prove browser geometry
or that every browser/search implementation behaves identically.

## Verification

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/semantic-reader-fractional-linear-compiler.test.ts
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run typecheck
npm run build:bundle
```

Pure geometry checks cover reading holds, motion intervals, result holds,
preview anticipation before departure, held math throughout caption exchanges, inverse seeks and
invalid measurements. The scoped Chromium check covers 1280×900 and 390×844
cards, foreground prose, absent divider, bottom-entry preview geometry, the
3.5% opacity ceiling while crossing math, preserved caption alignment, math
near the top of its region, the restored Nocturne palette, exact reverse sampling
during both halves of an exchange, held-position reload, menu navigation,
native scrolling, keyboard scrolling, document mode, reduced motion, final
completion, print return and static fallback. An unsupported-capability
simulation checks that prose stays exposed.
The preview check also verifies inert/hidden accessibility, absence of copied
IDs, and native reveal of the complete original while its faint copy is visible.
The latest local check also measures a constant gap from first preview entry
through departure, full outgoing opacity and a clipping boundary at the card
edge, with exact reverse samples. The shared translation prevents independent
departure and arrival curves from drifting apart; equation motion is unchanged.
The 41-sample equation smoke protects direct/forward/reverse paint and the
previous duplicate-owner repairs. Full typecheck includes app, tools, tests,
Svelte and domains. These checks passed for this candidate; screenshots were
inspected at both viewport sizes. No cross-browser promotion is claimed.
The startup check blocks the runtime entry module and asserts that the caption
frame, original intro and compact unbordered equation are already visible.
Compiler tests reject incomplete/nested markup. A synthetic persisted
pagehide/pageshow followed by the scroll checks guards against destructive
teardown; this is not cross-browser certification of actual bfcache admission.
The same scoped caption check passed against the production preview. The
noscript fallback remains inline: a linked stylesheet was extracted by the
bundler into unconditional CSS during development of this candidate, so the
production build and no-JS check explicitly protect that boundary.
Palette assertions match the requested Nocturne restoration; mathematical ink
and paint-ownership assertions remain unchanged.

## Tab-crash investigation and cost

The user reported a crashed tab. No crash was reproduced, no browser crash log
was available, and the cause remains unknown. The repeatable diagnostic is:

```sh
npm run visual:fractional-linear-equation -- --performance --base-url=http://127.0.0.1:8000
```

Measured in local Vite development, headless Chromium, with four complete
forward/back scroll cycles and forced GC between samples:

| Observation | Before | Candidate |
| --- | ---: | ---: |
| Ready including network-idle wait | 1,411 ms | 1,100 ms |
| Resource entries | 250 | 250 |
| Decoded resource bytes | 5,107,219 | 5,117,241 |
| Initial retained JS heap | 9.30 MB | 9.30 MB |
| Heap after four cycles | 11.50 MB | 11.50 MB |
| Nodes after each warmed cycle | 2,350 | 2,352 |
| Layout count after four cycles | 7,548 | 7,547 |
| 95th-percentile frame interval | about 33 ms | about 33 ms |

Candidate cycle heaps were 11.33, 11.57, 11.40 and 11.50 MB; node count stayed
constant after warm-up. During the final three-second idle window heap and
layout count remained unchanged, and measured script time increased by about
one microsecond. These observations show no accumulating retained-heap pattern
in this bounded run. They exclude GPU/native memory and are not a production
payload measurement or evidence that the user's crash is fixed. Ready-time
differences are single-run observations, not a demonstrated speed improvement.

Active scrolling remains costly: 49 canonical session builds and roughly
1,835 layouts per warmed full forward/back cycle. An experimental opt-in to
the existing pure-plan cache broke reverse-scroll positioning. It was reverted;
the existing cache eligibility remains unchanged. Any later optimization must
preserve the scoped reverse-geometry checks. The immediate startup repair is
structural first-paint correctness, not a claim of reduced animation cost.

Search evidence is deliberately split: Chromium `window.find()` locates an
inactive explanation, but does not invoke its native Find toolbar's reveal
algorithm. Actual fragment navigation exercises `beforematch`, reveals the
matching original node and synchronizes the equation. This is not an automated
end-to-end Cmd+F toolbar test. The user has confirmed native Cmd+F works in their
browser on the preceding card version. That acceptance does not certify all
browsers or every repeated-match case; the preview adds the targeted reveal
regression above.

## What to inspect

Open `http://localhost:8000/reader/solve-fractional-linear/` and choose **Steps →
Multiply both sides by two**. Read the caption over `x/2 = 4`, scroll through the
multiplication, then keep scrolling: the equation holds and the next caption
first appears very faintly near the bottom of the card. The old caption stays
fully opaque and moves upward at a fixed distance ahead of it, disappearing only
past the card edge. The incoming caption brightens only as it reaches the
caption region. The next
operation waits until that new explanation settles. Reverse through the
exchange and drag the scrollbar to check direct navigation.

Use Cmd+F for **A factor of two enters on each side** from a different step.
The actual passage should appear above the equation at its source state.
Close Find and continue scrolling in either direction. Also try **Read all**.
Judge whether the faint text provides anticipation without distracting from
the current explanation, and whether the closer prose/math alignment reads well.

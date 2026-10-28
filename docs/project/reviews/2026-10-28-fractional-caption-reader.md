# Document-backed captions for the fractional reader

Status: implemented local candidate; human reading and native Cmd+F review pending.

The user prefers explanations that behave like closed captions: remain still
and fully visible during the operation, then leave without a fading transition.
Native search and ordinary document scrolling are explicit requirements. This
supersedes the local rising/fading presentation in
[the preceding experiment](2026-10-28-fractional-rising-passages.md), not its
mathematical programs or the broader reader architecture.

## Authority and scope

- Canonical host: `/reader/solve-fractional-linear/`.
- Canonical artifact and mathematical source:
  `src/semantic/fractional-linear-equation-asset.ts`.
- Rendering remains the existing mixed native KaTeX/material and legacy
  introduction path. No new equation renderer, copied equation, motion motif,
  semantic state, or clock is introduced.
- Rollback unit: this caption candidate commit. Its local layout/geometry
  adapter and reader hooks can be reverted together. Other lessons do not adopt
  the caption presentation. Print lifecycle protection is a reader-host fix.
- Promotion requires human acceptance here, followed by one structurally
  different caller. No format-wide rollout or pedagogical effectiveness claim.

## Behavior

The stage retains the available-height midpoint divider, bottom-aligned math,
current dark palette and existing typography. One caption appears just below
the divider. It stays fixed and fully opaque while scrolling advances the
equation. There is no text fade, entrance movement, or automatic playback.

Each operation gets 14% of available-height scroll distance for reading, 32%
for its unchanged mathematical program, and 10% for a result hold. The caption
then disappears until the next step. These distances are local visual choices,
not reusable timing policy. Reverse motion samples the same geometry.

All explanations remain their original HTML nodes, in document order. Stable
in-flow step slots own scroll measurement; pinned caption rectangles cannot
change the semantic clock during resize or search. The Steps menu opens an
instruction before its operation. Existing mathematical progress and local
`kpReading` URL coordinates preserve reading positions within holds.

Inactive captions use `hidden="until-found"`; the native `beforematch` event
reveals the actual authored node and aligns its slot with the corresponding
source equation. No key is intercepted and no search UI is reimplemented.
**Read all** exposes every passage in flow, including for assistive-technology
reading. Browsers without `beforematch` support default to that mode, preserving
searchability rather than hiding unsupported content. Print exposes all prose;
without JavaScript the original static document remains.

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

These are runtime lifecycle guards, not claims that types prove browser geometry
or that every browser/search implementation behaves identically.

## Verification

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run typecheck
```

Pure geometry checks cover reading holds, motion intervals, result holds,
caption withdrawal, reverse sampling, inverse seeks and invalid measurements.
The scoped Chromium check covers 1280×900 and 390×844 layouts, fixed/full-opacity
text, clean withdrawal, exact rewind, held-position reload, menu navigation,
native scrolling, keyboard scrolling, document mode, print return and static
fallback. An unsupported-capability simulation checks that prose stays exposed.
The 41-sample equation smoke protects direct/forward/reverse paint and the
previous duplicate-owner repairs. Full typecheck includes app, tools, tests,
Svelte and domains. These checks passed for this candidate; screenshots were
inspected at both viewport sizes. No cross-browser promotion is claimed.

Search evidence is deliberately split: Chromium `window.find()` locates an
inactive explanation, but does not invoke its native Find toolbar's reveal
algorithm. Actual fragment navigation exercises `beforematch`, reveals the
matching original node and synchronizes the equation. This is not an automated
end-to-end Cmd+F toolbar test. Native toolbar search, repeated matches and
Safari/Firefox behavior remain manual review items; do not call them certified.

## What to inspect

Open `http://localhost:8000/reader/solve-fractional-linear/` and choose **Steps →
Multiply both sides by two**. Read the caption over `x/2 = 4`, scroll through the
multiplication, then keep scrolling: the result holds and the caption clears
without fading. Reverse and drag the scrollbar to check direct navigation.

Use Cmd+F for **A factor of two enters on each side** from a different step.
The actual passage should appear beneath the equation at its source state.
Close Find and continue scrolling in either direction. Also try **Read all**.
Judge the caption rhythm and whether native search feels like a normal document.

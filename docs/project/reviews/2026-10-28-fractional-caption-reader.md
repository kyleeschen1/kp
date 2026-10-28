# Document-backed captions for the fractional reader

Status: user accepted the card and confirmed Cmd+F works; revised alignment and
approaching-text preview await visual review.

The user prefers explanations that behave like closed captions. The latest
revision addresses the missing anticipation: captions sit above the equation
on a phone-width card. The user found the rail unhelpful; a faint approaching
caption now supplies anticipation directly.
Text remains still during its operation, then rises and evaporates as the next
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

The latest local candidate uses a centered card up to 440px wide. Its charcoal
surface, `#202222`, comes from `src/experiments/matrix-theme.css`, with a darker
neutral page (`#181a1a`) replacing the blue reader background. Mathematical ink
and typography remain unchanged. The caption is bottom-aligned six pixels above
a grey rule. The native equation renderer uses a compact 96px workspace at the
top of its region, retaining its existing fit and motion clearance. The rail
and its labels are removed. The final caption remains with the solved equation.

Each operation gets 14% of available-height scroll distance for reading, 32%
for its unchanged mathematical program, then holds its result. The final 18%
of available-height scrolling before the next instruction exchanges captions.
During the preceding 8%, the next heading peeks up to 18px into the text region,
at up to 12% opacity, while the current caption stays fully legible. The outgoing
text then rises up to 24px and fades as the incoming copy rises the remainder
of its own height and becomes solid. The fixed text region clips both copies
above the divider, preventing preview text from entering the mathematics.
Both captions are never at full reading contrast together. The equation holds
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
preview anticipation before departure, held math throughout caption exchanges, inverse seeks and
invalid measurements. The scoped Chromium check covers 1280×900 and 390×844
cards, six-pixel caption alignment, math near the top of its region, the restored charcoal, exact reverse sampling
during both halves of an exchange, held-position reload, menu navigation,
native scrolling, keyboard scrolling, document mode, reduced motion, final
completion, print return and static fallback. An unsupported-capability
simulation checks that prose stays exposed.
The preview check also verifies inert/hidden accessibility, absence of copied
IDs, and native reveal of the complete original while its faint copy is visible.
The 41-sample equation smoke protects direct/forward/reverse paint and the
previous duplicate-owner repairs. Full typecheck includes app, tools, tests,
Svelte and domains. These checks passed for this candidate; screenshots were
inspected at both viewport sizes. No cross-browser promotion is claimed.
The previous smoke palette assertion was updated from Nocturne blue to the
user-requested neutral page; all mathematical ink and paint-ownership assertions
remain. This is an explicit presentation change, not a waived failure.

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
first peeks faintly above the divider. The old caption rises away as the new
one materializes, entirely inside the text region. The next
operation waits until that new explanation settles. Reverse through the
exchange and drag the scrollbar to check direct navigation.

Use Cmd+F for **A factor of two enters on each side** from a different step.
The actual passage should appear above the equation at its source state.
Close Find and continue scrolling in either direction. Also try **Read all**.
Judge whether the faint text provides anticipation without distracting from
the current explanation, and whether the closer prose/math alignment reads well.

# Real document passages around one equation stage

Status: local candidate awaiting visual review. Implements the user-approved
[document-flow direction](../2026-10-28-document-flow-passages.md). It supersedes
the simulated passage travel in [the caption candidate](2026-10-28-fractional-caption-reader.md),
not the equation programs or semantic model.

## Canonical boundary

Host: `/reader/solve-fractional-linear/`. Semantic asset:
`src/semantic/fractional-linear-equation-asset.ts`. The existing native
KaTeX/material compositor and legacy introductions still own mathematical paint.
This changes one local compiler shell, CSS layout and reader geometry adapter.
The rollback unit is the candidate commit with its focused checks. No other
lesson or general authoring format adopts it.

## What changed

All seven original paragraphs now occupy their real place in the article list.
None is hidden, cloned, translated or faded. The old preview copy and empty
scroll slots are removed. Native sticky positioning holds a paragraph within
its own containing block. A block has an explicit read/action/inspection scroll
allocation; after that it releases into ordinary document scrolling. The next
paragraph starts below the viewport until the previous hold has finished.

One equation surface stays mounted beside that list in the same grid column.
It holds its mathematical result while the next paragraph approaches, and
releases into the document after the last result's inspection interval.
Text may cross the held equation during natural travel; there is no new opacity
effect or collision-avoidance animation. Judge this encounter at the checkpoint.

The framed region centers in the viewport below the header. Its interior uses
the maximum measured paragraph height, a stable gap and the existing 82px math
workspace. Shorter paragraphs share a bottom reading line. Changing the active
paragraph does not move the equation. A bounded ResizeObserver watches the seven
prose boxes; font/wrapping changes invalidate layout through the existing host.
Stable beat containers, not the moving sticky paragraph rectangles, supply the
document anchors. This prevents a paragraph from moving its own scroll clock.

The six operation sliders still project exact rendered progress. Their native
mouse and keyboard inputs seek the selected operation's interval, including
its repeated source state. Resize preserves that passage's ownership rather
than selecting the earliest occurrence of an identical equation. Read all
collapses the holds into a compact transcript and returns to the selected
paragraph; its navigation remeasures before restoring the position.

The existing Nocturne palette, 15px prose, smaller math, semantic reference
styling and grey side rails remain. This does not install Gill Sans or change
mathematical fonts. Headings remain metadata/navigation labels.

The next chrome revision moves the existing bound Motion control into the
toolbar's Steps menu. Its preference owner, persistence and accessibility label
remain the same. The theater heading no longer paints controls. The rails are
now 1px at 45% of the muted palette color, with 10px inward ends and slight corner
rounding. They are CSS decorations and add no measured elements or runtime loop.
The scoped browser check exercises the relocated control on desktop and phone;
captures of the bracket rails and menu were inspected. App/tools type checks pass.

## Theater sizing and measurement audit

The current container adapts to the measured maximum prose height, but reserves
an explicit **82px mathematical workspace** and a minimum 320px overall frame.
It is not yet a general container for composed scenes. The next useful boundary
is a renderer-supplied scene footprint, including its motion clearance, consumed
by the theater together with prose and controls. Reserve stable bounds through
an operation; avoid resizing the theater to individual moving glyphs. Invalidate
those bounds for content/font/available-width changes, not ordinary playhead
updates. Broader sizing work is a recommendation, not implemented here.

The committed diagnostic now counts `getBoundingClientRect` calls without adding
layout reads. Run:

```sh
npm run visual:fractional-linear-equation -- --performance --base-url=http://127.0.0.1:8000
```

One local Vite/headless Chromium run, four complete forward/back traversals:

| Counter | After startup | After four traversals | After 3s idle |
| --- | ---: | ---: | ---: |
| Paragraph bounds reads | 42 | 42 | 42 |
| Beat-container bounds reads | 28 | 28 | 28 |
| All bounds reads | 519 | 26,173 | 26,173 |
| Browser layout count | 76 | 9,467 | 9,467 |
| Scroll-geometry rebuilds | 4 | 4 | 4 |
| Canonical session builds | 0 | 53 | 53 |

The last three traversals each added 6,289 bounds reads, 2,312 browser layouts and
13 canonical session builds. Thus the prose adapter does not continuously
remeasure while scrolling, but the wider rendering path still does substantial
geometry work. A bounds read is not necessarily a forced layout; these counters
must not be equated. The diagnostic counts the whole page, so it does not assign
every read to a particular compositor function or prove all reads avoidable.
There were no additional bounds reads/layouts in the final idle window.

This was instrumented development Chromium, alongside other local checks.
Timing is not presented as a production benchmark or before/after improvement.
The next performance investigation should attribute the compositor preparation
and transit reads, preserve native ownership/reversal, and measure whether
cached footprints can remove work. Do not blindly enable a cache; an earlier
cache experiment broke reverse geometry, as recorded in the preceding review.

The agreed focus-threshold/crossfade and below-stage operation-slider design
remains a separate pending presentation change. Sliders should be associated
explicitly with animation-bearing passages; paragraph order alone is not the
general authoring rule. This chrome pass does not claim that promotion.

## Search, lifecycle and cost

Native search now operates on exposed original prose without hidden-until-found
reveal handling. The browser check locates an inactive paragraph with
`window.find()` and exercises fragment navigation; it does not automate the
browser's Cmd+F toolbar. Read all, print and no-JS still expose the complete text.
Persisted pagehide retains the runtime. Disposal disconnects the observer and
removes the local slider/navigation listeners.

There is still one mathematical clock and one equation surface. Caption cloning
and per-scroll text transforms/opacity writes are gone. No new renderer or
perpetual animation loop is added. This is an implementation accounting, not a
measured frame-time or memory improvement. The earlier tab-crash cause remains
unknown. The font-pressure check enlarges an existing paragraph to 22px; it is
not certification of arbitrarily long passages or all browser zoom settings.

## Verification

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/fractional-passage-progress.test.ts tests/semantic-reader-fractional-linear-compiler.test.ts
npm run typecheck
npm run check:architecture
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run build:bundle
```

The seven focused tests cover unequal paragraph anchors, read/action/inspection
intervals, direct/reverse seeks, all operation slider intervals, invalid geometry
and compiler shape/static semantics. The browser check covers desktop/phone
centering, native sticky presence, held prose, delayed next arrival, stable math,
reverse placement, click/drag/keyboard inputs, source-state reload, font reflow,
native find, transcript return, final release, reduced motion and print/no-JS.
The existing 41-sample smoke preserves equation paint at direct and forward/reverse
positions. Screenshots are disposable; evidence is the committed entrypoint.
These checks passed. The scoped document-flow browser check also passed against
the production preview on port 8011, including a compact no-JS transcript without
the animation hold distances. Desktop, phone and enlarged-prose captures were
inspected. No cross-browser promotion or new performance benchmark is claimed.

The first architecture run found four local deep imports, including two from
the preceding slider revision. These now use the existing learner runtime API;
it reexports the scroll sampler from the already-reachable clock module. The
architecture rerun passed without an exception or changed budget.

## What to inspect

Open `http://localhost:8000/reader/solve-fractional-linear/` with no saved query.
Scroll from the introductory document into the framed region. It should sit in
the center of the available viewport; prose should settle above the equation.
Choose **Steps → Multiply both sides by two**, then scroll slowly. Its paragraph
stays still as the slider fills and the operation runs. Keep scrolling through
the result hold: the paragraph eventually leaves normally and the next actual
paragraph approaches from below. Reverse and use the slider to inspect the same
operation. The shorter final paragraph should not reposition the equation.

Continue past `x = 8` into the closing document and rewind into the region.
Try Cmd+F for **The same x remains**, plus Read all and return. Judge whether
arrival now feels natural, whether the hold is too long, and whether the
paragraph crossing the held stage is comfortable. Those are open visual
questions, not outcomes established by passing automated checks.

# Theater focus candidate and performance audit

The behavior-first scope is recorded in
[the approved proposal](../2026-10-28-theater-focus-and-audit.md). This review
supersedes the unchanged-opacity/delayed-arrival parts of
[the document-flow candidate](2026-10-28-document-flow-passages.md).

## Local visual candidate

Canonical host: `/reader/solve-fractional-linear/`. Semantic authority remains
`src/semantic/fractional-linear-equation-asset.ts`; existing native KaTeX/material
and legacy introduction paths retain mathematical paint. Only the local reader
shell, scroll adapter, controls and verification change. No catalog promotion.
The behavior commit is the independently reversible rollback unit.

Real document paragraphs approach at 12% opacity. Their tops crossing the stage
workspace's upper boundary drive a 24px smooth focus ramp; the preceding
paragraph fades inversely. Both retain native flow and constant separation
while exchanging. These thresholds are provisional visual choices. Math holds
its result during that exchange; there is no extra blank inspection hold.

One native range below the 82px workspace has a 1px track, 4px thumb and 24px
interaction area. Only explicitly associated operations own it. The local
compiler checks those associations against the semantic transformation sequence;
an unbound comment may retain a result but cannot silently advance an operation.
Invalid or mismatched associations fail at compilation. This is not a new
general-purpose narrative schema. The control dissolves over 24px after the
operation ends and becomes hidden/disabled; reversing restores it. Its exact
interval keeps keyboard input and source-state reload attached to the operation.

Emphasis derives from cached paragraph geometry and scroll position; no new
per-frame bounds reads or independent animation clock. Read all, print and no-JS
show complete prose. Native search uses original paragraphs. The fixed 82px
workspace remains a limitation for future composed scenes.

## Behavior verification

Passed: 11 focused tests for compile-time associations, source/result intervals,
comments between operations, complementary focus, direct/reverse projection,
invalid geometry and existing compiler semantics. Commands:

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-theater-focus.test.ts tests/fractional-rising-scroll.test.ts tests/fractional-passage-progress.test.ts tests/semantic-reader-fractional-linear-compiler.test.ts
npm run typecheck
npm run check:architecture
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8000
npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000
npm run build:bundle
npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8011
```

Desktop/phone checks cover focus reversal, fixed paragraph separation, slider
placement and ownership, click/drag/keyboard, reflow, native find, transcript,
release and static/print fallbacks. The 41-sample equation-paint smoke has zero
failures. The production preview also passes the focused behavior check.
Phone crossfade capture inspected: text still crosses the held equation during
arrival. Whether the focus threshold makes that overlap comfortable needs human
judgment; passing checks do not establish aesthetic quality.

## What to inspect

Open `http://localhost:8000/reader/solve-fractional-linear/`. Choose **Steps →
Multiply both sides by two**. Scroll through the operation: its slider sits
below the equation, dissolves after completion, and the next paragraph enters
from below. At the stage boundary it should rapidly come into focus while the
old paragraph fades. Reverse through that exchange, try the slider, then use
**Read all** or Cmd+F for **The same x remains**. The introductory observation
has no slider. Judge the threshold, translucency and prose/math overlap.

## Performance audit

Pending the independently authorized second slice; no performance improvement
is claimed from the visual change or static accounting above.

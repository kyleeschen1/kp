# Fraction notebook scrolling diagnosis

Date: 2026-11-26
Scope: explanation and measurement only; no application or choreography changes.

The user reports stuttering mainly while scrolling the fraction notebook, before
discussing a new scrollytelling format. This investigation does not activate the
proposed reusable stage or change the current graph review commitment.

## Canonical surface and ownership

- Host: `/experiments/fraction-notebook/`, with its persistent
  `/reader/fraction-notebook-preview/?surface=window` iframe.
- Semantic source: `content/authoring/algebra/fractional-linear-reasoning.article.md`
  and its checked fractional-linear model/compiler. Notebook JSON owns editorial
  content; ProseMirror is not the equation animation clock.
- Renderer: the existing native KaTeX/material equation compositor in the reader.
  This is not the direct-WebGL graph pilot.
- Scroll authority: `src/reader/runtime/continuous-scroll-clock.ts`, with passage
  geometry from `src/reader/app/document-theater-scroll.ts` and cadence from
  `src/reader/preparation/document-passage-cadence.ts`.

## Observed contributors

The animation samples scroll position directly. Each operation receives 32% of
the available viewport height, after a reading hold. The editor's inline iframe
is 480 CSS pixels tall at the tested desktop viewport, compressing that travel.
This makes the same scroll gesture advance the animation about 1.75 times as far
as in the standalone reader. Browser-supported scroll positions also limit the
distinct intermediate samples in short portions of a transformation.

Local headless Firefox and Chromium, 1280 × 900 outer viewport, no CPU throttling:

| Host | Actual inner viewport | Scroll travel per operation | Travel through sampled moving portions |
| --- | --- | --- | --- |
| Standalone reader | 1280 × 900 | about 269 px | 45–48 px |
| Notebook reading mode | 640 × 832 | about 266 px | 45–48 px |
| Notebook inline editing mode | 406 × 480 | about 154 px | 26–28 px |

The sampled portions were cancellation, evaluation and denominator interiors,
each traversed over 1.2 seconds, first and repeat visits. These interior portions
are not whole transformations. In the inline editor they produced about 25–26
paint changes over about 72 animation-frame callbacks, tracking the actual
integer scroll changes. Callback cadence stayed regular; a regular callback does
not imply a new mathematical pose or a newly presented frame.

There is also foreground preparation on entering unprepared transitions:

- Firefox inline editor: evaluation 54 ms, denominator 61 ms. Most recorded cost
  was the material-session mount phase (47 and 55 ms respectively).
- Chromium inline editor: evaluation about 37 ms, denominator about 54 ms; mount
  accounted for about 31 and 42 ms respectively.
- Those repeat entries needed no session rebuilds. Cancellation had already
  benefited from preparation in both notebook runs.
- Every measured moving interior had zero session builds and zero scroll-geometry
  remeasurements. No callback interval exceeded 33.4 ms in these unthrottled
  interiors; the 95th percentile was about 17–18 ms in both browsers.

The separate existing standalone motion-cost check also ran at normal and 4× CPU
throttling. Normal operation interiors had no callback gaps over 33.4 ms; the
throttled repeat run included an isolated 234 ms gap. That broader load sensitivity
does not establish the cause of the user's notebook report.

## Interpretation and limits

Compressed direct scroll mapping and occasional first-entry preparation are
demonstrated contributors. They explain a plausible combination of stepped motion
and brief entry hitches. The exact proportion in the user's physical wheel or
trackpad experience is not established by controlled headless scroll sweeps.
Reading holds are intentional; not every pause is a dropped frame.

The sampled interiors do not support a claim that the notebook rebuilds KaTeX or
its whole layout on every scroll frame. They also do not certify every operation,
asynchronous browser presentation, outer-editor scrolling, or arbitrary device
load. No evidence here justifies replacing the renderer or blaming iframes as a
category.

For the forthcoming format, separate the animation's readable scroll distance
from a small embed's height, and prepare reusable transitions before the gesture
needs them. Whether to add playhead smoothing is an interaction choice: it adds
lag and needs deliberate reverse/stop behavior. These are recommendations, not
implemented or approved changes.

## Reproduction

Stable read-only diagnostic commands (reports are disposable under
`tmp/codex/fraction-notebook-scroll/`):

```sh
npm run visual:fraction-notebook-scroll -- --browser=firefox
npm run visual:fraction-notebook-scroll -- --browser=chromium
npm run visual:fractional-linear-equation -- --base-url=http://127.0.0.1:8000 --motion-cost --label=scroll-diagnosis
```

All three commands completed successfully; `npm run typecheck:fraction-notebook`
also passed with the new diagnostic included. No production source was changed.

In the live notebook, compare the same fraction step in inline editing mode and
reading mode using a similar scroll gesture, then revisit it in reverse. Look
for faster traversal in the short embed versus a hitch that disappears after the
first visit. This comparison diagnoses the two effects; it is not a new visual
acceptance gate.

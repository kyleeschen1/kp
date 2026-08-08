# Economics learner-route startup attribution

Date: 2026-08-08

Status: diagnostic evidence for `r02` of
`run-contract.kp.motion-passage-independent-infrastructure-v4`. This report
changes no product behavior and does not approve the provisional stacked
layout.

## Measurement

Command:

```text
npm run performance:economics-demand-shift-tutorial
```

Route:

```text
/tutorials/economics/demand-shift/?layout=two-column-scroll
```

The production build and scoped Chromium harness are reproducible enough to
locate the startup debt. The strict startup gate currently fails, while all
active-motion and layout-stability measurements pass.

| Metric | Current | Budget | Result |
| --- | ---: | ---: | --- |
| Initial transfer | 255,232 B | 250,000 B | 5,232 B over |
| Initial script transfer | 152,720 B | 150,000 B | 2,720 B over |
| Resources | 42 | 42 | pass |
| Startup longest task | 180 ms | 150 ms | 30 ms over |
| Cumulative layout shift | 0 | 0.02 | pass |
| Active-frame p95 | 34.7 ms | 42 ms | pass |
| Active long tasks | 0 | 100 ms maximum | pass |
| Geometry reads per active frame | 2.07 | diagnostic | stable |
| SVG strings/subtree replacements | 0 / 0 | 0 / 0 | pass |

Compared with the immediately preceding checkpoint (254,981 B transfer,
152,664 B script, 147 ms startup task), transfer changed by 251 B and script by
56 B. The 33 ms longest-task change is sampled cold-start variance; it remains
a real gate failure, but is not evidence that the exemplar made active motion
more expensive.

## Network attribution

The browser reports the following initial transfer by initiator. The remaining
1,003 B is the HTML navigation response.

| Initiator | Transfer |
| --- | ---: |
| Script | 152,720 B |
| CSS-loaded assets (fonts) | 64,680 B |
| Stylesheets | 36,829 B |

The route loads Source Serif 4 Light (21,068 raw bytes) plus the two KaTeX font
files needed by the compiled lesson (42,712 raw bytes). This is a bounded font
set, not the full KaTeX font inventory shown by the whole-build manifest.

The loaded stylesheet set is nevertheless broad:

| Stylesheet | Raw asset size |
| --- | ---: |
| Economics tutorial entry | 76,945 B |
| Shared `styles.css` output | 84,149 B |
| KaTeX CSS | 28,835 B |
| Tutorial scrub-bar CSS | 3,692 B |

Raw asset sizes explain ownership and relative weight; they must not be added
to the compressed transfer measurement.

## JavaScript attribution

The route's loaded raw JavaScript is concentrated in a few boundaries. The
largest named chunks are:

| Chunk | Raw asset size | Why it is present now |
| --- | ---: | --- |
| Economics tutorial entry | 183,398 B | Svelte presenter and route orchestration |
| Economics retained math | 90,519 B | retained graph semantics and projection |
| Tutorial core | 88,872 B | shared lesson runtime and navigation |
| Graph SVG viewport | 43,097 B | retained SVG surface |
| Animation player controller | 25,641 B | catalogue/player preparation path |
| Diagram SVG adapter | 19,992 B | broad animation surface path |
| Bootstrap | 18,534 B | shared application bootstrap |
| Asset runtime | 16,015 B | broad animation asset path |
| Economics equilibrium adapter | 13,545 B | economics projection |
| Asset transformation | 12,319 B | broad animation asset path |
| Sampled frame envelope | 11,361 B | player sampling path |
| Runtime sampler | 10,517 B | player sampling path |
| Gestalt base styles runtime | 10,482 B | broad visual runtime path |
| Animation player shell | 9,796 B | catalogue/player preparation path |

The route also loads the 1,197 B
`animation-catalogue-player-host` chunk. Its small direct size understates the
dependency path it selects: the learner entry currently calls
`createKpAnimationCatalogueSelectionPreparationService`, which brings player,
asset, sampler, adapter, and catalogue-oriented modules into startup.

## Conclusions and ordered response

1. Do not optimize the retained graph clock first. It already avoids SVG
   reconstruction, subtree replacement, duplicate clocks, active long tasks,
   and layout shift.
2. Publish narrative and stage truth as static light DOM before mounting the
   presenter (`r03`-`r05`). This creates a smaller enhancement boundary without
   weakening Cmd+F, indexing, no-JS reading, or direct links.
3. Split tutorial-foundation CSS from application-global CSS (`r06`), then
   separate graph-domain styles from the economics lesson shell (`r07`). The
   current economics file is close to its 77 KB raw budget and the route also
   pays for an 84 KB shared stylesheet.
4. Replace catalogue selection preparation on this fixed learner route with a
   route-local presenter/runtime seam (`r08`). This is the clearest path to
   removing catalogue/player/asset closure without changing the semantic graph
   model.
5. Keep server-compiled KaTeX and audit only the fonts and theme bootstrap that
   the first paint needs (`r09`). Runtime KaTeX JavaScript is already absent.
6. Re-run the same production gate in `r10`. Accept no budget increase hidden
   behind renamed chunks, and keep CodeMirror/Vim lazy and outside learner
   startup.

This evidence does not establish that pages with multiple animations are
infeasible. The measured active path is cheap and retained; the excess is a
cold route-closure and publication-boundary problem.

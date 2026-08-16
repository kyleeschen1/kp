# KP Bundle Experience Baseline

This is the first deterministic baseline produced by
`npm run measure:bundle-experiences` against main-build manifest
`d8cd11a22bcd1b19695b42474989e83fe609ce00227addccc74fe0e35fccdd37`.
The command reports declared emitted resources, including fonts and assets;
script-only ceilings remain explicitly script-only.

| Experience | Entry total | Experience total | Incremental total |
| --- | ---: | ---: | ---: |
| Catalogue outer shell | 10,819 | 10,819 | — |
| Empty Svelte catalogue | 279,915 | 279,915 | — |
| Solve-x equation | 279,915 | 1,462,629 | 1,182,714 |
| Economics graph | 279,915 | 283,657 | 3,742 |
| Programming trace | 279,915 | 356,475 | 76,560 |
| Graph3D | 279,915 | 441,361 | 161,446 |
| Place-value addition | 279,915 | 495,191 | 75,026 |
| Internal Studio legacy host | 325,620 | 325,620 | — |

All figures are gzip bytes. The solve-x total includes KaTeX's declared font
catalogue, which is deploy-time ownership rather than evidence that browsers
fetch every font face. The place-value comparison uses solve-x as its explicit
selected-math base, preserving the prior 75,026-byte differential without the
old checker's implicit set subtraction.

Every positive and negative owner assertion passes. Place value remains 26
bytes above its unchanged 75,000-byte ceiling; slices 11–14 own attribution and
structural repair. `npm run check:bundle-experiences` therefore intentionally
remains red until that debt is removed.

# KP Post-Authoring Next-Step Review

Date: 2026-08-09
Status: accepted; payload recommendation complete, algebra recommendation next
Predecessor:
`2026-08-09-kp-article-v1-post-checkpoint-next-step-review.md`

## Evidence From The First Real Authoring Session

The frozen economics article has now been edited and saved through the real
whole-file CodeMirror/Vim path. The session exposed two integration defects,
not a grammar defect:

- the editor could appear under a client-only dev server even though source
  persistence requires the full authoring stack; and
- a valid `.kp.md` save updated derived publication artifacts but caused Vite
  to reload the entire reader page.

Both defects are repaired. The full-stack path exposes source saving, `:q` and
`:wq` close the modal with the expected save semantics, valid edits propagate
to the article, and a source save no longer reloads the page. A write-enabled
browser regression covers that boundary. The trial did not demonstrate a need
to reopen `kp.article.v1` or add speculative editor metadata.

## Candidate Order

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Recover the shared reader-route payload regression | 3 | 5 | 5 | 2 | Do next |
| Author a compact multi-step algebra article | 5 | 4 | 5 | 2 | Do immediately after payload recovery |
| Add advanced CodeMirror semantic/history tools | 4 | 2 | 4 | 4 | Wait for more observed friction |
| Resume economics layout discovery | 1 | 1 | 2 | 5 | Keep paused |
| Begin Internal Studio or Public Web | 3 | 2 | 3 | 5 | Wait for the second caller |

## Recommendation

Run one bounded infrastructure loop that restores the established reader-route
payload baselines without copying `kp-tutorial-core` into each route or
weakening static publication. This debt already affects every article reader,
so carrying it into the algebra caller would obscure the marginal cost of the
new article and make later performance diagnosis harder.

That bounded recovery is complete. Its measured result and verification are in
`2026-08-09-kp-article-v1-reader-payload-recovery-closeout.md`.

Then build one compact multi-step algebra article through the frozen contract.
It should pressure long prose, compact focus passages, multiple motion blocks,
KaTeX, semantic links, direct checkpoints, static publication, and whole-file
editing. Treat any requested grammar change as evidence to evaluate, not as an
automatic extension.

Only after economics and algebra should the project extract another shared
article/vignette seam or prioritize advanced semantic completion and structured
editor history. Layout selection, station extraction, split parity, floating
navigation geometry, Canvas/WebGL adapters, and platform work remain outside
the next two loops.

## Preservation Boundary

Preserve the frozen `kp.article.v1` grammar, one canonical economics source,
searchable static output, build-time KaTeX/MathML, direct navigation, the
framework-neutral animation runtime, invalid-draft recovery, and the no-reload
authoring save boundary. Do not fold the current user-authored economics prose
change into infrastructure work; it remains an independently reviewable
content edit.

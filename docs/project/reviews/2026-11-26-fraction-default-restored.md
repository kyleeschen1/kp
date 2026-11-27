# Restore the default fraction notebook scrolling

User requested returning to the original fraction presentation after rejecting
the compact layout and subsequent scroll-distance repair. Restore the known
reference rather than tune those experiments further.

Reference: `7b545a9ba` (Preserve document scroll pacing across viewport sizes),
before the rail/frame/commentary experiments. The notebook preview stylesheet,
document theater, scroll mapping, layout measurement, cadence, page shell and
reader entry now match that commit exactly. This restores the default bracket
pair, centered stage, reading holds, passage visibility and original scroll
spacing. Exact-checkpoint and independent annotation-fit repairs remain intact.

Authored manuscript text and saved notebooks are untouched by this rollback.
Unused optional renderer alignment support is retained; the restored caller
uses the original centered default. This is a presentation rollback, not a
mathematical or storage rollback.

Canonical artifact: fractional-linear manuscript and semantic asset. Host:
`/experiments/fraction-notebook/` and its persistent native KaTeX preview iframe.
Reload that page to discard old live handlers. Scroll through cancellation and
the final answer in either reading or editing mode; the behavior should match
the original fraction notebook.

Verification: exact Git comparison against the seven reference files;
`npm run typecheck:fraction-notebook`; 23 focused notebook, scroll, page-shell
and exact-checkpoint tests; default scrolling browser checks via
`npm run visual:fraction-flow -- --project=firefox` and mathematical/bracket
checks via `npm run visual:fraction-ridge`. Detailed results live with the task.

Automatic approval review rejected an initial broader restore that included
authored content and equation-renderer files. The subsequent approved operation
was narrowed to the audited presentation/scroll files; no content rollback or
permission bypass was performed.

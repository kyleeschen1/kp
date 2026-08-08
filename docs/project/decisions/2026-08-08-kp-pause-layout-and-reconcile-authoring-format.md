# Pause Layout Discovery And Reconcile The Authoring Format

Date: 2026-08-08
Status: accepted

## Decision

Pause economics motion-passage layout discovery. The stacked, split,
two-column, and inline-sticky experiments remain available as evidence, but no
layout is selected, promoted, generalized, or refined as the current next
action. The delayed layout-decision slice closes as skipped rather than being
treated as visual approval or rejection.

Before extending the lesson editor, reconcile the author-facing source model.
The repository currently exposes three overlapping representations:

1. `content/lessons/economics-demand-shift.md` contains the full article and
   concise structural metadata in HTML comments such as
   `<!-- kp:passage ... -->`;
2. `content/lessons/economics-demand-shift-two-column.json` owns the six
   layout-specific editable passages and uses Markdown links such as
   `[$P$](kp-ref:price-axis-inline)` inside prose;
3. the CodeMirror whole-buffer view synthesizes typed JSON directives inside
   HTML comments, including `kp:lesson`, `kp:motion-passage`, and
   `kp:semantic-reference` records.

That synthesized buffer is safe and deterministic, but it is not the compact,
readable authoring surface previously discussed. In particular,
`::kp-link`-style syntax is not implemented. Do not normalize future content
around the current JSON-in-comment form merely because it exists.

## Next Decision

Prepare a bounded authoring-format review that chooses one article-level
canonical source and answers:

- how prose, headings, lists, and KaTeX remain ordinary readable Markdown;
- how semantic object links are written inline;
- how passages, motion blocks, stages, and other typed metadata are expressed
  without overwhelming the document;
- which metadata should be inline, in compact directive blocks, or derived;
- how CodeMirror autocomplete, diagnostics, saving, and static compilation all
  operate on that same source rather than a layout-specific shadow document.

Do not migrate syntax or alter persistence until that format is explicitly
reviewed. Preserve the completed static-publication, semantic-ID, navigation,
editor-session, accessibility, and performance infrastructure.

## TOC Status

The economics route already publishes a complete `kp-tutorial-toc` in static
HTML. On wide viewports it is fixed to the left; at intermediate widths it is
inline after the lesson introduction; on phones it is the native
`In this lesson` disclosure. Its hierarchy contains article sections and
motion-block starts, not scrub moments. Final floating geometry remains
deferred with the rest of layout discovery.

## Roadmap Effect

This pauses the motion-passage presentation frontier without changing the
animation-library promotion order. Authoring-format convergence becomes the
next reviewable question for this workstream; it is a design review, not an
implementation authorization.

## References

- `../reviews/2026-08-08-motion-passage-independent-infrastructure-closeout.md`
- `../threads/explanation-attention.md`
- `../principles/motion-passage-vocabulary.md`


# Adopt The KP Article V1 RC1 Authoring Contract

Date: 2026-08-08
Status: fulfilled; superseded by the frozen v1 contract

## Outcome

The economics exemplar passed its human checkpoint on 2026-08-09. The
candidate was promoted without broadening its grammar to `kp.article.v1`, and
the temporary importer, writable Markdown/JSON duplicates, compatibility
compiler, passage-buffer draft model, and legacy source-save endpoint were
retired. The frozen contract is
[`../principles/kp-article-v1.md`](../principles/kp-article-v1.md); this file
remains the historical adoption decision and proof plan.

## Decision

Adopt `kp.article.v1-rc1` as KP's provisional canonical article format. Prove
the contract with one economics article before freezing `kp.article.v1` or
migrating other lessons.

One Markdown file owns one complete publishable article. Ordinary prose,
headings, lists, fenced code, and TeX remain readable Markdown. Sparse typed
directives identify only stages, passages, focus changes, and motion. Standard
Markdown links with the `kp-ref:` scheme address semantic objects. Reusable
animation semantics and choreography remain external, versioned vignettes;
article instances supply local prose and select named transitions.

The complete provisional grammar and compilation contract live in
`../principles/kp-article-v1-rc1.md`.

## Authority Boundaries

- Markdown owns approved reader-visible prose and sparse semantic
  associations.
- Vignettes own reusable objects, checkpoints, transitions, defaults, static
  figures, and structural accessibility descriptions.
- Framework-neutral typed modules own executable behavior. Canonical articles
  cannot execute JavaScript, Svelte, MDX, or raw HTML components.
- A typed intermediate representation and source map are derived artifacts,
  never a second writable source.
- Layouts are projections. Article syntax cannot prescribe sticky behavior,
  viewport anchors, columns, rows, slides, or scroll mechanics.
- Prompts, model runs, confidence, review history, and invalid drafts live in
  sidecars keyed by stable document and block identities.

## Required Proof

Use the economics demand-shift article as the single RC1 exemplar. The proof
must cover raw authoring, CodeMirror, static Markdown/HTML, server-rendered
KaTeX and MathML, interactive projection, deck projection, direct links,
search, validation, accessible fallback, and the source-noise budget. Existing
economics presentation behavior is the preservation reference; this decision
does not reopen layout discovery.

Promote RC1 to `kp.article.v1` only after human review of that exemplar.
Compatibility readers are temporary migration tools and may not establish a
second writable truth.

## Sequence

1. Record the RC1 specification and golden source example.
2. Implement the already queued universal development toolbar.
3. Build the parser, validator, IR, static compiler, and editor-language slice.
4. Migrate the economics article through a temporary legacy importer.
5. Review every required projection and authoring surface.
6. Freeze `v1`, then retire migrated writable duplicates and consider broader
   migration.

## Explicit Deferrals

- no lesson-layout selection or choreography redesign;
- no arbitrary executable article blocks;
- no prose transclusion in RC1;
- no explicit sequence or slide directives;
- no second lesson migration before the economics checkpoint;
- no Public Web, Public Editor, or Svelte-owned animation runtime;
- no catalogue-wide animation or salience generalization.

## References

- `2026-08-08-kp-pause-layout-and-reconcile-authoring-format.md`
- `2026-08-08-kp-universal-dev-toolbar-queue.md`
- `../reviews/2026-08-08-authoring-format-convergence-next-step-review.md`
- `../principles/kp-article-v1-rc1.md`

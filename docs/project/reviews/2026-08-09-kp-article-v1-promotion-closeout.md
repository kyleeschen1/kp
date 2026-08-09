# KP Article V1 Promotion Closeout

Date: 2026-08-09
Status: complete
Contract: `run-contract.kp.article-v1-rc1-economics-exemplar-v2`

## Outcome

The human-approved economics release candidate is now the frozen
`kp.article.v1` authoring contract. One canonical file,
`content/lessons/economics-demand-shift.kp.md`, owns the economics prose and
sparse semantic associations. Its lockfile owns exact vignette resolution.
All reader, deck, static, interactive, accessibility, and editor projections
derive from that authority.

## Retired Compatibility Surface

- the writable legacy economics Markdown and two-column JSON sources;
- the migration-only RC1 importer;
- the old Markdown compatibility compiler;
- the synthesized passage-buffer/draft/semantic-index stack;
- the JSON lesson-source client, store, HTTP adapter, and configuration;
- editor plumbing that rebuilt the discarded draft model merely to retain a
  selected passage ID.

The development editor now edits the complete canonical article through one
`KpArticleDraftSession` and one `/api/kp/article-source` capability. The old
lesson-source endpoint remains absent and is covered by the canonical adapter
test.

## Frozen Boundary

- four closed directives: `kp-stage`, `kp-passage`, `kp-focus`, `kp-motion`;
- standard Markdown plus build-time TeX and `kp-ref:` semantic links;
- one typed article IR and source map;
- exact-version vignette locks and on-demand interaction manifests;
- framework-neutral compilation and language services;
- layouts remain projections and cannot add authoring syntax;
- no MDX, Svelte authority, executable article blocks, or prose transclusion.

The complete normative contract is
[`../principles/kp-article-v1.md`](../principles/kp-article-v1.md).

## Release Evidence

The promotion slice passed the v1 article suite, economics publication and
runtime suite, canonical source-save tests, TypeScript/Svelte/domain checking,
architecture and promotion-memory gates, generated-publication determinism,
the full repository test suite, production build/closure checks, and the
economics browser/editor/accessibility/performance checks recorded in Theseus.
The economics source remains inside the accepted authoring-noise budget.

The production economics profile remains within its deterministic publication
and active-motion budgets: 143,940 transfer bytes, 104,572 script bytes, 31
initial resources, zero layout shift, 1.5 ms active p95 updates, and no active
long task. One cold Chromium sample reported a 162 ms initial long task before
an immediate repeat measured 88 ms. That host-sensitive startup variance is
recorded rather than treated as a product regression or hidden by widening the
budget.

The separate repository-wide reader-route budget audit remains red because an
older shared `kp-tutorial-core` manual chunk adds roughly 29–33 kB gzip to each
reader route. That debt predates this promotion slice and does not alter the
economics Article v1 release decision, but it should be repaired before article
infrastructure is rolled out broadly.

## Next Recommended Work

1. Perform one real economics authoring session in the whole-file editor and
   record friction without changing the v1 grammar reflexively.
2. Fix defects revealed by that session through language-service or editor
   affordances when possible.
3. Recover the shared reader-route payload baselines without moving tutorial
   runtime ownership back into individual routes.
4. Pressure v1 with one compact multi-step algebra article as the first
   structurally different caller.
5. Generalize article infrastructure only where economics and algebra prove a
   shared boundary.

Layout discovery, shared station extraction, Public Web, Public Editor, and
the tabled matrix promotion frontier remain separate decisions.

# KP Article V1 RC1 Long-Loop Proposal

Date: 2026-08-08
Status: proposal; execution requires approval
Source decision: `../decisions/2026-08-08-kp-article-v1-rc1-authoring-contract.md`

## Objective

Turn the approved `kp.article.v1-rc1` contract into one trustworthy economics
authoring path while preserving the current lesson, animation, publication,
and projection behavior. Implement the queued universal development toolbar
before source migration so every later checkpoint has consistent Review and
view controls.

## Why Long Mode

This work crosses documentation, parsing, type validation, dependency
resolution, source maps, static compilation, accessibility, CodeMirror,
development tooling, persistence, economics migration, and compatibility
retirement. It is a migration and release boundary, not a safe three-slice
iteration.

## Canonical References

- Authoring contract: `../principles/kp-article-v1-rc1.md`
- Current article: `../../../content/lessons/economics-demand-shift.md`
- Current editable projection:
  `../../../content/lessons/economics-demand-shift-two-column.json`
- Current economics route and deck at commit `5e669449`
- Universal toolbar decision:
  `../decisions/2026-08-08-kp-universal-dev-toolbar-queue.md`

## Preservation Boundary

- Preserve economics prose, semantic IDs, motion checkpoints, direct seek and
  rewind, current static publication, searchable text, TOC, accessibility,
  theme, Review identity, layout URLs, and deck behavior.
- Preserve framework-neutral animation assets, vignettes, clocks, renderer
  ports, and publication truth.
- Do not redesign layout, graph styling, salience, or choreography.
- Do not migrate another lesson or generalize a new lesson API before the
  economics human checkpoint.

The smallest rollback unit is one verified slice commit. The whole migration
can roll back to the legacy readers until the post-review retirement slice.

## Ordered Slices

| # | Slice | Change | Risk | Verification | Commit boundary / stop |
| ---: | --- | --- | --- | --- | --- |
| 1 | Golden RC1 fixture | Add a compilable economics excerpt and assertions for the four directives, refs, math, and frontmatter. | low | focused parser fixture test | Commit; stop if the approved grammar is ambiguous. |
| 2 | Source spans | Implement framework-neutral offsets, line/column spans, and lossless source records. | medium | focused unit tests | Commit; stop on unstable round trips. |
| 3 | Frontmatter parser | Parse only the minimal `kp` document identity and import map without executing author code. | medium | focused unit tests | Commit. |
| 4 | Directive scanner | Recognize the four closed container directives and the motion `::after` slot while leaving ordinary Markdown untouched. | medium | focused grammar tests | Commit; stop if nesting requires an unapproved fifth construct. |
| 5 | Typed validation | Produce source-located diagnostics for unknown directives, attributes, malformed IDs, and invalid combinations. | medium | focused positive/negative tests | Commit. |
| 6 | Stable identities | Implement document-scoped IDs, collision checks, persisted slug suggestions, and atomic rename edits. | medium | focused identity/refactor tests | Commit. |
| 7 | Semantic refs | Resolve `kp-ref:` targets through article-local stage aliases without granting links timeline authority. | medium | focused resolution tests | Commit. |
| 8 | Import lock model | Resolve readable major-version vignette imports to exact versions and hashes through a deterministic lock model. | high | resolver and drift tests | Commit; stop if existing assets lack sufficient version identity. |
| 9 | Article IR | Compile validated source into `KpArticleDocument` plus source map, retaining prose and semantic order. | high | IR snapshots and invariant tests | Commit. |
| 10 | Static Markdown fallback | Expand vignette-owned initial/settled checkpoint figures with before/after prose in source order. | high | focused fallback tests | Commit. |
| 11 | Static HTML and math | Emit searchable semantic HTML plus build-time KaTeX HTML/MathML without a client KaTeX dependency. | high | static compiler and closure tests | Commit. |
| 12 | Accessibility contract | Enforce vignette accessible names, summaries, static checkpoints, and reduced-motion direct seeks. | high | accessibility unit/browser checks | Commit. |
| 13 | Stage manifests | Emit one optional interaction manifest per stage and prove direct-address/near-viewport activation. | high | capability and lazy-load tests | Commit. |
| 14 | Deck derivation | Derive motion and reading scenes from the same IR without slide syntax or split motion blocks. | medium | focused deck tests | Commit. |
| 15 | Toolbar capability protocol | Define a framework-neutral development-toolbar host and typed route contributions. | medium | protocol/unit tests | Commit. |
| 16 | Toolbar exemplar | Mount the dev-only bottom row on economics with Review always present and contextual view/theme controls. | medium, visual | economics browser smoke and screenshot | Commit; preserve the approved bottom placement. |
| 17 | Toolbar route rollout | Adopt the host across remaining development routes without production HTML/JS or layout shift. | high | representative route/browser and production-closure checks | Commit; stop on route-specific lifecycle loss. |
| 18 | Toolbar state handoff | Preserve semantic destination, playhead, theme, review identity, and meaningful scroll state across view changes. | high | direct-navigation browser tests | Commit. |
| 19 | Editor language service | Add RC1 completion, diagnostics, folding summaries, hover, go-to, refs, rename, and narrow formatting over editor-neutral edits. | high | language-service tests | Commit. |
| 20 | Draft/save lifecycle | Point the whole-file CodeMirror/Vim session at RC1 source with last-valid preview and exact `:w`, `:wq`, `:q`, and `:q!` behavior. | high | editor unit/browser tests | Commit. |
| 21 | Legacy economics importer | Read the Markdown comments, layout JSON, and synthesized buffer into one RC1 migration result without making them co-authorities. | high | importer parity tests | Commit. |
| 22 | Economics cutover | Make the RC1 article the sole writable economics source and derive document, passages, refs, TOC, static output, and presenter inputs. | high | economics focused suite and publication freshness | Commit; legacy readers remain available for rollback. |
| 23 | Exemplar release gate | Compare raw source, source-noise, static output, interactive layouts, deck, search, links, accessibility, CodeMirror, and production closure. | broad, visual | economics suite, browser suite, build, performance/closure checks, visual captures | Commit evidence and stop at `HUMAN_CHECKPOINT`. |
| 24 | V1 promotion and retirement | Only after human approval, freeze `kp.article.v1`, retire migrated writable JSON/synthesized forms and temporary reader, and publish closeout. | high | broad release gate and Theseus validation | Commit; stop if any parity or source-noise condition regresses. |

## Verification Cadence

- Inner loop: impact-selected unit tests for the changed parser, compiler,
  toolbar, editor, or migration file.
- Boundary: economics tutorial suite, source-save suite, compiled-publication
  checks, relevant browser checks, production-closure checks, and
  `npm run build`.
- Human checkpoint: raw RC1 source plus economics static, interactive, and deck
  projections. No second caller or API promotion precedes approval.
- Release: broad economics authoring/publication checks, performance budgets,
  `npm run check:promotion-memory`, and `theseus workspace validate`.

## Stop Conditions

Stop if:

- the grammar needs a fifth directive, layout syntax, executable article code,
  or prose duplication;
- source noise exceeds 25 percent of meaningful economics lines;
- import locking cannot reproduce the selected vignette;
- the migration changes learner-visible semantics or animation checkpoints;
- toolbar rollout introduces production JavaScript or layout shift;
- static search, HTML/MathML/SVG, direct links, accessibility, or last-valid
  preview regresses;
- unrelated dirty-worktree files would need modification;
- the economics exemplar reaches its required human review boundary.

## Explicit Deferrals

- layout selection or presentation redesign;
- advanced semantic-history authoring;
- executable `kp` programs and prose transclusion;
- multi-step algebra and all other lesson migrations;
- shared motion-passage/vignette API promotion;
- Public Web, Public Editor, and SvelteKit expansion;
- Canvas/WebGL/Graph3D changes;
- animation-library promotion work.


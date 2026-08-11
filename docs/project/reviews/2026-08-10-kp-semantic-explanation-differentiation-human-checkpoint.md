# KP Semantic Explanation Differentiation · Human Checkpoint

Status: awaiting human judgment at slice `s08` of
`run-contract.kp.semantic-explanation-differentiation-proof-v2`.

## Review Surface

Open the live exemplar:

[The Equation Remembers · attention stage](http://localhost:8000/tutorials/algebra/fraction-composition/?view=attention-stage)

The canonical reference is one austere attentional stage over the existing
fraction-composition equation: stage, passage, progress, then constant
Back/Forward controls. The complete searchable Article remains below it.

## What This Exemplar Is Testing

The question is not whether this is the final KP layout. It is whether the
same canonical equation, semantic objects, and motion become a meaningfully
different explanation when a projection coordinates one short passage, one
focus target, and one canonical range at a time.

Please judge:

1. Is it immediately clear what to read, what to watch, and when the state has
   changed?
2. Does the semantic focus feel like explanation rather than an ordinary
   slideshow wrapped around an animation?
3. Is the stage austere enough that the equation and passage fit in one screen
   without feeling cramped?
4. Do the fixed Back/Forward controls and full-interval progress make each
   state predictable and revisitable?
5. Does keeping the complete Article below preserve useful document context,
   or does it compete with the stage?

An approval means the attentional exemplar is strong enough to test as a
reusable projection. It does not approve catalogue-wide rollout or freeze the
visual language.

## Preserved Boundaries

- One retained canonical equation stage, renderer, session, and full clock.
- Twelve presentation-neutral beats derived from Article v1 identities.
- Prose focus never owns or advances time.
- No new animation, Article directive, renderer, clock, or responsive geometry
  in authored content.
- The ordinary static Article remains the default and the no-JavaScript,
  searchable fallback.
- Removing the scoped attention-stage adapter and styles restores the prior
  Article without changing canonical lesson semantics.

## Discovery Evidence

- `npm run test:kp-article-v1`: 113 focused checks passed, including static
  searchability, server-rendered KaTeX, semantic identity, deterministic scene
  projection, and the no-separator regression.
- `npm run visual:algebra-attention-stage`: one Chromium smoke passed. It
  verifies one retained stage, stable composition and controls, intermediate
  canonical-clock samples, scene focus, Article continuity, and produces
  disposable opening and settled captures under
  `tmp/codex/algebra-attention-stage/`.
- `npm run build`: typechecks, Svelte checks, domain checks, publication check,
  and production build passed.
- `theseus workspace validate`: the durable control graph passed.

The discovery cadence intentionally did not run a cross-browser or responsive
matrix. Those visual contracts should be encoded only if this exemplar earns
human approval.

## Payload Observation

The production observation exposed inherited performance debt rather than a
clean proof baseline:

- Article HTML: 10,034 gzip bytes.
- Startup and active JavaScript plus CSS: 185,524 gzip bytes.
- Authoring leakage: none.
- Shared reader runtime: 148,401 gzip bytes against the current 145,000-byte
  ceiling.

The current algebra entry eagerly loads the recovered canonical runtime, so
the older budget assumptions of a small startup plus deferred activation no
longer describe the route. The baseline was not moved to make the check pass.
This should become a bounded performance slice after the attentional design is
accepted; it should not be hidden inside visual discovery.

## Promotion Gate

Slices `s09` through `s17` remain locked until the user either approves this
exemplar or requests a bounded revision. Approval unlocks only projection
state, no-reload switching, direct URL restoration, and one compact reuse
caller. A second human checkpoint is still required before authoring or broad
promotion work.

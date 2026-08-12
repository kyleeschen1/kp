# KP Project Memory

This directory is the human-readable project control layer for Kinetic Press.
It records durable direction, accepted decisions, active workstreams, reviews,
and short next actions. Theseus remains the executable project graph for
typed nodes, verification evidence, run contracts, and implementation
provenance.

## Operating Split

- Project docs answer: what are we building, why, what direction won, what is
  current, what is deferred, and how priorities relate.
- Theseus answers: what exact node is next, what source refs changed, what
  verification passed, what is blocked, and what a Codex loop may safely run.
- Theseus-backed loops keep one reviewed proposal in `docs/project/` and one
  executable run contract. Do not maintain another copy under
  `docs/superpowers/plans/`; strategy files summarize and link, while Theseus
  alone tracks slice progress.

Accepted direction should move through this path:

```text
conversation or design record
-> docs/project decision, thread, or roadmap update
-> Theseus next-actions or run-contract
-> implementation, tests, Theseus completion evidence
-> commit
-> dashboard reflects the updated project state
```

## Canonical Files

- `strategy.md`: long-term product thesis, constraints, and prioritization.
- `roadmap.md`: current source of truth for active, next, and later work.
- `next-actions.md`: short list of concrete work candidates.
- `threads/`: living summaries for major workstreams.
- `decisions/`: accepted decisions and pivots.
- `principles/`: active architecture doctrine and design laws that future
  sessions should follow.
- `authoring/`: practical guides for humans, LLM sessions, and generated
  systems that create KP assets.
- `reviews/`: periodic next-step or project health reviews.
- `inbox/`: raw imported plans; keep immutable after import.
- `archive/`: superseded historical material.

## Collaboration Entry Points

- `principles/codex-collaboration-protocol.md`: enforceable working sequence for
  subjective visual and generated-output work.
- `authoring/codex-collaboration-prompt-card.md`: short prompts for diagnosis,
  exemplar review, grill-me sessions, and visual long loops.

## Current Focus

The current focus is convergence and architecture compression. Preserve the
stable semantic-to-renderer spine, reduce rejected product representations and
compatibility, make capability dependencies explicit, improve bounded LLM
retrieval/generation, and then pressure program animation through TypeScript
and Python before selecting one Public Web v0 projection.

Start new sessions with `roadmap.md`, then the active thread it names. Do not
load the historical decision and review corpus unless a selected task requires
specific provenance.

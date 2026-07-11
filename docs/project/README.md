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

## Current Focus

The current focus is the semantic animation runtime and dashboard-backed
authoring/catalog system. The immediate product direction is to make
`SemanticObject -> SemanticTransformation -> MotionPlan -> sampled frame ->
renderer` the stable spine for equations, graphs, diagrams, code, and tutorial
cards.

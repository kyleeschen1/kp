# KP Long-Term Semantic Product Plan

Status: accepted
Date: 2026-07-13

## Context

KP's strongest direction is the semantic tutorial system: semantic objects and
semantic transformations feed deterministic timelines, renderer-neutral frames,
views, exports, generated examples, and future flashcards. Recent loops proved
the core path across asset calculus, generated algebra families, renderer
frames, dashboard rows, export artifacts, and browser smokes. The remaining
risk is letting visible features run ahead of the reusable semantic/runtime
contracts that make KP composable for humans and LLMs.

## Decision

Preserve the project order:

```text
semantics first
-> runtime second
-> renderers third
-> authoring and generation fourth
```

Use category-theory and FRP ideas as design constraints, not as a broad
abstract framework. KP should model objects, transformations, composition,
ports, timelines, and interpreters precisely enough that independent assets can
compose, seek, rewind, export, and decompose into drill-down tutorials.

## Strategic Tranches

1. Promote generated algebra family metadata into reusable
   `SemanticTransformation` modules for fraction split/merge, exponent
   lowering, radical rewrite, function wrapping, distribution/factoring,
   simplification, and cancellation.
2. Attach visual motif defaults and reversible timeline laws to those
   transformations so authored and generated examples reuse the same motion
   vocabulary.
3. Move graph/vector panels, source/code traces, dashboard previews, and export
   previews toward renderer-neutral semantic frames instead of renderer-owned
   timing.
4. Turn the project dashboard into an authoring surface: create fixtures,
   inspect closure, compare variants, open samples, run smokes, and navigate
   source/test refs from rows.
5. Harden external boundaries before broader use: `/api/compile` needs a body
   size limit, schema validation, safer errors, and an explicit future
   auth/CSP/export policy.
6. Add a media-frame preservation law before integrating GIF or video encoders.
   Encoders should consume accepted frame-sequence artifacts, not invent timing.
7. Defer curriculum/problem generation and spaced-repetition cards until
   semantic transformations, computation protocols, frame preservation, and
   flashcard specs are stable enough to generate verified solution assets.
8. Defer dynamic package loading until capability manifests are stable across
   math, graph, programming, and export examples.

## Consequences

- New visible demos should usually land by strengthening a reusable semantic
  object, transformation, motif, frame, or dashboard authoring seam.
- Theseus next-actions should name the tranche they advance and the verification
  level needed to keep composition, rewind, and source refs honest.
- Graphs, code views, exports, and future media are consumers of the shared
  semantic/time protocol, not separate animation systems.
- Generated tutorial and flashcard work stays parked until the semantic and
  computational contracts can guarantee provenance and correctness.

## Non-Goals

- Do not build a full CAS or theorem prover inside KP.
- Do not encode every math adjective as a subclass when traits, predicates, or
  templates are sufficient.
- Do not add media encoders, dynamic package loading, or curriculum generation
  before their input contracts are stable.

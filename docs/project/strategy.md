# KP Strategy

Last Updated: 2026-07-10

## North Star

Kinetic Press should become a semantic tutorial system, not a collection of
one-off animations. LLMs should be able to propose and revise structured
explanations; KP should validate the semantics, execute computations, derive
representations, preserve identity, render synchronized views, and export the
result as interactive cards, static steps, GIFs, or videos.

## Product Thesis

The durable artifact is an executable semantic tutorial. A tutorial contains
semantic objects, semantic transformations, layouts, timelines, visual motifs,
concept refs, checks, and export settings. The same source should support:

- interactive scrubbable cards;
- synchronized equation, graph, diagram, and code views;
- generated worked examples and solution sets;
- spaced-repetition cards;
- embeddable capsules with lazy capabilities;
- GIF, MP4/WebM, and static-step exports.

## Strategic Architecture

The project should keep four layers distinct:

1. **Semantic layer:** immutable objects, transformations, selectors,
   correspondence, provenance, traits, and capabilities.
2. **Runtime layer:** clocks, timelines, sampled frames, reversible playback,
   sequencing, parallel composition, and layout state.
3. **Renderer layer:** KaTeX, SVG, WebGL, DOM, code, diagram, and table
   renderers that consume explicit frames.
4. **Authoring layer:** dashboard/catalog, tutorial specs, LLM-editable
   scripts, comparison cards, report cards, and project navigation.

## Project Docs And Theseus

Use project docs for direction and judgment:

- project strategy;
- roadmap;
- workstream summaries;
- accepted decisions;
- next-step reviews;
- stale-plan notes.

Use Theseus for executable control:

- typed next-actions;
- run contracts;
- source refs;
- verification records;
- progress and blocker state;
- dashboard exports.

The dashboard should increasingly read from both: project docs for the human
story and Theseus for the live operational graph.

## Prioritization Criteria

When choosing the next slice, prefer work that improves:

- **semantic foundation:** stable object, transformation, selector,
  correspondence, and provenance semantics;
- **runtime reliability:** deterministic seek, rewind, composition, and
  renderer-neutral sampling;
- **authoring workflow:** dashboard search, samples, report cards, and project
  navigation;
- **reusable primitives:** capabilities and motifs that many tutorials can
  reuse;
- **demo value:** visible equation/graph/tutorial behavior that proves the
  architecture;
- **cross-session continuity:** clear docs and Theseus records that let future
  Codex runs continue without rediscovery.

Down-rank work that is mainly visual flourish, unverified math, broad
infrastructure unrelated to KP, or a new UI before the semantic/runtime
contract is stable enough to support it.

## Current Non-Goals

- Do not build a complete CAS or theorem prover.
- Do not encode every math adjective as a runtime subclass.
- Do not make graph/WebGL a separate animation system.
- Do not make every embed ship the full runtime or Three.js.
- Do not let dashboard rows drift from source refs, tests, or Theseus records.
- Do not pursue unrelated Theseus planner infrastructure while KP semantic
  runtime work is the selected frontier.

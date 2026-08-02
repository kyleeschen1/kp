# KP Strategy

Last Updated: 2026-08-02

## North Star

Kinetic Press should become a verified semantic-to-interactive compiler, not a
collection of one-off visual effects. LLMs should be able to propose and revise
structured animations; KP should validate the semantics, execute computations,
derive representations, preserve identity, render synchronized views, and
export the result as interactive cards, lessons, static steps, GIFs, or videos.

## Product Thesis

The durable artifact is an executable semantic animation. An animation contains
semantic objects, semantic transformations, layouts, timelines, visual motifs,
concept refs, checks, and export settings. Tutorials, cards, comparisons,
problem solutions, and embeds are consumers of that animation artifact, not the
artifact itself. The same source should support:

- interactive scrubbable cards;
- synchronized equation, graph, diagram, and code views;
- generated worked examples and solution sets;
- spaced-repetition cards;
- embeddable capsules with lazy capabilities;
- GIF, MP4/WebM, and static-step exports.

KP's custom technical investment must measurably improve on a
semantic-constrained glyph-transform baseline through branching, direct
seek/rewind, responsive execution, accessibility, hover, annotations, Cloze,
and renderer-independent compilation. Bespoke motion planning is not itself a
product thesis.

KP is learner-facing in the long term. The first learner product should deepen
understanding for people who have already encountered the notation rather than
claim to be a complete curriculum. Before shaping that public product, the
internal Animation Catalogue is the immediate pressure lab: it should make the
executable library easy to search, play, tune, review, and compare across
domains while revealing which abstractions and host seams are actually shared.

## Strategic Architecture

The project should keep four layers distinct:

1. **Semantic layer:** immutable objects, transformations, selectors,
   correspondence, provenance, traits, and capabilities.
2. **Runtime layer:** clocks, timelines, sampled frames, reversible playback,
   sequencing, parallel composition, and layout state.
3. **Renderer layer:** KaTeX, SVG, WebGL, DOM, code, diagram, and table
   renderers that consume explicit frames.
4. **Authoring layer:** an asset-first Animation Catalogue, animation specs,
   review and tuning tools, LLM-editable scripts, tutorial cards, comparison
   cards, report cards, and diagnostic project navigation.

Within the executable animation path, keep only three stages: canonical
semantic trace, ephemeral presentation planning, and rendering. Authoring
produces inputs and projections around that path; it does not add another
runtime animation layer. One durable semantic animation artifact may compile
to multiple capability-declaring backends, with static JavaScript as the
primary full-interaction target.

KP's first-party product topology has two applications over that shared
engine. **Internal Studio** contains the Animation Catalogue and Internal
Editor. **Public Web** contains the mission site, curated lessons and content,
and initially a constrained Public Editor. Svelte 5 is the recommended host UI
for these first-party applications, and SvelteKit is the eventual application
and publication framework. Animation assets, semantic and runtime authority,
authoring commands, publication bundles, and renderer ports remain
framework-neutral. The public editor is a policy-limited projection of the
same typed authoring session, not a second implementation.

For structurally changing native-KaTeX equations, the canonical renderer is
one ephemeral session driven by semantic lineage and measured native paint.
Native DOM remains the sole authority for settled typography, accessibility,
annotations, and interaction. Existing equation animations remain reference
and compatibility coverage until migrated one exemplar at a time; a migrated
transition must retire its old paint branch in the same rollback unit.

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

The Animation Catalogue should read executable asset, hostability, verification,
and review evidence for artifact inspection. It must not duplicate the roadmap
or Theseus operational graph. Project docs retain the human story and Theseus
retains live execution authority.

## Prioritization Criteria

When choosing the next slice, prefer work that improves:

- **semantic foundation:** stable object, transformation, selector,
  correspondence, and provenance semantics;
- **runtime reliability:** deterministic seek, rewind, composition, and
  renderer-neutral sampling;
- **authoring workflow:** asset search, continuously visible playback,
  progressive inspection, parameters/tuning, and exact-state review capture;
- **reusable primitives:** capabilities and motifs that many animations can
  reuse;
- **demo value:** visible equation/graph/animation behavior that proves the
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
- Do not turn the catalogue into a roadmap, ontology browser, planned-work
  index, or peer representation switcher.
- Do not claim an asset is healthy when its required surface adapter or primary
  host is missing; expose the capability gap without an iframe fallback.
- Do not pursue unrelated Theseus planner infrastructure while KP semantic
  runtime work is the selected frontier.
- Do not infer semantic lineage from visual glyph equality.
- Do not grow operation-specific scheduling exceptions as a substitute for a
  general presentation law; unsupported work must fall back conservatively or
  remain lesson-authored.
- Do not turn the planned public-site proof into a full curriculum,
  learner/teacher system, or public catalogue mirror. Public Web begins only
  after the Internal Studio and portable publication seams are proven, with a
  mission page and a small explicitly curated lesson set.
- Do not build the Public Editor before the framework-neutral internal
  authoring session, context-specific untrusted-text boundary, publication
  contract, and public safety policy are proven.
- Do not let Svelte or SvelteKit own animation assets, semantic truth, the
  shared playback clock, renderer-neutral frames, or public compiler/runtime
  contracts.

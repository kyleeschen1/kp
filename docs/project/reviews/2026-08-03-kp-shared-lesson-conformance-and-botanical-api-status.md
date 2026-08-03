# Shared lesson conformance and botanical API status

Date: 2026-08-03
Status: implementation evidence; botanical presentation remains experimental-local

## Outcome

Economics and botanical Lisp now consume the same caller-proven lesson seams:

- `KpLessonDocument` remains the single ordered content authority through the
  framework-neutral tutorial publication adapter;
- motion-block metadata, cumulative projection, viewport corridors, manual
  rebase, and one-rAF ownership come from `kp-tutorial-motion.ts`;
- semantic history and restore-before-scroll ordering come from
  `kp-tutorial-navigation.ts`;
- static TOC and scrubber markup compile once from document truth through
  `kp-tutorial-publication-controls.ts`;
- progressive controls remain final light DOM with meaningful no-JS links;
  and
- both enhanced hosts use the replaceable `KpTutorialLessonShell.svelte`,
  while the Lisp static publication uses the same shell class and token
  contract without requiring Svelte at runtime.

The shared contract suite exercises both publications through one assertion
path. Caller-specific conformance tests additionally prevent economics or Lisp
from reintroducing pass-through corridor, coordinator, TOC, or shell APIs.

## API tiers after two callers

The executable tier ledger is `src/tutorial/kp-lesson-seam-ledger.ts`. None of
the newly shared lesson code is a public package promise.

- The lesson-document adapter, motion projection, navigation transaction,
  publication-control compiler, and progressively enhanced light-DOM elements
  are **shared-internal** APIs backed by both economics and Lisp.
- `KpTutorialLessonShell.svelte` and its layout tokens are a
  **replaceable-first-party-host**. They reduce duplicate Svelte composition
  without making Svelte the owner of content, controls, URLs, clocks, or stage
  rendering.
- Economics graph/focus/parameter composition is **domain-internal**.
- Lisp botanical presentation, stage paint, salience, and orchestration are
  **experimental-domain** APIs. They cannot advance without human approval and
  a structurally different approved botanical caller.

This classification deliberately stops short of a public tutorial SDK,
SvelteKit adoption, generated solve-x migration, or a shared focus/scene-graph
vocabulary.

## What remains local

The following are domain projections, not missing shared abstractions:

- economics graph composition, exact equilibrium verification, focus targets,
  spotlight geometry, and demand parameter controls;
- Lisp global-to-block progress mapping, certified evaluator frames, material
  lineage, native-code settlement, stage salience, and botanical paint; and
- each lesson's semantic destination resolver, which supplies typed state to
  the shared navigation transaction.

## Experimental botanical APIs

These APIs are intentionally internal and experimental:

- `createKpLispBotanicalPresentationPlan` assigns enclosure, branch, root,
  leaf, bud, fruit, and material-path roles to certified Lisp selectors;
- `renderKpLispBotanicalStageHtml` and `kpLispBotanicalStageCss` paint the
  current metaphor while keeping native code authoritative;
- `projectKpLispLessonSalience` maps exact runtime selectors to target,
  context, and attenuated material; and
- `createKpLispLessonMotionController` coordinates the canonical playback
  reducer, sampler, salience projection, and renderer for this lesson.

They do not define a promoted motif family, a general programming renderer, a
shared scene graph, or public authoring syntax. Promotion requires the pending
human review of the botanical language and a structurally different approved
caller. Until then, changes stay reversible within the Lisp presentation and
lesson-controller files.

## Removed compatibility surface

Economics no longer carries local corridor/coordinator pass-through modules or
a duplicate static TOC builder. Lisp no longer exports local wrappers around
shared corridor, scroll-frame, or rebase functions. The remaining controller
files contain actual domain lifecycle policy rather than renamed shared APIs.

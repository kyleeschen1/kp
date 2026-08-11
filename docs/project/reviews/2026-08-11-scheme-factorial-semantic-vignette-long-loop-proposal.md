# Scheme factorial semantic vignette long-loop proposal

Date: 2026-08-11
Status: approved; activation in progress
Mode: Theseus long loop
Canonical route: `/tutorials/programming/scheme-factorial/`
Target: `next-action.kp.scheme-factorial-semantic-vignette-v0`
Contract: `run-contract.kp.scheme-factorial-semantic-vignette-v2`
Estimated duration: 18–28 focused implementation hours, followed by a required
human visual checkpoint

The initially generated `v1` control record was deferred before execution
because it omitted the required run mode, slice limit, commit cadence,
verification level, and stop conditions. Corrected `v2` preserves the exact
approved scope and slice order with those typed-autonomy controls.

## Why this loop is current

The current code-native lambda asset proves many material primitives, but its
choreography is still hand-assembled around a single application. The older
Ouroboros and Codereel lineages demonstrate the missing architectural joint:
an evaluator can provide binding identity, branch truth, suspended work,
return provenance, and reversible state without dictating the pedagogical
story.

This loop uses that distinction to build one bounded Scheme factorial
vignette. The interpreter owns semantic truth; a separate pedagogical score
owns selection, compression, captions, holds, and emphasis; the existing KP
clock and renderer boundary own deterministic playback. The work is
exemplar-first and stops before shared promotion.

The previous algebra contract is preserved at slice 8/23 in commit `d38f06fe`.
Its 16 remaining slices are user-paused and recoverable. The economics prose
edit and unrelated untracked project documents present during activation are
outside this contract.

## Objective

Build one parallel, reversible `(factorial 3)` Scheme vignette in which a
bounded interpreter establishes semantic truth, a declarative pedagogical
score directs the explanation, and a deterministic native-code renderer
presents recursion as suspended work descending to a base case and resolving
in reverse.

## Canonical references

- Semantic lineage: `../Ouroboros_Versions/ob-april` and the older Codereel
  interpreter.
- Motion lineage: KP's current S-expression fold, jostle, binding,
  reconstruction, and timing implementations.
- Interaction lineage: the existing framework-neutral tutorial scrubber and
  one stable caption per semantic interval.
- Canonical source: a small Scheme definition of `factorial` and the invocation
  `(factorial 3)`.

## Allowed work

- One bounded Scheme parser and evaluator sufficient for the exemplar.
- Typed serializable trace events, causal dependencies, snapshots, and
  provenance.
- One typed declarative pedagogical score and validator.
- Factorial-local semantic, choreography, geometry, renderer, route, static,
  reduced-motion, review, and performance evidence.
- Reuse of existing framework-neutral primitives only where their contracts
  match exactly.

## Disallowed work

- No complete Scheme, Racket, Clojure, or host-evaluator integration.
- No live learner evaluator, CodeMirror work, or SICP curriculum authoring.
- No replacement of the existing lambda route.
- No universal programming renderer, generic language pack, or second caller.
- No new clock, CSS-owned semantic animation, runtime LLM, or Svelte semantic
  authority.
- No broad cross-browser certification before visual approval.
- No resumption of the paused algebra contract inside this run.

## Preservation, rollback, and promotion

- **Preservation boundary:** current Lisp lambda route, algebra checkpoint,
  economics, Article v1, shared clocks, semantic runtime, and existing renderer
  contracts.
- **Presentation boundary:** semantic and score artifacts remain
  framework-neutral; Svelte may host the route but owns no evaluation or
  timeline truth.
- **Rollback unit:** the Scheme route, evaluator, trace, score, and renderer
  adapter are one independently removable parallel exemplar.
- **Promotion boundary:** the human checkpoint approves only `(factorial 3)`.
  Shared extraction waits for approval and a structurally different caller.

## Ordered slices

Every slice begins with a bounded Theseus context receipt, records proof,
validates durable state, and ends in one focused commit. Visual discovery uses
one Chromium exemplar and cheap preservation checks; broad matrices wait for
promotion.

| Slice | Target and intended change | Risk | Verification and expected checks | Commit boundary | Stop condition |
| --- | --- | --- | --- | --- | --- |
| 01 | Record the approved pivot, source references, preservation manifest, and exemplar contract. | Competing durable authority | **Standard:** Theseus validation and scoped status | Commit decision, proposal, target, contract, and priority evidence | The algebra contract cannot remain recoverably paused |
| 02 | Audit current Lisp machinery against the old interpreter lineage; classify exact reuse versus exemplar-local work. | Rebuilding existing capabilities or forcing unsuitable reuse | **Focused:** import and ownership audit | Commit a bounded reuse manifest and tests where executable | The audit requires modifying the current lambda asset |
| 03 | Define the tiny Scheme source model with stable syntax, delimiter, occurrence, binding, and source identities. | Identity inferred from glyphs | **Focused:** parser/model laws | Commit model and tests | Identity depends on rendered text or geometry |
| 04 | Implement parsing for integers, booleans, symbols, `lambda`, `if`, application, and `define` sugar. | Accidental general-purpose language | **Focused:** valid and rejected source fixtures | Commit parser and tests | Macros or host interop become prerequisites |
| 05 | Define typed values, lexical environments, closures, and continuation frames. | Substitution becomes semantic authority | **Focused:** environment, shadowing, closure, immutable-state tests | Commit evaluator state model | Mutable host state becomes required |
| 06 | Define serializable evaluation events, snapshots, provenance, and causal dependencies. | Linear trace becomes an uneditable storyboard | **Focused:** schema, identity, causal-edge, serialization tests | Commit trace contract | Events contain renderer or timing authority |
| 07 | Implement bounded small-step evaluation for literals, symbols, and closures. | Nondeterminism or runaway execution | **Focused:** deterministic sampling and fuel-limit tests | Commit evaluator core | Repeated runs differ or bounds fail closed |
| 08 | Add function application and argument-to-parameter binding events. | Binding animation invented by renderer | **Focused:** environment and source/destination provenance tests | Commit application semantics | Binding depends on glyph equality |
| 09 | Add `if`, branch selection, and dormant-branch provenance. | Implying the unselected branch executed | **Focused:** branch exclusivity and causal-order tests | Commit conditional semantics | Both branches acquire execution events |
| 10 | Add trusted primitives `=`, `-`/`sub1`, and `*` with local-reduction events. | Primitive internals overwhelm recursion | **Focused:** exact-value and expansion-policy tests | Commit primitive semantics | Primitive implementation details enter the lesson trace |
| 11 | Add named recursive functions, call-frame identity, suspended continuations, and return events. | Frames lose identity across repeated calls | **Standard:** factorial trace, depth bound, return-lineage, typecheck | Commit recursion semantics | Return provenance cannot be reconstructed |
| 12 | Compile `(factorial 3)` into a frozen build artifact and prove reproduction from source. | Hand-edited trace drift | **Standard:** regeneration equality, schema validation, no runtime evaluator in publication | Commit generated artifact and check | Source cannot reproduce the artifact byte-for-byte |
| 13 | Define the framework-neutral pedagogical score and causal-order validator. | Editorial freedom contradicts execution truth | **Focused:** valid grouping, invalid reorder, missing-event, dependency tests | Commit score contract | A score can violate trace causality |
| 14 | Author the canonical score: first descent detailed, middle descents grouped, base and return cascade detailed. | Compression becomes speedup | **Focused:** checkpoint and grouping assertions | Commit factorial score | A summary motif lacks exact source events |
| 15 | Project semantic checkpoints: full definition, function seed, active locus, binding cell, waiting shells, dormant branches, and values. | Renderer becomes semantic authority | **Focused:** endpoint snapshots, material ledger, accessibility equivalents | Commit checkpoint projector | Any visible material lacks provenance |
| 16 | Compile definition-to-seed, downward bloom, waiting-shell, and inside-out fold/unfold choreography. | Reflow jumps or wrappers lead contents | **Focused + visual smoke:** ordering, direct sampling, parenthesis lag, conservation | Commit structural choreography | A parent completes before required contents |
| 17 | Compile argument arcs, persistent parameter cells, and demand-driven provenance echoes. | Connector clutter or false duplication | **Focused + visual smoke:** destinations, one-to-many lineage, reverse sampling | Commit binding choreography | Argument identity is duplicated without provenance |
| 18 | Compile branch decision, dormant-particle, trusted-primitive, and summary-descent motifs. | Evaluation and folding look identical | **Focused:** motif distinction, branch truth, stable endpoints | Commit decision and summary motifs | Structural folding falsely implies evaluation |
| 19 | Compile the base-case hold and single-value return carrier through reopening suspended shells. | Values teleport or shells jerk | **Focused + visual smoke:** carrier identity, readable multiplication checkpoints, exact reverse | Commit return choreography | The return path loses value identity |
| 20 | Build one deterministic timeline with motion intervals, reading holds, semantic checkpoints, and magnetic seek destinations. | A second clock or history-dependent reverse | **Standard:** dense direct-seek, rewind, checkpoint, stable-caption tests | Commit timeline and sampler | Sampling depends on playback history |
| 21 | Add restrained playhead-derived active jostle and responsive reflow/compaction. | Decorative distraction or unreadable phone scaling | **Focused:** deterministic paths, reduced motion, narrow geometry, stable type | Commit motion and responsive projection | Whole-stage scaling or random drift is required |
| 22 | Implement native DOM checkpoint rendering with transient inert motion overlays and one paint owner. | Inaccessible SVG code or double paint | **Standard:** searchable code, reading order, endpoint ownership, cleanup | Commit renderer | Settled code is not native selectable DOM |
| 23 | Integrate the isolated route, stable caption, existing scrubber, static fallback, and internal catalogue link. | Host acquires semantic authority | **Broad:** route, no-JS, scrubber, direct URL, Lisp preservation, typecheck, build | Commit product integration | Svelte, URL, or controls create another timeline |
| 24 | Add scoped visual/performance commands, produce wide/narrow/reduced captures, run the canonical smoke, and stop for review. | Automation mistaken for aesthetic approval | **Broad + manual:** `test:scheme-factorial`, `visual:scheme-factorial`, build, architecture, bundle observation, workspace validation | Commit checkpoint evidence | Always stop at `HUMAN_CHECKPOINT` |

## Human checkpoint criteria

- Source and invocation are immediately readable.
- First binding and recursive descent are causally clear.
- Repeated descent feels compressed rather than hurried.
- Waiting multiplication shells preserve object constancy.
- The base case reads as the turning point.
- One value visibly travels through the return cascade.
- Contents lead parentheses during collapse.
- Jostling signals active evaluation without noise.
- Captions remain stable during their transformations.
- Scrub, reverse, and direct seek never reconstruct by replay or jerk.
- Narrow layout remains readable without reduced typography.
- The result reads as living code rather than an embedded video.

## Verification cadence

Inner slices use the smallest affected tests and `npm run verify:impact` when
the changed-path map is informative. Standard slices add typecheck. Product
integration adds the current Lisp preservation suite and build. Only slice 24
runs the scoped browser/contact-sheet and performance observation. Cross-browser
release certification remains deferred until the human checkpoint passes.

## Contract stop conditions

Stop if source identities depend on glyphs or geometry; the trace cannot be
serialized deterministically; the score can violate causal dependencies; a new
clock or renderer authority is required; native checkpoint code becomes
inaccessible; existing Lisp, algebra, or economics behavior must be migrated;
scope expands into a general language or curriculum system; or visual judgment
is required at slice 24.

## Exact resume

After an interrupted approved run, resume through `theseus plan run` and the
stored next incomplete slice. Do not reconstruct the plan from chat history.

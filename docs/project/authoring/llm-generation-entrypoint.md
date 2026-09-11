# KP LLM Generation Entrypoint

Status: canonical routing guide
Updated: 2026-09-09

## Purpose

Give an LLM the smallest sufficient contract for creating or revising KP work.
Do not load the whole project history or ask a model to invent a complete
animation object graph from prose.

## Context Loading Order

1. `../roadmap.md`
2. the active thread named by that roadmap (currently
   `../threads/typed-semantic-authoring-framework.md`)
3. `../principles/system-vocabulary.md`
4. the exact task source and its canonical exemplar
5. one relevant authoring contract or renderer guide
6. a brief Theseus context packet for selected executable work

For motion or choreography work, the relevant guide must include
`../principles/animation-design-diagnostic-language.md`. In particular, an LLM
must not invent curved trajectories when direct same-baseline motion is clear,
and it must reuse a registered reception motif rather than authoring a new
timing table.

Retrieve historical decisions only to answer a named provenance question.
Older experiments are evidence, not default implementation authority.

For an existing supported task, begin with
`supported-authoring-entrypoint-packet.md` and `npm run author:check -- --list`.
This read-only discovery/check layer lists bounded callers, preserving
their distinct schemas, diagnostics and host/publication capabilities. It does
not replace their semantic authorities or provide arbitrary generation. Use
the domain packet only after selecting the exact task.

The authoring-first integration direction is accepted in
`../decisions/2026-09-05-authoring-integration-priority-and-sequence.md`.
Its bounded market source/Article/preview integration is implemented; use
`authoring-round-trip-packet.md` for executable examples and exact owners.
These internal entrypoints are not universal public generation APIs. A generic state update cannot supply
verified mathematical operation or animation authority; unsupported lowering
must return a typed repair gap. Handwritten generation-shaped state fixtures
must not be reported as a live-model benchmark.

For the accepted equation/code parent–reason–return exemplars, use
`reusable-reasoning-packet.md`. It supplies complete starter JSON, a read-only
checker, exact supported edits and typed repair examples. It does not expand
either domain's semantic or generation authority.

For the accepted binary-probability exemplar, use `bayesian-reasoning-packet.md`.
Exact joint masses or prior/likelihoods enter the probability-owned checker,
then existing governed construction, card, readings, practice and edition paths.
This does not authorize arbitrary probability trees, geometry, or new motifs.

For the accepted three-stop compound factoring/evaluation task, use
`composed-algebra-authoring-packet.md` and `equation.composed-algebra` discovery.
It accepts source-only oriented chains through existing verified operation
owners; it is not an arbitrary LaTeX deduction solver.

For the accepted four/five-state question-oriented composition, use
`reusable-algebra-intuition-packet.md` and `equation.algebra-intuition` discovery.
It adds checked distribution and optional constant-product evaluation through
the same canonical owners, plus contextual subquestions and static publication.

## Route The Task Before Generating

For focus-card presentation, follow `../principles/focus-card-typography.md`.
Use the canonical scaffold's inherited typography and shared plain-language
annotation helper; do not author local font/size values or scaled SVG reading
labels. Preserve native math/code renderers and their typography contracts.

| Intended change | Canonical target |
| --- | --- |
| Revise learner prose or sparse semantic references | `kp.article.v1` source |
| Reuse an existing animation in new prose or a flashcard | Versioned vignette import and a new Article/projection instance |
| Propose a new semantic animation | `KpGovernedCanonicalConstructionRequest` through `src/authoring/canonical-animation-public-api.ts` |
| Propose a code transformation | Begin with the closest approved TypeScript, Python, or Scheme exemplar; use a deterministic language-owned build-time frontend and checked-in semantic evidence |
| Change how a known operation is taught | Typed pedagogical score or presentation profile |
| Change paint for one medium | Renderer adapter or theme role, preserving semantic/frame contracts |
| Change desktop/mobile composition | Projection, never Article semantics or motion truth |
| Import a verified problem or execution | Deterministic solver/interpreter trace, then governed semantic operations |

## Required Generation Sequence

For supported source-edit tasks, follow the selected domain compiler and explicit
host Apply/Compile workflow in the entrypoint packet. The sequence below applies
to governed construction requests; do not wrap every domain source in a second
universal construction schema merely to match this list.

1. Identify the canonical artifact, host, renderer, and accepted reference.
2. State the semantic source of truth and exact operation/capability pins.
3. Declare stable objects, roles, identity, correspondence, and provenance.
4. Create a `KpGovernedCanonicalConstructionRequest` using only approved
   semantic object and operation references.
5. Compile with `compileKpGovernedCanonicalConstruction` and select the
   established presentation profile for the resolved operation.
6. Repair only through `planKpGovernedConstructionRepairs`; escalate
   compiler-authority gaps instead of inventing target truth.
7. Resolve the registered canonical representation and render through its
   existing sampled-frame and host boundary. An equal asset id is not proof of
   host or presentation parity.
8. Verify semantic endpoints, direct seek/rewind, accessibility, and the
   smallest relevant visual checkpoint.

## Minimal Successful Construction

This example deliberately varies an already verified operation. The trusted
fixture supplies source authority; the caller supplies only approved semantic
references and pedagogical intent.

```ts
import {
  compileKpGovernedCanonicalConstruction,
  createKpGovernedCanonicalConstructionRequest,
  createKpGovernedFractionSplitMergeVariation
} from "./src/authoring/canonical-animation-public-api.ts";

const verifiedSource = createKpGovernedFractionSplitMergeVariation();
const request = createKpGovernedCanonicalConstructionRequest({
  ...verifiedSource.request,
  id: "request.example.fraction-key-steps.v1",
  detailLevel: "key-steps"
});

const result = compileKpGovernedCanonicalConstruction({
  request,
  authority: verifiedSource.authority
});
```

`result` is already a verified compilation. Do not pass it to
`validateKpGovernedCanonicalConstructionCompilation`; that validator accepts
the pre-compilation pair `{ request, authority }`. Call the validator only when
an editor needs an issue list before compiling. The compiler performs the same
verification and throws `KpGovernedConstructionVerificationError` on failure.

Do not copy this example by inventing object or operation ids. Resolve a
trusted authority first, then select ids it actually exposes. If no approved
operation matches the intended explanation, use
`planKpGovernedConstructionRepairs({ request, authority })` and retain the typed
gap instead of substituting a generic animation.

## The Model May Author

- prose and claims that are explicitly reviewable;
- semantic objects and source/target roles;
- references to registered operations and exact versioned packs;
- selector paths and correspondence claims when supported by provenance;
- pedagogical grouping, disclosure, focus target, and necessary context; and
- explicit uncertainty or typed gaps.

## The Model Must Not Author

- DOM, SVG paths, WebGL handles, Canvas commands, or renderer node identity;
- coordinates, measured bounds, keyframes, per-token delays, or timing tables;
- arbitrary CSS, typography, shadows, or colors as semantic truth;
- a new clock, scheduler, stage lifecycle, or lesson-local state store;
- semantic lineage inferred from equal text or glyphs;
- unverified mathematics, execution results, or causal order; or
- silent fallback to a generic fade or unrelated animation when an operation is
  unsupported.

## Failure Contract

Unknown operations, missing roles, incompatible correspondence, unavailable
capabilities, or unsupported renderer behavior produce a typed repair gap. A
repair gap names the rejected path, expected contract, available candidates,
and preservation boundary. The previous valid artifact remains active while a
draft is invalid.

## Code Animation Boundary

There is not yet a universal arbitrary-source code-animation generator. For
code work, load exactly one approved exemplar:

- TypeScript free-shipping threshold for an imperative refactor with native
  token motion;
- Python free-shipping threshold for a build-time AST/token frontend; or
- Scheme factorial for evaluator-grounded recursive S-expression motion.

The shared contracts cover syntax paint roles and exact source spans,
complete-source projection composition where applicable, causal settlement and
native ownership, and explicitly scoped exceptions. They reject unknown IDs,
invalid or incomplete ranges, forged motion authority, premature native-paint
handoff, and unavailable surface capabilities.

Those contracts do not infer semantic correspondence, choose pedagogical
beats, invent trajectories, normalize language identity, or turn an evaluator
trace into a lesson. An LLM must retain a typed gap when those facts are absent
and request a canonical exemplar plus human visual review. Do not add a new
language or transformation topology merely to exercise the shared types.

## Compatibility Note

`kp.llm-animation-draft.v1` and `.v2` are retained compatibility and research
inputs with useful migration and typed-gap evidence. They are not the public
construction target for new work. Do not import their compilers from a new
production caller. Migrate accepted inputs into the governed canonical
construction seam instead of maintaining two author/compiler artifacts.

## Generation Evaluation

Track:

- first-pass validity;
- validity after one typed repair;
- correct operation, motif, and renderer selection;
- role-binding and reference-closure errors;
- semantic endpoint and seek/rewind parity;
- silent-fallback count, which must remain zero;
- caller-specific code introduced; and
- human findings categorized as semantic, architectural, choreography,
  editorial, or purely aesthetic.

Promote a model-authored pattern only after one approved exemplar and a
structurally different second caller. Provide one accepted example and one
useful rejected/repair example for every promoted generation pattern.

## Related Guides

- `kp-animation-asset-llm-authoring-spec.md` contains the detailed animation
  asset, historical draft, and governed-operation contracts.
- `../../reviews/2026-07-26-canonical-animation-construction-guide.md` defines
  the released construction workflow and public entrypoint.
- `kp-asset-authoring-guide.md` covers human-authored asset construction.
- `../principles/kp-article-v1.md` defines Article source and vignette imports.
- `../principles/codex-collaboration-protocol.md` governs implementation and
  visual review cadence.
- `../reviews/2026-08-13-cross-language-code-animation-foundation-closeout.md`
  records the proved seams, operations, performance, and remaining generation
  gaps for the code-animation portfolio.

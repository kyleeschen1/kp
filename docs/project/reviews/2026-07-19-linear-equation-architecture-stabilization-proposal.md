# Linear-equation Architecture Stabilization Proposal

Date: 2026-07-19  
Status: approved for execution on 2026-07-19  
Target: `next-action.kp.concept-room.architecture-walking-skeleton-v0`
Execution Contract: `run-contract.kp.concept-room.architecture-walking-skeleton-v1`

## Outcome

Deliver a deliberately plain but complete concept-room walking skeleton for
`2x + 3 = 8` that proves the accepted architecture. Stop for architecture
review before typography, color, choreography, hover links, balance aesthetics,
or other visual polish.

This proposal is not a broad rewrite. The user approved its exact long-loop
scope on 2026-07-19.

## Execution Ownership

This document is the sole human-readable plan for the loop. Its Theseus run
contract owns the exact execution order, per-slice state, verification evidence,
and stop status. Do not create or maintain a duplicate phase plan under
`docs/superpowers/plans/`.

## Canonical Reference

The canonical architectural reference is one linear-equation room with:

```text
2x + 3 = 8
2x = 5
x = 5/2
```

It is generated and verified by an exact-rational provider, translated once
into a KP semantic trace, addressable by a canonical URL, restorable from an
immutable snapshot, and consumable by symbolic, placeholder balance, and
static Review projections.

## Acceptance Criteria

The stabilization checkpoint is reviewable only when:

1. An inference-first authoring definition compiles into a validated immutable
   content artifact.
2. Generated registry metadata resolves a real canonical concept/version URL
   without adding a branch to legacy `src/main.ts`.
3. A headless pure reducer restores and changes serializable room state.
4. A room-scoped coordinator performs effects and rejects stale asynchronous
   results.
5. The browser reaches the provider only through a versioned JSON client.
6. A neutral headless provider deterministically generates `ax+b=c`, verifies
   exact rational intermediate steps, classifies invalid/ambiguous steps, and
   verifies solutions by substitution.
7. One anti-corruption mapper creates the KP semantic trace; the provider emits
   no KP assets, pixels, LaTeX-owned truth, DOM, or keyframes.
8. Symbolic and placeholder balance projections consume the same semantic IDs,
   transformations, and shared clock.
9. Searchable Review HTML, static math/diagram output, and a machine-readable
   inspection capsule work without interactive hydration.
10. Architecture, schema, inference, route round-trip, provider conformance,
    deterministic snapshot, and failure-fallback checks pass.

## Preservation Boundary

- Preserve the current semantic object, animation, equation-motion, graph,
  tutorial-card, FTC, dashboard, editor, export, and WebGL evidence.
- Do not globally migrate existing content or registries.
- Do not change visual semantics, existing URLs, or current renderer behavior
  unless a compatibility adapter is required and characterized.
- Do not promote the balance projection or new theme globally during this
  tranche.
- Do not add LLM execution, economics, programming, BFS, or new WebGL work.

## Smallest Rollback Unit

Each phase is independently reversible. The new concept-room route and
generated registry entry are the final integration switch; removing them must
leave the legacy application behavior unchanged. Provider, protocol, content,
and runtime scaffolds must remain unreferenced by legacy paths until their own
phase is accepted.

## Proposed 27-slice Long Loop

All slices target
`next-action.kp.concept-room.architecture-walking-skeleton-v0`. Each slice is
one focused commit after its verification passes. `Focused` means the named
contract checks; `standard` adds `npm run typecheck` and
`theseus workspace validate`; `broad` adds the relevant build, server, browser,
or integration gate. Any stop condition ends the autonomous loop before the
slice is marked complete or committed.

### Phase 1 — Fitness baseline and public boundaries

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s01` | **Legacy characterization:** inventory current cross-layer imports, global registries, `main.ts` routing, and content-owned styling into a reviewed exception baseline without moving code. | Low / focused | Baseline schema test; every exception resolves to a real source; `git diff --check`. | Commit baseline only. Stop if producing it requires changing runtime behavior. |
| `s02` | **Boundary declarations:** add the new logical boundary map and narrow `public-api.ts` entrypoint shells for kernel, authoring, domains, protocols, integrations, projections, and app adapters. | Medium / standard | Public-entrypoint resolution tests; no production consumer switched; typecheck; Theseus validate. | Commit declarations and empty-safe facades. Stop on import cycles or legacy breakage. |
| `s03` | **Architecture fitness gate:** enforce dependency direction and forbid new cross-subsystem deep imports while grandfathering only `s01` exceptions. | Medium / standard | Positive/negative import fixtures; baseline cannot grow unnoticed; typecheck; Theseus validate. | Commit gate and fixtures. Stop if enforcement requires a broad legacy migration. |
| `s04` | **Inference contract harness:** add positive and `@ts-expect-error` fixtures for literal IDs, typed handles, local invalid-reference errors, no leaked `any`, and compiler-cost sampling. | Low / standard | Dedicated type fixtures; typecheck; deterministic diagnostic expectations; Theseus validate. | Commit harness. Stop if public tests require speculative production APIs beyond the accepted builders. |

### Phase 2 — Neutral protocol and deterministic provider

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s05` | **Linear-problem protocol:** define runtime-schema-first exact-rational, equation, generation, step-verification, solution-verification, provenance, and error DTOs under `protocols/`. | Medium / standard | Schema accept/reject fixtures; inferred TypeScript conformance; headless compile; typecheck; Theseus validate. | Commit protocol only. Stop if any DTO imports KP or presentation types. |
| `s06` | **Exact rational kernel:** implement normalized rational arithmetic and linear-expression operations in the independent provider project. | Medium / standard | Unit and property tests for normalization, signs, zero denominators, equality, and arithmetic; provider headless compile; typecheck. | Commit arithmetic kernel. Stop on floating-point fallback or ambiguous normalization. |
| `s07` | **Deterministic generator:** generate bounded `ax+b=c`, `a != 0` problems from seed/version with `2x + 3 = 8` as the canonical fixed fixture. | Medium / standard | Seed determinism, bounds, solvability, exact solution, fixture stability, headless compile; typecheck. | Commit generator. Stop if generation depends on KP or nondeterministic ambient state. |
| `s08` | **Intermediate-step verifier:** classify canonical operations, compressed equivalent steps, valid simplification, one-sided mutation, arithmetic failure, unsupported form, and ambiguity. | High / standard | Equivalence/property tests; named classification matrix; adversarial invalid steps; provider conformance; typecheck. | Commit verifier. Stop if validity is inferred from LaTeX text or canonical-trace equality alone. |
| `s09` | **Solution verification and provider facade:** add substitution verification, capability descriptor, version/provenance response, and shared provider contract suite. | Medium / standard | Correct/incorrect fractional solutions; provider interchangeability fixture; schema round trip; typecheck; Theseus validate. | Commit provider public API. Stop if implementation details leak into the protocol. |
| `s10` | **Versioned HTTP adapter:** inject the provider into `/api/v1/linear-problems`, validate bodies, bound payloads, return structured errors, and keep transport outside the engine. | High / broad | Server route tests, malformed/oversized request tests, deterministic response fixture, existing server tests, `npm run build`, Theseus validate. | Commit transport adapter. Stop on unvalidated casts, provider singleton state, or regression to `/api/compile`. |

### Phase 3 — Content compiler and generated discovery

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s11` | **Inference-first authoring handles:** add `defineCapability`, `defineProviderRef`, and concept-builder primitives with literal preservation and no required generics at call sites. | Medium / standard | `s04` type fixtures; invalid capability/version combinations; declaration surface review; typecheck. | Commit public authoring primitives. Stop on inscrutable diagnostics or material typecheck slowdown. |
| `s12` | **Content manifest contract:** define mutable drafts and immutable published artifacts with schema, concept/version IDs, checkpoints, modes, semantic refs, capability majors, provider protocol, routes, Review metadata, and provenance. | Medium / standard | Runtime schema matrix; immutable-version and duplicate-reference tests; inference fixtures; typecheck; Theseus validate. | Commit manifest contract. Stop if executable callbacks enter the published schema. |
| `s13` | **Canonical content source:** author `content/mathematics/linear-equations/solve-with-balance` for `2x + 3 = 8` using only typed public handles and declarative copy/checkpoints. | Low / focused | Content validation; forbidden-import gate; expected checkpoint and capability refs; `git diff --check`. | Commit one content source. Stop if lesson-owned DOM, CSS, math verification, or keyframes are needed. |
| `s14` | **Deterministic publisher:** compile authoring TypeScript into a declarative artifact, resolved capability manifest, provenance, asset references, and integrity digest. | Medium / standard | Repeat-build digest equality; mutation changes digest; no executable payload fields; typecheck; Theseus validate. | Commit compiler and canonical artifact fixture. Stop on environment-dependent output. |
| `s15` | **Generated discovery:** discover validated content and generate typed catalog, canonical route, lazy-load, preload, and search metadata without central hand-written imports. | Medium / standard | Duplicate ID/version/route failures; deterministic ordering; generated-output freshness; typecheck; Theseus validate. | Commit generator and generated fixture. Stop if `main.ts` or a manual catalog switch must change per room. |
| `s16` | **Publication fitness gate:** enforce capability availability, parallel major resolution, provider protocol compatibility, immutable publication, and absence of authored runtime code or raw style values. | Medium / standard | Accepted/rejected publication cohort; missing capability/provider tests; style-role checks; typecheck; Theseus validate. | Commit publication gate. Stop if validation silently repairs invalid content. |

### Phase 4 — Headless room, effects, and route shell

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s17` | **Canonical route contract:** implement shared parse/format/canonicalize logic for concept version, checkpoint/time, mode/projection, parameters, focus, branch, provider provenance, and snapshot identity. | High / broad | Property round trips; malformed and old-schema handling; stable canonical URLs; server/client parity; typecheck; build; Theseus validate. | Commit headless route contract. Stop if URL meaning depends on browser state or a client router. |
| `s18` | **Room state and reducer:** add serializable immutable state, typed commands, pure transitions, replay, snapshot restoration, and separation from ephemeral hover/layout state. | High / standard | Reducer determinism, exhaustiveness, replay, invalid command, snapshot fixtures; typecheck; Theseus validate. | Commit reducer. Stop on hidden clock, DOM, provider, or mutable singleton dependencies. |
| `s19` | **Room-scoped effect coordinator:** interpret provider, URL, persistence, and lazy-load effects with request IDs, cancellation, disposal, and stale-result protection. | High / broad | Fake-effect tests; state-revision anchoring; cancellation/disposal; concurrent rooms; typecheck; build; Theseus validate. | Commit coordinator. Stop if components must own semantic effects or a global event bus is introduced. |
| `s20` | **Browser provider client:** call only the versioned JSON protocol, validate responses, and return typed effect results without importing the provider engine. | Medium / standard | Fetch fixtures; transport/schema/error cases; no provider-implementation import; typecheck; Theseus validate. | Commit client. Stop on trust of unvalidated JSON or KP mapping inside transport. |
| `s21` | **Strangler route shell:** mount one generated concept-room route beside the legacy app, lazy-load its artifact/runtime, preserve existing routes, and dispose cleanly without a new `main.ts` action branch. | High / broad | Legacy route characterization; direct/deep-link mount; navigation and disposal; `npm run build`; focused browser route smoke; Theseus validate. | Commit isolated shell. Stop on legacy state dual writes, broad `main.ts` rewrite, or broken existing routes. |

### Phase 5 — KP integration and plain projections

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s22` | **Anti-corruption mapper:** translate validated protocol problems and verification results into one KP semantic trace with stable IDs, exact values, operations, provenance, assumptions, and diagnostics. | High / standard | Canonical and generated trace fixtures; loss diagnostics; provider/KP dependency checks; existing semantic laws; typecheck; Theseus validate. | Commit sole mapper. Stop if provider DTOs become KP assets or canonical fixture matching substitutes for verification. |
| `s23` | **Plain symbolic projection:** interpret the shared trace through a minimal equation IR and KaTeX adapter with persistent semantic identities and no visual polish. | High / broad | Start/checkpoint/end semantic frames; KaTeX browser check; seek/rewind; reduced-motion structure; build; Theseus validate. | Commit symbolic projection. Stop if it invents math, owns room time, or requires content-specific DOM choreography. |
| `s24` | **Placeholder balance projection and theme plumbing:** map the same trace into an exemplar-local balance scene IR and prove shared semantic roles through typed DOM/KaTeX/SVG theme adapters. | High / broad | Cross-projection identity parity; shared clock; two-sided operation invariants; static SVG; accessibility labels; build; browser smoke; Theseus validate. | Commit structural placeholder only. Stop before aesthetic polishing or platform promotion. |

### Phase 6 — Review fallback and architecture closeout

| Slice | Subtarget and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s25` | **Review publication:** generate meaningful searchable no-JS HTML, KaTeX/static math, static balance SVG, checkpoint anchors, “Explore this state” links, print rules, and an inspection capsule from the published artifact. | High / broad | No-JS server fixture; browser Find/search; link round trips; print/static structure; machine capsule schema; build; Theseus validate. | Commit Review projection. Stop if it scrapes hydrated DOM or diverges from canonical checkpoints. |
| `s26` | **Failure containment and end-to-end smoke:** prove provider, Ask absence, capability, renderer, WebGL absence, invalid artifact, and unsupported-major failures preserve meaningful Review content and structured diagnostics. | High / broad | Failure matrix; direct canonical/snapshot routes; mount/switch/dispose; `npm run smoke:linear-equation`; existing browser/server checks; Theseus validate. | Commit resilience and smoke harness. Stop on blank failure UI, partial execution, or regressions outside the room. |
| `s27` | **Architecture closeout and mandatory stop:** run the full project gate, audit dependencies and legacy exceptions, record verification and source evidence, assess whether the loop was right, and stop for human architecture review before visual work. | High / broad plus manual runtime review | `npm test`; `npm run build`; `npm run smoke:linear-equation`; architecture and generated-artifact freshness gates; `theseus workspace validate`; manual canonical/no-JS/failure route review. | Commit closeout evidence only after all gates pass. Always stop before typography, color, choreography, hover-link, or balance-polish work. |

## Deferrals

- Exact font, palette, spacing, focus-ring appearance, and choreography.
- Polished traditional symbolic manipulation.
- Polished abstract balance geometry.
- Free-language LLM routing and Ask response choreography.
- Generalization to arbitrary public linear-equation content.
- Migration of FTC, tutorial cards, dashboard, or existing generated fixtures.
- Physical npm-package or service deployment boundaries.

## Promotion And Review

The architecture skeleton is accepted when the observable acceptance criteria
pass and an architecture review finds no content/provider/kernel ownership
leaks. That approval authorizes a separate visual-exemplar plan.

The balance projection remains exemplar-local until the approved linear room
and a second independent equation prove its reusable contract. House styling
is formalized as a capability here but visually approved only on the polished
linear-equation exemplar.

## Approval Gate

After this proposal is reviewed, explicit `go`, `execute`, `run it`, or
equivalent approval is required. Only then should the plan be split into small
phase files, committed, and executed phase by phase with a commit and report
after every phase.

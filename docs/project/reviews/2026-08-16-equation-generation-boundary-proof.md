# Equation Generation Boundary Proof

Date: 2026-08-16  
Status: slice `s14` evidence for
`run-contract.kp.post-convergence-infrastructure-compression-v1`

## Result

The three fixed pressure cases now compile on the first pass through one
tool-neutral, direct-import boundary. Function wrap returns the existing motif
plan, cancellation returns the existing semantic-motion choreography, and
distribution/factoring returns the existing canonical operation execution.
The boundary authored no timing, geometry, paint, or fallback behavior.

| Case | Trial before vocabulary projection | Direct boundary now | Returned authority |
| --- | --- | --- | --- |
| Function wrap | 1 typed repair round | 0 repair rounds | `function-wrap-motif-plan` |
| Cancellation | 1 typed repair round | 0 repair rounds | `cancellation-semantic-motion-plan` |
| Distribution/factoring | 1 typed repair round | 0 repair rounds | `distribution-operation-plan` |

The improvement is specifically attributable: `--list` exposes each surface's
canonical entity IDs and role bindings, so a tool can author the request in the
owned vocabulary instead of guessing aliases and waiting for
`equation-llm.entity.unresolved` repairs. This is a deterministic tool-contract
result, not a claim about live-model quality.

## Stable Proof

Run:

```sh
npm run prove:equation-generation-boundary
npm run test:equation-generation-boundary
```

The proof invokes each case 20 times to expose informational compile cost. On
this host the measured means were about 1.56 ms for function wrap and 0.62 ms
for cancellation and distribution/factoring. These wall-clock values are not
pass/fail budgets; first-pass acceptance, zero repairs, returned plan kinds,
and import closure are the durable assertions.

The tool runtime closure contains 87 repository modules and 893,753 bytes of
uncompressed TypeScript source. That number describes reachable source, not a
shipped browser bundle. The exact closure contains:

- no editor, renderer, Svelte, DOM, or browser modules;
- no root, `index.ts`, or `public-api.ts` barrel;
- no catalogue application runtime; and
- no live model runtime.

The proof initially caught one real broad edge:
`src/animation/choreography-compiler.ts` imported the Domain IR public barrel.
The compiler now imports its transition compiler and IR type owners directly.
The cancellation pressure authority likewise uses direct Domain IR owners.
No behavior changed; the narrower closure dropped five runtime modules and
roughly 51 KiB of reachable source.

## Bundle And Type Boundaries

The existing production bundle gate remains the shipped-code authority:

```sh
npm run check:animation-library-bundle-boundary
```

The inference attribution command remains the compiler-work authority:

```sh
npm run measure:inference-attribution
```

This proof does not substitute source-byte counts for either one. It locks the
generation command's own closure while those existing checks protect browser
chunks and TypeScript inference costs.

## Decision

The narrow generation boundary is accepted for deterministic tooling. Codex,
other editors, and later constrained LLM integrations can discover vocabulary
and submit JSON without importing the application. Live multi-model quality
evaluation remains explicitly deferred; the next slice may now map exact
repository reachability without expanding authoring scope.

# Legacy Equation Fade Reachability Audit

Date: 2026-08-13

Run: `run-contract.kp.typescript-threshold-architecture-convergence-v1`

Verdict: safe retirement candidate; no live paint caller

## Exact Path

The compatibility path is entirely contained in two production modules:

1. `src/domain-ir/semantic-equation-transition-compiler.ts` defaults an
   unsupported semantic transition to result status `fallback` and invokes
   `adaptKpSemanticTransitionGapToLegacyFade`.
2. `src/semantic/semantic-transition-gap.ts` converts the typed gap into a
   `{ kind: "whole-equation-fade", reasons }` value.

The compiler is re-exported through `src/domain-ir/public-api.ts`; the legacy
adapter and fallback type are not independently exported through a public
facade.

## Caller Classification

| Caller family | Count | Observed use |
| --- | ---: | --- |
| Production compiler-result callers | 8 outside the compiler | Five inspect semantic success or IR; three already request `typed-gap`. None reads `.fallback` or paints a whole-equation fade. |
| Direct production IR callers | 0 compatibility consumers | Direct IR compilation bypasses the result policy and is unaffected. |
| Tests calling the result compiler | 13 files | Domain conformance tests inspect semantic IR. Only `semantic-equation-transition-compiler.test.ts` asserts the legacy fallback value. |
| Scripts, generated metadata, serialized Article source, and route manifests | 0 | No compatibility value crosses a generated or persistence boundary. |
| Browser/rendering code reading `.fallback` | 0 | Unrelated Graph3D and tutorial-export fallback contracts have different owners and shapes. |

Two production audits call the result compiler without an explicit policy and
classify every non-semantic result as a failed promotion. One editor projection
uses the label `fallback` for any non-semantic status but never reads or paints
the legacy fallback payload. Changing the compiler default to a typed gap
preserves those observable decisions.

## Closure Evidence

- **Reference:** exact repository search finds the adapter/type only in their
  owner, compiler, ledger, and one compiler test.
- **Replacement:** `KpSemanticTransitionGap` already carries reason,
  diagnostics, repair kind, and target id.
- **Fixture:** generated authoring, choreography, reader planning, and catalogue
  conformance already request or handle typed gaps.
- **Route:** no catalogue, reader, editor, or Article renderer consumes the
  whole-equation-fade payload.
- **Export:** no public authoring facade, generated JSON, or publication bundle
  serializes it.

## Retirement Sequence

1. Preserve typed-gap diagnostics and repair semantics for every unsupported
   category.
2. Make the result compiler return only `semantic` or `gap` and remove the
   policy input.
3. Delete the adapter and legacy type after all callers compile.
4. Move the ledger entry to retired paths and ratchet zero production
   references to `legacy-fade`, `whole-equation-fade`, and the adapter name.

This retirement changes no approved visual choreography because the payload
has no paint consumer. The separately named Graph3D, static-export, tutorial,
and presentation-constraint fallbacks are out of scope and remain unchanged.

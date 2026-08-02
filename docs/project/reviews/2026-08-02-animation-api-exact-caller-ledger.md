# Animation API exact caller ledger

Date: 2026-08-02  
Status: source-derived audit after verified generated solve integration

## Outcome

The caller evidence supports one narrow new public boundary and rejects a broad
barrel consolidation.

`src/animation/canonical-balanced-solve-animation.ts` is the only current
animation-authoring seam shared by the named canonical fraction and verified
generated-solve callers. It has exactly two production callers:

1. `src/animation/fraction-composition-equation-adapter.ts`
2. `src/animation/verified-linear-problem-animation-compiler.ts`

One type fixture also imports it. No `src/animation/public-api.ts` exists yet.
Slice `s12` may therefore define a small `KpAnimationAsset`-centric facade around
this proven seam and the exact asset types/laws its two callers require.

The public facade must not re-export the complete internal asset module. Direct
source analysis finds 126 production and 43 test callers of
`src/animation/asset.ts`. That module owns far more than the two authoring callers
need: validation internals, builders, reference compilation, projection support,
runtime types, and compatibility surfaces.

## Reproducible inventory

- Full exact paths: `npm run audit:animation-api-callers`
- Compact counts: `npm run audit:animation-api-callers -- --summary`
- Executable classification:
  `src/architecture/animation-api-caller-ledger.ts`
- Exhaustiveness and migration ratchets:
  `tests/animation-api-caller-ledger.test.ts`

The scanner resolves static relative imports across `src/`, `tests/`, and
`scripts/`; it does not infer callers from similar names or documentation prose.
Slice `s11` established 15 targets. Slice `s12` added the new animation facade as
the sixteenth target. All 16 have zero unclassified “other” callers.

| Surface | Production | Tests | Scripts | Disposition |
| --- | ---: | ---: | ---: | --- |
| Animation authoring facade | 2 | 3 | 0 | Canonical fraction and verified generated solve only |
| Internal balanced-solve seam | 1 | 2 | 0 | Public facade is its sole production caller; keep implementation internal |
| Complete animation asset core | 126 | 44 | 0 | Keep internal; generated compiler no longer imports it directly |
| Concept authoring facade | 1 | 11 | 1 | Keep separate |
| Provider integration facade | 6 | 8 | 0 | Keep separate |
| Reader compiler facade | 1 | 15 | 0 | Keep internal |
| Reader runtime facade | 21 | 19 | 0 | Keep internal |
| Reader renderer facade | 4 | 30 | 0 | Keep internal |
| Equation motif facade | 0 | 0 | 0 | Keep separate canonical vocabulary |
| Experimental editor API catalogue | 5 | 2 | 0 | Defer |
| Semantic compatibility ledger | 0 | 1 | 1 | Keep internal evidence |
| Generated display metadata | 1 | 0 | 0 | Candidate only after exact replacement |
| Generated search metadata | 1 | 0 | 0 | Defer |
| Generated animation compiler | 2 | 2 | 0 | Keep internal |
| Generated explanation compiler | 2 | 1 | 0 | Keep internal |
| Generated catalogue reader | 2 | 1 | 0 | Keep internal |

## Authority boundaries

### Public-looking modules that are not animation authoring

- `src/authoring/public-api.ts` publishes concept manifests and publication
  fitness. Its only production caller is `src/bootstrap.ts`; it exports no
  `KpAnimationAsset` symbol.
- `src/integrations/public-api.ts` owns provider clients, trace mapping, and the
  verified bridge. Its six production callers should not acquire timing,
  geometry, prose, or renderer authority.
- Reader compiler, runtime, and renderer `public-api.ts` files are subsystem
  boundaries. Their production callers stay within reader code except for the
  explicitly bounded operation-evaluation adapter.
- `src/editor/api-catalog.ts` has five UI/dashboard callers. It remains an
  editorial projection, not the source of executable exports.

### Motifs and compatibility

The equation motif facade currently has zero direct imports. That is not deletion
permission: it is the canonical renderer-neutral vocabulary named by architecture
and compatibility evidence, while implementation modules import their local
siblings. Slice `s12` must not turn it into a universal motif registry, and slice
`s14` may retire only duplicate facade paths with an exact replacement.

The semantic compatibility ledger likewise has no production import, but one
architecture checker and one test consume it. More importantly, its entries name
live authors and consumers. Barrel-import counts cannot retire those underlying
contracts. The Jacobian/Hessian presentation remains a human disposition
candidate with unique semantic evidence, not an API-deletion target.

### Generated-session internals

The generated animation compiler, explanation compiler, and catalogue reader have
small, fully observed caller sets. They stay internal because they encode the
first provider trace, learner spine, and host projection respectively. The public
facade may replace their direct import of asset construction primitives; it must
not export these exemplar-specific compilers.

## Safe next move

Slice `s12` should create the absent animation authoring facade with only the
types, constructor, validation/law checks, and canonical balanced-solve factory
required by both observed production callers. Slice `s13` can then migrate those
two callers and prove semantic/static/browser preservation. Generated display
metadata remains a one-caller candidate, but no retirement is authorized until
that migration proves an exact replacement for searchable labels, contexts,
review state, and promotion evidence.

# Economics Equilibrium Exemplar Model Contract

Date: 2026-08-01
Status: frozen for exemplar implementation

## Canonical Reference

The bounded reference is one linear demand-intercept shift:

- horizontal quantity axis $Q$ from 0 through 12;
- vertical price axis $P$ from 0 through 20;
- persistent supply $P = 2 + Q$;
- persistent demand whose intercept changes from 14 to 18:
  $P = 14 - Q$ to $P = 18 - Q$; and
- exact equilibrium movement from $(Q,P)=(6,8)$ to $(8,10)$.

The model owns these equations and exact intersections. Runtime frames and the
SVG presenter sample the model; neither may solve or revise economics.

## Observable Acceptance

- Quantity is horizontal and price is vertical in visible and nonvisual state.
- Supply remains fixed while demand moves up/right through one named intercept
  parameter.
- The old equilibrium yields cleanly to the new equilibrium, with exact values
  synchronized across graph, inline equations, and narrative.
- Prices above equilibrium retain the surplus-side meaning; prices below
  equilibrium retain the shortage-side meaning.
- Direct seek, rewind, parameter restoration, accessibility, exclusive paint
  ownership, and a stable catalogue capture pass before review.
- The default catalogue surface continues to show only Play/Pause and scrubber;
  exemplar parameters remain behind `Parameters`.

## Preservation Boundary

The supply curve identity, demand curve identity, equilibrium role,
surplus/shortage sides, demand-intercept parameter, and narrative claim lineage
must survive every frame. Existing runtime clocks, graph ownership, catalogue
host, review history, algebra assets, and graph callers remain unchanged.

## Scope And Rollback

This is one exact authored model, not a solver, tax/subsidy laboratory,
universal parameter schema, renderer category, scene graph, or graph-specific
clock. The independently reversible rollback unit is the economics domain
contract and model, its presenter/asset registration, focused tests, and
catalogue evidence. No existing caller must change semantics to host it.

## Source

- `domains/economics/supply-demand-equilibrium.ts`
- `docs/project/reviews/2026-08-01-catalogue-curation-cross-domain-promotion-long-loop-proposal.md`
- `docs/project/decisions/2026-07-30-kp-persistent-workspace-composition-sequence.md`

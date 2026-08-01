# Animation Catalogue Interaction Baseline

Date: 2026-08-01
Status: characterized before persistent-selection implementation

## Observed Selection Boundary

The approved catalogue shell is visually persistent while a single artifact is
mounted, but ordinary asset selection still follows the result row's native
anchor as a full document navigation. The root catalogue renderer then disposes
review capture, players, equation-stage caches, and WebGL leases before
replacing the application root and hydrating a fresh shell.

The stable `npm run visual:animation-catalogue` flow now observes the transition
from `animation.linear-solve.solve-x` to
`animation.generated.radical.square-root-as-power` after setting probes on the
document, shell, and review composer. It records this before-state:

- document identity is replaced;
- shell identity is replaced;
- review-composer identity is replaced and its unsaved draft is empty;
- the rail query resets to empty;
- the inspector returns from Parameters to Details; and
- the selected artifact URL and native no-JavaScript link fallback remain
  correct.

The result is written to the disposable
`tmp/codex/animation-catalogue/manifest.json` under the typed
`kp.animation-catalogue-interaction-baseline.v1` record. The stable command,
not the disposable output path, is the durable proof entrypoint.

## Desired Replacement Boundary

The persistent-selection change should preserve the current document and the
three-region shell while replacing only state owned by the selected artifact:
player/controller, surface hydration, host observation, selected health,
inspector contents, URL artifact/playhead, and capture-provider artifact state.

The rail query, rail scroll, current focus when still valid, inspector choice,
review-composer element and unsaved draft must survive. Direct links,
modified-click behavior, external destinations, unresolved assets, and
JavaScript-disabled use must retain native navigation fallback.

This baseline does not authorize the implementation. The next slice defines
the typed selection-controller contract; the following slice integrates it.

## Sources

- `src/editor/animation-catalogue-shell.ts`
- `src/main.ts`
- `scripts/capture-animation-catalogue.ts`
- `docs/project/reviews/2026-08-01-catalogue-curation-cross-domain-promotion-long-loop-proposal.md`

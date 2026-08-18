# KP global development dock closeout

Date: 2026-08-18

## Outcome

The development dock now owns the controls that must be available across development surfaces: Review, View, Copy link, and theme. Route contributions remain contextual and cannot replace those global controls.

Catalogue and Coverage are two projections of the same addressable animation state. Switching between them uses same-document navigation and preserves the selected artifact, playhead, style settings, and focus state. Copy link copies that exact URL rather than a route approximation.

The development page directory now exposes 29 verified destinations through one development server. Three public pages that retain dedicated production builds are composed lazily in serve mode, so this convenience does not pull their compilers into the main production entry.

## Verification

- `npm run test:dev-toolbar` — 31 passing tests.
- `npm run visual:development-dock` — exact-state Catalogue/Coverage handoff and clipboard behavior pass in Chromium.
- `npm run test:browser:page-directory` — all 29 directory destinations resolve.
- `npm run typecheck` — TypeScript and Svelte checks pass with zero Svelte diagnostics.
- `npm run check:architecture` — dependency, framework-neutrality, semantic-animation, and compiler-authority gates pass.
- `npm run build:internal-studio` — passes.
- `npm run build:bundle` — passes; serve-only composition is absent from the production graph.
- `npm run check:animation-library-bundle-boundary` — passes its four governed budgets.

## Preserved boundary

The dock changes development navigation and control ownership only. It does not alter animation semantics, choreography, or production publication controls.

## Deferred human judgment

Full-motion log/exponent playback can still appear to jerk between semantic states. That perceptual issue is explicitly deferred to the combined visual checkpoint after exact-state review capture is finished. Passing structural and endpoint tests must not be interpreted as human approval of that motion.

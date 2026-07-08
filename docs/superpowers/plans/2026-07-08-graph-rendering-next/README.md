# Graph Rendering Next Plan

## Objective

Improve graph rendering quality and motion after the WebGL renderer migration:

- Smooth graph curves and visual borders where smoothing improves readability.
- Add adaptive surface resolution without making slider interaction expensive.
- Introduce a shared 2D graph scene API that can feed SVG now and WebGL later.
- Add transition scaffolding for mesh/donut/hyperplanes and 3D-to-2D graph motion.

## Phases

1. `01-smoothing.md` - add reusable smoothing helpers and route 2D curve/border data through them.
2. `02-adaptive-resolution.md` - add semantic/render settings for surface resolution and reuse them in SVG/WebGL samplers.
3. `03-2d-scene-api.md` - build a retained 2D graph scene model with stable roles and IDs.
4. `04-surface-morph-targets.md` - add common-grid morph targets for mesh, donut, and hyperplanes.
5. `05-3d-to-2d-transition.md` - add camera/axis/flatten transition planning data for 3D-to-2D handoff.
6. `06-browser-verification.md` - add browser checks for quality and interaction paths.

## Verification Strategy

- Use test-first slices for behavior changes.
- Run focused Node tests for each phase.
- Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check` before each phase commit that touches shared graph/rendering behavior.
- Use Playwright screenshots after browser-facing rendering changes.

## Deferrals

- Full WebGL 2D renderer implementation is deferred until the 2D scene model exists.
- Full animated transition playback is deferred until morph targets and transition descriptors are in place.
- Production performance budgets for old/mobile devices are deferred until there is enough transition code to measure meaningfully.

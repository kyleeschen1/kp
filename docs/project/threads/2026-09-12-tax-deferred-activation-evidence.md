# Tax host deferred activation evidence

Canonical host: `/experiments/kinetic-figure/supply-tax/`, generated canonical
market source, existing tax/log-equation/surface-contour/code renderers and clocks.
No new animation or content. Static authority/render functions moved into three
runtime-independent modules, with compatible exports from their previous owners.

## Measured delivery

`npm run build:bundle` and
`npm run visual:architecture-cost -- --tax-only --activation` passed. Three fresh
loads each at 1x and 6x CPU, Chromium at 390x844, same audit methodology. All six
cohorts requested identical bytes and reported no page errors.

| Requested quantity | Audit baseline | Deferred host |
| --- | ---: | ---: |
| Initial JavaScript raw | 2,437,593 | 1,894,809 |
| Initial JavaScript gzip | 642,444 | 509,883 |
| Initial CSS gzip | 30,307 | 31,360 |
| Initial fonts gzip | 42,766 | 42,766 |
| Additional JavaScript on companion activation | already eager | 140,666 |

Initial JavaScript is 132,561 bytes (20.6%) smaller. Fully activated JavaScript
is 650,549 bytes gzip: 8,105 bytes larger than baseline. This is a startup
deferral, not elimination of the renderer cost. CSS partitioning remains later
work. Chunk names and individual entry sizes are not the measurement boundary.
The first equation stage is partially visible on this phone-sized viewport and
correctly activates; the 3D and code stages remain idle until visited. All three
then reach controller readiness, native equation/3D readiness, and respond to
Next through their original playback owners.

Tax readiness times were 369–762ms at 1x and 1,437–2,517ms at 6x. These noisy
local sensitivity samples do not establish a startup-time win or certify a
physical low-powered device. The deterministic delivery reduction is the claim.

## Preservation and regression evidence

- `npm run visual:focus-deck-multi-card` with scoped grep checks: all four
  keyboard step owners; code slider/direct hash; gradual/reversible passage and
  horizontal wheel; direct equation hash; disposal/remount of final native
  rewrites; activated desktop/phone fit; delayed first keyboard command;
  delayed held native passage travel; persisted/non-persisted pagehide.
- Twenty focused model, projection, authority-routing and deferred lifecycle
  unit checks passed. Full typecheck and production build passed.
- The delayed keyboard and native-travel checks reproduced lost input before
  repair. The host now hands queued commands/native gesture signals and observed
  scroll position to the installed controller, not a parallel timeline.
- Required stage selectors are explicit per existing renderer; the 3D stage
  does not have the same CSS class as equation/code stages. A browser failure
  caught that incorrect assumption before acceptance.
- Full-page screenshots now explicitly visit deferred stages before testing
  activated layout. Existing native-paint assertions remain; no readiness gate
  was replaced with mere controller readiness.
- `npm run generate:equation-reachability` updates the existing import ledger.

The pagehide tests drive lifecycle signals, not a claim of physical Safari
back-forward-cache or edge-gesture certification. Browser-wide release checks
remain the final run boundary. Static models/HTML still cost CPU and bytes;
there is no new universal renderer, scheduler, or content cache.

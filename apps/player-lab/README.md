# Reusable saddle player lab

This independently runnable host reuses one prepared saddle animation in an
article-sized view and a compact reference card. Each mount owns its clock,
canvas, observers and WebGL lease. It imports no notebook, chat or experiment
runtime. This is a bounded saddle adapter, not a universal animation player.

## Run

From the repository root:

```sh
npm run dev --prefix apps/player-lab
npm run test --prefix apps/player-lab
npm run typecheck --prefix apps/player-lab
npm run build --prefix apps/player-lab
npm run visual --prefix apps/player-lab
```

Open <http://127.0.0.1:8013/>. Seek the article to its midpoint: its denominator
becomes 6 while the card remains at 8. Reverse the card independently. Resize
to phone width, then remount repeatedly: two working canvases remain. The
browser check starts and stops its own temporary server unless that port
already serves the lab. It writes disposable captures under
`tmp/codex/player-lane-browser`; it is not a persistent development service.

## Contract

Import `src/animation-player/public-api.ts`:

```ts
const animation = prepareSaddleAnimation();
const article = mountSaddlePlayer(articleElement, { animation });
const card = mountSaddlePlayer(cardElement, { animation, initialProgress: 1 });
article.seek(0.5);
card.play("rewind");
article.dispose();
card.dispose();
```

Hosts give their mount elements a nonzero width and height. Optional colors and
`onChange` integrate with the host's theme and controls. The player appends and
removes only its own DOM; mounting twice in the same live host is rejected.
Disposal is idempotent. Calls on a disposed playback owner fail explicitly.
`createSaddlePlayback` also exposes the headless controller with an injectable
scheduler; it is exercised without a browser in the focused tests.

Preparation shares immutable semantic source and CPU geometry. Each mount
uploads its own retained buffers and consumes one of the existing two WebGL
leases per document. This does **not** establish a shared-context/many-vignette
renderer. Invisible or hidden-document playback pauses, without automatic
restart. Reduced motion uses exact endpoints. Context loss and unavailable
WebGL retain the native equation and expose an explicit reason; remount retries.

## Authority and preservation

- Canonical artifact: `animation.graph-3d.saddle-denominator-four-to-eight`,
  created by `src/animation/graph-3d-saddle-parameter-asset.ts`.
- Semantic authority: the existing Graph3D trace, runtime sampler, saddle
  expression/gradient and graph projection. The artifact's fixed camera is
  retained. Absolute clock positions are translated explicitly to the domain
  sampler's forward coordinate, including during reverse.
- Renderer: the existing direct-WebGL retained pipeline, extracted into
  `src/animation-player/{gpu,geometry,shaders}.ts`. The original experiment
  delegates through its own renderer/model adapters. Shader bytes and geometry
  algorithms are preserved; GPU disposal additionally guards repeat releases.
- Section selection, clipping choreography and its salience remain in
  `src/experiments/direct-webgl-graph/section.ts`. They are not imported by
  this player or promoted by this lab.
- Original fraction notebook, chat, scrolling, themes, global styles and
  dependencies are unchanged. No iframe or new rendering dependency is added.

The reversible unit is this lane plus the three experimental adapter files.
Root integration owns module classification, aggregate checks and the original
graph browser-preservation run. Aesthetic acceptance is not claimed by tests.

## Candidate evidence

At the lane checkpoint, 16 unit checks pass (five player lifecycle/identity tests
and all 11 original graph semantic/geometry tests). Scoped TypeScript and the
independent production build pass. Three Chromium workflows pass for independent
playheads, responsive sizing, repeated remount, graphics loss/retry and unavailable
WebGL. The desktop capture was inspected: both surfaces, labels, controls and
native equations are visible. An added browser-test type check initially found
unrefined element types; explicit canvas guards repaired it, and the complete
scoped type check passes.

The production lab is approximately 87 kB JavaScript / 25.4 kB gzip with 50
transformed modules and no Three.js. These are Vite output estimates, not network
transfer or frame-time measurements. The original graph's full browser suite
and cross-browser integration are reserved for the integrator's combined run.

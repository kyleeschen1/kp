# Selected Equation and KaTeX Capability Split

Date: 2026-08-02  
Status: implemented and verified in `s22`

## Result

KaTeX and the equation renderer are no longer part of every catalogue
selection. The host derives two explicit optional capabilities from the
selected animation surface:

- `equation-katex` registers the equation adapter and KaTeX stylesheet only
  for an equation slot;
- `graph-svg-katex-labels` registers the SVG graph presenter and KaTeX
  stylesheet only for one of the six graph animations it can meaningfully
  paint.

The small graph-support authority is separate from the renderer, so deciding
that a 3D graph does not need the SVG capability does not import graph paint or
KaTeX. The legacy editor renderer is also route-lazy; the shared entry no
longer imports it merely because the editor and catalogue use the same page.

Before an optional module settles, the catalogue exposes an `aria-busy`
loading region and named artifact status. Editor and library views put their
static, accessible stage labels in the document before awaiting the selected
renderer. Player hydration still waits for registration, so the controller's
single initial frame cannot race a missing adapter.

## Production Closure Change

The six-route attribution command repeats every route twice with cache disabled
and now fails if equation or KaTeX ownership leaks back into an unrelated
selection.

| Route | Script gzip before | Script gzip after | Change | KaTeX result |
| --- | ---: | ---: | ---: | --- |
| generated/verified solve-x | 426,195 | 401,462 | -24,733 | selected equation capability |
| vector dot projection | 410,192 | 325,269 | -84,923 | selected SVG-label capability |
| economics equilibrium | 405,115 | 319,776 | -85,339 | selected SVG-label capability |
| exact fraction quantity | 470,358 | 389,675 | -80,683 | native selected math script; no global CSS or font request |
| 3D graph | 541,455 | 367,248 | -174,207 | no KaTeX script, style, font, or equation adapter |
| addition execution trace | 408,699 | 229,220 | -179,479 | no KaTeX script, style, font, or equation adapter |

The main-host static closure fell from 420,111 to 232,146 gzip bytes, a
187,965-byte (44.7%) reduction. The change did not move cost into a hidden
feature-pack allowance. The bundle boundary now reports the decomposition
explicitly:

- metadata outer shell: 10,456 / 50,000 gzip bytes;
- default main host: 232,146 / 490,000 gzip bytes;
- shared selected math capability: 182,343 / 190,000 gzip bytes;
- place-value feature closure beyond the default host and shared math:
  71,801 / 75,000 gzip bytes.

The 190,000-byte selected-math ceiling is a new ownership ratchet, not a wider
product target. The approved 250,000-byte script and 2.5-second LCP targets are
unchanged. The programming route is already below 250,000 emitted gzip bytes;
its measured browser script transfer is 250,083 bytes and remains an exact
residual for the optional-capability and performance closeout slices.

## Verification

- delayed equation-capability loading leaves a visible, accessible status;
- the equation stage keeps identical width and height through font settlement,
  with zero observed layout-shift score in the focused Chromium check;
- equation, vector, economics, exact-quantity, and 3D native paint remain
  honest; the programming row remains an explicit capability gap;
- generated solve-x, vector projection, 3D lease/context-loss behavior,
  direct seek, rewind, and reduced-motion browser checks pass; and
- typecheck, production build, architecture, selected-math attribution,
  split bundle budgets, and focused unit tests pass.

Stable commands:

```sh
npm run test:browser:animation-equation-capability
npm run perf:animation:attribution
npm run check:animation-library-bundle-boundary
```

## Boundary for the Next Slice

This slice does not claim that the host is fully isolated. API-catalog and
animation-diagnostics code still appears in all six route closures, and graph,
domain-adapter, player, and broad library ownership remains in the common
closure. `s23` owns those selected-caller boundaries. Layout probes and host-
contract geometry remain `s24`; the full normal/constrained target decision
remains `s25`.

# Animation Capability Closure Attribution

Date: 2026-08-02  
Status: measured baseline for slices `s22`–`s25`  
Stable command: `npm run perf:animation:attribution`

## Result

The production catalogue route has a reproducible capability-loading problem,
not an unbounded Three.js problem. Three.js is correctly lazy and appears only
for the selected 3D graph. By contrast, every measured selection currently
requests the equation surface, KaTeX JavaScript and CSS, the API catalogue, and
animation diagnostics. This includes the WebGL graph and the programming row,
which use no fonts in the measured state.

The attribution harness builds from the Vite manifest, launches the production
preview, records browser resource timing with cache disabled, maps each emitted
script, style, and font back to its manifest owner, and repeats every route
twice. It fails when either run has a different exact resource closure. The
2026-08-02 capture used manifest SHA-256
`d6d6784c598a2fd71c7ef7fc512bf513953337c55295217a201154c832829bf1`;
all six closures reproduced exactly.

## Route Closure

The script and style figures are emitted gzip bytes. Font figures are the
served WOFF2 byte count; already-compressed font files have effectively equal
gzip size. Transfer bytes remain in the disposable JSON report for transport
diagnosis and are not used as a build ratchet.

| Selected route | Host result | Script gzip | Style gzip | Font bytes | Exact route-only closure |
| --- | --- | ---: | ---: | ---: | --- |
| generated/verified solve-x | painted | 426,195 | 22,331 | 42,712 | algebra pack and four algebra-specific modules |
| vector dot projection | painted | 410,192 | 22,331 | 68,036 | bold KaTeX font only |
| economics equilibrium | painted | 405,115 | 22,331 | 42,712 | economics pack |
| exact fraction quantity | painted | 470,358 | 22,331 | 26,272 | eight exact-quantity/native-KaTeX modules |
| 3D graph | painted | 541,455 | 22,331 | 0 | Three.js WebGL chunk only |
| addition execution trace | capability gap | 408,699 | 22,331 | 0 | programming pack and adapter modules |

The programming result is intentionally honest: the row still reports
`capability-gap`. Its native surface is the objective of slices `s26`–`s29`, so
this measurement does not count a placeholder as paint.

## Common Closure

All six routes share 79 scripts totaling 404,981 gzip bytes and two styles
totaling 22,331 gzip bytes. The current main-host static closure is 420,111
gzip bytes, 69,889 bytes below its temporary 490,000-byte ceiling. The largest
common ownership signals are:

| Manifest owner | Common gzip bytes | Why it matters |
| --- | ---: | --- |
| KaTeX | 76,151 | requested even by 3D and programming selections that load no fonts |
| `src/main.ts` | 50,723 | entry composition still owns too much selected-surface machinery |
| equation surface adapter | 45,791 | requested by all six selections |
| animation player controller | 30,837 | shared player cost; preserve unless later attribution proves optional pieces |
| linear-solve adapter | 25,103 | algebra implementation is in every route closure |
| KaTeX texture atlas | 18,189 | equation/WebGL label implementation is in every route closure |
| main stylesheet | 14,377 | catalogue shell and surfaces remain co-owned |
| visual motif | 13,959 | broad motif implementation is in every route closure |
| graph transitions | 12,571 | graph implementation is in equation and programming closures too |
| API catalogue | 9,155 | development/review inventory is in every route closure |
| KaTeX stylesheet | 7,954 | requested before a selected caller demonstrates math typography need |

Animation diagnostics are also common at 2,008 gzip bytes. Their size is
modest, but their unconditional ownership is still contrary to the selected-
capability contract.

The older 2026-07-17 baseline recorded 357,656 gzip bytes for the entry script,
130,823 gzip bytes for Three.js, and 489,079 initial script-transfer bytes on
the normal route. It predates the current split chunk topology, so it is useful
as historical context rather than a file-for-file comparison. The current
measurement establishes a route-aware replacement without widening any target.

## Decisions for the Repair Slices

1. `s22` should remove equation/KaTeX implementation from selections that do
   not request it. Accessible and static content must exist before asynchronous
   typography settles, and the split must not introduce blank content or layout
   movement.
2. `s23` should make graph/WebGL, programming/code, diagnostics, and API-catalog
   ownership selected-caller driven. Three.js already demonstrates the desired
   route-exclusive behavior and should remain untouched except for preservation
   checks.
3. `s24` should reserve surface and label geometry at the host contract rather
   than encoding per-artifact dimensions in the shell.
4. `s25` should rerun this exact six-route matrix alongside the normal and
   constrained performance harness. The 250,000-byte script and 2.5-second LCP
   product targets remain fixed.

No visual treatment, catalogue disposition, vector generalization, or public
API is changed by this attribution slice.

## Reproduction

```sh
npm run build
npm run perf:animation:attribution
```

The stable command writes its full request log and owner matrix to
`tmp/codex/animation-capability-attribution.json`. That file is disposable;
this review, the committed harness, and its conformance tests are the durable
evidence.

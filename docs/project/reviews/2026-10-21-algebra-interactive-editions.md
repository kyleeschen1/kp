# Portable algebra: implementation and evidence

Completed continuation: `run-contract.kp.algebra-interactive-editions-v1`, backed by
`../2026-10-21-algebra-interactive-editions.md`. The accepted whole-and-parts
source and existing five-state source now build through explicit
`author:composed-algebra-publication --source <path> --interactive` selection.
The existing static v1/v2 command remains available and unchanged in output form.

## Reader and publication checkpoint

The read-only host uses the existing native card, extracted shared scaffold and
the same verified algebra compiler. No replacement math/motion engine, editor
session, default source fixture or application server is needed. Text remains
above the stage. The static reading, questions, self-checks, exact source and
publication evidence remain in every edition even if enhancement fails.

Pinned URL hashes restore fractional step positions against the embedded source;
wrong/malformed pins preserve the incoming URL and produce an actionable gap.
Editing the hash can recover. Source cannot be selected by playback location.
Page departure during preparation disposes the eventual surface; retained pages
pause, and final disposal releases controls and location subscriptions.

The immutable writer owns complete file identity and rejects modified or extra
files. A real-process CLI regression checks build/check and damaged output.
Static builds do not load the new browser bundler. Publication compilation now
lives outside the CLI entrypoint, retaining prior exports for compatibility.

Checks at this checkpoint: seven focused unit/CLI/publication checks, six
Chromium edition checks, three original-host checks, full types and architecture
pass. Whole-and-parts mobile screenshot inspected: accepted text-above structure
and native equation preserved. Full corpus and final integration are pending.

Failures and repairs:

- Initial actual CLI stopped at an unsettled top-level await: interactive module
  imported its own CLI. Extracted publication compilation breaks the cycle; real
  command round trips now pass.
- Initial packaged browser load reported `__VITE_PRELOAD__` undefined. Early
  `generateBundle` capture preceded final bundler processing. Capture final build
  output instead and reject unresolved placeholders; both sources now animate.
- Lifecycle test initially assumed ResizeObserver use. This owner uses event
  listeners; removed that unsupported assumption and assert actual controls,
  location updates and departure-during-preparation behavior.
- Type checking caught an unused extraction import and a test ES2023 array
  helper outside the configured target. Removed the import and used ES2022
  copy/reverse. Full types subsequently pass.
- First three-browser cohort: 17/18 pass; Firefox reverses an invisible leaf with
  one 1/60px layout-unit difference. Comparison now retains exact semantic IDs,
  text and opacity with <0.05px coordinate tolerance. Final cohort rerun pending.

## Measured baseline before import repair

`npm run measure:algebra-editions` includes all emitted lazy chunks:

| Consumer | Raw JS bytes | Sum of gzip bytes |
| --- | ---: | ---: |
| Edition | 1,409,619 | 369,974 |
| Editor | 1,520,247 | 402,100 |

Whole-and-parts static closure: 1,252,917 raw / 893,201 gzip bytes; interactive:
2,674,251 raw / 1,266,191 gzip bytes. Manifest bytes are separate (8,254 / 13,106).
The five-state case is also measured in the script. These are complete archives,
including every font format and source/proof reading evidence, not actual HTTP
transfer.

## Preservation and cost result

The preservation checkpoint cohort passed 22 checks: seven preservation checks in Chromium,
Firefox and WebKit, plus one Chromium timing diagnostic. The diagnostic is
intentionally skipped in the other two engines, not a missing preservation gate.
Tests cover both source lengths, fractional reload in a fresh browser context,
reverse, exact identities/opacity, local asset closure, phone containment,
reduced-motion keyboard, no-script reading, invalid source and location recovery,
retained/final page lifecycle and departure while fonts/native preparation wait.

The reader now coalesces travel samples before writing history (250ms idle), and
flushes the exact position on page departure. One hundred rapid scrub samples
produce one history update; a pending write cannot overwrite a newly invalid
link. That lifecycle repair adds 155 raw / 45 gzip JavaScript bytes.

A narrow-entrypoint extraction experiment did not improve complete emitted cost:
48 fewer raw bytes but 60 more gzip bytes, with five additional modules. It was
fully reverted. Existing tree shaking already removes unused function bodies;
splitting these modules did not remove the real compiler/native dependencies.
No semantic owner, required dependency or authenticated mount was weakened.

Final complete JS: edition **1,409,843 raw / 370,031 gzip**; editor
**1,520,247 raw / 402,100 gzip** (32,069 gzip bytes, about 8%, less for reading).
Both contain 35 emitted JS chunks. Whole-and-parts interactive archive:
2,674,475 raw / 1,266,248 gzip, plus 13,106 manifest bytes; five-state archive:
2,675,901 raw / 1,265,729 gzip, plus 13,106 manifest bytes. Static bytes unchanged.

`scripts/algebra-edition-budgets.json` establishes complete-consumer limits:
385,000 / 418,000 JS gzip bytes for edition/editor; static archive
1,320,000 raw / 940,000 gzip; interactive archive 2,820,000 raw / 1,330,000 gzip;
manifest 14,000 raw. These initial ceilings retain roughly 4–7% bounded headroom
over measured consumers, not an amendment to a previously failing budget.
The executable gate includes all chunks/assets and prevents edition imports of
editor sessions, draft staging, default fixtures or host selection. Mutation
tests prove cost and authority violations fail. `npm run measure:algebra-editions`
and `tests/algebra-edition-costs.test.ts` pass.

Three unthrottled local cold samples observed readiness at 338–360ms; reloads at
289–334ms. All requested 38 resources including 25 scripts, decoded 1,402,767
bytes, and transferred 1,414,467 bytes with HTTP overhead. Recorded long tasks
were 176–207ms. This plain test server has no compression or explicit cache
headers; warm means same-context reload, not proven cache savings. Readiness
includes automation overhead. These measurements expose remaining startup work;
they do not establish performance on learner hardware or across many cards.
Each immutable edition has its own asset directory; cross-edition deduplication
and multi-card amortization are not implemented by this delivery.

## Integration follow-through

An additional same-task navigation regression exposed a real race: changing the
hash and immediately dispatching pagehide could flush the old playhead before
the queued hashchange handler ran. The focused test failed with the new hash
overwritten. The reader now records the last restored/written hash and refuses
to overwrite a location it no longer owns. This adds 69 raw / 12 gzip bytes to
the earlier measured reader; the final totals above include it. The existing
coalescing and departure tests remain, and the three-engine rerun includes this
race plus opening/reloading generated editions through the shared dev server.

Final-rerun timing diagnostics (while other verification ran) observed cold
readiness at 389–612ms and reloads at 332–427ms, with long tasks up to 355ms.
All six samples requested 38 resources / 25 scripts and decoded 1,402,836 bytes.
These are not a before/after optimization comparison: concurrent work changed
the measurement conditions. The earlier quieter samples and this variability
both support retaining startup cost as a real limitation.

Local whole-and-parts edition:
<http://localhost:8000/tmp/codex/composed-algebra-editions/a94dec90a681b454e288a4ea667d8caa4b939072c89e6ebf0501332e740e1a06/index.html>.
The source revision remains
`sha256:9e16fc7a10f4fcf3f79469ad98da36572f4ff1b42cf66fc702e6ab5e201fe6ef`;
the path identifies complete output bytes, not a changed mathematical source.
The generated directory is disposable and reproducible with the documented
command; it is intentionally not committed or externally published.

COMPLETE: all four packages delivered. Final verification:

- `npm test`: 7,385 pass, no failures/skips, including architecture and inference
  gates before the full unit corpus. Runtime location-race changes during this
  run are additionally covered by the final focused and browser reruns below.
- `npm run typecheck`: all app/Node/test/Svelte/domain checks pass.
- `npm run build:bundle`: production build passes; existing unrelated large
  application-chunk warnings remain.
- `npm run check:authoring`: 24 focused boundary tests and complete runtime/type
  cost consumers pass.
- `npm run check:reproducible-authoring`: actual source-check/build/check processes
  pass, now including interactive export for the existing two-unknown algebra
  transfer source. No model calls or human-effort claim.
- `npm run visual:algebra-editions`: final 25 pass in Chromium/Firefox/WebKit;
  two non-Chromium timing diagnostics skipped by design. All preservation and
  shared-server checks execute in each engine.
- Final focused unit/CLI/publication/cost/discovery rerun: eight pass. Final
  `author:check` accepts the unchanged whole-and-parts source; actual interactive
  `--check` reproduces byte edition `a94dec90...`; complete cost gates pass.
- Three original whole-and-parts host checks pass after scaffold extraction.
  Theseus validates; generated equation reachability is current.

No further implementation remains in this contract. The new recurring ownership
is one small read-only edition host, a bounded location parser, builder and cost
gate; the prior scaffold/compiler/native reader are reused. An attempted renderer
split was discarded. Remaining compiler/native payload and startup long tasks
are documented rather than described as solved. Recommended next investigation:
profile cloning and paint alignment during native preparation on this accepted
packaged algebra reference. Preserve the visual and semantic owners; new
mathematical coverage or presentation design needs its own scoped decision.
Resume durable project context with `theseus work resume`.

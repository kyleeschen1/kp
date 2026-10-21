# Portable algebra: implementation and evidence

Active continuation: `run-contract.kp.algebra-interactive-editions-v1`, backed by
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
transfer. Remaining dependency analysis and bounded gates are pending.

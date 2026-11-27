# Persistent composition notebook

Date: 2026-11-27
Status: complete; user approved the notebook host on 2026-11-27 and resumed delivery.
Authority: “great! resume” accepts the reference and resumes this bounded successor.
Execution: `run-contract.kp.composition-notebook-reuse-20261127`.

## Outcome and boundary

Authors save integer 2×2 matrix pairs, discover their ordered-map explanation,
and reuse the accepted player inside notebook prose. Linked views share source
identity and calculation but retain local playback; ordinary copies are independent.
Invalid drafts and last admitted values survive undo and reload. This connects
the accepted composition family to the studio's reuse workflow.

Canonical host: `/experiments/fraction-notebook/?notebook=composition`.
Canonical presentation: accepted `/experiments/composition-area/`.
Source authority: saved matrix-pair resources, with `matrixProduct` and
`semanticEvaluate` still owning calculation. Graph2D/SVG, native KaTeX and the
existing timeline clock retain paint/time ownership. The reference and notebook
share the extracted player; persistence remains with the notebook host.

Preserve existing fraction, matrix, quadratic and projection documents, history,
theme overrides, chat and reference URLs. Add optional composition resources
without rewriting schema-version-3 documents. No mixed-family notebook,
cross-notebook import, general matrix resource migration, decimals, new animation,
generic plugin framework, paid model call or publication. Inputs remain −5 to 5.
Sixteen pairs and eight active views per pair bound the editing region.
Rollback units: shared accepted player extraction and additive notebook adapter.

## Packages and gates

1. **source:** strict matrix-pair records, stable IDs, last admitted values,
   native history, copy versus linked identity, bounded source-cache lifetime.
2. **host:** reference/notebook player reuse, inputs and explanation occurrences,
   command discovery, folding, local positions, lazy imports and reading host.
3. **verification:** focused persistence/cache/clipboard laws, prior-family
   preservation, types and architecture, real Chromium/Firefox workflows,
   narrow/theme checks, original reference and complete-consumer payload costs.
4. **review:** judge readability and editing in the notebook. Unchanged accepted
   choreography does not need reapproval; second-host layout does. Stop before
   broader integration or another mathematical family.

Use a six-hour ceiling with the last hour reserved for verification/backup;
finish sooner at required review. Record live progress only through Theseus.
Repair demonstrated boundary/cost failures in scope, preserving executable checks.
Commit coherent implementation and evidence, back up before handoff. The separate
actual-model revision trial remains pending.

## Review this host

Open http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=composition .
Change A11, then select **Explain composition** to add another explanation.
Scrub the two occurrences separately: they share matrix values, but not playheads.
Reload to check saved inputs and local positions. An incomplete entry such as
`-` persists while the last valid mathematics remains visible with playback
disabled. Repair it, fold/unfold a view, then return to its inputs.

Select the input block, open M-x or C-x C-x, and choose `math.discover`.
The two capabilities explain composition or insert linked inputs. Ordinary copy
creates an independent matrix pair; linked insertion retains source identity.
Use the editing toggle to inspect the reading host and Styles to switch themes.

Judge whether the controls, notation and small diagrams read comfortably inside
prose. Below 560px of available player width, the two orders stack; this includes
the default narrow document column. It preserves legibility but sacrifices
simultaneous comparison. Review that tradeoff before changing layout or promoting
the player further. No scroll positioning or new choreography is introduced.

## Implementation and safeguards

The reference and notebook now mount the same composition player. A saved pair
names the prepared semantic objects; each occurrence owns only its graph nodes,
clock and optional local position. The notebook owns UUIDs, validation, IndexedDB
drafts and ProseMirror history. No live subscription between independent pages
or general cross-notebook import is claimed.

Resource admission rejects extra fields, unsafe revisions, malformed entries,
duplicate identities and inconsistent admitted values. Runtime caching keys
admitted values, not revision numbers, so undo/re-edit cannot reuse stale geometry.
Invalid drafts retain that calculation. Copy reidentifies each copied source once
while preserving sharing inside the selected group; cut retains identities.
Capacity reclamation and insertion are one native-history transaction.

Hidden/folded views release players; a generation guard prevents delayed imports
from remounting them. Disposal removes listeners, observers and clocks. Position
storage runs at settled playback boundaries rather than every animation frame.
The discovery test found a default-to-quadratic routing assumption. Its owner now
uses an exhaustive typed family map, with regression coverage for every admitted
kind. Missing families cannot silently acquire quadratic commands.

## Executed evidence

- `npm run test:composition-notebook`: 45 passed, including persistence,
  native history, cache identity, independent copies, singular maps and prior
  matrix/quadratic/projection contracts. Initially failed on discovery dispatch;
  the owner repair above passes the complete rerun.
- `npm run test:composition-area`: 49 passed, including product and semantic
  owners. `npm run test:fraction-notebook`: 28 passed.
- `npm run visual:composition-notebook -- --project=firefox`: all 16 Chromium
  and Firefox checks passed on the full rerun. The initial run caught the same
  discovery bug. Includes original-reference preservation, edits/reload,
  invalid drafts, independent playheads, native copy/cut, stale discovery,
  folding, lazy-import interruption, capacity, phone and actual theme controls.
- `npm run visual:projection-notebook -- --project=firefox`: 14 passed,
  preserving the previous notebook and independent reference.
- `npm run typecheck`, scoped fraction-notebook/composition-area type checks
  and `npm run check:architecture` passed. Final scoped checking includes the
  shared entry-admission predicate and exhaustive discovery map.
- `npm run check:tooling-configs`: passed, with 83 Playwright configs,
  206 projects, 14 inventory-managed Vite configs and 22 TypeScript projects.
  Its first failure identified the new suite missing from the inventory; added
  only that resolved policy entry after comparing every prior entry unchanged.
- `npm run test:project-vision`: 75 passed. Its initial startup-budget failure
  was repaired by shortening roadmap history under the existing ceiling.
- `npm run build:composition-area`: 99,039 gzip bytes JS/CSS; 1,010,369 across
  all 64 emitted assets, versus 97,435 and 1,009,555 before shared extraction.
  The original browser behavior remains checked.

Desktop and phone/light/dark screenshots were inspected. The shared server
returned HTTP 200 for the review URL. Screenshots are disposable; stable commands
above reproduce them.

## Complete-consumer costs and limits

`npm run measure:notebook-mathematics -- --baseline 76ba6e7760abbb579065abc6fbe3d22f92e98e78`
measured the complete production consumers, including all reachable lazy chunks:

| Consumer | Initial JS gzip | Complete JS/CSS gzip | All emitted gzip |
| --- | ---: | ---: | ---: |
| Notebook before | 476,678 | 633,651 | 1,732,327 |
| Notebook after | 477,359 | 646,108 | 1,744,784 |
| Native reader, unchanged | 124,959 | 340,792 | 340,792 |
| Mathematical reading after | 165,933 | 247,646 | 1,346,322 |

The notebook adds 681 bytes initial JS and 12,457 bytes across its complete
JS/CSS closure. The executable import gate confirms composition/projection
evaluation and rendering remain lazy in the ordinary notebook. Scoped TypeScript
changes from 703 to 716 files, 176,701 to 178,583 types, and 204,793 to 206,834
instantiations. No budget ceiling was raised.

These are per-file gzip estimates, not HTTP transfer or memory/frame-time
measurements. Emitted totals include every font format, not only downloaded
fonts. New maintenance consists of a bounded matrix-pair resource/host adapter
and the shared accepted player; this is not a general plugin API.

The impact selector has no focused rule and suggested its broad fallback.
The approved bounded verification uses the preservation suites, full types,
architecture, complete-consumer builds and two-browser checks above.
Repository-wide unit tests, root production build and WebKit were not run.
The notebook layout is now accepted. Learning outcomes, mixed-family reuse and
the actual-model revision trial remain unproved. This contract closes at 4/4.
The resumed studio horizon proceeds through the separately bounded
[circle/trigonometry reference](2026-11-27-circle-trig.md), preserving its own
canonical visual checkpoint.

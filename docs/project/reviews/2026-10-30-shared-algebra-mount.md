# Shared algebra mount conversion

Date: 2026-10-30
Status: complete; both approved packages verified
Approved source: [KP product lane](2026-10-30-next-step-review.md#kp-product-lane-after-the-parallel-development-split)
Execution: `run-contract.kp.shared-algebra-mount-v1`

## Outcome and boundary

Checked factoring, composed algebra and distribute/collect now mount through
`src/reader/app/algebra-presentation-mount.ts`. Exact endpoint projection lives
beside it. Neither shared module imports an experiment, stylesheet or page
compiler. Existing host controls and CSS remain with their current owners.
The two obsolete common-factor module paths are removed, not forwarding facades.

The canonical composed source remains
`src/authoring/examples/composed-algebra-intuition.json`, hosted at
`/experiments/composed-algebra-intuition/`. Distribute/collect remains its existing
checked family and host, also reachable through
`/experiments/reusable-reasoning/?example=distribute-collect`.
Issued presentations and evaluation/endpoint certificates retain semantic
authority; the existing native KaTeX compositor retains paint authority.
No mathematical source, choreography, clock, style or saved-source schema changed.

Direct consumers include common-factor entry, page, readings and practice;
composed-algebra cards serving both selected families and edition/practice
callers; native endpoint tests; the browser canary; the complete authoring type
fixture; and inference profiling. All moved-path imports were converted.
The retirement ledger guards removal across source, scripts and type fixtures.
The import-closure regression guards the new shared owner against acquiring an
experiment, CSS or page-compiler dependency.

## Necessary dependency repair

The experiment directory had hidden a prohibited browser-to-page-compiler
dependency. Moving the mount made the reader architecture gate reject it.
The existing native stage-template rendering was extracted into
`src/rendering/equation-stage-template.ts`, with all standalone callers converted.
The page compiler keeps page assembly and calls the same extracted rendering.
Standalone stages still own their accessible math; full pages keep their
existing accessibility policy. Reader runtime/document imports use their
established public entries. No boundary exception was added.

A bounded before/after comparison covered factoring and both extended algebra
sources, standalone/page output, controls and profile selection: all 24 outputs
were byte-identical. The disposable comparison was removed. Durable preservation
uses the existing accessibility, endpoint and browser checks rather than adopting
new visual goldens for unchanged markup.

Full typechecking also exposed unchecked tuple fields in the baseline's new
`scripts/git-hygiene.ts`. Ref rows now require exactly three fields, a nonempty
ref and a full SHA-1/SHA-256 object ID before ancestry checks. Regression tests
exercise missing/extra fields, malformed IDs, both hash lengths and absent
upstreams. Existing real-repository audit tests retain their read-only and
preservation checks. This directly blocking repair adds no cleanup authority.

## Ownership and recovery packet

- Base: `8ba01b298f4982193c010caffa0d5e47ee9ae0ce`.
- Branch: `feature/20261030-kp-product-mount`.
- Worktree: `/Users/kyleeschen/Code/kp/.worktrees/kp-product`.
- Owner: this KP product conversation; no delegated agents. Workbench application,
  adapters and persistence stay outside this delivery.
- Owned changes: shared native/endpoint/template boundary, complete consumer
  imports, relevant tests/tooling, one npm visual command, generated reachability,
  this run's Theseus records and source-linked milestone evidence.
- Dependencies are a local copy with package-local executable links. No writable
  `node_modules` symlink, dependency or lockfile change.
- `npm run visual:algebra-mount` owns an isolated server on port 8011 for its
  duration, fresh browser contexts and disposable `tmp/codex/algebra-mount` output.
  It does not reuse or stop the shared review/workbench server.
- Integration handoff is this branch and its final commit. Review against the
  explicit base and integrate through existing authority; no merge is performed.
- Rollback: the complete mount/template conversion and consumer imports as one
  coherent commit. Do not restore just an old import while leaving its owner
  deleted. The small Git parser repair is identifiable separately in the diff.

## Verification and costs

Baseline: 25 authoring-boundary tests, 105 composed-algebra tests, all seven
complete consumer payload/type budgets and nine Chromium preservation checks
passed. The initial browser launch failed because copying dependencies had
flattened executable links; repairing those local links allowed the baseline to
run. No product change was involved in that launch repair.

During conversion, typechecking caught three remaining same-directory endpoint
imports; all were converted. The next typecheck caught the Git parser issue
above. The first full test attempt stopped at the reader architecture gate;
the extracted template and public imports repaired that boundary. The retirement
tests initially required the new entries in their exact inventory and the
existing typed-replacement description convention; both were updated without
weakening the tests. The first complete integration run passed 7,449 of 7,450
tests; its only failure was the exact reader-runtime caller list, now updated
with the shared mount. The clean full rerun passes all 7,450 tests with zero
failures or skips. Earlier failures remain in the Theseus verification history.

Final checks:

- `npm test`: architecture, inference, catalogue gates and all 7,450 tests pass.
- `npm run typecheck`: app, Node, tests, Svelte and domains pass; zero Svelte
  errors or warnings.
- `npm run build:bundle`: production build passes, 1,865 modules. Existing
  large graph/workbench chunk warnings remain; their thresholds were not changed.
- `npm run check:authoring`: 26 tests and all seven complete consumer budgets pass.
- `npm run visual:algebra-mount`: all nine Chromium preservation checks pass.
- `npm run test:project-vision`: 67 checks pass after recording the scoped
  completion and distinct style-ownership successor.
- Focused Git parsing, real-repository audit, accessibility and retirement tests
  pass; Theseus workspace validation and diff whitespace checks pass.

Measured inference costs before → after:

| Complete cohort | Types | Instantiations |
| --- | ---: | ---: |
| Core | 116,885 → 116,885 | 200,009 → 200,009 |
| Combined authoring | 180,418 → 180,245 | 304,906 → 304,808 |

All seven authoring consumers retained their measured module counts, raw/gzip
payloads and type costs after the mount move. No ceiling was raised. A directory
conversion is not a runtime speedup; no new runtime-performance claim is made.
The generated equation inventory retains all 68 roots. Its scanned count also
reconciles the baseline's two Git-hygiene source/test additions, plus the extracted
template module, instead of omitting them from accounting.

The root checkout independently advanced to `b12ac7413` with the native Codex
workbench refinement during this delivery. Its revised workbench priority is
preserved; the shared-mount scope is unchanged. This branch's strategic updates
are confined to the engine closure and its successor horizon. Integration must
retain that parallel workbench direction and its source records.

## How to verify and what remains

From this worktree, run `npm run visual:algebra-mount`. The nine Chromium checks
exercise both distribute/collect variants, four/five-state native handoffs,
direct seek during interrupted motion, last-valid revision retention, disposal
and resize, source/practice round-trip and collapsed-viewport recovery.
`npm run check:authoring` verifies checked-source authority, the new import
boundary and complete consumer costs. These establish the bounded conversion,
not universal compositor certification or improved learning outcomes.

The next KP product proposal is one useful anchored explanation, with only its
demonstrated style/preparation dependencies. Cross-example style ownership and
explicit document projection remain separate unfinished boundaries. Workbench
practice records and integration retain their own owner. No later visual
experiment, shared promotion or historical paused run started in this delivery.

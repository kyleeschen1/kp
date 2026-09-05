# Authoring Integration — Typed Source Save Boundary

Date: 2026-09-05
Outcome: STOP_CONDITION — save/source ownership decision required
Run: `run-contract.kp.authoring-integration-market-preview-v1`
Scope: s21 incomplete; the approved proposal still owns scope and Theseus owns
live execution. No new save endpoint, file-write target, editor, or evaluator
was introduced during this investigation.

## Established integration

The bounded economics prerequisite is implemented and verified. The isolated
`/experiments/authoring-market/` host now connects governed economics, exact
state queries, the existing reader clock, SVG, native KaTeX, Article/score/scene
bindings, and explicit revision-owned facts. The canonical lesson and default
host remain preserved. See [assembly evidence](2026-09-05-authoring-assembly-evidence.md).

The explicit author source is ordinary TypeScript:
`src/experiments/authoring-market/authoring-market-article-source.ts`.
It emits Article v1 with named fact slots. The resulting Article text is a
projection, not the editable authority for the model or those slots. The current
host does not yet provide transactional edit/compile/preview or durable saves.

## Why the existing save boundary is insufficient

- `server/kp-article-source-config.ts` registers exactly the economics-demand-shift
  and algebra-fraction-composition Markdown source stores, under the existing
  opt-in write flag. Neither owns this experiment or its typed declarations.
- `server/kp-article-source-store.ts` rejects a foreign source ID before disk
  access, validates Article text, and regenerates the named publication. Adding
  a new writable typed-source target is an authority expansion, not merely
  passing a different source ID to the existing endpoint.
- `src/article/kp-article-draft-session.ts` owns Article syntax validation,
  retained valid Article text, and explicit Markdown saves. It is useful existing
  infrastructure, but does not compile the typed model/fact source or retain a
  revision-consistent market preview across typed-source build failures.
- `vite.config.ts` suppresses save-triggered HMR for the two existing publication
  paths because their editor already replaces previews transactionally. The
  experiment currently has disposal wiring, not that transactional replacement.

`npm run test:economics-article-source-save` passes all five existing tests,
including foreign-target rejection and rollback on regeneration failure. This
is executed preservation evidence, not proof of a new market save workflow.

## Alternatives checked

1. Reuse an existing endpoint: rejected because it owns another lesson. Do not
   overwrite that lesson or widen a path check.
2. Edit/save only the generated Article: insufficient for model and typed-slot
   edits; it would create competing source authority or discard the bindings.
3. Add an in-memory preview with an unsupported save callback: useful as a
   diagnostic, but not completion of the approved save/rebuild lifecycle.
4. Save local TypeScript files in the author's normal editor and use Vite:
   viable without new HTTP write authority, but the current full-reload/disposal
   path does not establish revision-tagged compiler results, stale-result
   rejection, or last-valid-preview retention. Selecting and specifying that
   local-file workflow is the recommended bounded amendment below, not an
   already implemented capability.

The named s21 condition is “Requires replacing editor/session system or expanding
save authority.” The assumed existing end-to-end save path does not cover this
source. Stop for an explicit workflow decision rather than silently expanding
the in-app write surface or representing prose-only editing as typed authoring.

## Recommended amendment — NOT YET APPROVED

Keep typed authoring in the local source editor for this exemplar. Explicitly
make s21 a **local-file save/build/preview adapter**, not a browser source editor:

1. Identify the experiment's exact typed model and Article-template inputs and
   one build-produced preview revision. Keep the checked-in author source as
   authority; do not save generated Article text back over it.
2. Use the existing development build tooling to compile those trusted local
   modules. Introduce no arbitrary browser evaluation, new HTTP write endpoint,
   generic file writer, or replacement Article editor/session.
3. Retain the last valid mounted preview while a newer revision is compiling or
   invalid. Preserve the author's edited file, attach diagnostics to its source
   revision, and reject stale asynchronous results before replacing the preview.
4. Test actual valid/invalid local rebuilds and out-of-order results through the
   stable scoped browser/check entrypoint, plus the original architecture and
   preservation gates. A pure mock revision manager alone is insufficient.
5. Resume the unchanged s22–s28 order afterward. Keep the final human checkpoint,
   budgets, renderer/clock ownership, and all remaining stop conditions.

This changes the s21 workflow assumption, not the authoring-first product
direction. In-app typed-source editing/saving would require a separately
specified, narrowly scoped authority contract instead.

## Verification and resume

Latest implementation checks: 58 authoring-integration tests, 81 economics
tests, three Chromium host checks, full typecheck, architecture, exact
reachability, diff check, and Theseus validation pass. Latest full repository
suite was at s14 (6,531 tests); it is not a new release gate for s15–s20. The
final broad build/inference/release gate remains unexecuted.

Implementation in this resumed segment spans `acffda561` through `abea5f03c`;
the Article companion and fact bindings are `7a8a86c21` and `abea5f03c`.
Eight slices remain, including incomplete s21. Variant value calculations are
tested, but a complete ordered demand/tax reader, lifecycle/deep-link checks,
final author-cost audit, capture matrix, and human review remain ahead.

Run `theseus work resume` from `/Users/kyleeschen/Code/kp` to recover the gate.
That command does not grant the amendment. After user approval, record the
approved local-file workflow in the existing proposal/contract and resume s21;
do not create a second plan or claim this run complete.

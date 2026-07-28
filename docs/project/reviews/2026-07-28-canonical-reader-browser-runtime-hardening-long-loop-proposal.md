# Canonical reader browser/runtime hardening loop

Status: approved by the user on 2026-07-28 through the instruction to
implement the recommended Safari and rapid-scroll hardening while storing the
active role-complete presentation loop for exact resumption.

## Why this interrupts the current loop

The fraction-composition checkpoint exposed two generic risks at once:

- browser paint engines can disagree with approximate route preflight; and
- rapid scrolling can synchronously rebuild and remeasure compositor sessions.

The existing role-complete presentation run remains authoritative and paused
at slice 14. Commit `aeac631f` is its independently recoverable checkpoint.
This loop changes only browser verification and reader runtime performance.
After this loop closes, the prior run resumes at its unfinished broad visual
matrix; none of its remaining slices are absorbed here.

## Objective and boundaries

Make the canonical fraction-composition reader responsive under rapid
bidirectional scrolling and establish WebKit as an automated geometry/runtime
contract, without changing mathematical truth, animation motifs, authored
timing, accessibility, native endpoint authority, or the single-compositor
architecture.

Canonical exemplar: the fraction-composition reader in expanded automatic
fold mode, exercised across every phase in both directions at wide and phone
widths.

Observable acceptance criteria:

- one scheduler owns frame coalescing;
- ordinary scroll sampling performs no layout reads;
- unchanged semantic state causes no repeated focus/location/fit/visibility
  work;
- revisiting a prepared transition does not repeat pure collision planning;
- no mounted DOM or WebGL session is retained offscreen;
- rapid sweeps have no main-thread task over 50 ms after warm-up and meet the
  repository's bounded browser frame budget;
- Chromium, Firefox, and WebKit pass direct seek, rewind, measured-paint
  overlap, native handoff, phone fit, and rapid-sweep checks;
- structural WebGL capacity and context loss still settle to native DOM.

Preservation boundary: no semantic model, operation plan, motif recipe,
equation layout policy, review protocol, or static export change.

Rollback unit: each slice is one focused commit. The whole detour can be
reverted back to `aeac631f` without altering the stored role-plan contract.

## Ordered slices

| Slice | Change | Risk and verification | Commit / stop |
|---|---|---|---|
| 01 | Preserve the role-plan checkpoint and materialize this detour as a separate typed priority and run contract. | Focused: `theseus workspace validate`, loop-status tests. | Commit control records. Stop if the predecessor cannot remain resumable at slice 14. |
| 02 | Add WebKit as an explicit Playwright project and a scoped canonical-reader browser-contract command. | Standard: config/typecheck plus one WebKit smoke. | Commit browser surface. Stop if WebKit is unavailable in the managed toolchain. |
| 03 | Add a deterministic rapid bidirectional-scroll harness with frame intervals, long tasks, layout reads, session builds, plan compilations, and DOM-owner churn. | Broad browser harness in Chromium. | Commit instrumentation. Stop if measurement itself materially changes scheduling. |
| 04 | Capture and freeze the Chromium baseline without relaxing product targets. | Focused performance command. | Commit baseline evidence. Stop on nondeterministic counters. |
| 05 | Capture Firefox and WebKit baselines and classify engine-specific failures. | Broad cross-browser command. | Commit evidence. Stop if a browser cannot expose equivalent observables. |
| 06 | Define a branded, total compositor geometry-cache identity covering plan, font, layout, dimensions, DPR, motion, and presentation geometry. | Standard type fixtures and inference budget. | Commit types. Stop if callers can fabricate or omit invalidation fields. |
| 07 | Cache scroll geometry and viewport-anchor measurement until explicit resize, font, or content invalidation. | Focused scheduler/layout tests and browser counter. | Commit hot-path read removal. Stop if responsive anchoring changes. |
| 08 | Remove the duplicate scroll/requestAnimationFrame boundary so one latest-wins scheduler owns each visual frame. | Standard scheduler unit and rapid-scroll browser check. | Commit scheduling boundary. Stop if direct control seeks lose exactness. |
| 09 | Make semantic-focus publication equality-aware and eliminate the duplicate per-frame focus DOM walk. | Focused focus/runtime tests. | Commit semantic no-op path. Stop if focus precedence changes. |
| 10 | Make active location and share-link projection equality-aware; defer history writes to settlement. | Focused location tests. | Commit location diff. Stop if shareable URL truth changes. |
| 11 | Diff active transition, accessible equation, responsive fit, and review datasets before writing. | Standard browser and accessibility checks. | Commit reader-state diff. Stop if endpoint or review evidence becomes stale. |
| 12 | Replace per-frame material-owner queries with retained records and diff style/dataset writes while preserving measured-ink alignment. | Broad compositor/browser checks. | Commit DOM diff. Stop on clone identity or handoff regression. |
| 13 | Split pure measured scene compilation from mounted material/WebGL ownership at the reader adapter boundary. | Broad architecture, typecheck, canonical renderer tests. | Commit boundary. Stop if this creates a second compositor or lifecycle. |
| 14 | Cache pure compositor plans by the branded geometry identity; never cache mounted DOM/WebGL sessions. | Standard cache property, invalidation, and resource tests. | Commit cache. Stop on stale font/layout geometry. |
| 15 | Reuse exact cancellation route/collision certificates from the cached pure plan instead of recomputing on revisit. | Broad motif fidelity and operation-plan tests. | Commit certificate reuse. Stop if certification authority can be bypassed. |
| 16 | Add bounded adjacent-transition idle prewarming with deterministic cancellation and a synchronous fallback. | Standard unit/browser tests. | Commit prewarm. Stop if skipped phases acquire paint authority. |
| 17 | Make session replacement latest-only and atomic so obsolete cold work cannot commit after a newer scroll request. | Broad rapid-reversal and ownership tests. | Commit handoff. Stop if native endpoint settlement changes. |
| 18 | Add WebKit coverage for font paint, fraction rules, radical/SVG handoff, WebGL lease capacity, context loss, and exact native fallback. | Broad WebKit browser contract. | Commit engine gate. Stop on an unresolved Safari-class visual divergence. |
| 19 | Run the full Chromium/Firefox/WebKit rapid-sweep and canonical motif matrices; tune only bounded generic budgets. | Release browser verification. | Commit verified budget. Stop rather than browser-specific motif patching. |
| 20 | Run typecheck, architecture, inference, broad tests/build, Theseus validation, record closeout, and restore the role-plan run as next. | Release closure. | Commit closeout. Stop at human checkpoint if visual or real-Safari judgment remains. |

## Explicit deferrals

- No new animation family or motif.
- No general worker/off-main-thread compiler redesign.
- No persistent cache across page loads.
- No caching of live DOM nodes, canvases, WebGL contexts, or accessibility
  ownership.
- No global rollout beyond the canonical fraction reader before the exemplar
  promotion checks pass.
- Real-device Safari remains a human promotion check; Playwright WebKit is the
  automated contract, not a claim that it is Apple's shipping browser.

## Done contract

The loop is complete only when the rapid-scroll gate passes in Chromium,
Firefox, and WebKit; cached revisits demonstrably avoid pure recompilation;
layout reads and redundant writes are absent from the ordinary scroll path;
one mounted visual owner remains authoritative; release checks pass; and
Theseus selects the stored role-complete presentation run at slice 14 as the
next resumable work.

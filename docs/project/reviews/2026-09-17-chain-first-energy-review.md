# Middle-step unfolding: energy review

Review state: HUMAN_CHECKPOINT. Implementation is verified; visual acceptance
is pending. Theseus owns live counts and execution under
`run-contract.kp.chain-first-authoring-v1`. The
[approved proposal](../2026-09-17-chain-first-authoring-long-loop-proposal.md)
requires this judgment before scalar transfer. No later slice has started.

## Try the exemplar

Open [energy from momentum](http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum)
on the existing shared server (HTTP 200 verified). No comparison query is needed.

1. Find **2 · Square the denominator too**. Inspect that step and drag the rail
   into its middle; leave the handle held there.
2. Click **Inspect smaller steps** beneath that explanation. The original
   equation and parent explanation remain; **2.1** and **2.2** open underneath.
   **3 · Cancel one mass factor** and the final result stay in the argument.
3. Inspect step 3, then use **Collapse smaller steps** or **Back to step 2**.
   Return should restore the exact step-2 position saved before expansion.
4. Repeat at a larger font size. Try clicking the rail at either end and dragging
   near the window edges. The selected equation should remain readable.

The judgment: does this preserve your place while making the smaller reasoning
available, or does opening/returning still require you to search? In particular,
judge the retained parent plus child explanations and the unchanged downstream
step. Automation cannot settle whether that amount of context feels useful.

## What changed and what owns it

Canonical artifact: `examples/physics/momentum-energy.article.md`; host: the URL
above; renderer: shared native KaTeX scene compositor; semantic authority:
checked momentum-energy model and issued derivation plans. No new clock,
salience store, renderer or mathematical authority was introduced.

The plan issuer inserts only its own checked child operations. Unchanged moves
retain identity; publication emits checked correspondence for all original
rows. The local energy DOM adapter retains equations, prose and grip, including
the downstream cancellation. Both existing cancellation detail and the new
norm detail remain available, with one detail level active at a time.

Norm inspection uses the same checked children in compact and expanded forms,
so its actual child-clock position can be mapped through the existing act gate.
Shared endpoints alone do not license an interior mapping. Exact saved return
is retained in either case, and unaffected move selections/bookmarks survive
insertion. Copied plans, another model, wrong parents and recursive disclosure
are rejected. Browser recovery keeps the original reading if optional detail
is incomplete.

Rollback unit: local reader implementation commit `402639eb7`. Semantic
correspondence is independently isolated in `9b613ce23`; approval/scope baseline
is `7032e4798`. Preserve semantic authority if only the visual treatment changes.

## Evidence and limits

- 43 focused checks pass: momentum/scalar semantics, mapping negatives, act-gate
  inversion and budget-boundary regressions.
- Full `npm run typecheck`, `npm run check:architecture`, production build,
  11 equation-surface preservation checks, all 12 reader production closures,
  reader payload gates and Theseus validation pass.
- The final steady-source Chromium preservation run passes 14 cases, covering
  both details, two font sizes, retained DOM, semantic pose mapping, downstream
  selection/bookmarks, exact return, rail edges, keyboard/scroll ownership,
  delayed reflow, disposal and optional-view repair. Existing scalar behavior
  is checked for preservation, not promoted as the new second caller.
- Review capture/native-dock smoke passes two cases via
  `npm run visual:mechanics-relations -- --grep 'nonterminal unfolding|audit trail keeps'`.
  It generates the compact 16px/24px capture set under the command's disposable
  output directory. Both captures were inspected; these are not reviewed goldens.
- The complete preservation command is
  `npm run visual:mechanics-relations -- --grep 'nonterminal unfolding|inline refinement|rail jumps|rail press|keyboard navigation|smaller steps preserves|disclosure settling|disclosure anchor|scalar reader reuses'`.

Earlier browser attempts were interrupted by source reload/server disconnect;
a temporary baseline checkout also caused unintended test discovery. The
checkout was removed, the disconnect was confirmed in the trace, and the final
14-case run passed without builds or edits in parallel. These failed attempts
remain recorded, with a corrected shorthand command record marked not-run.

Three pre-existing HTML-budget failures reproduced identically before this
implementation. The explicit, bounded
[baseline amendment](2026-09-17-chain-first-reader-budget.md) retains all
consumers and runtime ceilings. Physics transfer estimates now measure 47,747
initial and 165,344 activated gzip JS/CSS bytes; HTML is 779,276 raw / 52,404
gzip bytes. This is emitted payload accounting, not browser latency evidence.

Full cross-browser promotion and final `npm test` remain later release gates.
There is no claim of family-wide visual certification, fraction-chain support
or demonstrated LLM inference precision from this reader checkpoint.

## Continue after judgment

Inspect the stopped contract with
`theseus work inspect run-contract.kp.chain-first-authoring-v1 --mode brief`.
Both contract and target are blocked at this human checkpoint; the generic
`loop:status` helper omits blocked runs and therefore reports no active loop.
That does not mean this approved portfolio is complete or abandoned.
After explicit energy acceptance, complete
`chain.energy-review`, restore both contract and target to ready, then use
`theseus plan run` and continue the already
approved scalar-transfer slice without another permission round. If changes
are requested, repair this reversible exemplar and keep the gate closed.

The loop remains appropriate so far: it exposed and removed a terminal-only
assumption while preserving the existing child semantics. That unlocks a
meaningful independent transfer test; it does not yet establish cheap authoring.
The next useful evidence is whether the scalar caller can reuse this boundary
without a separate reader treatment. The 24-hour active-work ceiling remains;
this checkpoint used roughly half an hour, excluding the ensuing human wait.

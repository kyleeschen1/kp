# Engineering discipline and performance portfolio

Status: reviewed-direction planning proposal; implementation has not started.
Authority: the user approved a day-long infrastructure/API portfolio with limited
human feedback and requested this concrete plan. This document owns scope,
selection rules and rationale. On execution, a linked Theseus run contract will
own live slice status, verification, parking and stop state.

## Outcome and operating window

Make existing authoring and reading workflows cheaper to execute, easier to
change, and less vulnerable to invalid lifecycle/ownership states. Preserve
mathematical meaning, checked authority, supported input scope and accepted
visual behavior. This is engineering work, not new educational content.

Proposed ceiling: eight elapsed hours from execution start, including checks;
reserve the final two hours for integration, repairs, documentation and backup.
Do not start new implementation during that reserve. This is an execution
ceiling, not a promise of a continuously running background job or eight hours
of worthwhile changes. No additional agents, paid calls or services.

Primary outcomes are measured loading, retained-resource and repeated-work
improvements in existing workflows. Additional delivery includes caller-driven
API simplification, demonstrated duplication removal and a clearer verification
entrypoint. Continue into those eligible outcomes after the primary work; they
are not merely emergency fallback tasks. Finish fewer coherent changes rather
than leave every package half implemented.

Each investigation authorizes a bounded repair at its existing owner when
evidence supports it. A documented no-change conclusion is valid. Do not claim
an investigation is an optimization. No blanket percentage improvement target:
the baseline must establish which costs are avoidable.

## Starting evidence and preservation cohort

Do not repeat completed work:

- Source-only algebra costs 1,549 gzip bytes; four complete authoring consumers
  have runtime and TypeScript budgets. All eleven example routes load 5–12 local
  modules and pass their real domain checkers.
- Tax-page initial JS fell from 512,946 to 392,893 gzip bytes through the
  prepared-player loading path. Throttled interaction stalls remain observed;
  the prior work did not establish faster startup.
- Shared code/physics visibility notifications release their listeners.
  Ten-player scenes still retain 3,370–5,964 mounted DOM elements across four
  families. This is measured retained cost, not proof of a leak.
- Final preceding integration passed 7,339 deterministic tests, full types,
  production budgets and affected browser preservation checks.

Evidence: [authoring boundaries](reviews/2026-10-21-authoring-boundaries.md),
[loading](reviews/2026-10-21-concise-authoring-and-loading.md),
[lifecycle](reviews/2026-10-21-reader-lifecycle.md).

Canonical consumers, selected per affected owner:

- Tax focus-deck at /experiments/kinetic-figure/supply-tax/: canonical authored
  market data and companion instruction, existing economics graph projection;
  logarithm card uses its checked asset and native equation player. Its code
  and surface-contour cards retain their distinct renderers and source owners.
- Composed-algebra-intuition page/editor: source v2, issued semantic proofs and
  presentation, existing reusable-reasoning/native KaTeX host.
- Bayesian-reasoning editor: binary-joint source and checked probability trace;
  existing notation/tree projections and seven semantic stops.
- Momentum-energy and TypeScript readers: existing physics/language evidence,
  reader clocks, DOM/code/native representations and local restoration policy.
- Existing semantic-cost production fixture: real dot/row/column/polynomial
  players, used for resource pressure rather than as a proposed article layout.

At a visible implementation boundary confirm the actual artifact/host/renderer
path in source; route names or matching asset IDs alone are insufficient.
Preserve IDs, source round trips, exact mathematical results, revision authority,
native endpoints, reverse/seek, keyboard access, reduced motion and print.

## Ordered packages

Order is a preference, not permission to ignore dependencies. Every package
depends on P0. P7 integrates all delivered work. P1–P6 may proceed independently
only after checking shared owners and preserved parked candidates.

### P0 — Baseline and execution readiness (required; about 30–45 minutes)

Beneficiary: every later change has trustworthy comparison and clear ownership.
Inspect branch/upstream/dirt; verify dev server, existing browser commands and
fixtures. Inspect current Theseus pressure and missing references: resolve only
evidence-backed execution metadata, or identify unrelated blockers explicitly;
never clear a substantive decision merely to make the dashboard green.
Measure selected complete reader/editor workflows and record the highest-cost
boundaries, avoiding a new repository-wide inventory.

Acceptance: reproducible scenarios, actual current numbers, named owners,
ranked opportunities and runnable commands. Separate raw/gzip/module counts,
CPU work, wall time and retained resources. Reuse existing instrumentation.
Rollback: measurement changes only. Verification cost: low to medium.
Human review: only a genuine scope/authority issue.

### P1 — Loading and activation cost (primary)

Investigate remaining production tax-card and selected author/editor activation
closures. Repair eager catalogue/inspection/fixture loading or duplicate
initialization only where complete requests show unnecessary work.
Do not trade smaller initial bytes for larger total activation cost unnoticed.

Acceptance: same full workflow and capabilities before/after, no additional
avoidable requests, reported cold/activated totals, preserved first input and
typed failure/retry. Tighten a justified gate when savings are stable.
Rollback: one loader/caller migration with its acceptance evidence.
Checks: production build followed by scoped architecture-cost browser audit and
focus-deck input checks. Cost: medium. Review: any changed loading experience,
placeholder, visible delay policy or interaction semantics is parked.

### P2 — Many-card resources and lifetime (primary)

Trace ownership during mount, repeated replacement, offscreen pause, restore
and disposal. Start from the existing ten-player cohorts and shared
playback-visibility/prepared-session owners. Repair leaked or redundant work,
listeners, observers, scheduled callbacks and DOM retention when demonstrated.
Do not assume that retained mounted DOM is a leak.

Acceptance: no stale writes after disposal, no superseded revision commit,
bounded listener/DOM trends across repeated cycles, deterministic restore,
and a materially different caller for any shared extraction. Report heap
measurements cautiously; do not label noisy post-GC samples leak-free.
Rollback: one lifecycle-owner repair plus caller migrations.
Checks: focused interruption/cancellation tests and semantic-cost browser
cohorts, then affected real-host smoke. Cost: medium to high.
Review: changing automatic playback/resume, focus, persistent interaction state
or offscreen eviction behavior is parked before production rollout.

### P3 — Repeated compilation and preparation (primary)

Measure repeated valid Apply, invalid Apply, same-source Apply and source changes
in algebra and Bayes. Locate parsing, semantic verification, projection, native
preparation or measurement work that repeats unnecessarily. Prefer eliminating
duplicate calls before introducing caching.

Any cache must have an explicit owner, bounded retention, exact dependency
identity and tested invalidation. Distinguish source revision from editorial,
font, layout and renderer dependencies. Never share live surfaces across owners,
reuse foreign proof authority, or trust a serialized revision as issued proof.

Acceptance: unchanged checked outputs and repair diagnostics; measured work
reduction; stale, concurrent, invalid, superseded and disposed requests remain
safe. Account for cache lookup/retention and total preparation cost.
Rollback: one revision-local optimization, not a global cache framework.
Checks: prepared-session and domain tests, real Apply/reload browser cohort and
type/consumer budgets. Cost: medium. Review: altered Apply behavior or semantic
equality decisions beyond existing owners are parked.

### P4 — Concise, constrained authoring APIs (additional delivery)

Compare complete callers, especially repeated prepare/commit/dispose wiring in
algebra and Bayes, against the existing prepared-revision-session contract.
Remove verified redundant wiring or provide one small capability-oriented
convenience with real migrated callers. Keep domain-specific error/restore
behavior explicit. Simplify names within clear namespaces; do not bulk rename.

Acceptance: less caller-owned coordination with unchanged expressiveness;
inference and negative type tests preserve authority/dimension guarantees;
located repairs remain useful; no hidden example choice or new runtime registry.
Compatibility exports remain until all owned consumers are migrated.
Rollback: one helper and its callers. Checks: complete source examples, type
costs, session laws and affected host smoke. Cost: medium.
Review: changes to the author's conceptual model receive a small before/after
code proposal; keep it isolated and continue other packages.

### P5 — Remove proven competing implementations (additional delivery)

Follow duplication discovered in P1–P4 rather than searching for cosmetic
similarities. Consolidate only identical responsibilities with demonstrated
callers; migrate actual imports and retire unused owned paths.
Do not merge domain policy because two functions look alike.

Acceptance: fewer production owners for the identified responsibility, complete
consumer migration, executable dependency guard and unchanged outputs. Explain
net maintenance cost; file count alone is not success.
Dependency: a concrete duplication finding from P0–P4.
Rollback: one owner consolidation. Checks: affected laws, reachability generator,
architecture/types and scoped browser preservation. Cost: medium.
Review: any semantic or presentation-policy reconciliation is parked.

### P6 — Fast, understandable verification (additional delivery)

Use verify:impact, check:authoring and existing scoped commands. Improve missing
routing or discoverability encountered during this run; eliminate duplicated
check execution only when coverage remains explicit. Record which checks are
cheap inner-loop checks and which certify integration.

Acceptance: representative authoring and runtime changes select the right gates;
one short guide and stable commands; no omitted consumers, disabled checks,
hidden baselines or blind budget refresh. Measure command cost when optimizing
it. Do not build another task runner.
Rollback: check routing/script plus documentation. Checks: command selection
regressions and an actual affected invocation. Cost: low to medium.
Human review: ordinarily none.

### P7 — Integration and durable handoff (required; final two-hour reserve)

Stop opening new changes. Run final full typecheck, deterministic suite,
production build and affected reader/authoring/resource budgets; perform actual
browser preservation for changed owners. Main build and fixture-browser checks
must be sequential because they share dist. No new aesthetic certification
matrix is necessary for unchanged presentation.

Record baseline/result/limits for each shipped change and distinguish
investigated-without-change, delivered, awaiting-review and untouched work.
Close context receipts, validate Theseus, update durable direction, checkpoint,
push and verify the remote tip. Retain pre-existing unrelated changes.
If integration fails, repair inside reserve or leave an explicit recoverable
checkpoint; never describe focused passes as a clean full-suite pass.

## Selection, review and stop rules

- Spend at most about 45 minutes establishing a package's opportunity before
  reassessing. A single repair that looks likely to exceed two hours should
  become a bounded diagnosis or smaller independently useful repair.
- At each boundary choose the highest-value eligible package fitting remaining
  implementation and verification capacity. Record why an order changed.
- Required work is P0 and P7 plus an honest disposition for P1–P6. This does not
  guarantee all six improvement packages will ship in one day. Report unfinished
  eligible work explicitly rather than marking it complete.
- Batch nonurgent questions into one review packet: concrete artifact or URL,
  before/after, recommendation, evidence, exact decision and dependent packages.
  Lack of response is not approval. Park only dependent work and continue the
  independently approved portfolio. Existing older visual gates stay intact.
- Use supported Theseus states and commands; never edit event/node JSON or
  invent a scheduler. If a parked slice cannot be represented safely, report
  the limitation. No fresh scope is selected from an empty queue automatically.
- Commit checked coherent slices with evidence; push at least hourly and before
  handoff to the same-named authorized origin feature branch. No merge, direct
  main/dev push, force push, deployment or publication.
- No new mathematics, renderer, global scene model, broad cache, learning system,
  visual redesign, unrelated cleanup or paid external action.
- Stop for completion of justified eligible work, the ceiling, user pause,
  genuine safety/external blockage, or review when nothing independent remains.
  Report COMPLETE, HUMAN_CHECKPOINT, STOP_CONDITION or the applicable standard
  outcome honestly. Do not manufacture work to consume eight hours.

Execution starts only after this plan is presented and the user directs the run.
At that point create the linked Theseus contract from these package IDs and
scope. This planning document is not a claim of a running autonomous job.

# Practical curriculum repertoire review

The [approved plan](../2026-09-16-curriculum-repertoire-away-plan.md) delivers a
curriculum-shaped inventory, bounded source/test audit and worked-problem probes.
Execution is recorded in `run-contract.kp.curriculum-repertoire-v1`; this document
records the result, not a second slice tracker.

## Inspect the result

Open [the dashboard](http://localhost:8000/experiments/repertoire/).
Start with [logarithms](http://localhost:8000/experiments/repertoire/#topic-algebra-logarithms-and-exponential-equations)
or the [root rewrite](http://localhost:8000/experiments/repertoire/#alg.root.half-power).
Use the topic selector to narrow a discipline; individual row URLs survive
reload and history navigation. All content remains readable without JavaScript.

Look for independently useful distinctions: log product expansion versus quotient
combination, same versus unlike fraction denominators, and a move versus the
visual treatment that could support it. Then compare economics, mechanics and
programming: their interpretation should remain specific even when they reuse
algebra. Evidence links show the precise implementation boundary.

The human questions are whether the granularity helps choose the next explanation,
whether ordinary practical topics are still missing, and whether any row combines
different authoring capabilities. This is review readiness, not evidence of
learner benefit or a completed implementation audit.

## Scope and evidence

Dated snapshot: **747 entries: 617 semantic moves and 130 motif entries**, across
46 topics and 11 selector entries in 45 small content files. There are 82 bounded
implemented claims, 29 partial claims, two confirmed gaps and 634 unaudited entries.
These are inventory counts, not percentages of mathematics supported. Motif rows
describe contextual needs and are not 130 distinct implemented mechanisms.

Practical algebra is deepest. Applied mathematics includes calculus, linear
algebra, probability/statistics, differential equations, optimization and numerical
methods. Economics, classical mechanics and programming receive systematic first
passes. [Scope and curriculum sources](../repertoire-notes/scope-and-sources.md)
states exclusions and the open reference basis. Breadth is provisional; unaudited
does not mean absent.

[Worked-problem findings](../repertoire-notes/trace-findings.md) link probes across
all five areas. They exposed missing injectivity and integration steps and the
gap between fraction alignment and a complete calculation. Existing runtime
evidence is bounded: binary Bayes is not general inference, gradient reasoning
is not a complete optimizer, and one code extraction is not arbitrary refactoring.
The radical registry's title differs from its actual power-to-root operation;
the inventory follows source/target semantics and leaves the inverse partial.

## Maintenance and safeguards

Edit [small Markdown topic files](../repertoire/README.md), then run
`npm run test:repertoire`. No database, generated manual manifest, percentages or
additional client dependency was introduced. Existing semantic engines, animations
and learner passages are unchanged. The static dashboard uses native selectors.

The parser owns authoring invariants: IDs and topic routes must be unique,
examples/audit states are required, checks must agree with audit state, reuse
references must resolve, and audited claims require evidence. Tests reject
malformed and conflicting edits, stale trace references and broken local links.
Evidence packaging constrains resolved paths and escapes authored text. These
checks cannot establish mathematical correctness or the sufficiency of evidence;
those still require review.

Measured production output: 282,017 bytes of dashboard HTML, 958 bytes of
dashboard JavaScript and 2,852 bytes of CSS, excluding the pre-existing common
module preload helper and separately opened evidence files. All inventory HTML
is static; the client performs selection and deep-link scrolling. This remains
small in runtime code but the prose payload grows with the inventory.

## Verification and limits

Focused validation passes eight repertoire tests and four Chromium browser tests
using `npm run test:repertoire` and `npm run visual:repertoire`. Browser checks
cover topic/row links, reload/history, no-script reading, narrow enlarged-font
layout, and the built production route with packaged evidence. Wide and phone
captures were inspected. This is not a new supported-browser certification.

`npm run typecheck`, `npm run typecheck:tests`, `npm run check:architecture` and
`npm run build:bundle` pass. The build retains existing large-chunk warnings
outside the repertoire route. Representative source-evidence cohorts passed
39 algebra and 51 cross-domain tests.

Earlier focused failures were repaired and rerun: the old test assumed one root
file per discipline; a programming audit link had an incorrect relative path.
Source inspection also corrected the radical operation direction. No checked
capability was inferred from a passing link test.

The additional full `npm test` run exited nonzero on a stale generated equation
reachability snapshot. A focused reproduction confirmed that only the repository
scan count differed (4,704 → 4,749); all 68 roots and their caller lists were
unchanged. `npm run generate:equation-reachability` refreshed that measured count;
`npm run test:equation-reachability` then passed all 12 tests and
`npm run check:equation-reachability` passed. The existing exact-snapshot gate is
the durable safeguard. No scan consumer or assertion was removed. The full suite
was not rerun after this data-only repair and is not claimed green; the approved
integration gates and the focused repair checks passed.

Execution bookkeeping initially omitted typed run-mode/cadence/ceiling fields,
although the approved plan supplied and governed them throughout. The installed
CLI can update done-contract fields and source references but cannot update
those run fields after creation. The omission is retained as a process limitation,
not silently rewritten history or a waived product check. Future contract
creation must supply run mode, slice ceiling, commit cadence, verification level
and stop conditions explicitly before execution.

## Next direction

Keep the saved nonterminal equation unfolding and independent scalar transfer as
the next machinery experiment, followed by persistent code/text coordination.
The inventory suggests fraction completion, log direction/argument pressure and
assumption persistence as concrete later probes. These recommendations are not
authority to start another loop. No curriculum lesson or new motif was promoted.

# R1 diagnostic corpus

Date: 2026-09-07
Evidence: `tests/authoring-round-trip-corpus.test.ts` and
`tests/fixtures/authoring-round-trip-chains.ts`

The corpus contains 24 distinct tasks: two verified-source change-of-base
positives (one narration edit), five invalid/missing-authority/syntax cases,
and 17 unbound requested chains across eight domain labels. The two positives
exercise one mechanism, not two independent mathematical families. A separate
schema/count test brings the executed total to 25 passing tests.

Run `node --disable-warning=ExperimentalWarning --test tests/authoring-round-trip-corpus.test.ts`.
The tests call the real equation-series compiler. Unsupported syntax, absent
planner selection and missing trusted bindings remain explicit repair results;
no partial runtime is accepted for these negative cases. The canonical log
source is verified by its existing domain owner, not supplied by an LLM.

This establishes an initial task denominator and safe input boundary, not a
complete capability census: the 17 unbound requests intentionally supply no
planner proposal or source authority. Their rejection does not mean KP lacks
the operation elsewhere, and does not mean the mathematics is false. Later
entrypoint integration and live-model trials must record actual resolved paths,
not turn these expected rejections into a curriculum support percentage.

Cases retain named assumptions (nonzero divisor, convergence domain, finite
expectation, positive conditioning mass, compatible matrix shape). Those notes
are author-task requirements, not machine-issued proof. Sampling, animation
paint, family promotion and static publication remain separate evidence axes.
No new domain implementation or visual motif is added by this diagnostic corpus.

# Baseline adjudication notes

Raw first-run records are immutable in `baseline/`. `expectationMatched` currently
compares the top-level checked/repair status only; it does **not** mean that the
case reached its intended boundary or that its prose was reviewed successfully.

Both algebra inputs accidentally use unnamespaced state IDs. The existing owner
rejects them at `$.states[0].id`, before mathematical or presentation preparation.
The single-digit positive is an unexpected failure. The composite-factor negative
has the expected top-level repair status but **does not exercise its intended
presentation boundary**. Neither counts as demonstrated factoring reuse or as a
successful trial of multi-digit paint rejection. The independent existing owner
suite covers those boundaries and passes 32 checks; that evidence does not replace
these trial outcomes. Keep both raw inputs unchanged for the rerun.

This is an author-generated input defect, not evidence that factoring cannot be
implemented. The actionable repair for a future, separately identified input is
namespaced IDs such as `state.trial.expanded` and `state.trial.factored`. Changing
these frozen cases now or relaxing the responsible source validator would conceal
the observed failure. Final findings must report status matching separately from
intent coverage and actual host application.

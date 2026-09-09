# R4A primary author workflow comparison

Date: 2026-09-09
Scope: existing R4A primary tasks; not a live-model or learner benchmark.
Source proposal: `2026-09-08-authoring-entrypoint-convergence-long-loop-proposal.md`.

Both retained tasks now pass source checking, explicit browser application,
exact source export and the appropriate existing local edition builder.

| Task | Retained source | Browser and export | Local reading |
| --- | --- | --- | --- |
| Urn prior 1/3 with likelihoods 1/4 and 3/4 | `content/authoring/r4a-urn-prior.bayes.json`, 460 bytes | Bayes host applies the checked revision; all seven stops, fractional seek and reverse retain posterior 1/7; download matches authored JSON | Bayesian edition reproduces the exact revision, seven static trees and the deduction `(1/12)/(7/12) = 1/7`, without JavaScript |
| Log base 3 of 9 to natural-log quotient | `content/authoring/r4a-logarithm-base.json`, 946 bytes | Numeric equation host uses the CLI's text compiler; input remains unbound authored JSON, invalid input preserves last-valid paint; explicit market export includes the displayed equation | Existing market builder publishes its text/fact reading plus both numeric equation states and narration, without JavaScript |

## Repeat the source checks

```sh
npm run author:check -- --list
npm run author:check -- --task bayes.binary --request content/authoring/r4a-urn-prior.bayes.json
npm run author:check -- --task equation.logarithm-base --request content/authoring/r4a-logarithm-base.json
npm run visual:authoring-entrypoints
```

The last command executed six Chromium tests on the shared port-8000 server,
including the two actual Apply/download/build/verify/no-JS workflows. The
existing numeric card tests also preserve continuous controls, native ink,
reverse, stale preparation, restore and disposal. Full typechecking passes.
An initial assertion incorrectly expected the posterior inside a static SVG
description. Inspection confirmed that description owns joint masses, while
the reading owns the posterior deduction. Both are now asserted separately;
no production behavior was changed to satisfy the test.

## Inspect the existing hosts

- <http://localhost:8000/experiments/bayesian-reasoning/>
- <http://localhost:8000/experiments/authoring-market/#equation-authoring>

These links open hosts, not automatically applied source revisions. Paste the
retained source and explicitly Apply/Compile. The browser test performs those
steps and checks the revision/output; a URL alone is not that evidence.

## What improved, and what remains different

One task-discovery/check command replaces command hunting, while each domain
still owns its input schema, proof, diagnostics and renderer. Numeric CLI and
browser compilation now share a text boundary and a complete-success type.
Neither new specimen required renderer or motif code.

Publication is still a separate, explicit workflow. Bayes exports a standalone
source for `author:bayesian-publication`; the numeric task must be included in
an enclosing market branch for `author:market-publication`. This is a real
workflow difference, not hidden feature parity. Market output is a bounded
reading, not animated Graph2D publication or a standalone equation edition API.

The tests create unique disposable edition outputs and remove those generated
directories after inspection. Durable evidence is the committed source and
test command, not a temporary download URL. Existing static-template ownership
is preserved; this run does not change a distributed edition's bytes in place.

No new choreography, layout or editorial treatment was needed. The approved
policy therefore permits continuation without a ceremonial visual checkpoint.
Browser-cohort release verification remains later in R4A. No external model
call, measured human authoring time, physical Safari certification or learning
outcome is claimed.

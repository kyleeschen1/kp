# R4B baseline

Canonical artifact: `animation.probability.flagged-ticket-bayes` at
`http://localhost:8000/experiments/bayesian-reasoning/`, explicitly applied source.
Truth: existing probability joint model/trace/evidence. Paint: existing SVG tree
and native KaTeX session; no new renderer or motion is authorized.

`content/authoring/r4b-spam-filter.bayes.json` initially pins the hypothetical
model in strict v1 form. The existing native population is 2,000: 18 spam flags,
2 unflagged spam, 99 non-spam flags and 1,881 unflagged non-spam. The selected
posterior is 18/117 = 2/13. Editorial source will be authored at s09 after its
versioned boundary exists; this fixture is not a completed authored explanation.

`tests/bayesian-reasoning-editorial-baseline.test.ts` pins the pre-extension default
revision and exact card/reading/prompt output hashes, as well as task arithmetic
and seven existing stops. New editorial tests stay in the existing
`test:bayesian-reasoning` command; browser checks extend
`visual:authoring-entrypoints` on the shared server.

The workflow summary now names approved R4B. The metadata-incomplete, unstarted
v1 Theseus setup record remains superseded by v2; this does not change approved
scope. Neither baseline creation nor executing fixtures is an independent model
trial or an author-time/comprehension measurement.

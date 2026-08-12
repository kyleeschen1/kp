# Project Tightening Next-Step Review

Date: 2026-08-12
Status: recommended and accepted as roadmap direction

## Evidence

KP's engine is materially ahead of its product convergence. Article v1,
versioned vignettes, static publication, semantic navigation, editing,
deterministic animation, native KaTeX/SVG rendering, the catalogue, and route
budgets are real. The active repository still carries many historical lesson
projections, 13 compatibility-only ledger entries, two retained fixtures,
module-scoped choreography registration, several timeline vocabularies, and a
project roadmap that had grown into a chronological transcript.

The current public-product gap is not “invent more animation infrastructure.”
It is to make the canonical path obvious, demonstrate low marginal cost across
unlike domains, and select a release-worthy projection and small content set.

## Candidate Ranking

| Candidate | Authoring | Stale reduction | Reliability / demo | Reuse | Slice size | Speculation risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Compress control plane and canonical language | 5 | 5 | 4 | 5 | 5 | 1 | Do now |
| Audit and prune rejected production layouts | 4 | 5 | 4 | 4 | 4 | 2 | Do next |
| Make capability dependencies explicit | 4 | 5 | 5 | 5 | 3 | 2 | Follow pruning |
| Retire all compatibility in one broad rewrite | 2 | 5 | 2 | 3 | 1 | 5 | Reject |
| TypeScript refactor proof, then Python | 5 | 3 | 5 | 5 | 3 | 2 | Next domain pressure |
| Choose public layout immediately | 3 | 3 | 4 | 3 | 3 | 4 | Wait for proof portfolio |
| Start SvelteKit/Public Web now | 2 | 2 | 3 | 3 | 2 | 5 | Defer |

Scores run from 1 (weak) to 5 (strong). For slice size, 5 is smallest; for
speculation risk, 5 is highest risk.

## Recommendation

Run a convergence tranche in this order:

1. compact project memory and authoring language;
2. inventory production reachability and remove rejected projections;
3. replace implicit registration with explicit capability dependencies;
4. retire compatibility in caller-backed waves;
5. pressure the program architecture through TypeScript and Python; and
6. select one public v0 projection using symbolic, graph, and code content.

Do not begin with a physical monorepo/package migration. Narrow public APIs,
dependency gates, and production reachability produce most of the benefit with
far less churn. Reconsider `packages/` and `apps/` when SvelteKit work begins.

## Product Interpretation

The biggest bottleneck is a convincing user-facing product, but layout is only
one part of that bottleneck. Public Web v0 requires:

- two or three explanations worth returning to;
- one default projection that reads well on desktop and phone;
- searchable static prose and accessible fallback truth;
- stable URLs, navigation, and direct animation state restoration;
- restrained controls and coherent visual language; and
- an authoring/revision loop cheap enough to sustain content production.

KP may choose a competent default without declaring it universal. Alternate
projections should remain replaceable consumers of the same Article IR and
vignettes.

## Expected Gate

Before further expansion, answer:

1. Is the canonical production path obvious to a fresh model from bounded
   context?
2. Did active representations and compatibility decrease?
3. Can a TypeScript example and Python equivalent reuse the same clock,
   semantic transformations, and product host?
4. Can symbolic, graph, and code content share one credible public projection
   without authoring geometry into their sources?

Positive answers justify Internal Studio/Public Web work. Negative answers
identify a bounded architecture or product-projection issue without reopening
the entire engine.

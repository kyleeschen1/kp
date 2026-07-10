# Next-Step Review: Semantic Runtime Roadmap

Date: 2026-07-10
Status: active recommendation

## Candidates

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
|---|---:|---:|---:|---:|---|
| Derive/representation capability | 5 | 4 | 5 | 3 | Do first |
| Semantic object registry metadata | 5 | 4 | 5 | 3 | Do second |
| Transformation composition model | 4 | 5 | 5 | 4 | Do after object/derive metadata |
| KaTeX fixture expansion | 4 | 4 | 4 | 3 | Continue once composition vocabulary is clearer |
| Graph/vector timeline diagnostics | 4 | 4 | 4 | 3 | Pair with shared runtime work |
| Full curriculum and spaced repetition | 5 | 3 | 5 | 5 | Defer |
| Export/embed pipeline | 4 | 3 | 4 | 5 | Defer |

## Recommendation

Start with derive/representation capability because it connects the semantic
object layer to visible authoring value. It gives the dashboard something real
to show for objects: what can this object render as, compute as, derive into,
and prove about provenance?

Then add registry metadata so those capabilities can be searched, previewed,
and lazily loaded. After that, transformation composition and KaTeX/graph
expansion have a better foundation.

## Next Exact Work

Materialize a Theseus run contract for the semantic runtime roadmap, beginning
with derive/representation capability and moving through registry metadata,
capability previews, transformation composition, KaTeX fixtures, graph/vector
timeline diagnostics, and dashboard report-card visibility.

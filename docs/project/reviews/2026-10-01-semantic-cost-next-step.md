# Next step: measure semantic reuse and delivery cost

Status: approved by the user's “go”; execution is tracked by
`run-contract.kp.semantic-cost-v1`.

The user asked how to proceed after discussing semantic-object complexity and
browser payload risks. Recommend one bounded cost-and-reuse experiment on the
existing matrix product and its two existing interpretations. Keep the textbook
graph available as research material; expand it when a concrete authoring gap
requires more evidence.

## Evidence and uncertainty

`src/math/matrix-product.ts` already retains immutable factor entries and exposes
rows, columns, cells and scalar contributions. It eagerly constructs all result
cells and their pairs: m×n×p contribution records for an m×n by n×p product.
`src/math/matrix-interpretations.ts` regroups the same contributions into column
combinations without creating independent arithmetic identities. This is useful
reuse evidence, not measured transport or runtime scaling.

The algebra modules already have semantic spaces, bases and matrix representations.
Do not introduce a competing universal context model merely because the textbook
graph exposed the importance of these choices. Their suitability for a particular
new caller still needs verification.

The research corpus's roughly 963 KB gzip data cost is specific to its inspection
host. It is not a baseline for animation delivery. An in-memory shared reference
does not automatically survive JSON serialization as a shared reference.

## Candidate comparison

| Candidate | Authoring | Reliability/demo | Reuse | Scope/risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Measure existing product, two readings, and repeated instances | High | High | Direct | Bounded; low speculation | Next |
| Design universal context/serialization framework | Unproven | Low initially | Speculative | Large; high coupling risk | Defer |
| Import more textbook material | Indirect | Low for delivery risks | Research only | Bounded but leaves current question open | On demand |
| Add polynomial or composition animation immediately | High | Potentially high | New boundary | Multiple new variables | After baseline and first reuse check |

The first option improves the actual authoring workflow, avoids another parallel
system, preserves accepted work, and leaves a reproducible cross-session baseline.

## Proposed experiment

1. Measure the actual production delivery path for one existing animation:
   imported modules, raw/compressed JS and data, required fonts/CSS, startup,
   mounted DOM, allocation/retained-memory evidence where measurable. Distinguish
   build size, transfer with cold/warm cache, and browser runtime costs.
2. Exercise one and ten instances, both repeated and different numerical inputs.
   Separate loaded-but-inactive examples from concurrently active ones. Record
   total cost, marginal per-example cost, shared assets, mount/dispose behavior
   and measurement limitations; do not infer general scaling from two points.
3. Use the same existing product in row–column and column-combination readings.
   Preserve source/contribution identity, results, seek/reverse and existing
   choreography. Change values, selected entry/column and existing layout choices
   through authoring input. Record any renderer edits as actual API gaps.
4. Repair demonstrated costs at the owning boundary. If data is exported,
   explicitly select required objects and encode references without recursively
   copying the context graph. If callers instantiate locally, measure that path
   before adding a serialization layer. Consider lazy contribution construction
   only when measurements and consumer requirements justify it. Preserve semantic
   guarantees and full consumers. Set regression budgets from measured baselines.
5. After reviewing the bounded result, pressure the same design with one new
   interpretation or domain, preferably basis-aware composition or polynomial
   coordinates. This is a later proposal, not included implementation scope.

Success means shared code/assets are reused; unused graph/proof/rendering features
are absent from the ordinary animation's loaded dependencies; extra examples add
mostly their necessary input/score/instance costs; visual instances retain common
semantic identities; and a supported example can change without renderer edits.
Exact byte/time ceilings should follow baseline measurements, not invented targets.

## Preservation and review boundary

Use the existing matrix examples host and dot-product passage as canonical
references, their existing Native KaTeX/compositor path as renderer, and the
matrix product's typed values and contribution identities as semantic authority.
Measurement-only work has no new aesthetic gate. Any new layout or motion needs
one reversible exemplar review before wider rollout. Keep measurements/export
repairs independently revertible and avoid changes to mathematical semantics.

The previous rectangular-authoring contract remains at its recorded visual
checkpoint. This recommendation does not resume it, waive its checkpoint,
restart delivered interpretation work, or reopen the parked symbolic inspector.
The approved work covers steps 1–4. Step 5 remains a later proposal. Preserve the
existing feature branch and its accepted dependencies; no merge or deployment.

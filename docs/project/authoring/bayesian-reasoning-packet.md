# Bounded Bayesian authoring packet

Canonical host: <http://localhost:8000/experiments/bayesian-reasoning/>.
Artifact `animation.probability.flagged-ticket-bayes` uses an exact binary joint
model, seven semantic stops, shared Focus Card input, a derived SVG tree and
canonical native KaTeX evaluation. Source/revision pins distinguish examples.

## Author, check, preview, publish

Get complete starter JSON with `npm run author:bayesian-reasoning -- --example`
or `--example urn`. Check with `--request path/to/source.json` (or `-` for stdin).
Compilation exits 0; a located repair gap exits 2. Paste into the host editor
and Apply; invalid edits retain the entire last-valid revision. Inspect all
seven stops, denominator/return, readings and practice. Download the applied
source, not an unapplied textarea edit. Build with
`npm run author:bayesian-publication -- --source path/to/source.json`; verify
with the same command plus `--check`. Editions retain immutable bytes and local
shared style/font snapshots; style changes affect newly built editions only.

## Supported grammar

```json
{"schemaVersion":"kp.bayes-source.v1","model":{"kind":"prior-likelihoods","sourceId":"probability.two-urns.v1","events":[{"id":"urn-a","label":"Selected urn A","complementLabel":"Selected urn B"},{"id":"red","label":"Drew red","complementLabel":"Drew blue"}],"prior":"1/2","likelihoods":["1/4","3/4"]},"teaching":{"firstEventId":"red","detailLevel":"key-steps"}}
```

Events are A then B. `prior` is P(A); `likelihoods` are P(B|A), P(B|not A).
Alternatively use `kind: "joint-masses"` and `masses` instead of prior and
likelihoods. Its order is A∩B, A∩not B, not A∩B, not A∩not B. The equivalent urn
masses are `["1/8","3/8","3/8","1/8"]`. Never supply both forms.

All probabilities are exact nonnegative n/d strings with positive denominators.
Joint masses sum exactly to one; no independence or rescaling is inferred.
IDs are explicit distinct alphanumeric identities (dots, underscores, hyphens
allowed). Labels are nonempty and at most 160 characters. Integers have at most
18 digits; source is at most 100,000 characters. The native arithmetic motif
requires an exact safe-integer display population; oversized cases return a gap.

The lesson asks **P(A|B)**. `firstEventId` chooses either declared event's tree
order, not a new question. Detail is `complete` or `key-steps`; neither omits
the seven stops: population, first partition, joint tree, marginal, conditional,
restored population, reordered tree. Zero outcomes are valid; zero-mass B
returns `probability.undefined-condition`, never zero or an invented branch.

## Repair and limits

### Opt-in authored explanation (v2)

Use `--example spam-explanation` or `--example urn-explanation` for complete
checked-in sources. Both use the same compiler and views. The latter starts
color-first rather than urn-first; its posterior is 1/7. The original default
and `--example urn` remain strict v1 with default prose and unchanged revisions.

`kp.bayes-source.v2` adds one required `editorial` object: `title`, `setup`,
exactly seven `passages`, `readings.full`, `readings.compact`, `denominator`, and
`prompts.prediction`/`prompts.reconstruction`. Passages contain `stateId`, `title`,
`body`; prompts contain `title`, `body`. Inline text is an array of nonblank
literal strings and `{ "fact": "posterior" }` references, not Markdown or HTML.
Keep spaces attached to neighboring words; whitespace-only pieces are rejected.
Passage IDs must equal the compiled seven states in order: `<sourceId>.state.`
followed by population, first-branches, joint-tree, marginal, conditioned,
full-population and reordered. No authored duration, answer or motion fields.

Closed fact names: `event.a`, `event.not-a`, `event.b`, `event.not-b`, `prior`,
`likelihood.a`, `likelihood.not-a`, `joint.tt`, `joint.tf`, `joint.ft`, `joint.ff`,
`numerator`, `denominator`, `posterior`, `population`, `count.tt`, `count.tf`,
`count.ft`, `count.ff`, `count.flagged`. The historical name `count.flagged`
means the total B count even when B is red rather than a flag. Likelihoods
mean P(B|A) and P(B|not A); requesting one for an empty parent returns a gap.

Title limit 160, passage/prompt titles 120, literal pieces 1000 characters;
inline arrays 1–32 pieces; each reading 1–12 paragraphs. All slots are required,
unknown fields rejected. Required definitions, assumptions and computed answers
cannot be removed or overridden. A prose edit changes the lesson revision, not
probability evidence. Bound numbers recompute on model edits, but free prose
and story/parameter/tree-order compatibility still need editorial judgment.
Compiling false prose does not certify it as true.

Paste the complete urn source into the existing editor and Apply. For spam,
the host also has a load-into-draft button; loading is not applying. Both export
through the existing displayed-source and immutable local-edition commands.

Read diagnostic `code`, `path`, `expected`; repair from the problem statement,
then recheck. Example: `teaching.durationMs` is rejected at that path. Remove
it; do not replace it with another timing field. Unsupported questions stay gaps.
Do not author SVG, geometry, timing, glyph IDs, certificates, new operations,
clocks, arbitrary LaTeX, causal claims, or fallback animations. Labels are
editorial, not proved. Compilation does not establish empirical story truth,
teaching quality, or learner comprehension. A valid unchanged starter does not
fulfill a requested edit. Label injected test faults separately from model
mistakes; one two-call trial is not a model success-rate estimate.

## Live evaluation permission boundary

The local packet and checker make no model calls. The synthetic live trial is
explicitly deferred until the next real authoring task; it is not required for
current R3 completion. Future evaluation still needs external-payload approval.
Previously proposed destination: OpenAI
Codex, model `gpt-5.6-sol`, using existing access, at most two calls. Proposed
payload: this packet, the synthetic default starter and parcel-inspection task,
then the generated JSON plus checker diagnostics (or a labelled injected
unsupported timing field). No unrelated repository files, user content or
credentials are prompt content. Do not implement or invoke the blocked runner
until that specific payload and destination are approved.

# Bounded authoring round-trip packet

Start with `llm-generation-entrypoint.md`. This packet is for the existing
supply-tax specimen and governed logarithm change-of-base chain, not arbitrary
economics or arbitrary LaTeX animation. R1 execution is owned by
`../reviews/2026-09-07-authoring-round-trip-long-loop-proposal.md` and Theseus.

## Supply-tax source edit

Canonical reader host: `/experiments/kinetic-figure/supply-tax/`; development
preview: `/experiments/authoring-market/`, on the same `npm run dev` server
(port 8000). Source editing is filesystem authoring, not a browser write API.
Do not start another server if this shared server is already running.

1. Edit prose in
   `src/experiments/authoring-market/authoring-market-article-source.ts`.
   Preserve semantic reference IDs and `facts.text`/`facts.latex` slots.
2. For parameters, edit/select a supported specimen in
   `src/experiments/authoring-market/authoring-market-model-source.ts`.
   Let `buildKpAuthoringMarketPreview` recreate Article facts from the same
   model revision. Never copy old Article bindings onto new model parameters.
3. `prepareKpAuthoringMarketPreview` validates that pair through shared
   `prepareKpAuthoredMarketSource`. The preview receiver retains the last valid
   result when the new candidate fails. Source edits are not reader input state.
4. Run `npm run test:authoring-integration` for integration checks, and
   `npm run visual:authoring-market` for the existing browser workflow.

The reference currently produces revenue 12; the supported variation produces
10. Both are derived values, not prose constants to patch by hand. Free prose
is reviewable editorial content, not machine-proved mathematical truth.

Executable accepted/rejected examples:
`tests/authoring-round-trip-baseline.test.ts`. It changes a heading while
preserving the model revision, rebuilds the parameter variation, and rejects a
mixed old-Article/new-model input. Run from the repository root:

```sh
node --disable-warning=ExperimentalWarning --test tests/authoring-round-trip-baseline.test.ts
```

Canonical publication remains the reference specimen at this stage. Preview
selection alone does not select a publication revision. Do not hand-edit
generated JSON/HTML; the existing `npm run compile:canonical-tax-source` and
`npm run check:canonical-tax-source` own generated canonical artifacts.

The preview's **Inspect recent source builds** control retains the last four
successful builds in the current tab. Select a revision and inspect it without
changing source files. The current draft and inspected display remain separately
labeled; a new source save returns to live draft reporting. Reload/disposal
clears this disposable cache. It is not durable source history or a new semantic
snapshot authority; use the existing source files/version control for durable work.

**Export selected source as branch** creates a separately named `.market.json`
download. It records the selected predecessor, preserves prose and model inputs,
and gives the branch its own Article source identity. Edit the downloaded copy
through ordinary file authoring; the live TypeScript sources are not overwritten.
This is an editable source packet, not a published edition or a verified claim
that someone reviewed its prose. `readKpAuthoringMarketSourceBranch` validates
identity and reuses existing preparation, including mixed-revision rejection.
Build the selected branch explicitly from the repository root:

```sh
npm run author:market-publication -- --source path/to/draft.market.json
npm run author:market-publication -- --source path/to/draft.market.json --check
```

Output is confined to `tmp/codex/authoring-market-editions/<branch-name>/`:
`index.html`, verified `publication.json`, and local KaTeX CSS/fonts. `--check`
is read-only and rejects stale source, payload, HTML or dependency bytes.
The command does not deploy or overwrite canonical source/publication files.
An optional `--name` selects another generated edition directory, not a source.

The concrete review source is `content/authoring/market-round-trip.market.json`;
its build name is `round-trip-review`. Run the same command with that path for
a reproducible example. The selected source stays outside generated output.

Selected publications carry an explicit `text-and-exact-facts` reading edition:
authored title and prose, stable reference links, native HTML/MathML and exact
market facts. It deliberately excludes the imported vignette's fixed reference
SVG, which would be stale for a parameter variant. This is not a full graphical
vignette publication or a promotion of all Focus Cards to no-JavaScript output.
The supported equation chain also has a governed ordered-math reading projection;
invalid equation drafts cannot become a static fallback.

## Governed equation-chain edit

Use the complete executable pair `{ value, source }` from
`createKpEquationSeriesLogarithmBaseExample` in
`src/authoring/equation-series-logarithm-base-example.ts`. It binds the verified
`kpCanonicalLogarithmChangeOfBase` through
`createKpEquationSeriesLogarithmBaseSemanticSource`; the model does not invent
that authority. Call the existing internal TypeScript compiler:

```ts
const candidate = compileKpEquationTransformSeries({
  value, governedSources: [source], previous
});
```

Imports and exact pins are in the helper and baseline test. The request owns
ordered LaTeX states, intent, narration, and source references, never geometry,
timing, or renderer glue. A missing source or inverted target fraction returns
`repair-required`; inspect `repairs` and preserve `active` from the previous
valid candidate. Correct the input/authority mismatch, then compile again.
Do not remove a required assumption to make a request pass.

The existing CLI now explicitly selects the same trusted source:

```sh
npm run author:equation-series -- --example logarithm-change-of-base
npm run author:equation-series -- --example logarithm-change-of-base --request draft.json
```

The first command emits a compiled response containing the editable `request`.
Save that request object (not the entire response) as `draft.json`, edit it,
and run the second command. No file is written by this CLI. Without `--example`,
matching source pins alone do not bind source authority. Unknown examples,
false endpoints and missing assumptions return repairs with exit code 2.
`npm run author:equation-series -- --list` inventories operations and examples.
The development preview now mounts the verified equation in the shared Focus
Card scaffold at `/experiments/authoring-market/#equation-authoring`. It uses
`animation.equation.logarithm-change-of-base.v1`, the existing player clock,
and the canonical native-KaTeX change-of-base surface/transit session. This is
not the different log/exponent-solving sibling on the supply-tax page.

Edit the request JSON and compile. State `narration` is optional Markdown;
successful edits update passages without replacing the equation compositor.
Dirty, malformed or unsupported drafts remain in the editor and retain the
last valid card. **Restore displayed request** explicitly restores the editor
to that valid request; neither action writes a source file. This draft is
tab-local and must be exported for durable work.

To include it in an edition, explicitly check **Include displayed, compiled
equation in this edition** beside source-branch export. An uncompiled/invalid
draft blocks that export instead of silently publishing the retained equation.
The downloaded source's optional `equationRequest` is validated again by the
same bounded compiler during the local build. Its ordered native MathML and
authored narration join the market reading; unrelated equations are never
appended implicitly. The checked-in review source includes this equation.

The combined executable browser workflow edits a real market source, breaks
and repairs it, inspects a retained revision, compiles equation narration,
exports that selected pair, and verifies a real local filesystem build with
JavaScript disabled. Run `npm run visual:authoring-market`; focused filters
are `-- --grep 'actual local-file rebuild'` and
`-- --grep 'equation authoring Focus Card'`.
The new authoring card and workflow still require the R1 human checkpoint;
compilation/browser checks alone do not grant visual or catalogue promotion.

```sh
node --disable-warning=ExperimentalWarning --test tests/authoring-round-trip-corpus.test.ts
```

The corpus contains 24 requests: two accepted variants of one governed
mechanism, five deliberate failures, and 17 unbound curriculum probes. Their
typed repair gaps do not mean the mathematics is false or absent elsewhere in
KP. New operation/motif support is outside this packet: retain a typed gap.

## Handoff contract

Return the changed source paths, exact candidate revision, executed commands,
diagnostic path/code/repair when rejected, and the preserved active revision.
Never report deterministic fixtures as an actual live-model trial. Do not
claim authoring or visual promotion from a capability registration alone.

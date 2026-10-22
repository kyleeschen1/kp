# Bounded input-comparison authoring

Use this when the teaching question concerns what happens to the difference
between two inputs to one numerical 2×2 matrix. It is separate from the older
[column-combination JSON task](matrix-column-authoring-packet.md). There is no
comparison JSON editor, publication command or arbitrary animation composer.

The accepted source is
`content/authoring/linear-algebra/dependent-columns-comparison.ts`.
`distinguished-inputs-comparison.ts` is the contrasting review candidate. Both
use the same local native view, host, clock and optical profiles. Source-only
reuse means editing mathematical objects and prose/targets inside this format;
adding a host-selectable source still requires an explicit lazy-loader entry.

## Mathematical objects first

```ts
const A = M.matrix("example.A", [[1, 2], [2, 5]]);
const inputs = M.matrix("example.inputs", [[3, 5], [-1, -2]]);
const product = M.product({ id: "example.product", left: A, right: inputs });
const relation = compareInputs(product);
```

Import `M` from `src/math/authoring/matrices.ts`, `compareInputs` from
`src/math/matrix-input-comparison.ts`, and `defineComparison` from the local
`src/experiments/matrix-column-combinations/comparison-source.ts`.
Each right-hand column is an input vector. Results, differences and weighted
contributions are derived; never supply their values separately in the view.

`relation.inputs.before/after` and `outputs.before/after` retain original lenses.
`inputDifference` is a genuine 2×1 matrix; `image` is A applied to that difference.
`combination.terms` retains each original column and derived coefficient/product.
`kind` distinguishes lost differences, identical inputs and distinguished inputs.
The owner rejects unsupported shapes, unbound/noninteger entries and arithmetic
outside its exact safe-integer boundary. It does not prove general injectivity.

## Explain through the fixed sequence

Copy one complete source and use `defineComparison({ relation, title,
introduction, beats, conclusion, question, answer })`. Its six beats are, in order:
compare the mappings; subtract inputs; inspect the difference; use its entries
as column weights; evaluate the contributions; add them.

Each beat supplies `{ id, text, targets }`. IDs are unique URL-safe names;
targets are actual relation entity/group IDs. For example,
`targets: [relation.inputDifference.id]` focuses the difference's entries.
Names may change with meaning: `opposites`/`zero` in the accepted source become
`partial-cancellation`/`output-change` in the contrast. The underlying six phases
do not change. Do not add coordinates, duration, CSS, new phase kinds or new
renderers to the source. Those requests need a separate supported mechanism.

The constructor checks structure and reference closure, not prose truth or
pedagogical effectiveness. It copies/freezes cues and targets so later mutation
cannot change a prepared explanation. Large numerals may still need horizontal
scrolling; safe arithmetic does not establish layout quality for arbitrary data.

## Apply and inspect

The local loader accepts `?compare=1` (accepted lost difference) or
`?compare=1&case=distinguished`. An unknown/duplicated case fails explicitly.
Step IDs are hash links. Reload preserves named endpoints; fractional scrub
positions are not pinned by this preview. The complete calculation disclosure
contains the matrix and seven native MathML equations after JavaScript loads.
This host is not a no-JavaScript publication.

Run `npm run test:matrix-comparison`, `npm run visual:matrix-comparison` and
`npm run typecheck` after a source change. Promotion uses
`npm run visual:matrix-comparison:cohort`, complete-consumer measurements and
human judgment. Checks do not certify the general Native KaTeX compositor.
The next worthwhile expansion must answer a different question cheaply; another
numerical substitution alone is not evidence for a universal rendering API.

# Concise domain authoring

These entrypoints reuse existing semantic and presentation authorities. They
are scoped conveniences, not a universal animation language or broader support
claim. Existing longer names remain compatible for internal and advanced use.

## Matrices

```ts
import * as M from "../../../src/math/authoring/matrices.ts";

const A = M.matrix("example.A", [[1, 2], [3, 4]]);
const B = M.matrix("example.B", [[5, 6], [7, 8]]);
const product = M.product({ id: "example.AB", left: A, right: B });
const firstDot = product.cell(0, 0).dot;
const firstRow = M.parts(A).row(0);
const firstColumn = M.parts(B).column(0);
```

Indices are zero-based. The entry values selected through `firstDot`, `firstRow`
and `firstColumn` are the same immutable objects. Selecting does not copy them.
The product holds result destinations and contribution provenance. Creating a
visual copy remains the presentation owner's responsibility.

`matrix(id, rows)` accepts nonempty rectangular numeric tuples, rejects nonfinite
values, and preserves literal dimensions. Entry IDs are `${id}.${row}.${column}`,
matching the former example helper. Use distinct stable matrix IDs; the product
owner rejects conflicting identities. For runtime arrays, symbolic scalars or
basis-backed maps, use the existing typed constructors; this numeric convenience
does not erase those distinctions or claim exact arbitrary-precision arithmetic.

`product`, `parts`, and `evaluate` delegate directly to existing math owners.
The actual source caller is `content/authoring/convergence/matrices.ts`.
Its accepted view still supports the bounded 2×2 column-combination presentation;
the math object's rectangular support does not broaden renderer support.

## Bounded algebra chains

```ts
import * as algebra from "../../../src/authoring/algebra.ts";

const result = algebra.check(sourceJson);
if (result.status === "compiled") {
  const draft = result.draft;
  const savedSource = algebra.serialize(draft);
  // Pass draft to the existing composed-algebra host.
} else {
  const { code, path, expected } = result.diagnostic;
  // Report the located repair; retain the last valid displayed revision.
}
```

`compile(source)` checks an in-memory source and returns the existing issued
presentation, throwing `Repair` for supported diagnostics. `check(json)` returns
the compiled/repair-gap union. `read` validates source objects, `parse` reads JSON,
`serialize` exports checked source, and `session` retains the existing prepare/
commit/dispose lifecycle. Omitting `compile`'s input retains the existing example
default; supply source explicitly for authored work.

This module supports the existing four/five-state real-scalar
collect → evaluate count → distribute → optional product evaluation contract.
The source schema, declared symbols, explicit state IDs and narration stay intact.
See `reusable-algebra-intuition-packet.md`; this is not an arbitrary proof solver.
The real page and editor callers are `src/experiments/composed-algebra-intuition/`.

## Import and extension boundaries

Use a namespace for a specific domain module, not one eager object assembling
all KP capabilities. These modules have no new runtime registry or renderer.
Concise algebra names currently alias the proven implementation; matrix creation
additionally removes repeated scalar construction. The remaining authoring
opportunity is fewer source concepts and shared host wiring, not more aliases.

Validation: `tests/concise-authoring.test.ts` checks dimension inference, invalid
shapes/nonfinite inputs, stable identity, source mutation isolation, unchanged
algebra animation artifacts, source round-trip and located repair diagnostics.
The standard matrix/algebra suites and full typecheck retain their authority.

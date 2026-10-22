# Bounded matrix column authoring

Use this packet for numerical 2×2 multiplication in the accepted column-combination
presentation. Both the typed TypeScript input path and the checked JSON task
below use the same mathematical objects. Neither is an Article schema,
arbitrary-matrix renderer or symbolic simplifier.

## Check a source file

Use `npm run author:check -- --task matrix.column-combinations --example` for a
complete starter derived from the accepted dependent-columns source. Save its
source as JSON, then run
`npm run author:check -- --task matrix.column-combinations --request <file.json>`.
The checker is read-only: it does not update a preview or publish anything.

`kp.matrix-columns.v1` accepts an ID, finite numerical 2×2 `left` and `right`
arrays, and `reading`: title, introduction, two complete seven-beat cue records,
conclusion paragraphs and a question with its answer. Results and scalar
contributions are derived; motion, geometry and authored result fields are
rejected. Prose is editorial, not verified mathematical proof. Located repair
gaps cover invalid fields, unsupported dimensions, missing cues and arithmetic
overflow. Values use JavaScript numerical arithmetic, not exact real arithmetic.
Scientific notation in factors or derived values is a repair gap: the accepted
renderer supports ordinary decimal numerals, not exponent choreography.
`npm run test:matrix-source` checks this boundary and semantic identity.

## Edit and preview without rebuilding

Open `http://localhost:8000/experiments/matrix-column-combinations/?author=1`.
The accepted dependent-columns source is the starter. Load a local JSON file or
edit the textarea, then select **Apply source**. Loading and typing change only the
draft. Apply checks it and prepares the existing player before replacing the
display; errors leave the previous animation usable. Result column 1/2 compares
the displayed source at the held animation position, even if the draft is invalid.

**Download draft** saves the exact textarea, including incomplete work.
**Download displayed source** saves normalized checked JSON for the revision
actually displayed. Feed that file to the edition command below. Files are never
overwritten, and there is no autosave: reload restores the starter. Use a built
edition for durable revision-pinned reading URLs. Text remains editorial; editing
the factors does not update or verify explanatory claims automatically.

`compile`, `check`, `serialize` in `src/authoring/matrix-columns/compile.ts` and
`session` in the adjacent `session.ts` expose the checked source/revision boundary.
The host reuses `columnExampleFromProduct` and `mountColumnPlayer`; it does not
author geometry or motion. `npm run visual:matrix-authoring` checks file import,
revision ownership, export, failures, cleanup and production playback across the
supported browser engines. Ordinary readers do not load this editor.

## Make a local edition

Run `npm run author:matrix-publication -- --source <file.json>` for a complete
static reading. Add `--interactive` to include the accepted column player, or
`--check` to reproduce and verify an existing edition's exact bytes. The command
prints the content-addressed directory under `tmp/codex/matrix-editions/`, source
revision and byte-edition identity. Keep authored files outside this generated
directory. Serve the edition directory over local HTTP to open its `index.html`;
the shared dev server also serves its reported repo-relative path on port 8000.

Both modes include exact source bytes, publication evidence, all local styles and
fonts, both result columns and all fourteen cues. Interactive mode includes the
production reader without the registry, editor or other authored lessons. Column
links preserve fractional progress; reload and copied URLs pin that position to
the source revision. A stale pin produces an error. Static meaning remains
available with JavaScript disabled, unavailable or rejected source setup.
These are local artifacts, not deployed publications or proof of prose quality.

The registry preview below continues to use its explicit TypeScript sources.

## Start and change an example

The complete source is `content/authoring/convergence/matrices.ts`. Change the
`left` and `right` arrays of one retained input (`signed`, `zero` or `larger`):

```ts
{ id: "signed", left: [[-2, 3], [4, -1]], right: [[-1, 2], [2, -3]] }
```

The [concise domain API](concise-domain-api.md) binds immutable scalar expressions
through `M.matrix` and calls `M.product`. Scalar IDs come from the named input, factor, row and column,
never from matching text. `columnExampleFromProduct(product, column)` retains
the same product, operand references, contributions and derived results.
Changing values requires no geometry, timing, CSS or renderer code.

Preview that source at
`http://localhost:8000/experiments/matrix-column-combinations/?input=signed`.
Use the Result column links to visit both columns without losing the input.
`?input=zero` and `?input=larger` exercise zero contributions and larger signed
entries. The unqualified route is the original accepted example. The matrix menu
continues to use this same player; it is not a second implementation.

## Checks and boundaries

- TypeScript constrains these source arrays to 2×2. The existing presentation
  adapter rejects other shapes, unresolved parameters and nonfinite evaluated
  entries with `MatrixColumnGap`; no unrelated animation fallback is selected.
- `npm run test:matrix-interpretations` checks products and retained references.
  When deliberately changing a retained example, update its independently
  calculated expected answer in the source test.
- `npm run visual:matrix-interpretations` applies the actual source module to
  the existing host, checks factor values and both result columns, verifies copy
  provenance, reversal and native endpoints, and captures the result.
- `npm run typecheck` checks authored TypeScript along with its consumers.
- `npm run build:semantic-cost`, `npm run measure:semantic-cost` and
  `npm run visual:semantic-cost` cover complete dependency closures, cold/warm
  requests and one/ten-instance lifecycle costs.

Three edited inputs demonstrate value reuse within this layout. They do not
establish legibility for unbounded digit lengths, automatic story generation,
rectangular shapes or arbitrary symbolic entries. Accessible calculation text
is generated by the existing host after JavaScript loads; this experiment does
not provide a published no-JavaScript Article. Canonical native-compositor
certification remains separate from this local optical-profile reuse.

## Explain a selected input

`content/authoring/linear-algebra/projection-loss.ts` is an accepted explanatory trial:
two different vectors are mapped to the same output by a projection. The user
approved it on October 21, 2026. The matrices use the same `M.matrix` / `M.product` API. An
optional `ColumnReading` supplies title, introduction, two cue records keyed by
the seven existing milestone IDs, conclusion paragraphs and one question/answer.
Prose is editorial, not checked mathematical evidence. All fields render as
plain text; no HTML, geometry, choreography or clock is accepted through them.

The existing projection call is now:

```ts
columnExampleFromProduct(product, column, reading);
```

Omit `reading` to retain the existing generated text. Register a source alongside
the numeric inputs in `matrixSources` in `content/authoring/convergence/matrix-sources.ts`.
That registry supplies both selection and menu links; the host needs no lesson-ID
branch. Open `/experiments/matrix-column-combinations/?input=projection-loss` and
use Result column 1/2 to inspect the two inputs. The selected source survives
column navigation. The host remains a JavaScript preview, not a source-specific
no-JavaScript publication or arbitrary LA authoring task.

The trial exposes remaining limits: the seven-step sequence is fixed;
narrow screens require horizontal stage scrolling;
cue text does not itself bind semantic subobjects or verify explanatory claims.
Acceptance covers this example. Pressure a structurally different caller before
expanding that editorial seam or introducing another presentation abstraction.
See `../reviews/2026-10-21-projection-loss-authoring.md`.

The second candidate, `content/authoring/linear-algebra/dependent-columns.ts`,
uses the same interface with two nonzero dependent columns and signed weights.
Open `?input=dependent-columns` on this host. Its source and registry entry
require no host/API changes; both inputs produce (1,2) through partial cancellation.
The user accepted the explanation on October 21. This demonstrates another mathematical reading
within the same sequence, not arbitrary lesson topology. See
`../reviews/2026-10-21-dependent-columns-authoring.md` for limits and evidence.

## Persistent preview and lazy registration

Register an ID, title and lazy `load` function in
`content/authoring/convergence/matrix-sources.ts`. Keep source bodies out of its
static imports. The loader checks the returned ID/title against the descriptor;
the existing presentation still validates shape and finite values. Numeric trial
data stays in `matrices.ts`. Only the selected source body is requested.

Column comparison now stays in the same document at the held position; source
and interpretation links use their declared starts. Exact fractional links use
`#p=0.64`, alongside existing milestone links such as `#scaled`. Reload and
Back/Forward retain source, column and position. Failed loads preserve the usable
prior source. Each replacement disposes the old player instead of retaining
prepared scenes. See `../reviews/2026-10-21-matrix-reader-continuation.md` for
measured costs, lifecycle evidence and the unchanged presentation boundaries.

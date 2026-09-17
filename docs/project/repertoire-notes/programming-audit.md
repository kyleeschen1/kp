# Programming implementation audit

Source inspection: 2026-09-16. The inventory separates language semantics,
source transformation, runtime state and visual treatment. A robust product
implementation of cancellation or resource disposal is not itself an implemented
teaching interface for those concepts.

## Positive evidence

- `code.call-bind`, `.return`, `.recursion`, `.base-case`, and call/binding motifs:
  [Scheme factorial asset](../../../tests/scheme-factorial-animation-asset.test.ts),
  [recursive evaluator](../../../tests/scheme-factorial-evaluator-recursion.test.ts),
  [source model](../../../tests/scheme-factorial-source-model.test.ts),
  [reuse boundary](../../../tests/scheme-factorial-reuse-boundary.test.ts).
  The bounded `(factorial 3)` source evaluates to `6` through explicit call-local
  bindings, suspended multiplications, base case and returns. Source identities
  come from syntax addresses, not repeated glyphs. This is not a universal
  arbitrary-source animation generator.
- `code.extract-ts`, `code.extract-python`:
  [TypeScript legality](../../../tests/typescript-extract-helper-legality.test.ts),
  [Python legality](../../../tests/python-extract-helper-legality.test.ts),
  [cross-language implementation closeout](../reviews/2026-08-13-cross-language-code-animation-foundation-closeout.md).
  Checked free-shipping predicates move into helpers while preserving contributing
  bindings and replacement calls. The frontends reject ambiguous ownership and
  unsafe capture rather than invent semantic correspondence.
- `code.extract-centroid`, `.rename-centroid`, extraction/rename motifs:
  [accepted centroid motion](../threads/2026-09-16-centroid-motion.md).
  The calculation moves into a helper, followed by parameter/local renaming.
  Independent runtime storage is not merged merely because source text matches.

## Evidence-backed gaps and partial support

- `code.extract-keyword`: the Python legality test explicitly rejects the
  keyword-only/keyword-call shape with `code-refactor.unsupported-source-shape`.
  This is a confirmed boundary of that frontend, not a claim that Python cannot
  express the transformation or that no future compiler could support it.
- `code.recursion-general`: the bounded source/trace and
  [authoring entrypoint](../authoring/llm-generation-entrypoint.md) explicitly
  withhold arbitrary-source semantic correspondence and choreography. A new
  recursive topology requires its own authority/exemplar rather than a fallback.
- `code.extract-capture`: rejected bad captures are valuable partial evidence;
  they do not establish general closure-safe extraction across languages.
- `motif.code.text`: persistent text coordination remains an identified next
  experiment. Beautiful token motion does not settle long-prose coordination.

All other unchecked programming rows remain unaudited. Loops, aliasing, sorting,
graphs, concurrency and types are included because authors need to explain those
relationships, not because existing runtime infrastructure already does so for
learners. Evidence tests are source-inspected unless explicitly recorded as run.

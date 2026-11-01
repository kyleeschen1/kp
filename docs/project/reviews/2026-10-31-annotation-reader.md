# Annotation reader integration evidence

Scope: [approved delivery](../2026-10-31-annotation-reader-delivery.md).
Execution: `run-contract.kp.annotation-reader-v1`.

## Shared document projection conversion

The fractional reader now selects the document theater explicitly. The static
prose compiler constructs the intro, story pin, actual passage blocks and
continuation from the parsed document, and the page shell constructs Options and
static fallback directly. `fractional-caption-shell.ts` and its completed-page
HTML rewrite are removed. The layout boundary rejects multiple/missing stories,
nested attention sequences, unknown passage bindings and unowned mathematical
progress before emitting a partial page.

Document styles, scroll geometry, passage focus and lifecycle now have shared
document names. The entry selects the compiled layout declaration rather than
the fractional lesson ID. The fractional operation associations remain with
their semantic source. Existing script/test consumers use the new owners;
the native equation renderer, source, semantic URLs and visual values are
unchanged. No compatibility facade or new clock was added.

Baseline and converted `npm run visual:fractional-linear-equation -- --rising
--base-url=http://127.0.0.1:8011` both passed desktop/phone reading, generous
handoffs, held math, reversal, slider retirement, reflow, native find, Read all
and static/print checks. Four focused compiler/scroll/passage suites pass all
14 tests. Application, Node and test TypeScript projects pass, as does
`npm run check:architecture`. The exact reachability graph is regenerated for
the moved modules; no budget was raised and no runtime speedup is claimed.

The first exact-caller check rejected the old alphabetical ordering after module
renaming; the corrected exact list passes all 12 reachability/caller tests. The
first endpoint-boundary capture sampled a missing progress value while startup
restored the URL. Its clean rerun passed all desktop/phone endpoints; the harness
now waits for the existing font-stable host-ready marker before measuring, rather
than treating early shell hydration as readiness. No visual assertion is relaxed.

This checkpoint establishes a shared projection with the original consumer
preserved. The new annotation reader is the next package; integrated appearance
and attention are not yet accepted. The projection conversion is independently
reversible, leaving the previous annotation candidate intact until replacement.

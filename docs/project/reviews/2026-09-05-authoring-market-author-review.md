# Authoring market: reviewable source and cost

This is an internal authoring/API specimen, not a promoted public facade or a
new publication format. The approved plan remains the long-loop proposal;
Theseus owns progress. Run `npm run dev` and open
`/experiments/authoring-market/` for the local-file preview.

## What an author edits

- `src/experiments/authoring-market/authoring-market-model-source.ts` names two
  specimens and declares exact demand/tax inputs. Set
  `kpAuthoringMarketSelectedSpecimen` to `variation` for demand 14, then tax 2.
- `src/experiments/authoring-market/authoring-market-article-source.ts` owns
  literal prose and explicit `math("after.revenue")` / `value("after.tax")`
  slots. Save either source in the ordinary local editor. Build diagnostics
  identify the source revision; invalid drafts do not replace the last valid
  mounted preview or overwrite source.
- Model declarations, family meaning and composition order remain in
  `src/experiments/typed-linear-supply-demand/semantic-state-composed-market.ts`.
  The `root` declaration owns demand-then-tax order. An order change is a
  semantic edit, not a prose-only edit or permission to reorder the fixed tax
  choreography. The executable order/query specimen in
  `tests/authoring-integration-explanation.test.ts` demonstrates that changing
  declared order changes historical queries while preserving member meaning.
- Query with `createKpSemanticStateQuerySession(packet.explanation)`, then
  `query.evaluate(address, packet.stateHandles.refs.outcomes.evaluation)`.
  Addresses come from existing composition handles; settled pins recover
  immutable history. Dispose the session when its owner retires. The query,
  clock, frame and variation tests are executable usage examples.

Only the two ordinary input/template files are watched for retained-preview
rebuilds. Changing assembly implementation uses the normal development workflow,
not a claim of transactional live editing for every repository file.

## Honest support boundary

Demand is explicitly `settled-history`; tax alone uses existing motion.
The variation explains initial `(Q,P)=(5,7)`, post-demand `(6,8)`, then post-tax
`Q=5`, buyer/seller prices `9/7`, revenue `10`, total surplus `35`.
Demand `motion` returns a typed repair gap. Neither generic state updates nor
matching asset IDs grant domain-operation or renderer authority.

The existing eight Article references retain their score/attention order.
Missing or reordered references fail explicitly. Free-prose truth verification,
arbitrary demand animation and a visual branch editor are not implemented.
Local TypeScript is trusted build-time author code; it is not arbitrary browser
code or a safe execution environment for untrusted modules.

## Comparable author cost

`npm run test:authoring-integration` emits repeatable AST-based cost and complete
owner-local helper inventories. The frozen comparison is the same composed
market task, not the much smaller parameter-selection file.

| Comparable boundary | Frozen manual | Internal assembly |
| --- | ---: | ---: |
| Setup nonblank lines | 205 | 158 |
| Setup orchestration | 52 | 15 |
| Additional compatibility glue charged | 0 | 6 |
| Charged orchestration | 52 | 21 |
| Module imports | 22 | 14 |

Charged orchestration falls **59.6%**, exceeding the approved 50% target.
Semantic declarations still occupy 143 setup lines. The live module is 268
nonblank lines versus the frozen 330; this is not a total-repository reduction.

Shared assembly costs 387 nonblank lines and the bounded math bridge costs 307.
The preview/lowering/build inventory costs **897 nonblank lines across 17
files**, including both author sources (23 model-source and 49 template lines),
host, frame/fact/companion adapters, lifecycle protocol, dev plugin, governed
lowering, domain operation registration, CSS and physical document.
The inventory automatically includes files added to the authoring-market owner.

These whole-file inventories are disclosed implementation surface, not a net
diff calculation. They exclude tests/docs/generated metadata and changes within
reused canonical host/SVG/Article/Vite configuration files; those remain visible
in per-slice commits. They do not count the pre-existing renderer/state engines
as newly written. No claim is made that the overall integration is fewer lines,
that arbitrary lessons now need only 23 lines, or that one specimen establishes
a universal authoring API.

Fixed inference remains 111,257 types and 192,271 instantiations under unchanged
112,500 / 195,800 ceilings. The integration suite passes 68 tests, including
parameter variants, literal prose edits, typed gaps, ordering and queries.

## Review questions

Can an author distinguish input, model meaning, prose and choreography ownership
without hunting through implementation? Are explicit fact slots and typed gaps
useful enough to justify the remaining declaration ceremony? Does settled demand
history explain the variant adequately, or should a separately governed demand
motion be proposed? The visual checkpoint must answer readability and motion
questions before any cross-family promotion.

## Reproduce the visual review

Run `npm run visual:authoring-market`. Its committed browser entrypoint emits
disposable reference/variation captures at desktop 1280 and phone 390 widths:
baseline, mid-tax transit, surplus accounting, final loss and reverse baseline,
plus reduced-motion settlement and plain static facts with JavaScript disabled.
Images live under `tmp/codex/playwright-test-results/`; they are not adopted
goldens. The command and named checkpoints, not scratch paths, are durable proof.

Baseline/final phone prose and graph captures were inspected without a new
material treatment. Mid-transit prose is intentionally split by the preserved
horizontal-card scroll; endpoint prose is the readability checkpoint. Reduced
motion uses the existing settled navigation path. A scrubber `input` previews a
gesture, and `change` settles it before checking disabled navigation and its
accessible step label. Static facts are a model-bound plain projection, not a
claim that the dev-only preview URL now serves a no-JavaScript publication.

Automated preservation and these agent-inspected captures do not replace human
visual approval. The long loop must stop at the authoring/API checkpoint before
generalization; exact treatment values and new demand motion are not promoted.

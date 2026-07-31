# Release-Baseline Recovery Long-Loop Proposal

Date: 2026-07-31
Status: approved 2026-07-31
Proposed contract: `run-contract.kp.release-baseline-recovery-v0`
Target: new bounded next action `next-action.kp.release-baseline-recovery-v0`
Source review:
`docs/project/reviews/2026-07-31-architecture-and-library-next-loops-review.md`

## Why This Loop Is Current

Rank-2 place-value addition is promoted and its focused release matrix is
green, but the repository-wide release baseline is not trustworthy enough to
attribute regressions in the next domain exemplar. The observed debt is exact
and bounded:

1. four architecture ratchets fail in the repository test suite: HTML escape
   duplication, canonical compositor source size, linear-provider dependency
   direction, and a stale operation-promotion evidence path;
2. the shared main host is 495,627 gzip bytes against a 490,000-byte ceiling;
3. the shared reader closure is 151,256 gzip bytes against a 145,000-byte
   ceiling.

These failures predate the place-value promotion and do not justify reopening
its visual design. They do justify one release-baseline recovery before rank-3
economics, because beginning a new synchronized-view exemplar on a red
baseline would make both architectural and payload regressions ambiguous.

This loop does not change the promotion rank. Economics remains next and is
not implemented here.

## Outcome And Preservation Boundary

The loop restores all named release gates without raising accepted ceilings,
hiding code outside audited closures, or introducing a peer runtime. It keeps
the canonical Animation Library and representative readers visibly and
behaviorally unchanged.

Preserve throughout:

- commit `7b65be16` place-value appearance, motion, semantics, and release
  authority;
- all promoted equation, fraction, radical, and reader behavior;
- one canonical native-KaTeX renderer session and its frozen five paint kinds
  and six lifecycles;
- existing public authoring contracts, semantic traces, accessibility,
  Review, static/export behavior, direct seek, and rewind;
- the accepted numeric ceilings themselves;
- all unrelated dirty and untracked user work. Mixed files may be patched and
  staged only by exact hunk.

The canonical runtime checks are the Animation Library host, one solve-x
reader, one fraction reader, and place-value selection through the existing
host. This is objective maintenance work, so no aesthetic checkpoint is
planned. Any user-visible loading, layout, motion, or interaction change is a
`HUMAN_CHECKPOINT` before generalization.

## Allowed Work

- characterize and repair only the six named architecture or payload failures;
- extend existing attribution and drift-check tools when that makes the same
  regression directly diagnosable;
- consolidate one proven HTML output consumer through a context-appropriate
  encoder boundary;
- establish one neutral exact-rational implementation shared by the domain
  pack and linear provider without duplicating arithmetic;
- delete or consolidate real canonical-compositor responsibilities inside the
  audited core;
- prune or lazy-load existing main-host and reader dependencies while
  preserving behavior and production closure;
- update matching project-memory projections and Theseus evidence;
- retire compatibility code only when its last caller is proven absent.

## Disallowed Work

- economics, physics, vector, matrix, fraction-harvest, or other new content;
- place-value choreography or semantic changes;
- a new renderer, runtime, clock, scene graph, display page, or compatibility
  implementation;
- raising source, gzip, route-growth, inference, or module-count ceilings;
- moving compositor bytes into an unmeasured helper to satisfy a superficial
  count;
- a universal sanitizer, motif registry, API-tier redesign, generator bridge,
  or LLM integration;
- unrelated cleanup or wholesale staging of dirty project-memory files.

## Verification And Commit Cadence

- `focused`: the smallest exact unit or architecture test for a narrow seam;
- `standard`: focused checks plus `npm run typecheck`, impact selection, and
  `theseus workspace validate`;
- `broad`: touched-subsystem suites, production build/closure, relevant browser
  smoke, and payload measurement.

Before executing changed-path checks, inspect
`npm run verify:impact -- --path <changed-path>`. Run the selected commands only
after confirming their scope. Commit each completed slice with its Theseus
evidence as one independently reversible unit. Diagnostic slices may commit
only durable tests, attribution tooling, and evidence; they may not rewrite a
budget to create a passing result.

## Ordered Slices

The user approved the proposal with one ordering amendment: the observed
"Animation Host did not render" failure must be reproduced and repaired before
the broader baseline work. The approved contract therefore moves host
liveness to `s01`; the remaining work preserves the proposal's scope and
relative order.

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
| --- | --- | --- | --- | --- |
| `s01` | Reproduce the reported "Animation Host did not render" failure in the canonical Animation Library, identify whether it is selection, dynamic import, readiness, server, or lifecycle failure, and implement the smallest deterministic repair. Prove initial selection, search, place-value lazy mount, Review readiness, and repeated selection. | High / broad | Animation Library display, live, and host-liveness browser commands; production closure; targeted import/lifecycle tests | Commit the host repair and regression law. Stop if the fix changes visible loading/layout/interaction semantics, requires a new host/runtime, or cannot reproduce a deterministic failure. |
| `s02` | Freeze the remaining exact six-failure baseline and map each failure to its owner, untouched preservation files, and impact-selected checks. Record current byte measurements and test names without changing thresholds. | Low / focused | Four exact architecture tests; both payload measurement commands; `verify:impact` inspection | Commit characterization and Theseus evidence. Stop if any failure cannot be reproduced or is caused by an overlapping uncommitted user source edit. |
| `s03` | Extend the existing bundle and reader-budget inspectors to report stable per-file closure attribution and deltas sufficient to identify shared growth. Keep their pass/fail semantics unchanged. | Medium / standard | Inspector unit tests; both checks still fail for the same totals; typecheck | Commit attribution tooling. Stop if attribution requires parsing minified code or introducing build-system-specific runtime behavior. |
| `s04` | Repair the operation-presentation migration ledger so promotion evidence points at the source-rich generated-catalog builder rather than the metadata-only runtime catalog. Add a split-aware evidence law. | Low / focused | `operation-presentation-migration-inventory.test.ts`; catalog generation check | Commit ledger repair. Stop if the runtime catalog would need to import promotion certificates. |
| `s05` | Reconcile the stale cross-domain thread current action with v19 and extend promotion-memory checking to cover the active-thread projection without duplicating the rank table. Preserve all unrelated hunks in the dirty thread and roadmap. | Medium / standard | Promotion-memory tests/check; roadmap/thread source test; Theseus validate | Commit exact hunks and drift law. Stop if safe partial staging cannot separate user work. |
| `s06` | Inventory the 22 local `escapeHtml` definitions by output context and select one genuinely duplicate text/HTML consumer for consolidation. Encode the ownership decision in a focused test or typed inventory, not a prose-only count bump. | Low / focused | Construction inventory test; encoder consumer tests | Commit inventory and selection evidence. Stop if the extra function serves a distinct output context. |
| `s07` | Route the selected consumer through the existing or smallest context-specific encoder boundary and delete its local generic helper. Do not create a universal escape function. | Medium / standard | Consumer tests; generated-HTML escaping tests; impact-selected checks; typecheck | Commit one-consumer consolidation. Stop on output-byte or accessibility drift that lacks a deterministic explanation. |
| `s08` | Add misuse and inventory laws that distinguish text-node, attribute, and script-JSON contexts and restore the accepted helper count through deletion. | Medium / standard | Construction inventory; generated HTML/script JSON security tests; typecheck | Commit encoding guard. Stop if satisfying the ratchet requires weakening context distinctions or raising the count. |
| `s09` | Introduce one neutral exact-rational implementation beside the public provider protocol, preserving normalization, immutability, zero checks, and bigint arithmetic. The domain pack may re-export it; no duplicated arithmetic. | Medium / standard | Exact-rational unit and type tests; protocol boundary tests; typecheck/domain typecheck | Commit neutral authority. Stop if this requires adding KP domain semantics to the neutral protocol. |
| `s10` | Migrate the linear provider and domain pack to the neutral rational authority while retaining their existing public symbols and DTO behavior. | High / broad | Linear-provider boundary; provider generator/verifier tests; domain rational tests; typecheck | Commit migration. Stop on public fixture drift or a new provider-to-KP dependency. |
| `s11` | Prove cross-boundary rational conformance and remove the superseded implementation only after all callers resolve to the neutral authority. | Medium / standard | Import/reference inventory; provider/domain conformance; inference check | Commit retirement and conformance. Stop if two live arithmetic authorities remain. |
| `s12` | Make the canonical compositor source audit closure-aware so moving code to an unlisted local helper cannot evade the four-module and byte ceilings. Produce a responsibility/byte report for the audited core. | Medium / standard | Canonical renderer convergence tests; source-closure test; typecheck | Commit the stronger ratchet and report. Stop if the accepted canonical core is not expressible as a deterministic local closure. |
| `s13` | Remove or consolidate the first audited duplicate, dead, or compatibility-only responsibility from the canonical compositor core. Preserve the public session contract and paint vocabulary. | High / broad | Canonical renderer and compositor unit suites; focused seek/rewind browser checks; build | Commit first real reduction. Stop if the only available reduction changes visual behavior or hides source outside the audit. |
| `s14` | Remove or consolidate the remaining measured source excess, prioritizing retired compatibility paths and duplicated validation/geometry logic over mechanical compression. | High / broad | Same compositor suite; governed fraction/radical browser smoke; source bytes | Commit second reduction. Stop if reaching 136,000 bytes requires API breakage, vocabulary changes, or unreadable minification. |
| `s15` | Close the compositor boundary: prove source bytes at or below 136,000, exactly four audited modules, no hidden production dependency, and unchanged canonical host behavior. | High / broad | Full canonical-construction tests; canonical Animation Library browser suite; typecheck; build | Commit compositor closeout. Stop on any glyph handoff, font, flicker, seek, rewind, or paint-ownership regression. |
| `s16` | Use stable closure attribution to identify and remove or lazy-load the main-host dependency responsible for the 5,627-byte excess. Preserve route identity and the metadata-only Animation Library shell, then rerun the `s01` liveness law. | High / broad | Build; main-host bundle boundary; import-boundary tests; Animation Library host liveness | Commit main-host repair. Stop if the fix eagerly loads an animation pack elsewhere, changes a public route, or requires raising 490,000. |
| `s17` | Attribute the shared reader excess and remove or lazy-load the responsible dependency while keeping one reader runtime and all eleven manifest routes. If `s15` already fixed it, close with proof and adjacent pruning only. | High / broad | Build; reader budget report; reader production closure; import boundaries | Commit reader repair. Stop if a route needs a second runtime, duplicated reader entry, or a baseline increase. |
| `s18` | Prove all reader routes under their 5% ceilings and smoke representative solve-x, fraction, radical, and review paths, including direct navigation and static/export closure. | High / broad | Reader budgets/production; representative browser suites; accessibility/static checks | Commit route proof or exact regression fix. Stop on content, timing, typography, URL, Review, or accessibility drift. |
| `s19` | Run the complete release matrix and repair only deterministic in-scope fallout: repository tests, inference, typecheck, build, catalog, promotion memory, production closures, payload gates, canonical host browser checks, and Theseus validation. | High / release | `npm test`; inference; typecheck; build; all named checks; browser host smoke; workspace validate | Commit final deterministic repairs and evidence. Stop on a newly discovered product decision, subjective visual change, unrelated failing subsystem, or pressure to widen the contract. |
| `s20` | Publish the closeout, record exact before/after bytes and retired paths, resolve the recovery action/contract, and restore economics-equilibrium proposal preparation as the sole planning frontier. Do not materialize or execute economics. | Low / standard | Promotion-memory check; loop status; workspace validate; `git diff --check` | Commit closeout and resolved evidence. Stop if any named gate remains red; finish as `STOP_CONDITION`, not a false completion. |

## Stop Conditions

Stop immediately and record the condition when:

- a numeric ceiling must be raised or its audit weakened;
- code would merely move outside a measured closure;
- public API, route, or visible behavior must change;
- a second renderer/runtime/clock or duplicated rational authority would be
  introduced;
- the repair overlaps inseparably with unrelated user changes;
- canonical motion, typography, ownership, accessibility, Review, or export
  behavior regresses;
- a seventh unrelated architectural project becomes necessary;
- economics or another content exemplar would begin;
- a required browser judgment becomes subjective.

## Done Contract

The loop is complete only when:

1. all 3,114-or-later repository tests pass with no expectation/count bump used
   to conceal duplication;
2. the canonical compositor is genuinely within the accepted closure-aware
   four-module and 136,000-byte ceilings;
3. the linear provider depends only on its local modules and neutral protocol;
4. the operation ledger and active project-memory projection are current;
5. the main host is at or below 490,000 gzip bytes, every reader route is
   within its accepted 5% growth envelope, and the lazy place-value pack is not
   charged to the outer shell;
6. build, inference, typecheck, production closure, catalog, promotion memory,
   representative browser behavior, and Theseus validation pass;
7. no visible animation or reader behavior changed without human approval;
8. the contract resolves and the next action is economics proposal preparation,
   not economics implementation.

## Explicit Deferrals

- rank-3 economics implementation and its visual proposal;
- rank-4 physics;
- public API tiers and the verified generator bridge;
- deterministic explanation and LLM editorial work;
- fraction or place-value harvests;
- motif redesign/versioning;
- broader Safari hardening, WebGL policy, or dashboard redesign unless an exact
  named release check proves they are the source of one of the six failures.

## Approval Boundary

The user approved materializing and executing this 20-slice contract through
`s20`, subject to the named stop conditions, with Animation Host rendering
moved to `s01`. Approval does not select any plan-refill candidate, begin
economics, waive a newly triggered human checkpoint, or authorize budget
changes.

# Composed-algebra release budget checkpoint

Date: 2026-09-09 (local). Outcome: STOP_CONDITION; no budget change is approved
or applied. Contract: `run-contract.kp.composed-algebra-authoring-v1`.
Theseus owns live status: s01–s24 complete, s25 release incomplete, s26 closeout
unstarted. This is a resume record, not a second execution plan.

## Accepted work and current inspection

The user approved the repaired primary at `1b3a862d0`. Approval was recorded in
`c0c913d77`; post-acceptance work through browser promotion is committed at
`d9bf7016e`. Both retained sources use complete canonical factoring plus
ink-glyph coefficient evaluation, one native compositor and one semantic clock.
The second chain adds source JSON, not an example-specific renderer.

Open `http://localhost:8000/experiments/reusable-reasoning/?example=composed-algebra`
on the existing shared server. The primary has three stops:
`2(x+3)+3(x+3)` → `(2+3)(x+3)` → `5(x+3)`.
Paste `src/authoring/examples/composed-algebra-product.json` and Apply for the
opposite-orientation product chain. See
`../authoring/composed-algebra-authoring-packet.md` for the exact authoring scope,
checker, repairs, projections and immutable static-edition commands.

## Release budget decision

`npm run check:reader-budgets` measured the current production output:

| Route / metric | Measured | Fixed allowed | Excess |
| --- | ---: | ---: | ---: |
| `/reader/solve-x/teacher-zero/` HTML gzip | 4,582 bytes | 4,570 bytes | 12 bytes |

The route's baseline remains 4,352 bytes with the existing 5% allowance. All
other eleven routes, all raw-HTML budgets and all runtime budgets pass. The shared
equation runtime is 142,060 gzip bytes, 2,940 below its limit. The HTML includes
shared dependency URLs, so compressed size also responds to chunk boundaries
and content hashes; this is not evidence of animation slowdown. Exact attribution
of every added compressed byte is not established.

A read-only probe removing optional quotes from generated same-origin script
URLs saved 98 raw bytes but increased gzip from 4,582 to 4,583. It was not applied.
Do not change loading order, semantic content, accessibility or gzip measurement
to hide this failure. No budget baseline, ceiling, route coverage or stylesheet
was changed.

Recommendation, requiring explicit approval: replace only this route's HTML-gzip
baseline **4,352 → 4,582**, retaining the 5% policy and every other gate. This is
a measured policy amendment, not an optimization. Standing TypeScript-cost
auto-approval does not authorize this non-TypeScript change.

## Verification already complete

- `npm run visual:composed-algebra:cohort`: 51 passes across Chromium, Firefox
  and WebKit, both callers, native ownership/seams, reverse seeks, controls,
  narrow layouts, reduced motion, repeated Apply and both no-JavaScript editions.
- The initial cohort exposed a 0.35875-pixel WebKit delimiter seam and a product
  reading with six instead of eight math fragments. The shared target-clone
  normalizer now includes introduced glyphs without source frames; the Article
  compiler recovers exact display-math source before CommonMark emphasis can
  reinterpret multiplication. Both have executed red/green evidence. Settlement
  tolerance and accepted choreography are unchanged. Composed readings now
  reject missing rendered checkpoints.
- 48 composed-authoring tests; 29 canonical renderer tests; 72 shared native
  scene / Article tests. These overlap the full suite, not extra unique totals.
- Complete inference: core 113,698 types / 194,449 instantiations; combined
  172,065 / 286,160. All real consumers and negative fixtures remain. Source-size
  and inference ceilings pass without amendment. The accounted 28-module
  compositor aggregate is 514,955 / 515,000 bytes: only 45 bytes of source
  headroom. The successor must budget real consolidation or an explicit policy
  decision, not move code outside the measured closure.
- `npm run build`: full TypeScript/Svelte/domain checks, publication freshness
  and production bundle pass. Existing large-chunk advisory remains.
- `npm run visual:common-factor-authoring:cohort`: 24 passes across three engines.
  `npm run visual:authoring-entrypoints`: 23 earlier-exemplar Chromium passes.
- Production isolation: reader 12 routes; dev review 460 files / 12 forbidden
  markers; compositor diagnostics nine forbidden markers. All pass.
- Both `author:composed-algebra-publication -- --source <retained-file> --check`
  commands pass. Product's corrected static edition is content-addressed at
  `tmp/codex/composed-algebra-editions/f1b74572eeca9a3894fad8c763c55463978687aaeae5a741486c3930ef45432f`.
  Earlier immutable editions were not overwritten. Static editions are readings
  and self-checks, not animated publication.

Full `npm test`: **6,936 passed, one failed, 6,937 total**, zero skipped or
cancelled, 705,740 ms. Architecture, inference, concept-catalog and
promotion-memory pre-gates passed. The only failure was the stale generated
reachability inventory; its owning `generate:equation-reachability` command
refreshed the new caller list (68 roots, 4,572 scanned files).
`npm run test:equation-reachability` then passed all 12 tests, including the
formerly failing exact freshness assertion. The full suite has not been rerun
after this metadata repair, so a green final full-suite run is not claimed.

## Exact continuation and preserved limits

After the budget decision, resume s25, rerun the full suite, build and budget gate,
and finish release checks before s26. Fresh-session entry: `theseus work resume`, then
`npm run --silent loop:status`; use `theseus plan run` and the exact contract if
resume's own output budget blocks retrieval. Do not restart the accepted visual
checkpoint or the completed R1–R4B / M1a loops.

The required `compositor-extension-occupancy-follow-up.md` remains pending.
S26 must carry it into an explicit successor proposal and named pending action
before another specialized motif expansion. Current factoring evidence is not
a universal extension certificate, continuous-time collision proof or aesthetic
approval of every mechanism. No successor implementation, deployment, external
model calls, physical-device certification or comprehension study is authorized
or claimed.

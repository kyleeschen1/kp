# R3 release repair: accessibility ownership, not budget relaxation

The initial R3 release build exceeded eight existing reader HTML budgets.
Attribution: commit `b7f5c2c72` correctly made dedicated accessible endpoints
mandatory for standalone canonical Bayes hosts, but applied the same rule to
whole-page readers that already had a static MathML owner. This duplicated
accessibility markup and broke two exact MathML-count preservation tests.

The final repair separates those compiler entrypoints internally. The exported
standalone template compiler always selects stage-owned accessibility, without
an author-accessible opt-out. The whole-page compiler retains its existing page
owner for ordinary readers and its existing dedicated stage owner for controlled
foldable/fraction-composition readers. There is one private closed ownership
choice, no new public option and no caller-specific Bayes exception.

`tests/compiled-reader-accessibility-payload.test.ts` requires complete accessible
states for both controlled and chrome-free standalone hosts, and the original
static MathML count without a duplicate stage owner for a legacy page. Existing
radical, numerator split/merge, foldable and fraction-composition assertions stay
unchanged. No native typography, paint choreography, semantic model, source
grammar, inference fixture, or budget was relaxed.

Rejected intermediate experiments: MathML-only duplicate endpoints, then
compacting their redundant wrappers/annotations. Both still failed fixed budgets.
Those experiments and the extra renderer output option were fully removed; the
final implementation fixes ownership rather than compressing a duplicate owner.

Rebuilt fixed budgets pass: solve-x HTML 38,743 bytes raw / 5,160 gzip; generated
solve-x 54,497 raw / 4,985 gzip; ordinary shared reader runtime 138,180 gzip.
All 12 manifest routes pass the existing limits. This does not publish the Bayes
development host or certify new mathematical families.

The first full unit run surfaced legacy count regressions and stale generated
reachability metadata. The normal generator refreshed 68 unchanged roots with
the newly implemented Bayes consumers and the current scanned-file count;
`npm run check:equation-reachability` and all 12 reachability/caller-ledger tests
pass. No expected assertion or declared root was removed. A second full run
completed 6,774 tests with only the metadata failure, which it had read before
regeneration. The clean final-state rerun is authoritative in Theseus.
Two full typecheck attempts also exhausted Node's default 2 GB heap during the
test project. No memory limit was raised. The final ownership-only repair passes
the complete app/node/test/Svelte/domain typecheck. The exact top-level
`npm run build` subsequently passes too, including all typechecks and the bundle;
17 reader conformance and 12 targeted three-browser Bayes checks pass after this
repair. Build chunk-size warnings remain advisory; reader budgets are hard.

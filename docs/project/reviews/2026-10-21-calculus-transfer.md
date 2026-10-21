# Calculus authoring transfer

The first two cases are source-only variations of the existing change-propagation
model. Neither requires new differentiation, geometry, timing or rendering code.
The reference presentation is still unaccepted; these checks establish mathematics
and authoring reach, not teaching effectiveness.

`content/authoring/transfer/stationary-change.json` asks why a zero derivative
does not imply zero finite change. Its static baseline is the identity
3(x+h)² − 3x² = 6xh + 3h². At x=0 the first-order prediction vanishes,
while the residual remains positive for nonzero h. The existing visual job is
to compare prediction with actual change as h shrinks, not animate a proof.

`content/authoring/transfer/two-reversals.json` instead asks how two local
reversals yield an increase. At x=1, the intermediate value is −1 and both
local rates are −2. The outer derivative must be evaluated at the intermediate
value. The composed function is x⁴. Claims about the initial rates are qualified
because the learner can change the evaluation point.

Both assume familiarity with derivatives and composition. Five fixed passages,
bounded polynomial/trigonometric expressions and a fixed parameter window are
real constraints. Editorial prose is not machine-verified. No arbitrary chain-rule
derivation or learning-effectiveness claim follows from a successful source check.

Source audit: `npm run test:change-propagation` passes all 11 tests, including
both actual source files over positive, negative and zero increments and several
base points; exact residual formulas; deterministic reverse projection; and
located rejection of undeclared variables, division and unsupported functions.
An initial assertion incorrectly distinguished IEEE negative zero from zero;
the numerical assertion now uses the same tolerance as the other identities.
No engine behavior was changed to accommodate that test.

The supported task is now `calculus.change-propagation`, routing directly to
the existing compiler. Its starter reads JSON without loading the compiler or
renderer; the complete 12-task starter cohort passes, with the calculus starter
bounded at seven loaded modules. Check reports carry source, notation, initial
sample and revision, not executable model authority. Both selected files pass
the real CLI path; invalid meanings remain located gaps. The focused calculus
suite now has 13 passing checks.

Two infrastructure defects were repaired at their existing owners. The compiler's
readonly types previously left mutable runtime source objects that could disagree
with captured functions; source, passages, notation and model are now frozen and
revisioned. The editor previously disposed its valid card before candidate mount;
it now uses shared inert staging and releases partial mount resources on failure.
Source-pinned URLs reject mismatched reloads without discarding the link, and
matching reapplication restores the position. Pending preparation cannot publish
after page disposal. No new editor/session framework was introduced.

`npm run visual:change-propagation` passes seven Chromium checks: original
continuous/reverse/navigation behavior; both selected source identities and
reload/reapply; an injected ResizeObserver mount failure preserving the original
live card; phone containment; and existing no-script reading. `npm run typecheck`
passes after correcting two test-only narrowing errors. Presentation layout,
timing and the default calculus source are preserved. These are engineering
preservation checks, not visual acceptance or learning evidence.

`npm run build:bundle` and `npm run measure:change-propagation` report declared
initial JS changing from 73,142 bytes / 23,566 gzip to 76,663 / 25,223 gzip
(+1,657 gzip). The starting measurement used the pre-change built output;
this is an asset-size comparison, not a runtime benchmark. Most added cost is
the existing narrow SHA-256 module (1,069 gzip), followed by lifecycle/restore
code. CSS adds 34 gzip bytes for hidden staging. The measurement excludes fonts,
dynamic authoring imports, HTTP and caching; KaTeX editing remains lazy.
No budget ceiling was raised.

The full suite initially caught the newly registered task missing from the
authoring packet. The packet and generation route were updated, and
`node --disable-warning=ExperimentalWarning --test tests/authoring-entrypoint-packet.test.ts`
passes both checks. Final integration results are recorded in Theseus.

The useful conclusion is narrower than universal authoring: this mathematical
family already supports meaningful source variation. Discoverability and reliable
source-to-preview transfer were missing. The fixed five-step layout and unaccepted
dashboard remain constraints; further abstractions need a demonstrated caller,
and improving this explanation's teaching value still requires visual judgment.

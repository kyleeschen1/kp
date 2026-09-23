# Selected repair: native accessible math in fraction publication

Select one implementation boundary: the equation-rendering helper in
`src/tutorial/fraction-chain/publication.ts`. Both valid frozen fraction cases
reproduce the same missing accessible mathematics, with six failed no-JS checks
across Chromium, Firefox and WebKit. Their checked sources and interactive native
motion work; the static publication omits the native semantic projection.

Invariant: every published fraction equation, including static smaller-step
detail, must expose native mathematics for the same checked LaTeX as its visual
glyphs. Aria-hidden visual HTML alone is insufficient. The existing KaTeX adapter
already supports `htmlAndMathml`; request it at this publication owner. Do not
change the adapter's global default, infer alternative semantics from glyphs, add
an accessibility framework, or replace native math with an invented prose label.

Complete consumers: the Vite fraction publication plugin builds addition,
numeric, two-sided and subtraction hosts. The two frozen browser fixtures use
the same compiler. Existing fraction passage and numeric-variation unit tests
also consume it. No other publication owner imports this function.

Preservation boundary: exact checked source, revision, operation plans, row IDs,
native visual HTML, typography, rails, disclosure, timing and current runtime
remain unchanged. Rollback unit: this local rendering option and its regression
checks. This is an objective accessibility defect with deterministic acceptance,
not a new visual treatment requiring aesthetic approval.

Acceptance: unchanged native visual markup; source-matching MathML for every
permanent row and static detail; no hidden ancestor suppressing the accessible
math; both frozen sources pass their existing browser checks in all supported
engines. Pressure the four established hosts with their preservation cohort,
measure complete publication/reader costs, and rerun all ten unchanged inputs.
Do not rewrite the failed baseline or award new semantic capability.

Alternatives: changing the algebra IDs would conceal an author-input failure;
relaxing their validator would weaken a contract. Guidance can prevent repetition
without changing this trial. New mechanics/code Apply paths are distinct missing
capabilities and would broaden the repair. A catalogue-wide KaTeX default change
would affect unexamined owners; the demonstrated publication boundary is smaller.

The repair is expected to improve two usable previews, not checker acceptance.
It adds serialized MathML and therefore may increase HTML bytes; measure that
cost rather than claiming a speedup. Per-case engineering savings and learner
benefits remain unmeasured.

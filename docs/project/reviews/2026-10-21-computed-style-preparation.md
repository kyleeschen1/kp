# Computed-style preparation: no runtime change justified

Scope: [bounded continuation](../2026-10-21-computed-style-preparation.md).
The user confirmed the preceding matrix jerk repair: “bug is fixed. continue”.
KP-MATRIX-END-JERK is resolved; accepted matrix motion remains intact.

## Decision

Do not ship the tested style-copy optimization. It removes many JavaScript CSSOM
writes but does not demonstrate lower reader startup or sampled copying cost.
The original `src/rendering/computed-style-clone.ts` is restored byte-for-byte.
No production source, lesson, renderer, cache, readiness policy or budget changed.

Retain two development capabilities: a clone-count mode in the existing production
profiler, and a scoped three-engine CSS snapshot regression command. Future work
can distinguish fewer API calls from lower complete-reader cost without repeating
this investigation or weakening the paint contract.

## Experiment and measurements

Baseline: `npm run visual:algebra-preparation -- --label=clone-baseline` and
`npm run visual:algebra-preparation -- --profile --label=clone-baseline`.
Same cold local immutable whole-and-parts algebra reader, Chromium 390×844, DPR1,
three fresh contexts per CPU multiplier. Ordinary timings and instrumented
attribution were separate; no broad checks ran during those timing cohorts.

Candidate: serialize the complete computed declarations once for clones with no
inline style, while retaining original property replacement for existing inline
styles. Appending serialized CSS to existing declarations could change important
or logical/physical-property precedence, so that path deliberately stayed intact.
Names of custom properties were escaped; no properties were omitted. The initial
comparison passed 18 checks across Chromium, Firefox and WebKit.

| Ordinary observed readiness | Baseline samples (ms) | Candidate samples (ms) |
| --- | --- | --- |
| 1× CPU | 596.4 / 311.0 / 330.0 | 465.3 / 307.5 / 308.5 |
| 6× CPU | 2151.1 / 1713.3 / 1604.4 | 1693.5 / 1834.8 / 1728.8 |

Median 6× readiness is 1713.3ms versus 1728.8ms; the smaller 1× median is not
consistent across cohorts. The candidate's instrumented profile also avoids
unnecessary escaping of standard property names; its copying self-time samples
are **194.72 / 188.96 / 186.99ms**, versus baseline **192.45 / 174.97 / 175.12ms**.
A separate smaller candidate that only captures the live declaration's property
count once gave **178.46 / 172.13 / 182.22ms**. Neither change was retained.

These are small noisy diagnostic samples, not statistical evidence that either
candidate is universally slower. They do not establish the benefit required to
add runtime complexity. Instrumented inclusive rows overlap; observed readiness
includes automation overhead, local loading and warmup effects. A CPU multiplier
does not certify phone performance.

The added `--clone-counts` mode observes actual `cloneNode` outputs and their
JavaScript `setProperty`/`cssText` calls. All three repetitions agreed:

| Clone-style observations | Original | Declaration candidate |
| --- | ---: | ---: |
| First touched with empty inline style | 33 | 33 |
| First touched with existing inline style | 21 | 21 |
| Individual property setter calls | 23,658 | 7,455 |
| Whole-declaration setter calls | 0 | 33 |

Thus roughly 68% fewer individual writes did not yield a measured startup gain.
These counts include setter calls on observed cloned styles, not every browser
style operation. The diagnostic uses weak tracking scoped to a fresh browser
context; it installs nothing in the reader build. Count-mode timing is deliberately
omitted from its output. A count run overlapping type/tests is used only for
counts, never for performance comparison.

Reproduce the retained implementation's counts with:
`npm run visual:algebra-preparation -- --clone-counts --label=clone-final`.
The rejected candidates are described here, not retained as alternate runtime paths.

## Retained safeguards and verification

`npm run visual:computed-style-clone` is a stable scoped command for all three
supported engines. The new test moves clones into a different inherited style
context, changes source typography/direction/writing mode and reverses that change,
then compares realized computed typography and paint. It also checks nested SVG,
quoted punctuation/custom properties, clone-only declarations, important-value
replacement and an untouched source DOM. Existing tests cover independent template
paint, nested typography, intact SVG and inert authority stripping.

The final cohort passes **15/15**. Unlike the discarded candidate's comparison
test, the retained regression checks the source and connected clone in different
contexts; it does not duplicate the copying implementation as its oracle.
This is a style-contract safeguard, not new compositor certification.

Full `npm run typecheck` passed. After the final test and diagnostic-output edits,
affected test and Node type checks also passed. An attempted `npm run typecheck:node`
failed because that script does not exist; the existing full typecheck and direct
`tsc --project tsconfig.node.json --noEmit` provide the actual Node checks.
`npm test` passed all **7,389 tests**, zero failures/skips/cancellations, including
the architecture and inference gates. `git diff --quiet HEAD -- src content`
confirmed no remaining production-source changes. The new clone-count mode
completed three identical repetitions with the retained implementation.

No production code remains changed, so there is no reader payload addition and no
new visual treatment to promote or review. Complete-consumer budgets are unchanged;
this is established by unchanged production inputs, not a new transfer measurement.
Do not repeat this micro-optimization without a materially different hypothesis.
The remaining startup cost still includes ink measurement and clone alignment;
this result does not establish that either should outrank a concrete authoring need.

Outcome: **COMPLETE**, measured no-change investigation plus developer diagnostics
and safeguards. All three contract packages are satisfied; no visual approval or
runtime rollout remains. Theseus validates 1,235 nodes. Retrieve this evidence with
`theseus work context task.kp.computed-style-preparation --mode working`; the next
session should select a concrete authoring or measured runtime need rather than
automatically continuing this completed micro-optimization.

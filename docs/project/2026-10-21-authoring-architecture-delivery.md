# Concise authoring and bounded reader cost

Approved: 2026-10-21. The user accepted the independent architecture audit and
asked to preserve its recommendations and implement as far as possible.
Execution record: `run-contract.kp.concise-authoring-v1`; this document owns
rationale and scope, not live slice status.

## Direction and retained evidence

While learner testing is constrained, prioritize easier authoring and measurable
reader costs. Preserve immutable semantic referents, checked operations,
correspondence, deterministic playback, and domain-specific repair gaps. Do not
treat architectural verification as evidence of pedagogical effectiveness.

The October 21 audit rebuilt production assets and ran architecture, reader
budget, canonical construction budget, inference and Chromium tax-page checks.
The calculus page declared 23,566 gzip JS bytes and 10,859 CSS bytes (excluding
fonts and dynamic authoring). Authored rails had 60,499 initial and 178,153
activated code/style gzip bytes. The tax-page browser probe requested 512,946
gzip JS bytes through startup and first interaction. Desktop p95 frame gaps were
17.6–17.7 ms; 6x CPU slowdown produced 1.28–2.29 second readiness and 183–233 ms
maximum interaction frame gaps. This was local-file Chromium on M2, not a real
phone/network benchmark. Canonical cohort construction p95 was 0.64 ms,
verification 0.35 ms, projection 26,725 bytes. Semantic metadata was not the
demonstrated primary bottleneck.

## Approved agenda and next-step retrieval

1. Concise domain authoring over existing authorities, proven by matrix and
   algebra callers. Remove caller boilerplate, not semantic guarantees. Keep
   plain text for prose and equation sequences; TS for reusable relationships.
2. Bounded reader activation improvement with before/after evidence, preserving
   navigation, native endpoints, offscreen deferral, reversal and disposal.
3. Consolidate repeated host lifecycle around existing clocks/schedulers:
   mount, sample, resize, suspend, restore, dispose. Start from demonstrated
   duplication rather than inventing a new framework.
4. A compact performance acceptance suite: cold activation, warm reverse,
   one/many cards, offscreen suspension, disposal, DOM and memory growth.
5. Separate ordinary authoring exports from compiler/extension/inspection and
   fixtures. Retire entrypoints only with migrated consumers. Make common
   verification discoverable without deleting specialized checks.
6. Broaden composition through a structurally different domain after the above.

For future next-step questions, consult this agenda and the run record before
returning to the unaccepted calculus card or frozen Gaussian elimination work.
The old explanation-authoring contract is preserved at its visual gate; this
architecture lane neither accepts its card nor changes its remaining slices.

## Current execution packages

- `authoring`: concise matrix construction/selection and bounded algebra
  authoring entrypoints; migrate real source callers, check semantics, inferred
  dimensions, diagnostics, and unchanged presentation artifacts.
- `activation`: diagnose tax-page dependency costs, implement a justified
  loading-boundary improvement, verify actual production activation and costs.
- `integration`: publish author examples and limitations, run affected types,
  architecture/build/budget gates, document evidence and the next remaining
  agenda item. A new visual treatment is outside this run.

Canonical matrix source: `content/authoring/convergence/matrices.ts`, existing
matrix-column-combinations host and column renderer; `matrixProduct` owns
semantics. Canonical algebra source: existing composed-algebra source and proof
owners, reusable-reasoning host and native KaTeX compositor. Tax host:
`/experiments/kinetic-figure/supply-tax/`, existing economic semantic source and
focus-deck/native renderer owners. Preserve layout, timing, source IDs and
mathematical results. Smallest rollback units are the author API/caller slice
and the independent loading slice. No subjective redesign or generalization is
authorized; an unavoidable visible change requires review.

Focused checks precede full integration. Use `verify:impact`, existing matrix
and algebra tests, affected TypeScript checks, production build, architecture
gates and existing architecture browser audit. Commit coherent checked slices
and back up per repository policy. Allow evidence-backed boundary/cost repairs;
exclude universal languages, new renderers, adaptive learner modeling, broad
renames, deployments and unrelated dirty files. Cap this run at four hours with
the final quarter reserved for checks and handoff; estimates are uncertain.
Finish when these three packages meet their acceptance, or record a named
review/external/resource stop with remaining work. No minimum slice count.

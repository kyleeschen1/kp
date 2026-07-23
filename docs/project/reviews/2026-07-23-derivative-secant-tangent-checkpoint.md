# Derivative secant-to-tangent exemplar checkpoint

Status: approved on 2026-07-23

Run contract: `run-contract.kp.product-roadmap-v5-continuation-v2`
Slice: `s27`

## Recommendation

Review the rebuilt derivative exemplar as the canonical finite-to-limit bridge.
It now drives the symbolic difference quotient, moving graph point, secant
slope, and tangent limit from one shared value of \(h\). Approve this exemplar
before it is projected into learner-wide and learner-narrow surfaces or reused
for other limit animations.

## Canonical reference

The canonical semantic model is
`src/animation/derivative-tangent-adapter.ts`. It fixes
\(f(x)=x^3\), \(a=1\), and an initial \(h=1\), then continuously converges
\(h\) to zero.

The runtime frame in
`src/animation/derivative-tangent-runtime-frame.ts` derives both visual
surfaces from that model:

- the finite quotient \(\frac{f(a+h)-f(a)}{h}\);
- the anchored point \((a,f(a))\);
- the moving point \((a+h,f(a+h))\);
- the finite secant and its slope; and
- the limiting tangent and \(f'(1)=3\).

The SVG viewport owns graph geometry while shared KaTeX rendering owns every
visible mathematical expression. No plain SVG text is used as mathematical
notation.

## Observable acceptance criteria

1. The opening frame clearly presents a finite difference quotient and a
   secant through two distinct points.
2. As \(h\) decreases, the moving point, quotient value, and secant slope
   change continuously and stay synchronized.
3. The secant visibly converges to the tangent at the fixed anchor; it does not
   switch to a separately animated line near the endpoint.
4. The limiting derivative notation becomes legible as the construction
   converges without obscuring the finite construction prematurely.
5. All visible mathematics uses the shared LaTeX/KaTeX path.
6. Direct seek is deterministic, and rewind retraces the exact forward states
   without a snap.
7. The Animation Library inspector remains `Ready` with no warnings.
8. The graph and mathematical model remain general enough to replace the
   exemplar function and anchor without changing the runtime-frame contract.

The automated criteria pass. The remaining decision is whether the visual
explanation makes the finite-secant-to-tangent relationship immediately clear.

## How to inspect

The development server is available at `http://127.0.0.1:8000`.

Open:

`http://127.0.0.1:8000/?animation=editor-animation.sample.animation.derivative-rules.tangent-graph`

Scrub forward through the finite secant, quarter, midpoint, three-quarter, and
tangent-limit states. Then rewind through the same positions. Watch the second
point, orange secant, displayed \(h\), quotient slope, and limiting tangent as
one synchronized construction.

The stable capture command is `npm run visual:derivative-tangent`. It produces
six disposable captures under `tmp/codex/derivative-tangent-visual` and checks
the KaTeX overlays, `Ready` diagnostics, and mirrored rewind values.

## Verification evidence

| Gate | Result |
| --- | --- |
| Focused semantic and editor node cohort | Passed: 62 tests |
| Focused Chromium convergence test | Passed |
| `npm run visual:derivative-tangent` | Passed: six captures, Ready with zero warnings |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 1,975 tests |
| `npm run build` | Passed: repository typecheck and production build |

## Preservation boundary and rollback

The preservation boundary includes semantic object identities, editor catalog
routing, the shared graph viewport contract, KaTeX ownership of mathematical
text, exact seek and rewind, and all already approved animation families.

The smallest independently reversible rollback unit is this derivative
adapter/runtime-frame/viewport exemplar, its `limit-convergence` motif
registration, stable capture, and focused tests. Reverting it does not require
changing the shared semantic document model, other graph animations, or any
approved learner lesson.

## Promotion boundary

This checkpoint deliberately remains editor-only. Approval authorizes a
follow-up projection into the learner-wide and learner-narrow presentations
while preserving this semantic clock and visual construction. It does not
authorize automatic reuse for arbitrary limits or a global derivative style.

## Human decision

The user approved the synchronized finite-quotient and secant-to-tangent
exemplar after reviewing the live Animation Library route. The shared semantic
clock, exact rewind, KaTeX mathematical presentation, and graph construction
are accepted as the derivative reference.

This approval closes the exemplar gate. It does not create a separate learner
route, generalize the construction to arbitrary limits, or authorize the
superseded integral-first continuation. Learner representations will be
attached beneath the same canonical animation identity through the approved
Semantic Animation Workbench sequence.

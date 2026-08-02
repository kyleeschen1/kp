# Catalogue Stage Reservation and Performance Probes

Date: 2026-08-02
Status: slice 24 evidence; performance debt continues in slice 25

## Outcome

The catalogue loading state and the painted shell now share one explicit stage
reservation contract:
`kp.animation-catalogue.stage-reservation.v1`. The contract owns only the
outer catalogue stage footprint. It does not encode dimensions for equations,
graphs, WebGL scenes, or any other artifact family.

The document also reserves the route-agnostic host viewport before module CSS
loads. That prevents the empty document, loading shell, and painted shell from
advertising different page footprints.

## Browser Evidence

Delayed-capability tests hold the equation or graph capability request while
measuring the loading reservation, then release it and measure the settled
stage after fonts and two animation frames. At both `1280 x 900` and
`390 x 844`, the outer `x`, `y`, `width`, and `height` deltas are below 0.5 px.
Settlement CLS is below 0.001 in both cases.

The broad economics route now observes Core Web Vitals from navigation start,
waits for meaningful native paint and font settlement, and then records a
separate deterministic interaction-paint proxy and three-second frame window.
The probe reports which entry types the browser supports and names layout-shift
sources without retaining DOM nodes.

## Representative Measurement

Command: `npm run perf:animation`

| Condition | Meaningful paint | LCP | CLS | Interaction paint | Load long task | Frame p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal | 318 ms | 372 ms | 0.000220 | 10.6 ms | 0 ms | 17.4 ms |
| 6x CPU + constrained network | 3,251 ms | 3,368 ms | 0.000105 | 35.8 ms | 106 ms | 17.6 ms |

The route stayed below the 0.1 CLS and 200 ms interaction targets. Remaining
shift attribution is limited to the shared scrubber label and KaTeX label ink;
the stage reservation itself does not move. No asset-specific box was added.

## Exact Residual Assigned to Slice 25

- selected-route script transfer: 324,087 bytes versus the 250,000-byte target;
- constrained LCP: 3,368 ms versus the 2,500 ms target; and
- constrained load long task: 106 ms versus the 50 ms target.

These are target misses, not baseline regressions. Slice 25 may repair them
without widening the targets or reducing semantic or visual fidelity. The lab
numbers are representative rather than immutable; the stable probe fields and
target comparison are the durable evidence.

## Verification

- `npm run test:browser:animation-equation-capability`
- focused catalogue route, shell, and performance-budget tests
- `npm run typecheck`
- `npm run build`
- `npm run perf:animation`

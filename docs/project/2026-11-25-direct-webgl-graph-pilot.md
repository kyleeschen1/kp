# Direct WebGL grid and saddle experiment

Date: 2026-11-25
Authority: user requests “let's try it with a 3d grid, and also with a the saddle surface.”
Status: checked candidate awaiting visual review; no renderer replacement or promotion.
Review: [working exemplar, evidence and limits](reviews/2026-11-25-direct-webgl-graph.md).

## Outcome and reference

An author can inspect a smooth 3D coordinate grid and saddle, rotate the camera,
vary the saddle denominator, and compare the same source/camera with the existing
Three.js surface. Determine whether a small direct GPU adapter earns further work.
The accepted quadratic remains complete; matrix reuse remains a proposed return path.

Canonical artifact: the bounded grid/saddle fixture at
`src/experiments/direct-webgl-graph/model.ts`.
Host: `/experiments/direct-webgl-graph/` on the existing port-8000 service.
Candidate renderer: an isolated WebGL2 adapter; reference renderer:
`src/rendering/graph-webgl-three.ts`, loaded only by explicit comparison.
Truth: existing saddle expression/evaluation/gradient and Graph3D camera model.
Use the existing reader playback clock for parameter motion. Surface sampling and
shader deformation must agree with domain evaluation; no new expression language.

Interpret “3D grid” as a three-axis coordinate grid with reference lines in the
three coordinate planes. Grid-only and saddle views share the camera. Labels use
native HTML/KaTeX typography; GPU geometry owns depth. Exact light, color, line,
camera and density choices remain provisional for this exemplar.

## Single delivery package

Create the isolated host and renderer, with retained geometry, bounded sampling,
smooth normals/lighting, consistent screen-space lines, native labels, pointer and
keyboard camera controls, reset, denominator scrubbing and reversible playback.
Compare the saddle against the current Three adapter without changing it. Report
complete production imports and desktop interaction measurements with qualifications.

Acceptance: visible grid and saddle; source/camera agreement; smooth rotation and
parameter changes without geometry recreation; theme/resize correctness; idle and
offscreen drawing stops; loss/disposal retain an explicit fallback or recovery;
no Three import before comparison. Human review decides appearance and clarity.

Preserve the existing notebook, shared Graph3D renderer, semantic operation pins,
source identifiers, context lease pool and playback ownership. Rollback unit: this
experiment directory/HTML plus its scoped checks and discovery link. No new
shared renderer protocol, general GPU formula compiler, arbitrary surfaces,
transparent-surface sorting, shared visual promotion, notebook migration, matrix
implementation, publication, model calls or parallel workers.

Three hours is a ceiling, with the last 45 minutes reserved for verification,
review evidence and backup. Stop at one working review packet or a concrete
unresolved blocker. One coherent checked checkpoint; if it exceeds an hour,
checkpoint and back up owned work before continuing.

## Verification

Standard tier: numeric/normal/projection tests against existing owners; resource,
interruption and lifecycle invariants; complete affected TypeScript; one scoped
Chromium visual workflow including phone layout; explicit import/production-cost
measurement; Theseus and project-vision checks. Broader browser/promotion checks
follow human review. The impact selector has no focused renderer rule and proposes
production gates; this unpromoted isolated experiment uses the bounded tier above.

Execution: `run-contract.kp.direct-webgl-graph-20261125` owns status and evidence.
Do not resume the historical contract proposed by the generic Theseus election.

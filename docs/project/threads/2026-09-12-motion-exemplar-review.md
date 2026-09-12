# Motion-description exemplar: learner review

Review URL: http://localhost:8000/experiments/mechanics-motion/

This is the opening exemplar of the approved
[delivery proposal](2026-09-12-mechanics-motion-delivery-proposal.md), not a
translation-symmetry lesson or the complete twelve-lesson curriculum.
The Theseus contract `run-contract.kp.mechanics-motion-v1` owns live progress.

## What to try

Read the top passage, then use the right arrow. Seven stops describe a trip,
outward motion, a modeled pause, a partial return, changing coordinate zero,
reading the graph, and distance versus displacement. Scrubbing remains continuous;
arrows visit stopping points with motion. The prose holds its preparatory question
during motion, then supplies the conclusion. The last two transitions are reading
beats: they do not invent additional physical movement.

Please judge whether you can tell where to look, distinguish the physical point
from the position–time graph, and explain why a horizontal graph segment means a
modeled pause. After the origin changes, can you explain why the coordinate changes
but the trip does not? The new-trip question checks displacement versus distance;
the answer is inside a separate disclosure rather than shown immediately.

## Established facts versus open judgments

- Checked source: observations at 0, 2, 4, 6 seconds and positions 1, 5, 5, 2 metres.
- Piecewise-linear interpolation is an explicit assumption. Equal measured
  endpoints cannot establish the absence of a hidden detour.
- Displacement is +1 metre; model distance is 7 metres. Shifting zero by 3 metres
  gives coordinates −2, 2, 2, −1 without moving the physical point.
- Focused automated checks cover source/governance, seven exact stops, reverse
  projection, anticipatory prose, controls, reduced motion and phone overflow.
  These do not establish comprehension or approve the visual treatment.
- Screenshot inspection found overlapping default overlay annotations. The
  renderer now anchors shared typography in flow; the browser check guards the
  heading-label separation. Time-axis labels expose the recorded timestamps.

## Ownership, cost and remaining work

The mathematical source is `src/semantic/motion-observation.ts`; governed asset
construction is `src/authoring/motion-observation-authoring.ts`. The native 2D
candidate and host live under `src/tutorial/mechanics-motion/` and
`experiments/mechanics-motion/`. It uses the existing focus-deck scaffold, semantic
theme and typography, attention projector, timeline/checkpoint playback, native
input, keyboard and Graph2D session lifecycle. It adds no package dependency or
Three.js renderer. Browser transfer/production closure is not yet measured.

This first narrative accepts only its supported outward/pause/return source shape;
incompatible narratives return a repair gap. It is not a generic motion authoring
system or a globally promoted visual motif. Source editing, independent mathematical
reading, a structurally different caller, static publication and broad release
checks remain subsequent approved work, conditional on this visual acceptance.

Resume with `theseus work context next-action.kp.mechanics-motion --mode brief`.
After acceptance, finish P2 and proceed to P3 without another routine approval.
Reproduce discovery evidence with `npm run visual:mechanics-motion` and the
verification commands recorded on the target. Captures are disposable, not goldens.

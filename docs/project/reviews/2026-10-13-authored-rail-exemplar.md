# Complete passage authoring through the accepted equation rail

Status: HUMAN_CHECKPOINT; source boundary complete, canonical host candidate
implemented and checked, human authoring/reading judgment pending.
Plan: `../2026-10-13-explanation-authoring-delivery.md`.
Execution: `run-contract.kp.explanation-authoring-v1`.

## Review the actual outcome

Open <http://localhost:8000/experiments/authored-rails/>. The shared dev server
serves the checked example selected by:

```sh
npm run author:rail -- --source examples/physics/energy-as-a-function.article.md --apply
```

Read the question, drag the first equation forward/back, open smaller steps,
then continue from energy as a function to its rate of change. Compare the short
source with the rendered argument: it supplies prose and two checked derivation
references, not copied chains, coordinates or timing tables.

Human questions: does the file give an author a comprehensible way to construct
a whole passage? Does the original rail still feel right in that passage? Which
missing author choice would matter first: the reasons inside the derivation,
notation, or a genuinely different mathematical sequence? This is a file-based
authoring boundary, not an in-browser editor or a new mathematics demonstration.

## What changed, and what did not

`compileAuthoredRailPublication` expands two explicit versioned references using
existing checked mechanics plans, then runs the existing Article/publication
checks. The CLI checks or explicitly applies source bytes. Invalid drafts cannot
replace the prior selection; corrupted/empty/revision-mismatched stored selections
error rather than silently falling back. Runtime tests protect these boundaries.
Production builds deliberately ignore private local selections and build the
versioned example. The selected source is identified in both CLI and host.

The new host loads the unchanged `momentum-energy-reader.ts`; KaTeX paint,
derivation sessions, shared CSS, clocks, correspondence and refinement ownership
remain unchanged. The canonical mechanics and code-card references are preserved.
The title/prose/rail inclusion can change through source alone. Formula changes,
new proof steps and per-step editorial overrides still need their responsible
domain/authoring owners; the include marker does not pretend otherwise.

## Evidence and limits

- `npm run test:rail-authoring`: 35 source/selection and existing mechanics tests
  pass. Pressure includes shorter source, unknown/duplicate/misplaced references,
  unsupported presentation ids, missing concept origins, source limits, selected
  byte identity, rejected drafts, corruption and production selection isolation.
- `npm run visual:rail-authoring`: four Chromium checks pass. Actual host source
  revision changes, bad draft leaves it unchanged, continuous forward/reverse
  pointer travel, keyboard endpoints, energy/power refinement return, static
  no-JavaScript reading, shared typography and 390px phone docking are exercised.
- Full typecheck, architecture gates and production build pass. Existing reader
  production closure and budget gates pass. No ceiling was changed. Full unit
  corpus and supported-browser promotion matrix were not run for this candidate.
- Desktop and phone captures inspected. Phone remains functional but preserves
  the existing narrow explanatory column; this is not a claim of ideal mobile
  reading or all-device certification.

The first attempted dev launch found ports 8000/8001 already occupied; authorized
HTTP inspection confirmed the existing shared server serves this candidate.
It was reused, not killed or replaced. No implementation check has a known failure.

## Cost and maintenance

`npm run measure:mechanics-relations-closure -- authored-rails --summary` measures
60,499 gzip bytes initial JS/CSS, 178,153 gzip bytes activated reachable JS/CSS,
and 35,956 gzip bytes HTML (619,328 raw). The existing `physics-argument` entry
has exactly the same JS/CSS closure and 36,675 gzip bytes HTML (628,904 raw).
Fonts, images, HTTP overhead and execution/paint costs are excluded. Most static
HTML is the existing native equation and refinement markup; this is inherited
cost, not evidence that arbitrary long documents will be cheap.

Added ownership: one bounded build compiler, a local selection/CLI pair, one host
entry, and source/validation/documentation. No browser module or dependency added.
The authoring compiler remains build-only. A portable selected-source export is
still absent; the current deliverable is a local preview plus complete static
reading and the versioned reference build. No public deployment occurred.

After acceptance, continue the stored card-caller package using the accepted
centroid top-text reference. Do not change all scaffold callers or skip that
first card checkpoint. The later connected publication remains unfinished.

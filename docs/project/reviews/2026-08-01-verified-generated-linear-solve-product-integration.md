# Verified Generated Linear Solve Product Integration

Date: 2026-08-01  
Status: implemented; visual and editorial judgment deferred to the consolidated checkpoint

## Outcome

The exact provider snapshot for `linear-68c15d41` now reaches two native
product hosts through one canonical `KpAnimationAsset`:

- `/?artifact=animation.generated.linear-solve.linear-68c15d41` uses the
  persistent catalogue shell, the existing equation adapter, the shared
  player clock, and an optional inspector projection of all eight deterministic
  explanation cues;
- `/reader/generated-solve-x/` uses the certified equation reader runtime,
  six compact searchable beats, direct URL seek, native static KaTeX, reduced
  motion, and the catalogue as its return path.

Neither host contains an iframe, a provider request, a second playback clock,
or a generated renderer. The production host imports a checked generated JSON
asset; provider bridge and compiler code remain generation/test authority.
`npm run generate:verified-generated-linear-solve` reproduces that asset, and
the parity test requires byte-equivalent JSON before it can ship.

## Authority and Accessibility

The provider remains authoritative for the problem, exact steps, solution,
and provenance. KP remains authoritative for semantic expansion, timing,
selectors, correspondence, presentation, explanation wording, layout, and
rendering. The compiled asset now includes the successor metadata and native
fraction-rule anchors required by both established equation hosts.

The catalogue explanation is hidden behind the existing inspector switcher so
the default surface remains animation plus play/pause and scrubber. Its math
segments use inline KaTeX and its section headings are `h3`. A collapsed
`Static steps` disclosure exposes all six exact checkpoints without adding
default control clutter.

## Verification

Passed:

- focused provider snapshot, bridge, animation, explanation, runtime-asset
  parity, catalogue, metadata, hostability, static reader, selector, route,
  and architecture tests;
- `npm run test:browser:generated-linear-solve` in Chromium, covering native
  catalogue paint, in-place seek/rewind, stable URL identity, inline
  explanation, no provider requests, direct reader seek, and reduced motion;
- `npm run build`;
- `npm run check:architecture`;
- `npm run check:reader-production`;
- `npm run check:dev-review-production`;
- `npm run check:animation-library-display-catalog`; and
- `git diff --check`.

The build exposed one measured performance debt, deliberately not hidden by a
budget increase: the shared equation-reader closure is 145,855 gzip bytes,
855 bytes above its current 145,000-byte release allowance. The new route's
HTML and gzip baselines pass, no forbidden production asset remains, and the
repository-wide 250,000-byte script target is unchanged. Exact closure
attribution and capability splitting are already approved work in slices
`s21` through `s25`; `npm run check:reader-budgets` remains red until that
scheduled performance tranche closes the shared residual.

## Human Checkpoint

No wording, choreography, aesthetic, catalogue disposition, or promotion was
approved here. Slice `s10` will capture start, operation, settlement, narrow,
reduced-motion, static, and explanation views, then freeze this exemplar until
the consolidated human checkpoint.

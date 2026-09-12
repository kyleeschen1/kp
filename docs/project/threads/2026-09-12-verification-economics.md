# Verification economics and selected ownership

This is a measured subset, not a claim that the entire suite was profiled or
that source-reading tests are redundant. The initial audit's full suite took
about 12.8 minutes; the final release will remeasure it. Native Node test output
and /usr/bin/time provide timing; no new test runner was introduced.

## Current measurements

| Existing command/cohort | Executed scope | Observed wall cost |
| --- | --- | --- |
| npm run test:focus-deck-multi-card | 31 checks / 7 files, including shared travel and deferred lifecycle | 3.22 s; Node reports 2.33 s |
| Node test: local-stylesheet-closure plus four gradient model/sequence/authoring/extraction files | 26 checks / 5 files | 3.58 s; Node reports 2.89 s |
| Existing impact selection / CLI / health command tests | 35 checks / 3 files | Node reports 1.35 s |
| Shared input Chromium code/deferred/keyboard cohort | 13 cases | 46.3 s |
| Representative tax/code input across Chromium, Firefox, WebKit | 15 cases | 1.1 min |
| Built tax/code/no-JS cohort with isolated built assets | 6 cases | 11.9 s |

These are local observations with background work, not stable performance
ceilings or additive estimates. In the 31-case cohort, the existing stage
source/ownership check cost ~782 ms; code and equation authority construction
cases cost ~124–162 ms. Removing all source-reading assertions would not follow
from those measurements. Import/startup and browser process costs also matter.
The first CSS measurement lacked scratch-write permission and is excluded;
the unchanged escalated run passed all 26.

## Selected change: actual input-owner routing

Previously focus-deck-native-input.ts had no impact rule, so even an inner edit
selected the full suite/build. Its bounded rule now selects:

- discovery: the existing seven-file Focus Card cohort;
- contract: that cohort and full typecheck;
- promotion: those checks, production build, tax/code/deferred browser cohort,
  and the gradient checkpoint-clock caller's controls/reduced-motion/wheel cases;
- release: unchanged broad repository gate.

Negative selection tests prove that adding an unknown owner restores the broad
gate, release remains unchanged, and overlapping known inputs deduplicate checks.
Focused CSS still deliberately falls broad: document-base styles reach app
consumers as well as these readers. No incomplete visual coverage was relabeled
as a complete CSS impact map.

## Selected change: production test hosting

Canonical tax production verification no longer starts its own 4173 preview
server. Its existing six cases now run at the shared 8000 origin against an
isolated browser-context closure of already-built files. No-JS contexts receive
the same closure. Requests outside the exact document and flat built assets
abort; development-server fallback cannot hide missing production dependencies.
Gradient already uses this pattern; its duplicated fixture is the next bounded
consolidation candidate.

## Inventory, candidates and limits

The current audit counts 624 package commands, 1,779 unit-test files and 216
*.browser.spec.ts files. The browser suffix count excludes other spec naming
conventions. The 380 source-reading hits are only a heuristic.

An exact command-string scan finds two duplicate pairs:
economics-demand-shift tutorial browser/visual commands, and canonical-animation
review / animation-library-display. Equal command strings demonstrate duplicated
configuration, not duplicated executions or safe deletion of public aliases.
Keep both entrypoint names if consolidating their implementation.

Fault-pressure plan for consolidation: preserve the current rendered/native
assertions, inject forbidden source/network requests into the shared production
fixture, and verify alias expansion forwards selection arguments and reaches
the same test files/projects. Do not delete historical tests by filename or
phrase alone; keep any check whose unique failure class is not demonstrated by
the replacement.

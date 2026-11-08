# Root tooling and CSS maintenance evidence

Approved scope: [maintenance proposal](2026-11-08-next-step-review.md).
Execution status and remaining work: `run-contract.kp.maintenance-20261108`.
This file records evidence, not a second execution queue.

## Playwright configuration ownership

Moved 64 specialized configs into `config/playwright/`; the conventional root
config remains. Updated package commands and impact-selection consumers.
Inherited paths and server working directories retain the repository as owner.
No editor checkout, URL, suite selection or browser coverage was changed.

The installed Playwright resolver and file collector captured all 65 configurations
and 152 projects before relocation. `npm run check:playwright-configs` matched
the resolved baseline after relocation. Its first comparison exposed property
insertion order in the measurement, not changed values: explicit `cwd` appeared
earlier in server objects. Normalizing that field restored the original hashes.
After the original baseline passed, canonical object-key ordering was introduced
and the encoding regenerated to prevent equivalent object ordering from causing
false failures. This is a measurement repair, not a behavior exception.

`npm run test:tooling-configs` passed two ownership/reference checks. Node tooling
typechecking and `git diff --check` passed. All 27 impact-selector tests passed.
`npm run visual:anchored-algebra -- --project=firefox` passed all eight tests
across Chromium and Firefox, including initial/reloaded paint, reversible
annotation handoff, missing-selector repair and old-link/static reading. The
optional dev-review API on port 8001 was unavailable; its proxy warnings did not
prevent the reader checks. No review-service availability is claimed.

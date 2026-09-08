# R3 supported-browser cohort

Stable command: `npm run visual:bayesian-reasoning:cohort`, existing port-8000
canonical host. The same 16 cases run in Chromium, Firefox and WebKit: exact
native evaluation, source replacement, invalid-source retention, both sources,
no-JS local publication, parent/reason/return, practice, URL/history, persistent
SVG owners, keyboard, wheel/passage, stage drag/reversal, reduced motion, narrow
layout, and light/dark system preferences. The accepted shared paper treatment
is not a newly designed dark theme. Accessibility checks cover semantic math,
labelled controls/current beat and answer hiding, not a screen-reader user study.

Initial cohort: 47/48 passed. Firefox alone failed edited-source refresh.
Diagnostic capture proved the correct source and revision were in history before
`page.reload()`, but history.state was null afterward; the pinned hash survived.
The application correctly rejected that unavailable revision. Repeated runs
reproduced this automation-specific behavior. With browser `location.reload()`,
all three history cases pass, retaining source bytes and exact position. The
durable test now waits for history publication, invokes DOM reload and asserts
retained source bytes. No hidden revision store or recovery authority was added.
No claim is made that the driver-level reload issue itself is fixed.

Performance timing is descriptive, not a pass threshold: initial cross-browser
samples gave Chromium dispatch median/p95 0.5/2.9 ms, Firefox 1/7 ms, WebKit 1/4 ms.
WebKit RAF p95 was 26 ms during concurrent release checks. Do not claim a universal
60 Hz guarantee or physical Safari/trackpad certification from this cohort.
See [the runtime report](2026-09-08-bayesian-runtime-cost.md) for measurement scope.

Theseus records the final rerun result; this report is rationale and limitations,
not a second progress ledger. No new aesthetic treatment needs human approval.

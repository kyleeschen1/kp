# Playback visibility and many-card evidence

This implements the [approved lifecycle delivery](../2026-10-21-reader-lifecycle-delivery.md)
within the architecture agenda. `watchPlayback(stage, pause, lifetime.signal)`
now owns viewport/document pause notifications for the code inspection and
momentum-energy reader. Their domain models, clocks and renderers are unchanged.

One live document has one shared visibility observer/listener, with independently
abortable registrations. Final cancellation disconnects both. Hidden documents,
viewport exits, multiple subscribers, cancellation during delivery, separate
iframe documents, queued deliveries after disposal and remount are covered by
the production browser fixture. Reentry neither seeks nor resumes. Existing
pagehide/BFCache and reduced-motion owners stay local to their hosts.
Shared delivery preserves the error isolation of separate browser listeners:
one failing callback reports its error without preventing other cards pausing.
An executable regression exercises both outcomes.

This is deliberately not a universal host controller. It does not unmount
offscreen scenes or prevent a caller from explicitly starting an already-hidden
clock. Callers still own preparation, resize, playback controls and disposal;
they must abort the registration before disposing its clock. The required
AbortSignal makes that lifetime explicit; browser-event guards and tests enforce
notification safety. No catalogue-wide migration is implied.

## Measured costs

`npm run visual:semantic-cost` retains the existing cold/warm and concurrent
one/ten-player baseline, and adds a separate suspension cohort. Each of four
families mounts ten real players, begins playback while visible, moves offscreen,
checks held poses, returns without resuming, then plays/disposes. Three cycles
pressure cleanup. Stages overlap in the fixture to keep all ten visible before
exit; this is not a proposed article layout.

Chromium, local production build, October 21:

| Family | Mounted DOM elements, ten players | Listener delta after three cycles | DOM-node delta after three cycles | Post-GC JS heap delta |
| --- | ---: | ---: | ---: | ---: |
| Dot | 4,484 | 0 | 1 | 602,600 B |
| Rows | 4,162 | 0 | 1 | 445,584 B |
| Columns | 5,964 | 0 | 1 | 327,580 B |
| Polynomial collection | 3,370 | 0 | 1 | 397,172 B |

The shared production chunk is 940 bytes raw / 527 bytes gzip. That is chunk
size, not a measured net page saving. Source inspection shows the former policy
allocated an observer and document listener per session; the new mechanism test
demonstrates sharing and final release. Existing renderers can own additional
observers/listeners for other responsibilities.

Listener/DOM results are bounded executable checks. Heap includes browser and
renderer caches and is neither total process memory nor proof against leaks.
Thousands of mounted elements remain even when motion stops. This supports
pausing work offscreen; it does not establish that hundreds of mounted cards
are inexpensive. Demand mounting and bounded retained scenes remain useful.

## Verification and limitations

The focused physics/code browser checks preserve continuous control, exact
reverse, held prose, disclosure and print behavior. TypeScript and architecture
checks pass. Production build, reader closure/budgets and dev-tool exclusion pass.
All six cost-browser tests and 17 shared-reader Chromium conformance checks pass.
The complete deterministic suite passes: 7,323 tests, zero failures or skips.
The existing semantic-cost construction and complete-consumer bundle budgets
pass unchanged. Integration outcomes are recorded on `task.kp.reader-lifecycle`.

An initial full cost run failed because a concurrent main build cleared its
fixture under the shared `dist` directory. The trace showed “Not found,” not a
motion failure. Build and fixture-browser steps must run sequentially. The
focused ownership/suspension run had passed before this orchestration failure;
the complete cost suite subsequently passed against the restored fixture.

## Next recommendation

Separate ordinary authoring imports from compiler/inspection/fixture imports,
using the matrix and algebra authors already migrated as complete consumers.
Measure their actual dependency closures before adding more aliases or moving
modules. Keep mount/resize/restore policies domain-local until another repeated
responsibility is demonstrated. This delivery does not reopen the unaccepted
calculus card or require a new aesthetic review.

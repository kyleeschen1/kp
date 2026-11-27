# Independent library lanes: integration evidence

Date: 2026-11-27
Outcome: COMPLETE for the bounded [approved delivery](../2026-11-27-parallel-library-lanes.md).
The fixtures are inspectable; completion does not assert aesthetic acceptance,
a general extension SDK, published packages or broad notebook promotion.

## What can now be done

Three workers implemented separate source/API/fixture paths from the same base,
each in an isolated worktree with its own dependency copy. The integrator
reviewed and cherry-picked the three commits into the product feature branch.
No worker changed shared contracts, dependencies, strategic records or Theseus.

| Lab | Inspect | Independent API |
| --- | --- | --- |
| [Interaction](http://127.0.0.1:8011/) | Open picker; type apricot; choose it; reopen, use C-h to filter, then q to return | `src/interaction/public-api.ts` |
| [Mathematics](http://127.0.0.1:8012/) | Set matrix row 1/column 1 to 3; result becomes (5,2). Enter a partial minus sign, change one range and reload | `src/math-resources/public-api.ts` |
| [Player](http://127.0.0.1:8013/) | Scrub one saddle while the other stays put; play/reverse, resize and remount | `src/animation-player/public-api.ts` |

The interaction fixture is a browser picker over existing row/command owners,
with a native input and five mounted results. It does not replace the notebook's
ProseMirror picker or broaden Vim behavior. The matrix family uses existing
typed arithmetic, state admission and dependency caching; it remains a finite
2×2-by-vector family, not arbitrary CAS. Its persistence is fixture-local.
The player consumes the existing saddle artifact, geometry, projector and clock.
Its retained GPU pipeline is shared with the original experiment. Section
clipping policy remains in that experiment; this does not promote its pending
choreography. Two mounts use two bounded graphics leases, not one global canvas.

[Launch and development guide](../../../apps/README.md) supplies each app's
dev/test/typecheck/build commands. `lanes:start/status/stop` manage checkout-owned
localhost jobs with strict ports and preflight against foreign listeners. They
survive terminal exits and restart crashes until stopped or logout; no login
startup hooks were installed. Port 8000's existing KP service is unchanged.
Future worker tasks should start from the verified integration commit.

## Enforced boundaries and repairs

The new transitive API gate rejects product-host, experiment, sibling-lane and
unresolved imports, including type edges and reexports. Independent builds also
exercise real module resolution. Lab configuration checks enforce separate
localhost ports, strict binding and local output directories. This is a static
module boundary; it is not a plugin security sandbox or a proof about arbitrary
computed runtime imports.

The original architecture check failed on unowned editor modules and quadratic
resource imports classified under an experimental notebook directory. Inspected
the complete affected imports: chat stays application-owned, browser commands/
rows stay renderer-owned, and only the host-free quadratic model/runtime receive
specific neutral-core classifications. The original notebook experiment remains
experimental. No dependency exception or policy relaxation was added.

Further checks exposed three pre-existing UI schedules absent from the equation
clock inventory. Reviewed their selection measurement, shortcut expiration and
wall-clock display responsibilities; registered those exact paths with rationale.
They do not sample equation motion. Existing negative clock-policy tests pass.

Full TypeScript initially failed on `node:crypto` in a browser-owned object module,
then on an untyped array in the restored scroll test. The object now uses the
existing portable SHA-256 owner; a regression test compares the canonical
descriptor against Node's hash to preserve saved revision bases. The scroll
test has an explicit number-array annotation; its behavior is unchanged.

Configuration policy initially rejected three missing baseline entries: the new
three-lab browser suite and two previously added fraction suites. Inspected their
actual test matchers, inherited browsers, output paths, ports, absent server
launchers and timeouts (30 seconds for lanes, unchanged 90 seconds for the two
fraction scopes). Added only those three reviewed hashes. No timeout, existing
hash or compiler budget was raised.

## Verification

- `npm run check:library-lanes`: passes six boundary/service checks, 17
  interaction/preservation tests, seven matrix tests, 16 player/original-graph
  tests, all three complete scoped typechecks and all three production builds.
- `npm run visual:library-lanes -- --project=firefox`: 14 pass, Chromium and
  Firefox. Inspected Firefox captures of the picker, matrix views and both player
  sizes. Screenshots are disposable, not adopted visual goldens.
- `npm run visual:direct-webgl-graph`: initial run 31/32; Chromium's optional
  Three comparison was not ready within its existing five-second assertion.
  The complete unchanged rerun passes 32/32. No cause or runtime fix is claimed
  for that initial timeout; it remains loading/verification uncertainty.
- `npm run check:architecture`: complete chain passes, including dependency
  direction with zero exceptions and framework-neutral facades.
- `npm run typecheck`: full app, Node, tests, Svelte and domains pass on final
  integrated code; Svelte reports zero errors and warnings.
- `npm run check:playwright-configs`: 78 configs / 191 projects pass.
- Focused object-descriptor, compiler-authority, ownership and service tests:
  12 pass. Existing notebook mathematics: eight pass.
- Project vision/orientation: 75 checks pass; Theseus validation and exact
  backup tips are verified at closeout.

Standalone build JS raw/gzip: interaction 14.89/5.54 kB; mathematics
343.03/99.36 kB; player 86.89/25.38 kB. Math CSS is 30.49/8.74 kB with separate
KaTeX font alternatives. These are emitted-file estimates, not transfer or
startup measurements. The graph regression ran alongside compiler work, so its
frame timings are not used as a new performance benchmark. No new dependency
was added. New maintenance includes three finite adapters/fixtures, their tests,
the boundary manifest and the managed-service launcher.

## Backup and successor

Worker commits: interaction `7e538c18f`, mathematics `c59587d6d`, player `c21c006a8`;
each is backed up on its same-named feature branch. Integrated counterparts are
`ada4f8f72`, `30a2138e4`, `557b2dda4`; shared repairs and evidence follow in the
integrator's checkpoint. Worktrees are retained, not deleted or merged to main.

Proposed successor: use the independently checked matrix resource API through a
thin notebook adapter, preserving the accepted quadratic and shared operations.
This is the previously proposed M1 product workflow, not approval to begin it.
Independent interaction/player improvements can now receive separate bounded
worker packets. No further autonomous scope starts at this handoff.

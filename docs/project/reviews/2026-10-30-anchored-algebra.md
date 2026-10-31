# Anchored algebra: canonical review candidate

Status: HUMAN_CHECKPOINT — implementation checked; editorial and visual judgment pending.
Scope: [approved bounded exemplar](../2026-10-30-anchored-algebra-exemplar.md).

## Inspect the explanation

Run `npm run dev:client -- --host 127.0.0.1 --port 8011 --strictPort` in the
KP product worktree and open
<http://localhost:8011/experiments/reusable-reasoning/?example=anchored-algebra>.

The question is **What counts as one thing?** Follow the arrows through four
states. First, commentary points to the two occurrences of the same whole.
Next, it distinguishes the combined count from the unchanged quantity. At the
third stop, predict what five copies contribute before opening the parentheses.
Reverse the last move, then use the direct-state links and reload.

Judge whether the commentary helps explain the structure, whether each leader
has an unambiguous referent, and whether withdrawing text during transit gives
the movement enough room. Compare the same checkpoints on a phone. This is one
local light-theme candidate, not evidence of learning efficacy or a promoted
annotation system. The existing fractional tutorial remains unchanged.

## Canonical authority and implementation

Source: `content/authoring/algebra/what-counts.json`, revision
`sha256:7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61`.
The source checked on its first author-check attempt. The page renders and the
browser compiles those exact checked source bytes. It uses the existing
four-state real-scalar algebra chain, canonical native reader mount and composed
card controls. No mathematical compiler, shared native mount, timing, motif or
public source schema changed.

The local commentary score names stable states and selector groups. It is pinned
to that source revision, including editorial wording. Both verified endpoint
views of the counted whole have explicit bindings. The adapter resolves only
the compositor's active, passed native endpoint; it never looks up equal glyphs
or uses an inactive native copy as a moving anchor. Labels use the existing
plain-language helper and its screen-space typography. No math is painted by
the commentary adapter.

One existing clock drives the host. Commentary is a pure endpoint projection and
is absent during material transit. Geometry is read on a changed stop or layout,
not on every animation frame. Two labels occupy separate above/below bands;
leaders use the measured union of their declared selectors. Missing, duplicate,
unmeasurable or unsupported view bindings produce `kp.anchored-algebra.repair-gap`.
Labels are withdrawn on failure; static equations and commentary remain available.

The new host imports reader/scaffold CSS directly. Its styles do not inherit a
neighboring example's styles. This avoids those dependencies for this candidate;
it does not migrate or retire other hosts' CSS. The local controls are still
reused from `composed-algebra/card.ts`, which remains experiment-owned.
Maintenance added: four local TypeScript modules and one stylesheet, 265 lines
in total, plus source, focused checks and the dev route. No dependencies,
additional clock, paint owner, global store or reusable annotation API were added.

## Verification and repairs

- `npm run author:check -- --task equation.algebra-intuition --request content/authoring/algebra/what-counts.json`: checked, four states and three operations.
- `node --disable-warning=ExperimentalWarning --test tests/algebra-authoring-boundaries.test.ts tests/concise-authoring.test.ts tests/anchored-algebra.test.ts`: 10 passed. Includes stale wording/math rejection, exact selectors, direct/reverse endpoint projection and complete static content.
- `npm run visual:anchored-algebra`: three Chromium checks. Four desktop and four phone captures; direct/reverse parity, native endpoints, transit withdrawal, ordinary playback, reduced motion, links/reload/back, no-JavaScript reading, stale revision rejection and missing/duplicate anchor recovery.
- `npm run visual:algebra-mount -- --grep 'complete algebra native handoff'`: both preserved four/five-state callers passed.
- Application, Node and test TypeScript projects passed. `npm run test:project-vision`: 67 passed. `theseus workspace validate`: valid (1,269 nodes / 33,969 events at the first closeout validation).

The first unit/app-type pass rejected a parameter property under Node's
erasable-syntax policy; the gap class now declares its field explicitly. A test
mutation initially produced unsupported algebra before reaching the commentary
pin; its valid contrasting source now changes a declared symbol consistently.
Both were rerun successfully.

The first browser capture exposed two grid participants: server-rendered math
and the appended native shell. The host now hides the static participant before
native preparation; the browser guard requires one enhanced host and a hidden
static participant. A fresh run passed. The first duplicate-anchor fault also
duplicated compositor measurement IDs, correctly tripping that separate guard;
the focused injection now duplicates only the commentary selector binding, and
the browser test requires no uncaught page errors.

`verify:impact` has no focused rule for this new experiment and defaulted to a
promotion-wide plan. The approved discovery contract instead uses the focused
checks above and affected type projects. No production build or full browser
certification matrix is claimed. Native rendering itself is unchanged; no cost
baseline was raised and no performance improvement is claimed.

## Handoff and remaining decision

Branch: `spike/20261030-anchored-algebra`, based on the completed mount conversion
`a4978530b9f47ce8ce1a64239c1aff42951f2f86`. This conversation owns the candidate;
the workbench lane remains independent. Its `b12ac7413` native-session direction
must be retained when integrating strategic documents. No merge was performed.

Theseus: `run-contract.kp.anchored-algebra-v1`, one candidate slice. Human review
must decide wording, proximity, leader treatment and disappearance during motion
before reuse. A second caller, broader theme/accessibility/browser pressure,
practice integration and shared promotion remain outside this approval.

The rollback unit is the exemplar candidate commit: source, local host and
commentary, dev route, checks and evidence. Removing it leaves the prior shared
mount and existing algebra readers intact.

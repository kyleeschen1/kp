# Workbench opens a KP object through a bounded adapter

The user's “go” approves the preceding separation recommendation: keep general
editing and Codex sessions in the workbench, retain KP's domain validation and
rendering, and demonstrate one open/edit/preview integration before extraction.
The notebook style candidate at `c7fca1a11` is accepted by “looks great”.

Canonical object: the existing fractional-linear animation's bounded JSON note
and target specification, derived from
`content/authoring/algebra/fractional-linear-reasoning.article.md`. The existing
fraction compiler, semantic playhead and native KaTeX renderer remain authoritative.
The rich fraction notebook remains the accepted interaction reference. No new
motion, mathematical operation, publication, general conversation service or
renderer is authorized.

Workbench owns its generic source buffer, draft, commands and session interfaces.
KP supplies an identified, revisioned object descriptor and validates preview
proposals. A KP-owned frame retains one native player and reports accepted or
rejected requests. Stale basis, invalid inputs, superseded results and detached
frames cannot replace a newer accepted result. Changes are preview drafts; the
canonical lesson and independent notebook storage are not overwritten.

Implementation ownership: KP checkout `.worktrees/kp-product`, base `c7fca1a11`,
branch `feature/20261031-annotation-reader`; isolated workbench checkout
`.worktrees/workbench-kp-object`, base `a923112e23ed2be4094581e878d424e81c2b0f31`,
branch `feature/20261125-kp-object-adapter`. One agent owns both sides of the
adapter. Existing workbench checkout and native session state remain untouched.
The isolated workbench uses its own preview port and persistence key. No merge
to either repository's integration branch is implied.

Two packages: a narrow KP descriptor/preview boundary and its actual workbench
consumer. Use a documented message contract with exact parent/frame identity;
do not grant the iframe native workbench capabilities or add a permissive CORS
write endpoint. Workbench never imports KP runtime modules. KP never imports
workbench or Codex modules. The rollback units are these two repository commits.

Acceptance: open the object in Workbench, change an admitted annotation, preview
it in the existing animation, reject an invalid target while preserving the last
result, reload/reconnect without silently sending drafts, and reopen ordinary
workbench content without a KP dependency. Test request identity, stale revision,
bounded source and teardown; preserve the accepted notebook and public reader.
Use focused unit/types, workbench build/format checks, stable scoped browser
commands, and source-linked project-orientation checks. Inspect the integrated
desktop browser example before one human review; no broader extraction or promotion.

Timebox this bounded candidate to two hours, reserving its final quarter for
verification, recovery, documentation and backup. Record actual checks and
remaining limitations, especially native GUI/inference behavior not exercised.

## Implemented boundary

`src/fraction-notebook/object-protocol.ts` owns the text-only wire contract;
`object-compile.ts` derives a descriptor and reconstructs a preview from canonical
data. The descriptor's stable logical ID is
`kp:algebra:fractional-linear:annotations`; its revision is SHA-256 of the canonical
manuscript. This does not introduce a replacement UUID system: the existing
notebook/cell identities are retained during compilation. `source` is the existing
bounded JSON step specification, with `language: json` and only the `preview`
capability. The opening caption remains a separate existing slot.

The workbench owns a generic textarea draft and uses its existing SCI commands.
It does not import KP modules. The KP object host at `/experiments/kp-object/`
owns one same-origin native preview iframe and talks to the development-only
`/api/dev/fraction-object` route. GET describes; POST checks identity, canonical
revision, bounded source and the existing compiler's target/topology rules.
Neither route writes a file. POST still requires same-origin JSON; the cross-origin
workbench sends messages to its KP frame instead of gaining CORS write authority.

Messages carry protocol `kp.project-object.v1`, a fresh connection `session`, and
monotonically increasing `request` numbers for `preview`/`cancel`. `open` returns
`opened` with the descriptor after the native player is ready. `accepted` follows
the player's application acknowledgement; `rejected` carries the compiler error.
Both sides check exact window identity, origin and session. KP currently admits
only browser parents at 127.0.0.1 ports 1422 and 1426. Native origins are not
silently included. Edits, disconnect, supersession and timeouts invalidate pending
requests; stale drafts retain their original basis and cannot silently rebase.
The host installs its receiver before starting the child, avoiding a warm-load
ready-message race. Browser failure cases, rather than types alone, verify these
lifecycle guarantees. An already applied result is not rolled back by cancellation.

The workbench source is in `.worktrees/workbench-kp-object`, separate from the
existing candidate. Its `docs/project/reviews/2026-11-25-kp-object-adapter.md`
records consumer details. No rich-editor extraction or native session migration
was attempted. The original rich notebook remains the accepted authoring surface.
The paired workbench checkpoint is `500ad8b` on
`feature/20261125-kp-object-adapter` in `kyleeschen1/spindle-editor`.

## Review packet

Open <http://127.0.0.1:1426/> and choose **Edit KP object**. Choose **Predict how
to uncover x** in the animation menu. Change that step's `content` from “Four
is half of x…” to another explanation, then **Preview draft**. The annotation
should change at the current moment without replacing the animation player.
Replace a `focusRefs` entry with `invented.target` and preview: the error should
be useful and the previous result remain visible. Reconnect, or reload and reopen
the object: the draft survives but is not sent. **Return to reader** preserves
the independent workbench; **Standalone site** uses its own port 1427.

Judge the clarity of source → checked result → rejection/recovery before making
the editor richer. This preview-only JSON buffer does not claim rich notebook
parity, full Vim editing, multi-object storage, publication or native inference.
The accepted notebook remains at
<http://127.0.0.1:8000/experiments/fraction-notebook/>.

## Verification and cost

Focused model/types, actual consumer browser checks, notebook/public-reader
preservation and source-linked orientation are the review-tier gates. The impact
selector has no fraction-notebook rule and recommends a generic broad fallback;
this bounded development-only exemplar uses the proposal's focused gates rather
than claiming repository-wide release certification.

- `npm run test:fraction-notebook`: 20 tests, including the new descriptor,
  canonical revision, identity, bounded input and invalid target cases.
- `npm run typecheck:fraction-notebook`: passes for the boundary and browser tests.
- `npm run visual:workbench-object -- --project=chromium --project=webkit`:
  all eight final integrated cases pass, including actual annotation changes,
  invalid/stale/foreign requests, retained player, reload, cancellation, timeout
  and the independent site. Desktop captures were inspected; human workflow
  judgment remains pending.
- `npm run visual:fraction-notebook`: clean full rerun passes all 21 cases.
  The initial run passed 20/21: clicking the existing source disclosure once failed
  to reveal CodeMirror. Three focused repetitions and the full rerun passed
  without changing notebook UI code. Cause remains unproved; no fix is claimed.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: one canonical
  public-reader preservation case passes.
- Workbench production build, 11 focused CLJS tests/67 assertions, owned-source
  format check and port validation pass. Its native/Rust ownership is unchanged.
- `npm run test:project-vision`: 75 pass after shortening the active thread back
  within its original 450-word budget; the first reconciliation exceeded it by 11.
- Tooling tests and Playwright configuration/discovery pass. The only policy
  inventory addition is the new three-project object suite; all 70 existing
  configuration hashes remain unchanged (71 configurations, 170 projects total).

No new dependency, native effect or public-reader module was added. The canonical
reader closure remains 1,250,344 JS bytes / 308,778 gzip / 414 modules. Against
the existing workbench artifact, this candidate adds 8,132 JS bytes and 2,868 gzip
bytes (1,286,822 / 317,861 total). This is a measured artifact delta, not evidence
for whole-book performance or general authoring latency. The object compiler is
loaded only by the development route and the existing native player is reused.

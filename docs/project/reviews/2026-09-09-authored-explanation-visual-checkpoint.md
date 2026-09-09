# R4B authored explanation: combined human checkpoint

Date: 2026-09-09
Outcome: HUMAN_CHECKPOINT — awaiting editorial/visual approval, not a completed run.
Contract: `run-contract.kp.authored-explanation-coherence-v2`
Proposal: `2026-09-09-authored-explanation-coherence-long-loop-proposal.md`
Theseus owns live counts and slice state. This packet records the review artifact,
not a second implementation queue. Second-lesson reuse remains gated.

## Open and select the lesson

The existing single development server is running on port 8000.

- Interactive host: <http://localhost:8000/experiments/bayesian-reasoning/>
- Static edition: <http://localhost:8000/tmp/codex/bayesian-editions/6e2d8b84965e18ba23e9f4b45a41a7eaabee64feb437973beaea90e15bebd06d/index.html>
- Authored source: `content/authoring/r4b-spam-filter.bayes.json`.

The interactive URL deliberately preserves the original v1 default. Open
**Edit the probability model**, click **Load spam-filter lesson into draft**,
then **Apply draft**. Collapse the editor for reading. Loading alone does not
change the displayed card; there is no automatic source-file write.

Selected lesson: **Why a good spam filter can still produce many false alarms**.
Expected lesson revision:
`sha256:a5b48db5cee74e19aca2fdf0b1651ebf8ea7376a734fd3ba3cbc9f968013a24f`.
Committed source-byte hash:
`sha256:13189f82cd1db593318880b7f6de0f3fda3d2a1a8a1bf5e391693b76c5993213`.
The static edition pins its source, compiled payload and local styles; it is
complete without JavaScript. Serving it through Vite may add development tooling,
but the generated artifact itself contains no scripts and was tested directly
with JavaScript disabled as well as over the shared HTTP origin.

## What to judge

1. Read the setup and traverse the seven steps with arrows or gestures. Does the
   story make the base-rate issue clear, and does the prose fit comfortably?
   At **4 / 7**, both routes to a flag have gathered: 18 + 99 = 117. At **5 / 7**,
   the reference is flagged messages and the ratio evaluates to 2/13. Gathering
   and conditioning must feel distinct. No new motion treatment is proposed.
2. Compare **Full reading** and **Compact reading**. They should explain the same
   problem at different lengths, with definitions, assumptions and exact answer
   retained. Numbers in authored fact slots come from the model.
3. Open **Why this denominator?**, then return. Inspect the prediction and
   reconstruction questions, reveal their answers, and return to the card.
   Answers begin hidden; return preserves the interrupted position.
4. Open the static edition. It should read as the same explanation, with one
   Article-owned main title, seven checkpoint figures, denominator reasoning,
   and native disclosure-based self-checks.

Optional authoring check: change the prior from `1/100` to `1/10` and Apply.
The bound posterior becomes `2/3` across card, readings and answers. An invalid
passage state ID must retain the complete last-valid card. Reload the committed
spam-filter lesson and Apply again before approving the canonical revision.

Please approve this combined exemplar or name the specific editorial/visual
repair. No routine nonvisual approval is requested.

## What is implemented and preserved

One opt-in, bounded `kp.bayes-source.v2` source now supplies title/setup, seven
stop-linked passages, full/compact readings, denominator explanation and two
prompt wordings. Literal text and a closed vocabulary of existing probability
facts are the only inline forms. No template interpreter, new math, renderer,
timeline, salience store or editor state machine was added.

The existing verified model/trace owns probability evidence; the lesson revision
also pins editorial content. Prose-only edits change lesson identity without
minting new probability evidence. Required context and answers remain compiler
owned. Wrong references, unsupported fields, unknown facts and undefined
requested conditionals return located repair gaps, not fallback animations.

The v1 source remains strict, with pinned default revision/card/reading/prompt
outputs unchanged. Native SVG/KaTeX motion and shared seven-stop controls remain
the canonical mechanisms. Immutable editions preserve earlier bytes; rebuilding
changed content or presentation creates another edition rather than rewriting it.

The practice scenario exposed an existing post-Apply staging-wrapper bug. Its
repair gives delayed handlers only the retained revision element, with browser
regressions for both v1 and v2. The final capture also exposed a duplicated
static title; the shell now delegates the authored title to Article, protected
by a deterministic heading-count test. Details and honest drafting/repair
provenance: `2026-09-09-authored-explanation-authoring-evidence.md`.

## Verification and boundaries

Executed at this checkpoint boundary:

- `npm run test:bayesian-reasoning`: 53 passing tests, including exact v1
  baselines, hostile literal prose, revisions, extraction, answers and editions.
- `npm run typecheck`: application, Node, test, Svelte and domain checks pass.
- `npm run check:inference`: both complete cohorts pass. Latest measured core
  112770 types / 193156 instantiations; combined 142317 / 239377.
- `npm run check:architecture`: dependency, framework-neutral, reader, semantic,
  equation authority/governance and eight cross-domain gateway tests pass.
- `npm run visual:authoring-entrypoints -- --grep 'R4B|buttons visibly sample forward|combined checkpoint preserves keyboard|Bayes author apply'`:
  six Chromium cases pass, covering the authored workflow, desktop/390px captures,
  no-JS edition, legacy Apply, visible button motion and phone keyboard/gesture
  preservation. The additional R4A retained-urn case also passed after the
  practice ownership repair.
- `npm run author:bayesian-publication -- --source content/authoring/r4b-spam-filter.bayes.json --check`:
  exact edition verification; the stable browser checkpoint also builds and
  verifies it so a fresh workspace does not require preexisting output.

The isolated cold nonincremental TypeScript invocation hit Node's default 2GB
heap; the canonical cached full check passed. Standalone direct Node publication
tests could not create fixtures under the restricted workspace; the authorized
scope-specific npm suite passed. Neither issue was hidden by weakening tests.
Measured fixed TypeScript-cost amendments are recorded in
`../decisions/2026-09-09-editorial-consumer-typescript-cost.md` under the standing
approval, with all 48 core fixtures and the complete frontend consumer retained.

Not yet claimed: human editorial approval, second authored urn explanation,
complete R4B release, independent model-generation usability, learning efficacy
or physical Safari behavior. The full repository test/build and supported-browser
release cohort remain at the approved post-review boundary. Unrestricted prose
is editorial: changing parameters or tree order can require revising its claims
even when every bound number is correct.

## Resume

After approval, record acceptance of this exact exemplar, complete the human
checkpoint through Theseus, and continue the same contract with source-only urn
reuse, bounded authoring documentation/adversarial checks, measured effort/cost
and release verification. Do not restart R1–R4A, activate another contract or
implement the deferred mathematical-family expansion.

Theseus represents this wait with a review-ready s14 and a blocked target;
its slice schema does not support `blocked`. After human acceptance, transition
`next-action.kp.authored-explanation-coherence` back to `in-progress`, record the
acceptance evidence, then complete s14. Do not treat technical readiness as approval.

Fresh-model context command, from the repository root:

```sh
theseus work resume
```

Then use `npm run --silent loop:status` and the approved contract above. The
ordinary user resume instruction is **“approve this exemplar; resume the loop.”**
Each slice remains independently reversible by its scoped commit. Code through
the edition slice is committed at `e07334dfc`; the checkpoint commit additionally
contains review captures' executable entrypoint and the duplicate-heading repair.

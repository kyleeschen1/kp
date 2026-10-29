# Architecture repair roadmap

Date: 2026-10-29
Status: proposed; planning only, no implementation run authorized
Active direction: [co-creative practice](../threads/co-creative-practice.md)
Source baseline: `d6d297e9f06158fe692df76ec5799fb5b0e4a3d6`

## Decision and scope

The user accepts the latest fractional reader treatment (“it's grrat!”) and
asks for an architecture repair roadmap. Preserve that local treatment. Its
acceptance does not establish learning efficacy or authorize promotion to every
reader. The proposed campaign repairs demonstrated ownership and conversion
problems, then returns to the question → attempt → revision → later-return
product goal. It should not become an indefinite infrastructure programme.

This review owns the proposed repair sequence. The existing practice proposal
continues to own the product rationale. If implementation is approved, a Theseus
contract should own execution and evidence; do not duplicate its live status
here or in the roadmap. The broader workbench remains deferred.

## Findings and limits

This is a targeted source review of the algebra authoring/mounting path and the
current document reader, informed by the existing retirement and performance
evidence. It is not a complete repository audit, and no fresh runtime or bundle
measurement was performed for this planning turn.

1. **Shared runtime code has an exemplar owner.**
   `src/experiments/common-factor/native.ts` owns authenticated native mounts used
   by `src/experiments/composed-algebra/card.ts`. Composed-algebra intuition,
   edition reading and distribute/collect reuse that machinery. The common
   helper already preserves presentation validation, endpoint certificates,
   native layout, preparation, fonts, hidden viewports and disposal. Those are
   valuable contracts; the repair is explicit ownership and consumer conversion.
   This evidence does not establish that every production route imports it.
2. **Styles inherit sideways between examples.**
   `src/experiments/composed-algebra-intuition/entry.ts` imports styles from
   authoring-distribution-focus-card, reusable-reasoning, common-factor and
   composed-algebra. An example's appearance consequently depends on other
   examples' files. This is demonstrated coupling, not a measured duplicate-byte
   claim: bundlers may deduplicate repeated imports.
3. **The reader entry still coordinates too many responsibilities.**
   `src/reader/app/exemplar-entry.ts` has 1,760 lines at this baseline, including
   lesson selection, renderer/session construction, control authority, geometry,
   focus, preparation, restoration and teardown. There are already extracted
   owners. The issue is the remaining coordination and lesson-specific branches,
   not file length alone or a total absence of modularity.
4. **The theater depends on the shape of a previously compiled page.**
   `src/reader/compiler/fractional-linear-equation-lesson.ts` compiles an equation
   page and passes it through `fractional-caption-shell.ts`. That guarded local
   adapter locates and rewrites specific HTML structures. It rejects malformed
   inputs, but still couples two layout implementations. Promotion should emit
   the intended document structure directly from explicit inputs.
5. **Ownership and retirement mechanisms exist but cover bounded scopes.**
   `kp-module-ownership.ts`, `semantic-animation-compatibility-ledger.ts` and
   workbench lifecycle records already distinguish important concerns. The
   [algebra retirement](2026-10-29-algebra-api-retirement.md) successfully removed
   one obsolete facade. It did not certify the entire host/style/source-format
   dependency graph. Extend useful existing mechanisms instead of introducing a
   competing lifecycle database.
6. **Some performance problems have already been repaired.**
   [Motion-continuity evidence](2026-10-28-reader-motion-continuity.md) records
   continuous scroll sampling, narrower font invalidation and fewer repeated
   focus/preparation requests. [Prepared-reader evidence](2026-10-28-prepared-reader-delivery.md)
   identifies remaining cold preparation costs. A directory move cannot be
   credited with runtime improvement. Preserve the measured gains and measure
   new claims separately.

## Candidate comparison

These are planning judgments, not benchmark scores. Continuity favors completing
the already identified mounting/style boundary while preserving the accepted
reader. Small scope and stale-path removal favor a conversion over a new system.

| Candidate | Authoring and reuse | Stale-system reduction | Reliability and continuity | Scope/risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Shared algebra mounting conversion | Makes existing checked math usable outside its originating example | Removes a real cross-example dependency | Existing consumers and preservation evidence | Bounded; async lifetime needs care | First |
| Explicit document projection and owned styles | Makes layout changes local and supports additional hosts | Removes HTML rewriting and selected style inheritance | Preserves the accepted reader | Medium; typography and scroll geometry are sensitive | Next, one family |
| Repository-wide API renaming | Potentially easier discovery | Low if aliases accumulate | Broad compatibility disruption | High relative to demonstrated benefit | Defer; shorten names at repaired boundaries |
| Broad cache or renderer replacement | Uncertain | Can add parallel runtime paths | Risks known endpoint and continuity guarantees | High; no new measurement justifies it | Do not schedule |
| First durable personal-practice loop | Direct product value and a useful reuse test | Exposes remaining host assumptions | Follows accepted product direction | Bounded if existing math is reused | Return to it after the first repairs |
| Full workbench/ontology/task platform | Potential long-term coordination value | Uncertain while owners are unsettled | Previously deferred | High speculative scope | Remain deferred |

## Ordered outcomes

### 1. Give reusable algebra mounting an explicit owner

Trace all consumers of the existing native and card mounts, including edition
reading, browser harnesses, type fixtures and cost tooling. Place the genuinely
shared checked-presentation mount under the appropriate existing reader/runtime
owner. Keep example content, controls and lesson choices with their hosts.

Convert the current composed-algebra presentation and a structurally different
existing caller such as distribute/collect. Preserve the restriction that only
validated presentations choose animation assets, endpoints and certificates;
the new boundary must not expose unchecked renderer overrides. Preserve last
valid revision, cancellation, hidden viewport handling, font readiness,
resize and complete disposal.

**Completion:** both consumers use the owned boundary; old import paths are
removed or explicitly justified as versioned compatibility; no permanent forwarding
facade is introduced merely to avoid finishing the migration. Visual behavior,
semantic guarantees and complete consumer cost checks remain stable. A coherent
mount conversion is the smallest independently reversible unit.

### 2. Give the document theater an explicit projection boundary

Use the accepted fractional reader as the reference. Separate host responsibilities
(article layout, navigation, URL state and reading mode), projection responsibilities
(passage placement and prose/operation coordination), and renderer responsibilities
(native mathematical paint and prepared surfaces). Reuse existing clock, focus,
session and descriptor owners. A single semantic playhead must still determine
direct seeks, reversal and restoration without replaying intermediate animation.

Compile the theater's intro, passages, stage, options and continuation directly
from structured inputs, replacing its completed-page rewrite. Remove only the
corresponding branches from the large entry; do not split the file cosmetically
or attempt every lesson family at once. Keep domain checking upstream of layout.

**Completion:** the accepted page mounts through the explicit projection;
its old HTML rewrite and superseded boot path are removed. A second bounded
existing caller demonstrates that the contract does not encode fractional-lesson
details. Any newly proposed appearance still receives local visual review.
The projection conversion is separately reversible from the renderer.

### 3. Establish style ownership for that bounded family

Assign existing rules to foundations/tokens, native mathematical surface,
document or card projection, and genuinely local experiment styling. Convert the
identified cross-example imports to their real owners and delete the superseded
rules. Do not make an example's stylesheet the shared foundation under a new name.

Preserve approved typography, native KaTeX measurements, theme response and
geometry. Keep instructional labels in their existing typography owner. Exercise
the converted family beside an unrelated host and, where supported, in two
instances so accidental cascade and global selector ownership become observable.

**Completion:** a shared spacing or typography change has one documented owner;
the migrated example no longer imports another example's CSS; unrelated hosts
remain stable. Record actual route payload before claiming a shipping reduction.
One family's stylesheet conversion is the rollback unit.

### 4. Close conversions and simplify the supported authoring path

Retirement discipline starts with outcome 1; this outcome consolidates what those
conversions prove. Extend the existing compatibility/ownership records only where
the pilot needs additional evidence. Track source imports, CSS, routes, saved
source versions, publication artifacts, discovery and tests. Stop new consumers
of a deprecated path; remove its runtime after the required consumers migrate.
Keep archived editions and saved-source compatibility deliberate and versioned.

Apply concise names at real domain boundaries. `src/authoring/algebra/session.ts`
already provides a short domain-contextual entry over the prepared-revision owner.
Build on that pattern. Measure a small complete authoring task, remove redundant
public alternatives, and preserve typed repair gaps when a task is unsupported.
Domain semantics, pedagogical choices and rendering stay distinct.

The current roadmap also contains extensive historical execution material.
Condense its live navigation during a bounded memory cleanup, retaining dated
evidence by reference. The generation entrypoint should identify supported
capabilities and their current owners without requiring an LLM to reconstruct
history. Avoid a second manually maintained capability catalogue.

**Completion:** a new author or agent can find one supported path for the selected
task, obtain actionable typed failure, and use the same checked result in the
selected hosts. Each retired path has complete closure evidence; intentionally
retained compatibility has an owner and reason.

### 5. Demonstrate the repair through personal practice

Use one existing checked mathematical presentation in both an explanation and a
small durable practice interaction. A question can be revised, attempted, annotated
with a mistake or uncertainty, saved, and reopened at its original context after
reload. Retain the exact question version and assistance conditions for each
attempt. Keep observed mistakes separate from learner interpretation and model
hypotheses.

This is the product test of the repaired boundaries. Reuse math, rendering and
revision ownership; practice owns its prompts, attempts and persistence. Start
with the current assistant and local storage/export, without requiring a new
chat platform, automatic scheduler, global learner model or universal ontology.

**Completion:** one real practice loop works across a reload without copying the
lesson runtime or creating a new animation path. Record marginal authoring work
and the remaining repair gaps. Reprioritize from that evidence before expanding
the architecture campaign or generating a larger library.

## Verification and cost discipline throughout

- Preserve the canonical fractional artifact, `animation.fractional-linear.solve-x-over-2`,
  its source `content/lessons/solve-fractional-linear.md`, the native KaTeX
  compositor and host `/reader/solve-fractional-linear/`. Retain generous passage
  spacing, readable outgoing explanations, held math during exchange, endpoint
  retreat, no scrubber, real searchable/selectable prose, Read all, no-JS/print,
  reduced motion and URL restoration.
- At each changed owner, test invariants proportionally: semantic issuance and
  types; mount/dispose and async supersession; direct/reverse projection; native
  endpoints and paint ownership. Reuse stable scoped commands and existing
  canonical browser checks. Broaden the matrix at promotion, not after every
  local aesthetic adjustment.
- The latest reader correction showed that positional/opacity assertions can
  pass while the intended reading experience fails. Keep observable contracts
  such as readable text across the handoff; acceptance of an appearance and
  programmatic safety are distinct evidence.
- Attribute invalidation to content/semantic revision, math typography/geometry,
  presentation, attention, or host layout. Reuse the responsible owners and
  measure unnecessary work before changing policy. Retain bounded preparation,
  stale-work rejection and disposal; do not add per-frame geometry measurement.
- Measure cold preparation, warm seek/reverse, retained resources after disposal,
  production route payload and complete authoring type costs separately. The
  existing evidence predicts no particular speedup from ownership repair.
- Commit each coherent checked conversion and back it up under the standing Git
  policy. Record unfinished conversion honestly; a new wrapper is not closure.

## Progress and stopping rules

Judge progress by completed consumer conversions and removed old paths; fewer
independent owners touched for a routine change; fewer public choices for a
complete authoring task; stable or improved measured costs; and the ability to
reuse one checked presentation in the practice workflow. File count, test count
and new abstractions alone are insufficient measures.

Approve the first shared-mount conversion as a bounded implementation tranche,
with the two selected consumers and unchanged visuals. Review its evidence before
expanding the repair scope. The rest of this roadmap is a proposed order, not
automatic permission to migrate every family. After the mounting, projection
and style repairs, move into the practice proof with only the retirement/API work
needed to close those conversions. Broader cleanup should earn priority against
that product experiment.

For the accepted reference, open
`http://localhost:8000/reader/solve-fractional-linear/`, jump through Options to
“Multiply both sides by two,” then scroll and reverse across the passage handoff.
Generous spacing should coexist with a readable explanation while the completed
equation holds. That behavior is the preservation baseline, not a new candidate.

# Symbol-Motion Three-Caller Comparison

Date: 2026-08-15
Status: complete
Run Contract: `run-contract.kp.symbol-manipulation-three-operation-pressure-v1`
Slice: `s32`

## Question

Which candidate symbol-motion laws survive source-backed comparison across the
approved log-quotient, distribution, and additive-cancellation callers, and
which details must remain operation or renderer policy?

## Caller Evidence

| Boundary | Log quotient | Distribution | Cancellation |
| --- | --- | --- | --- |
| Semantic shape | Many-to-one operator/application fusion with two role-changing arguments | One-to-many factor fan-out with ordered product attachments | Two-source inverse cohort retires after shared contact |
| Continuants | `x` and `y` change grammatical roles | Addends and `+` preserve identity and attachment | Variable, equality, right value, and right inverse preserve identity |
| Non-continuants | Source enclosures and subtraction retire; quotient shell and bar are introduced | Source factor derives copies; parentheses retire | Only the authored left inverse pair retires; no visible zero is introduced |
| False identity rejected | Subtraction is not the fraction bar; neither source `ln` is the sole survivor | Equal factor glyphs are derived copies, not identity continuants | Equal `-3` glyphs on opposite sides cannot exchange provenance |
| Structural dependency | Enclosures and connector clear before argument transfer; target structure enters after settlement | Target slots precede fan-out; grouping retires after content departs | Contact precedes retirement; retirement precedes survivor compaction |
| Native endpoint | Measured native `ln(x)-ln(y)` and `ln(x/y)` | Canonical native `a(b+c)` and `ab+ac` | Canonical native `x+3-3=7-3` and `x=7-3` |
| Rewind | Same total correspondence projected backward | Same compiled plan sampled backward | Authored inverse pair reconstructs from shared contact |
| Presentation-specific behavior | Operator fusion, argument arcs, compact fraction treatment | Branch fan-out, ordered products, connector axis constraint | Opposing arcs, shared contact, joint retirement, implicit identity |

## Invariants Supported For Promotion

### 1. Exact semantic endpoints and a bounded rewrite frontier

Every caller starts from authoritative source and target structure and limits
motion to the operation's declared frontier. Unaffected context is not inferred
from layout. The common compiler must require exact endpoint authority and an
explicit frontier, even when a family currently stores that frontier through a
family-local contract shape.

### 2. Total correspondence, explicit provenance, and false-identity rejection

All visible operation material must be covered by a declared semantic relation.
Identity, role change, fan-in, fan-out, introduction, removal, cancellation,
and artifact participation remain distinct. Equal glyphs never establish
identity. Derived copies, fused successors, and cancelled sources retain their
actual provenance.

### 3. Semantic material lifecycle is separate from salience and paint

The three callers distinguish material that persists, changes role, derives a
successor, is introduced, or retires. That lifecycle cannot be encoded through
opacity or focus styling. `continuous-opaque` is therefore rejected as the
promoted name: continuants require continuous semantic presence and exclusive
visual ownership, while scene-level salience remains independent.

### 4. Typed operation cohorts and attachment closure

Each operation has semantic material that must travel or settle as a coherent
unit: fused operator applications, distributed products and connector, or an
inverse contact cohort. Promote the requirement that every operation plan
declare exhaustive role bundles, membership, attachment, and cohort identity.
Do not promote a single universal geometry policy such as rigid motion,
ordered reflow, or shared contact; those are plan variants.

### 5. Semantic precedence before physical scheduling

Each approved animation depends on a partial order expressed in meaningful
events: material clears structure, derived material arrives, contact occurs,
survivors compact, and the native endpoint becomes ready. Promote an acyclic
semantic precedence graph that a presentation compiler may lower into local
phase windows. Do not promote any caller's normalized times.

### 6. One nominal compiler authority before rendering

The operation-specific contracts validate meaning before renderer work, and
the strongest paths mint plans or choreography only after validating required
roles and correspondence. Promote a single nominal authority boundary between
semantic validation and renderer consumption. Renderers may measure endpoints,
plan collision-safe paths, and paint, but may not invent missing semantic
roles, identity, or lifecycle.

### 7. Deterministic sampling, native settlement, and exact historical rewind

All three callers use the existing host clock, direct seek, stable endpoint
ownership, and reverse projection. Promote these as execution requirements,
not motif traits. Reverse playback must reuse the same semantic history even
when the mathematical operation is not uniquely invertible.

## Candidates Rejected Or Kept Local

| Candidate | Result | Reason |
| --- | --- | --- |
| One universal trajectory grammar | Reject | Fusion, fan-out, and cancellation intentionally require different geometry. |
| Shared normalized timing windows | Reject | Only semantic precedence survives; pace and windows are presentation policy. |
| Opacity as material presence | Reject | Lifecycle and instructional salience are independent. |
| Universal rigid compound | Reject | Quotient subtrees, ordered products, and inverse cohorts have different cohesion laws. |
| Homomorphic fusion as the root grammar | Keep candidate/local | It describes quotient well but neither distribution nor cancellation. |
| Structural-shell lifecycle as a mandatory operation feature | Keep conditional | Quotient and distribution use shells; cancellation correctly introduces none. |
| Counter-orbit contact | Keep cancellation-local | It is the reviewed cancellation recipe, not a general semantic-motion law. |
| Distribution connector axis constraint | Keep distribution-local | It preserves the `+` attachment but does not generalize to fusion or cancellation. |
| Compact fraction optical correction | Keep exemplar-local | It is typography treatment over native KaTeX, not semantic authority. |
| Renderer-authored motif fallback | Reject | Missing authority must produce repair, explicit static, or human review. |

## Architecture Finding

The shared laws are already present in pieces, but callers reach them through
different authority paths:

- log quotient creates a family-local compiled operation and then a candidate
  homomorphic choreography with authored windows;
- distribution binds its family-local pressure contract directly to the
  existing distribution compiler and sampler; and
- cancellation relies on a generated transformation, a typed pressure
  contract, an asset presentation profile, and the reader choreography mint.

This is not evidence for merging the operation-specific motifs. It is evidence
for one compiler front door that validates the promoted invariants, resolves a
capability-compatible presentation, and mints the appropriate existing plan
variant. The accepted successor ordering is recorded in
`../decisions/2026-08-15-kp-canonical-semantic-motion-compiler-order.md`.

## Source Evidence

- `src/semantic/log-quotient-contract.ts`
- `src/semantic/log-quotient-transformation-compiler.ts`
- `src/animation/log-quotient-homomorphic-fusion.ts`
- `src/semantic/distribution-pressure-contract.ts`
- `src/animation/distribution-pressure-animation.ts`
- `src/semantic/cancellation-pressure-contract.ts`
- `src/animation/cancellation-pressure-animation.ts`
- `src/animation/operation-presentation-plan-types.ts`
- `src/reader/renderers/equation-operation-choreography-compiler.ts`
- `src/rendering/native-katex-operation-choreography.ts`

## Verification Scope

The comparison is verified by the focused semantic and animation suites for
all three callers plus the repository architecture checks. Visual treatment is
already human-approved independently for quotient, distribution, and
cancellation; this slice does not alter their presentation.

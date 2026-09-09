# Canonical presentation routing repair

Status: bounded migration implemented; fixed renderer source-budget stop before release and visual acceptance.

## Accepted direction

The user requested that generated work use the same pipeline as its canonical
presentation, including animation and composition, with a type-level guarantee
where possible. A shared semantic asset constructor or native compositor does
not alone satisfy this requirement. Preserve domain-specific semantic and
rendering owners; do not substitute a universal renderer.

The required boundary is an opaque, resolver-issued presentation binding that
couples the verified source revision, supported canonical presentation owner,
and composition. Hosts must consume that binding, not independently combine an
asset with a descriptor. Unknown owner/capability combinations must yield typed
repair gaps. Runtime authenticity and revision checks complement negative
compile-time tests; a brand does not certify visual equivalence.

## Evidence and scope conflict

- `src/authoring/common-factor-draft.ts` validates and compiles the governed
  equation-series request, then independently creates its animation from the
  common-factor proof. The compiled candidate is not presentation authority.
- `src/experiments/common-factor/native.ts` locally constructs its descriptor,
  endpoint layout and native session. It does not resolve the preserved
  canonical presentation owner.
- `src/editor/semantic-animation-preservation-manifest.ts` identifies the
  factoring reference as
  `editor-animation.sample.animation.factoring.factor-common-a`, with catalog
  choreography `choreography.catalog.animation.generated.distribution.factor-common-a`.
- That live reference traverses `src/editor/equation-surface-adapter.ts` and
  `src/rendering/semantic-equation-token-renderer.ts`, using the complete
  `compileKpFactoringChoreography` / `sampleKpFactoringChoreography` capability.
- `src/rendering/native-katex-factoring-choreography.ts` instead uses the
  fusion core, its own transport and compressed context schedule. This is not
  the complete canonical factoring presentation.
- The approved M1a proposal requires native KaTeX and explicitly stops s12
  when the existing mechanism cannot support the task without new visual
  grammar. It also excludes global renderer changes and broad migrations.

The previous uncommitted motion experiment and its accompanying test were
removed on 2026-09-09. The committed semantic authoring work and native host
remained unchanged at that earlier stop. The implementation below supersedes
that stopped state, not the preserved canonical reference.

## Approved scope resolution

Preserve the native compositor, but authorize a bounded migration of the
complete canonical factoring presentation into its shared adapter. Reuse the
canonical phase and composition owner, not copied timing or newly guessed
geometry. Require an issued presentation binding at the authored mounting
boundary and test rejected unbound assets, forged bindings, mismatched
revisions and unsupported compositions. Compare canonical and native output
through every material phase, including grouping reception, reverse and seek.

The alternative is to mount the existing catalogue presentation owner directly,
which restores actual owner reuse but abandons this card's native-only host
requirement. Do not silently choose that architectural tradeoff.

The user accepted the recommendation and requested implementation. This amends
the M1a s15 repair scope to permit the bounded native adapter migration and
typed presentation binding described above. It does not authorize reverting to
the legacy host, catalogue-wide rollout, or new mathematical families. Preserve
the source/proof APIs and existing-group factoring callers; the complete
group-introduction adapter and binding are the reversible repair unit. Compare
the canonical catalogue reference and authored native host before s15 visual
acceptance. Theseus remains the execution authority.

## Implemented repair and remaining gate

`src/authoring/common-factor-presentation.ts` now resolves one nominal,
runtime-authenticated binding from matching proof, source revision and compiled
two-state composition. It registers the complete factoring operation plan with
the existing operation-presentation registry. The authored native mount accepts
this binding and no asset, layout or choreography override. Raw assets,
candidates, serial copies, copied bindings and mismatched compositions are
rejected. Complete choreography itself is compiler-issued; fusion-only plans
cannot stand in for it. This is enforced for the common-factor path, not a claim
that all historical hosts have been migrated.
Valid multi-digit coefficients return `unsupported-presentation` before
mounting: the current native fusion owner requires single-glyph contributors.
Mathematical verification remains independent of that presentation limitation.

Both catalogue and native adapters now consume the canonical factoring phase
sampler, lineage branch helper, grouping reception helper and copy-focus
profile. Complete native choreography retains semantic playhead timing rather
than receiving the compositor's second endpoint-dwell time warp. Existing-group
native factoring retains its previous timing and transport. Full factoring
continuants retain their baseline through downstream collision planning.
Reception preserves the reference gesture while reserving the measured
compaction corridor at larger typography; no glyph-specific offset or blanket
collision exemption was added.

The scoped browser test compares grouping-phase values with the live catalogue
reference, captures both presentations at 0, .18, .37, .5, .68, .9 and 1, checks
continuant baselines and repeated reverse-seek poses, and retains controls,
Apply, readings, practice and no-JavaScript edition tests. It caught the second
time warp and off-axis context routing during this repair. Automated evidence
does not constitute human visual approval or universal renderer certification.

Inspection URL:
`http://localhost:8000/experiments/reusable-reasoning/?example=common-factor`.
The shared server was restarted after a read-only check found port 8000 unused.

Executed evidence:

- `npm run test:common-factor-authoring`: 27 passing tests, including the
  multi-digit presentation gap.
- `npm run visual:common-factor-authoring`: 3 passing browser tests.
- `npm run test:real-katex-glyph-compositor`: 82 passing tests.
- `npm run typecheck`: passed, including Svelte and domain checking.
- `npm run check:architecture`: passed dependency, frontend, reader, semantic,
  governance and cross-domain gates.
- `npm run profile:authoring-entrypoint-inference`: within unchanged ceilings;
  measured complete fixture 169,961 types / 282,610 instantiations and core
  113,052 / 193,425 after the geometry/cache changes.
- Canonical renderer source gate remains **failed**: 512,488 aggregate source
  bytes against the unchanged 505,000 ceiling. The accompanying focused
  factoring/preservation run passed 30 of 31 tests; the size gate alone failed.
  Earlier `npm run test:canonical-equation-renderer` passed its other 28 checks.

Source/target ownership sampling was consolidated and catalogue duplication
removed, but the complete composition, time-authority and binding repair still
exceeds this non-TypeScript-compiler budget by 7,488 bytes. The standing
TypeScript-cost approval does not authorize raising it. Proposed amendment:
515,000 aggregate source bytes (2,512 bytes of headroom), with the same module,
paint-kind, lifecycle, import, inference and behavioral gates. **Not applied.**

Stop at this budget decision; do not mark s15 accepted or start numeric reuse.
After approval, apply only the approved budget amendment, rerun the failed gate
and final narrow checks, and obtain the combined primary visual decision.
Full release and the supported-browser promotion matrix remain later slices.

## Follow-up: reported “Preparing figure” stall

The user reported that the inspection page never left preparation. Reproduced
in Firefox and WebKit; fresh Chromium continued to pass. This was a synchronous
preparation rejection, not a server outage or a semantic-proof/binding failure.
The protected-transit validator found an introducing parenthesis crossing a
persistent addend around progress .61–.73. Grouping position incorrectly followed
its opacity schedule, which settles at .72, while addend compaction continues
until .78. Reserving only the starting corridor did not prevent overtaking
during transit; browser-specific measured paint exposed the defect.

The shared factoring frame now separates `groupingReceptionProgress` from
`groupingOpacity` and bounds reception by both visibility and compaction.
Both catalogue and native adapters consume that same reception value; opacity,
proof, authored sources, nominal binding, endpoints and existing-group native
factoring remain unchanged. No collision exemption or browser-specific offset
was introduced. A sampled unit law guards the ordering relation.

Initial preparation errors now replace the loading stage with a visible repair
message and disable card controls. A browser test aborts the dynamic compositor
module to verify that failure cannot leave this loading overlay active. Readiness
assertions report terminal errors immediately. The existing scoped
`npm run visual:common-factor-authoring` command now includes Chromium, Firefox
and WebKit by default because this regression escaped Chromium-only checking.

The fixed source gate is still unchanged and failed: **512,619 / 505,000 bytes**
after this repair. The proposed 515,000 amendment remains unapplied; s15 still
requires human visual approval. This bug repair does not advance the long loop.

Follow-up verification: all 12 scoped browser tests pass (four in each engine),
including real canonical phase comparison, interrupted reverse seeks, controls,
Apply, static editions and injected preparation failure. The eight factoring
choreography unit tests, 82 native compositor tests, full typecheck and
architecture checks pass. The focused source/conformance run passed 18/19;
its sole failure is the previously pending aggregate byte ceiling above.

## Human visual approval

After the cross-browser preparation repair at `1752d11d8`, the user confirmed
“it looks good.” This accepts the repaired common-factor card's visual treatment.
Preserve that treatment during subsequent work. Earlier pending-visual statements
above are historical; the outstanding stop is now the renderer source-size
decision only: 512,619 bytes against 505,000, with 515,000 proposed and unapplied.
Visual acceptance does not waive that gate or authorize a broader migration.

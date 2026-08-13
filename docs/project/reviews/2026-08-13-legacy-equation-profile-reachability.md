# Legacy Equation Profile Reachability

Date: 2026-08-13
Verdict: retire the decoder and reject missing typed profiles

## Closure

The legacy equation presentation metadata decoder has no remaining author,
public entrypoint, serialized ingress, or production asset that requires it.

- `createKpAnimationAssets()` exposes 25 assets with equation render targets;
  every one now carries `kp.presentation-profile.v1`.
- The LLM v1 compatibility compiler explicitly supplies the established typed
  default when its target is an equation.
- No `public-api.ts` exports the decoder, its metadata keys, or the renderer
  policy that consumed it.
- No source loader parses JSON into a `KpAnimationAsset`. Catalogue assets are
  constructed and validated through typed source adapters; projection
  recomposition also passes the typed profile explicitly.
- Exact production references to legacy keys are confined to the decoder,
  its compatibility ledger, and a conformance checker whose purpose is to
  inspect that legacy representation. There is no runtime author.
- Remaining direct decoder imports are internal fallback policy/branch helpers
  and tests of the fallback itself. These are replacement callers, not external
  compatibility obligations.

## Replacement

`src/animation/equation-presentation-policy.ts` becomes the neutral owner. It
requires and validates `KpEquationPresentationProfileV1`, exposes the existing
compact policy view, and reads branch strategy directly from the typed profile.
An equation asset without that profile fails with its animation id rather than
receiving an inferred visual policy.

The semantic cancellation-intent resolver remains independently useful for
generated repair and capability selection. Only its metadata authoring helper
is obsolete.

## Evidence

- `node --disable-warning=ExperimentalWarning --test tests/equation-presentation-profile-authoring-ratchet.test.ts`
- `rg -n "equation-presentation-profile-decoder|decodeKpEquationPresentationProfile|decodeKpLegacyEquationPresentationMetadata" src tests scripts package.json`
- `rg -n "equationMotionPresentationRecipe|equationCancellationTeachingGoal" src --glob '*.ts'`
- `rg -n "equation-presentation-profile-decoder|equation-presentation-policy" src/*/public-api.ts src/public-api.ts`

The retirement unit is the decoder, legacy-only tests and conformance branches,
the eight ledger entries, and the metadata authoring helper. Semantic asset
identity, typed profiles, renderer choreography, cancellation intent inference,
sampled clocks, and visible behavior remain outside that unit.

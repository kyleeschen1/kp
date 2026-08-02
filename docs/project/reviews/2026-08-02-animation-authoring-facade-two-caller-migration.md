# Animation authoring facade two-caller migration

Date: 2026-08-02  
Status: complete; visual matrix retains separately attributable presentation debt

## Scope

Exactly two production callers now import the narrow animation-authoring
facade:

- `fraction-composition-equation-adapter.ts`;
- `verified-linear-problem-animation-compiler.ts`.

No builder, renderer, reader, motif, provider, timing, geometry, prose, or
metadata implementation moved. The internal balanced-solve module now has one
production caller: `animation/public-api.ts`.

## Preservation evidence

- The facade re-exports the same factory and validator bindings by strict
  identity; it does not wrap either implementation.
- The canonical fraction asset remains valid with the same identity, 14
  objects, 13 transformations, and `kp.presentation-profile.v1` profile.
- The verified generated-solve session remains deeply identical to its
  committed runtime JSON asset.
- Focused preservation, facade conformance, caller-ledger, fraction dry-run,
  generated-session, and product-integration tests pass: 24/24.
- The generated-solve Chromium product checks pass: 2/2.
- Typecheck, production build, reader production closure, architecture gates,
  and generated display-catalog currency all pass.

The exact caller audit after migration reports two facade production callers,
three test callers, no scripts, and no unclassified callers.

## Existing visual debt surfaced by the broad gate

`npm run visual:fraction-composition-canonical` completed its full 16-case,
1,296-sample matrix but remains red on six unrelated material-contact pairs.
This is not a behavior delta introduced by the facade migration: the public
factory export and the former internal factory import are the same ECMAScript
binding by strict identity, and no presentation code changed in this slice.
The result is retained as separately attributable presentation debt rather
than weakening or whitelisting the visual gate.

## Rollback

The independently reversible migration unit is the two import-path changes,
the exact caller expectations, and the preservation test. Reverting it leaves
the facade definition and both implementations intact.

# Canonical Extension Path Audit

Date: 2026-08-12  
Scope: creating or reusing semantic animation without inventing a new runtime,
renderer, host, or presentation authority.

## Finding

KP has one implemented governed construction path, but current guidance makes
it look like two. The released canonical public entry is
`src/authoring/canonical-animation-public-api.ts`. The older
`kp.llm-animation-draft.v2` path still has valuable migration and repair-gap
tests, but the construction inventory explicitly classifies it as retained
compatibility evidence and says it must not become a second construction API.
The 2026-08-12 LLM routing guide accidentally promoted that older schema again.

This is exactly the kind of ambiguity that makes a large repository expensive
for a fresh model: both paths are typed, tested, and plausibly named, while
only historical reading reveals which one governs new work.

## Canonical Path

```text
verified solver / interpreter / authored semantic source
  -> exact source revision and operation-pack pins
  -> KpGovernedCanonicalConstructionRequest
  -> compileKpGovernedCanonicalConstruction
  -> KpVerifiedGovernedCanonicalConstruction
  -> existing presentation profile and choreography compiler
  -> one sampled-frame clock
  -> capability-selected renderer adapter
  -> registered canonical host / vignette / Article projection
```

The public authoring seam carries references, role and lineage intent,
explanation purpose, detail, composition, and checkpoints. It deliberately
cannot carry coordinates, timing tables, CSS, DOM, renderer selection, or
unverified target mathematics. `planKpGovernedConstructionRepairs` is the
canonical bounded repair mechanism.

## Adjacent Paths And Dispositions

| Path | Valid use | Why it is not the default extension path |
| --- | --- | --- |
| `src/animation/asset.ts` and domain adapters | Internal construction of a verified semantic `KpAnimationAsset` and existing hand-authored exemplars | Broad internal model; exposing it asks authors to assemble details the governed compiler should derive. |
| `src/animation/public-api.ts` | Small caller-proven balanced-solve facade | Deliberately narrow exemplar API, not a universal construction surface. |
| `kp.llm-animation-draft.v1/v2` readers and compilers | Historical generated fixtures, version migration, operation-resolution research, and typed repair evidence | The July construction inventory classifies it as compatibility/retained evidence; promoting it creates a parallel author/compiler artifact. |
| Generic editor animation player | Catalogue inspection and assets without a certified product host | Equal animation ID does not preserve canonical host, renderer, anchors, salience, or protected transit. |
| Renderer and surface adapters | Paint sampled state in one medium | They own paint only and cannot author semantics, time, or product representation. |
| Legacy equation metadata recipes | Decode retained serialized inputs while callers migrate | Presentation policy in semantic metadata is a compatibility seam, not authoring vocabulary. |
| Article and vignette syntax | Reuse and explain an existing certified animation | It selects a canonical representation; it does not construct the animation or renderer. |

## Product-Binding Reality

The governed construction seam is real and tested, but final product binding is
still exemplar-led rather than a single generic function. That is an honest
boundary, not permission to use the generic player. An author must resolve the
animation's registered canonical representation and reuse its certified host
when presentation parity matters. A new motif or host remains exemplar-first
and requires human review before promotion.

## Required Corrections

1. Route new model-authored semantic animation through the canonical
   construction public API and mark LLM draft v2 as retained compatibility.
2. Keep concept publication, animation construction, renderer, and product
   host facades separate; “one path” means one ordered authority chain, not one
   giant barrel.
3. Add executable checks that canonical guidance names the real public seam
   and that new production callers do not import the legacy draft compiler.
4. Make representation resolution explicit: an asset ID alone is not evidence
   that a caller reused canonical behavior.


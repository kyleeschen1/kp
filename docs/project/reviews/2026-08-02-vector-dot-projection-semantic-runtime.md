# Vector dot-projection semantic runtime

Date: 2026-08-02  
Status: complete; visual projection remains slice `s18`

## Outcome

The stable `animation.dot-projection.basic` asset now consumes the exact rank-5
contract instead of hard-coding the earlier axis-aligned sample. One semantic
compiler owns the source and target vectors, indexed component products, dot
product, squared magnitudes, projection scale, projected vector, perpendicular
residual, angle state, and accessible description.

The canonical values are `a=(4,2)`, `b=(1,1)`, component products `4` and `2`,
dot product `6`, scale `6/2=3`, projection `(3,3)`, and residual `(1,-1)`.
Two semantic component-pair objects carry stable selector and geometry IDs, so
the later SVG projection can highlight correspondence without deriving it.

## Runtime contract

The shared animation clock deterministically selects eight semantic beats:
source pose, x pair, y pair, dot settlement, projection scale, projection drop,
orthogonal decomposition, and native settlement. Runtime frames expose:

- exact values and projection geometry from the compiled semantic model;
- pending/active/accumulated state for both indexed component pairs;
- stable component-to-source/target/projection geometry lineage;
- bounded projection-drop and residual-reveal progress;
- right-angle settlement state and a current accessible description; and
- the existing animation/runtime frame and active-transformation identities.

Forward direct seek and mirrored rewind are equal at semantic beat, component,
and geometry level. The dense 65-sample law also checks dot accumulation,
projection collinearity, residual orthogonality, and exact source decomposition.

## Degenerate behavior

- A zero projection target rejects with typed
  `projection.target.zero`; no fallback direction is invented.
- A zero source is a valid projection with zero projection and residual, while
  its angle is explicitly `null` and described as undefined.
- Non-finite and non-integer components reject in stable input order because
  this exemplar promises exact integer arithmetic.

## Preservation and next boundary

The animation ID, sample/family/catalogue identities, graph capability pack,
shared clock, SVG host, and two canonical family definition IDs remain stable.
The asset tree changes from parallel to semantic sequence because component
pairing must precede projection; the renderer still owns no vector math.

Slice `s18` may change only the existing SVG presentation to consume these
frames using dimensional continuity and native inline KaTeX. It must not add a
graph engine, scene graph, clock, or domain-wide motif. Rollback is the semantic
model, adapter/runtime evolution, focused tests, and this evidence file.

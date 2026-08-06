# Repository seams

Audit these seams before creating new salience infrastructure. Extend or compose them when their authority matches the task; do not add a parallel global store simply to obtain a more uniform name.

| Concern | Existing authority | Constraint |
| --- | --- | --- |
| Semantic objects, groups, regions, and cross-surface composition | `src/semantic/semantic-scene-protocol.ts` | Layout stays owned by surface adapters. |
| Instructional salience intents | `src/animation/salience-plan.ts` | Intents name semantic entities and reject timing, paths, coordinates, DOM, and SVG instructions. |
| Story, URL, pointer, and keyboard focus | `src/reader/runtime/semantic-focus.ts` | Preserve the existing precedence: keyboard, pointer, URL, story. |
| Orient/act/settle/inspect attention projection | `src/reader/runtime/attention-projector.ts` | The attention plan owns semantic and visual playheads; only `act` opens the motion gate. |
| Cross-view transmission | `src/tutorial/cross-view-attention.ts` | Compile correspondences into semantic `transmit` intents rather than synchronizing physical nodes directly. |
| Paint-only focus elevation | `src/animation/focus-profile.ts` | Keep `layoutParticipation: false` and preserve accessibility modes. |
| Domain-specific salience projection | `src/tutorial/lisp-function-application/lisp-function-application-salience.ts` | Preserve domain semantics; converge through adapters only after a second caller proves the boundary. |

## Audit order

1. Find the semantic entity registry and confirm every target has a stable ID.
2. Find the instructional intent or attention-plan owner.
3. Find the deterministic clock or semantic progress input.
4. Find focus overrides and precedence.
5. Find the renderer's current paint ownership.
6. Find theme and accessibility resolution.
7. Identify duplication, missing projections, and any style values masquerading as semantic state.

Report what already exists before proposing abstractions. A new adapter is appropriate when the semantic state already exists and a renderer cannot express it. A new semantic contract is appropriate only when the teaching distinction cannot be represented by existing intent, identity, attention, presence, or trace roles.

## Integration shape

Prefer a thin composition layer:

```text
KpAnimationSaliencePlan + KpReaderAttentionProjection
  + KpReaderFocusSnapshot + semantic scene
  -> scene salience resolution
  -> renderer binding
```

Keep tutorial authoring framework-neutral. Svelte or SvelteKit hosts may subscribe to projections and render controls, but Svelte state must not become the animation asset's semantic clock or salience authority.

## Link and restoration behavior

Use stable lesson, vignette, beat, checkpoint, scene, and entity IDs in authoring and URLs. Resolve jumps directly to semantic state, then paint one endpoint. Do not scroll through intermediate states, synthesize pointer events, or replay every animation to reconstruct a linked moment.

## Comments and compatibility

When extending a seam, comment the reason for its ownership boundary or ordering rather than narrating the implementation. Preserve existing public authoring contracts during presentational work. If migration is necessary, isolate it as a separately approved compatibility slice.

# Doctrine and state model

## Governing principles

1. **Salience is semantic.** Author what the learner should notice, compare, follow, predict, or retain—not a physical effect.
2. **Rendering is medium-specific.** DOM, KaTeX, SVG, Canvas, and WebGL may use different properties to express the same resolved state.
3. **Identity, salience, presence, and trace role are independent.** A demand curve can stay red while becoming contextual; a prior curve can remain present as historical evidence without becoming the focus.
4. **Attention transfers.** Coordinate release and reception so the learner can follow an idea between prose, notation, diagrams, code, and 3D scenes.
5. **Color is a resource, not permanent syntax.** Use stable identities where they aid recognition, but preserve enough chromatic headroom for instructional emphasis.
6. **Continuity carries meaning.** Direct seek, reverse, interruption, and replay must be deterministic and should not depend on replaying a transition from the beginning.

## Canonical dependency direction

```text
instructional intent
  -> attention phase / semantic playhead
  -> object-state projection
  -> scene-level resolution
  -> renderer + theme style resolution
  -> paint
```

Information may flow down this pipeline. Renderer measurements and style values must not flow back upward and become semantic truth.

## Conceptual object state

Use this decomposition as the architectural model, adapting names to existing contracts. Do not introduce a new shared type merely to match this example.

```ts
interface ObjectVisualState {
  identityFamily: ColorFamily;
  salience: "focus" | "normal" | "context" | "dim";
  presence: number;
  traceRole: "live" | "historical" | "inferred" | "prospective";
}
```

- `identityFamily` answers: what is this object?
- `salience` answers: how strongly should the learner attend to it now?
- `presence` answers: is it currently revealed or withdrawn?
- `traceRole` answers: is it current evidence, a former state, an inference, or a prediction?

Treat `absent` as `presence = 0`, not as a salience tier. Treat `ghost` as a trace role plus renderer-specific styling in most cases, not as an all-purpose low-opacity state. Add domain-specific roles only when the semantic distinction changes authoring or behavior.

## Scene-level resolution

Object-local adapters cannot guarantee that the intended target wins the scene. Resolve the collection together:

```ts
resolveScene({
  entities,
  activeIntents,
  attentionPhase,
  focusOverrides,
  theme,
  accessibilityMode
}) -> ResolvedObjectVisualState[]
```

The resolver should:

- determine targets, supporting context, and unrelated context;
- arbitrate simultaneous or conflicting intents;
- preserve focus-source precedence;
- ensure relative visual dominance without hiding required context;
- return stable endpoints that renderer adapters can cache.

## Determinism contract

For a fixed semantic model, playhead, theme, and accessibility mode, projection must return the same resolved state. Imperative commands may compile to a plan or update the playhead, but they are not core authority.

Direct links and TOC jumps should resolve semantic beat and entity IDs to endpoint state immediately. Reverse motion should sample the same plan backward. Interruption should continue from the current sampled state or seek to a stable semantic endpoint; it must not reconstruct meaning from DOM styles.

## Accessibility contract

Visual context and accessibility presence are separate. Required explanatory content must remain perceivable, operable, and available to assistive technology even when it is visually de-emphasized. Pair color or opacity differences with another cue when the distinction carries meaning. Honor reduced-motion, high-contrast, and no-depth preferences at style resolution.

## Source of truth

The expansive rationale, renderer discussion, open questions, and historical decisions remain in [the visual salience handoff](../../../../docs/kinetic_press_visual_salience_handoff.md). When that document and a reviewed newer exemplar disagree on an aesthetic parameter, preserve the architectural doctrine and treat the aesthetic value as provisional until the user resolves it.

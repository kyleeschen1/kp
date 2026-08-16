# KP Animation SDK API Handoff

> Historical specification. The private, unexported SDK and its parallel
> manifest were retired on 2026-08-16 after caller-complete reachability found
> no production or script consumer. Current hosts should use
> `src/animation/kernel.ts`, `src/animation/catalog-loader.ts`, and the narrow
> authoring APIs. The paths below remain as historical evidence only.

## Purpose

This file explains the public animation SDK surface for a host application or
agent that wants to build its own picker, UI controls, hover affordances, and
time manipulation while using KP animation data and motion sampling.

The intended integration is not an iframe. The host imports KP JavaScript,
loads a lightweight typed manifest for picker search, lazily loads the selected
animation, renders the visual state in its own DOM or canvas, and drives time
through the SDK.

## Source Files

- `src/public/equation-animation-manifest.ts`
  - lightweight picker metadata
  - safe to import during app startup
- `src/public/kp-animation-sdk.ts`
  - public SDK entrypoint
  - lazy-loads the full animation catalog only when a selected animation is
    requested
- `src/editor/equation-animation-catalog.ts`
  - current full animation source
  - loaded dynamically by the SDK
- `src/rendering/equation-motion-plan.ts`
  - converts transitions into motion plans
- `src/rendering/equation-motion-sampler.ts`
  - pure `plan + progress -> frame` sampler
- `src/rendering/equation-motion-player.ts`
  - simple player wrapper around the sampler

## Import Pattern

Use the SDK module from the host:

```ts
import {
  bindKpEquationMotionHover,
  createKpEquationAnimationSession,
  listKpEquationAnimationSelections
} from "/src/public/kp-animation-sdk.ts";
```

If the host only needs picker metadata and wants to avoid importing the full SDK,
it may import the manifest module directly:

```ts
import {
  listKpEquationAnimationSelections
} from "/src/public/equation-animation-manifest.ts";
```

## Picker Manifest

Call:

```ts
const selections = listKpEquationAnimationSelections();
```

Each selection has this shape:

```ts
interface KpEquationAnimationSelection {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly summary: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly tags: readonly string[];
  readonly fixtureId?: string | undefined;
  readonly defaultDurationMs: number;
}
```

Use these records for fuzzy pickers. Search over `label`, `summary`, `id`,
`sourceLatex`, `targetLatex`, `tags`, and optionally `fixtureId`.

The manifest is intentionally lightweight. It does not include the full
transition data, full state data, or compiled plans.

## Loading An Animation

After the user selects an item:

```ts
const session = await createKpEquationAnimationSession(selection.id, {
  render(frame) {
    renderFrame(frame);
  }
});
```

This call dynamically imports `src/editor/equation-animation-catalog.ts`, finds
the selected animation, converts the selected transition into an
`EquationMotionPlan`, and creates a player.

By default, the first transition is used. To load another transition:

```ts
const session = await createKpEquationAnimationSession(selection.id, {
  transitionIndex: 1,
  render(frame) {
    renderFrame(frame);
  }
});
```

The current session shape is:

```ts
interface KpEquationAnimationSession {
  readonly animation: EquationAnimationCatalogEntry;
  readonly plan: EquationMotionPlan;
  readonly transitionIndex: number;
  readonly player: EquationMotionPlayer;
  setProgress(progress: number): EquationMotionFrame;
  getProgress(): number;
  getFrame(progress?: number): EquationMotionFrame;
  getTokenMetadata(tokenOrMotionId: string): KpEquationMotionTokenMetadata | undefined;
}
```

## Rendering Responsibilities

The SDK does not currently render DOM for the host. The host must render the
source and target visual states, then apply sampled frames.

For an equation animation, render the states from:

```ts
session.animation.states
```

Each state has:

```ts
interface EquationAnimationState {
  readonly step: number;
  readonly latex: string;
  readonly renderLatex?: string | undefined;
  readonly structuralMotionAnnotations?: readonly EquationAnimationStructuralMotionAnnotation[] | undefined;
  readonly annotations: readonly EquationMotionAnnotation[];
}
```

Use `state.renderLatex ?? state.latex` as the preferred visual LaTeX. Some
fixture animations use `renderLatex` because it inserts `data-kp-motion-id`
anchors into KaTeX via trusted HTML commands.

The host renderer must preserve elements with:

```html
data-kp-motion-id="..."
```

Those motion IDs are how the SDK maps hover events and sampled frame poses back
to semantic animation tokens.

## Driving Time

Drive time by setting normalized progress from `0` to `1`:

```ts
slider.addEventListener("input", () => {
  session.setProgress(Number(slider.value));
});
```

`setProgress()` clamps through the sampler and returns the sampled frame:

```ts
const frame = session.setProgress(0.42);
```

A frame has this shape:

```ts
interface EquationMotionFrame {
  readonly progress: number;
  readonly tokens: readonly EquationMotionFrameToken[];
}

interface EquationMotionFrameToken {
  readonly tokenId: string;
  readonly pose: MotionPose;
}

interface MotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}
```

Apply each token pose to the matching rendered element. The host should resolve
the rendered element using the token metadata:

```ts
function renderFrame(frame: EquationMotionFrame) {
  for (const tokenFrame of frame.tokens) {
    const metadata = session.getTokenMetadata(tokenFrame.tokenId);
    const motionId = metadata?.targetMotionId ?? metadata?.sourceMotionId;

    if (motionId === undefined) {
      continue;
    }

    const element = stage.querySelector(
      `[data-kp-motion-id="${CSS.escape(motionId)}"]`
    );

    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const { x, y, scale, opacity } = tokenFrame.pose;
    element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    element.style.opacity = String(opacity);
  }
}
```

Important: for robust source-to-target animations, the host usually needs both
source and target state DOM available, layered in a stable stage. Some tokens
exist only in the source, some only in the target, and some persist across both.

## Hover Affordances

Bind hover metadata to rendered elements:

```ts
const cleanupHover = bindKpEquationMotionHover(stage, session, {
  enter(metadata, event) {
    showTooltip(metadata, event);
    highlightToken(metadata);
  },
  leave(metadata) {
    clearTooltip();
    clearHighlight(metadata);
  }
});
```

The binder listens for `pointerover` and `pointerout`, walks up to the nearest
`[data-kp-motion-id]`, resolves metadata through the session, and calls the
host-provided handlers.

Call the cleanup function when unmounting:

```ts
cleanupHover();
```

Token metadata shape:

```ts
interface KpEquationMotionTokenMetadata {
  readonly tokenId: string;
  readonly label: string;
  readonly lifecycle: EquationMotionPlan["tokens"][number]["lifecycle"];
  readonly visualLifecycle: EquationMotionPlan["tokens"][number]["visualLifecycle"];
  readonly correspondenceRelation: EquationMotionPlan["tokens"][number]["correspondenceRelation"];
  readonly sourceMotionId?: string | undefined;
  readonly targetMotionId?: string | undefined;
  readonly sourceLatex?: string | undefined;
  readonly targetLatex?: string | undefined;
}
```

Use this metadata for hover cards, selection outlines, token inspectors, and
cross-view highlighting.

## Minimal Host Flow

```ts
import {
  bindKpEquationMotionHover,
  createKpEquationAnimationSession,
  listKpEquationAnimationSelections
} from "/src/public/kp-animation-sdk.ts";

const selections = listKpEquationAnimationSelections();
renderPicker(selections);

async function selectAnimation(animationId: string) {
  const session = await createKpEquationAnimationSession(animationId, {
    render(frame) {
      renderFrame(session, frame);
    }
  });

  renderStates(session.animation.states);
  session.setProgress(0);

  const cleanupHover = bindKpEquationMotionHover(stage, session, {
    enter(metadata) {
      hoverPanel.textContent = metadata.label;
    },
    leave() {
      hoverPanel.textContent = "";
    }
  });

  return { session, cleanupHover };
}
```

Note: the `render(frame)` callback closes over `session`, so in production code
it is often cleaner to create the session first without a render callback, then
call `session.setProgress()` from your own time loop.

## Safer Host Flow

```ts
const session = await createKpEquationAnimationSession(animationId);

renderStates(session.animation.states);

slider.addEventListener("input", () => {
  const frame = session.setProgress(Number(slider.value));
  renderFrame(session, frame);
});
```

This avoids callback ordering issues and leaves the host fully in control of
rendering.

## Current Limitations

- The SDK exposes motion data and hover metadata, but does not yet include a
  complete stock DOM renderer.
- The host must provide KaTeX rendering if it wants DOM math output.
- The host must preserve `data-kp-motion-id` attributes for hover and motion
  metadata to work.
- The lightweight manifest is manually maintained and tested against the current
  full catalog.
- The current lazy load imports the full animation catalog module. Future work
  can split each animation into its own chunk.
- Multi-transition animations expose `transitionIndex`; the host must decide how
  to sequence steps.

## Verification

The SDK is covered by:

```sh
node --disable-warning=ExperimentalWarning --test tests/kp-animation-sdk.test.ts
npm run typecheck
npm test
```

These tests verify picker manifest metadata, manifest/catalog parity, lazy
session creation, time sampling, and token metadata lookup for hover
affordances.

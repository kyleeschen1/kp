import { normalizeAnimationProgress } from "../animation/kernel.ts";

export type KpLayoutObjectKind =
  | "row"
  | "split"
  | "synchronized-panel";

export type KpSynchronizedPanelRole = "controls" | "equation" | "graph";

export type KpSynchronizedPanelTarget =
  | {
      readonly kind: "equation-animation";
      readonly id: string;
      readonly fixtureId?: string | undefined;
    }
  | {
      readonly kind: "graph-surface-mode";
      readonly id: string;
      readonly surfaceMode: string;
    };

export type KpSynchronizedPanelControlKind =
  | "play-pause"
  | "scrubber"
  | "step-back"
  | "step-forward";

export interface KpLayoutObject {
  readonly id: string;
  readonly kind: KpLayoutObjectKind;
  readonly childIds: readonly string[];
  readonly preserves: readonly string[];
  readonly role?: KpSynchronizedPanelRole | undefined;
  readonly summary: string;
}

export interface KpSynchronizedPanel {
  readonly id: string;
  readonly role: Exclude<KpSynchronizedPanelRole, "controls">;
  readonly layoutObjectId: string;
  readonly target: KpSynchronizedPanelTarget;
}

export interface KpSynchronizedPanelControl {
  readonly id: string;
  readonly kind: KpSynchronizedPanelControlKind;
  readonly boundClockId: string;
}

export interface KpSynchronizedPanelLayoutSample {
  readonly id: string;
  readonly title: string;
  readonly sharedClockId: string;
  readonly rootLayoutId: string;
  readonly layoutObjects: readonly KpLayoutObject[];
  readonly panels: readonly KpSynchronizedPanel[];
  readonly controls: readonly KpSynchronizedPanelControl[];
}

export interface KpSynchronizedPanelLayoutFrame {
  readonly sampleId: string;
  readonly sharedClockId: string;
  readonly progress: number;
  readonly rootLayoutId: string;
  readonly panels: readonly KpSynchronizedPanelFrame[];
  readonly controls: readonly KpSynchronizedPanelControlFrame[];
}

export interface KpSynchronizedPanelFrame {
  readonly panelId: string;
  readonly progress: number;
  readonly role: KpSynchronizedPanel["role"];
  readonly target: KpSynchronizedPanelTarget;
}

export interface KpSynchronizedPanelControlFrame {
  readonly boundProgress: number;
  readonly controlId: string;
  readonly kind: KpSynchronizedPanelControlKind;
}

export function createLinearSolveSynchronizedPanelLayoutSample(): KpSynchronizedPanelLayoutSample {
  const sharedClockId = "solve-x-shared-clock";

  return {
    id: "layout.sample.linear-solve-synchronized-panel",
    title: "Linear solve synchronized panel",
    sharedClockId,
    rootLayoutId: "layout.linear-solve.root",
    layoutObjects: [
      {
        id: "layout.linear-solve.root",
        kind: "synchronized-panel",
        childIds: [
          "layout.linear-solve.split",
          "layout.linear-solve.controls"
        ],
        preserves: [
          "child selector identity",
          "shared playhead"
        ],
        summary:
          "Root synchronized panel binding equation, graph, and controls to one playhead."
      },
      {
        id: "layout.linear-solve.split",
        kind: "split",
        childIds: [
          "panel.linear-solve.equation",
          "panel.linear-solve.graph"
        ],
        preserves: [
          "child selector identity",
          "pane identity"
        ],
        summary:
          "Two-pane split for the equation animation and graph visualization."
      },
      {
        id: "layout.linear-solve.controls",
        kind: "row",
        childIds: [],
        preserves: [
          "child selector identity",
          "shared playhead"
        ],
        role: "controls",
        summary:
          "Control row bound to the same clock as the equation and graph panels."
      }
    ],
    panels: [
      {
        id: "panel.linear-solve.equation",
        role: "equation",
        layoutObjectId: "layout.linear-solve.split",
        target: {
          kind: "equation-animation",
          id: "linear-equation-solve-x"
        }
      },
      {
        id: "panel.linear-solve.graph",
        role: "graph",
        layoutObjectId: "layout.linear-solve.split",
        target: {
          kind: "graph-surface-mode",
          id: "saddle-orbit-graph",
          surfaceMode: "mesh"
        }
      }
    ],
    controls: [
      {
        id: "control.linear-solve.scrubber",
        kind: "scrubber",
        boundClockId: sharedClockId
      },
      {
        id: "control.linear-solve.step-back",
        kind: "step-back",
        boundClockId: sharedClockId
      },
      {
        id: "control.linear-solve.play-pause",
        kind: "play-pause",
        boundClockId: sharedClockId
      },
      {
        id: "control.linear-solve.step-forward",
        kind: "step-forward",
        boundClockId: sharedClockId
      }
    ]
  };
}

export function sampleSynchronizedPanelLayoutFrame(
  sample: KpSynchronizedPanelLayoutSample,
  progress: number
): KpSynchronizedPanelLayoutFrame {
  const clampedProgress = normalizeAnimationProgress(progress);

  return {
    sampleId: sample.id,
    sharedClockId: sample.sharedClockId,
    progress: clampedProgress,
    rootLayoutId: sample.rootLayoutId,
    panels: sample.panels.map((panel) => ({
      panelId: panel.id,
      progress: clampedProgress,
      role: panel.role,
      target: { ...panel.target }
    })),
    controls: sample.controls.map((control) => ({
      boundProgress: clampedProgress,
      controlId: control.id,
      kind: control.kind
    }))
  };
}

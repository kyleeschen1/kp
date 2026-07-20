import {
  linearSolveAssetIds
} from "../../../../src/semantic/linear-solve-asset.ts";

export interface KpLinearEquationStorySegment {
  readonly text: string;
  readonly semanticRef?: string;
}

export interface KpLinearEquationStoryBeat {
  readonly id: string;
  readonly title: string;
  readonly progressPermille: number;
  readonly focus: readonly string[];
  readonly segments: readonly KpLinearEquationStorySegment[];
}

export interface KpLinearEquationSymbolicStoryShape {
  readonly id: string;
  readonly animationId: "linear-equation-solve-x";
  readonly title: string;
  readonly summary: string;
  readonly beats: readonly KpLinearEquationStoryBeat[];
}

export function defineLinearEquationSymbolicStory<
  const Story extends KpLinearEquationSymbolicStoryShape
>(story: Story): Story {
  validateStory(story);
  return deepFreeze(story);
}

export const solveXPlusThreeSymbolicStory = defineLinearEquationSymbolicStory({
  id: "mathematics.linear-equations.solve-x-plus-three.symbolic-story.v1",
  animationId: "linear-equation-solve-x",
  title: "Solve x + 3 = 7",
  summary: "Watch the same algebraic objects persist as the equation changes.",
  beats: [
    {
      id: "read-equality",
      title: "Read the equality",
      progressPermille: 0,
      focus: [linearSolveAssetIds.initial],
      segments: [
        { text: "Begin with " },
        { text: "x + 3 = 7", semanticRef: linearSolveAssetIds.initial },
        { text: ". The equals sign is a promise: both sides still name the same value." }
      ]
    },
    {
      id: "subtract-both-sides",
      title: "Make the same move twice",
      progressPermille: 333,
      focus: [linearSolveAssetIds.subtract],
      segments: [
        { text: "Subtract 3 from both sides. " },
        { text: "The two −3 terms enter together", semanticRef: linearSolveAssetIds.subtract },
        { text: ", so equality never breaks." }
      ]
    },
    {
      id: "cancel-opposites",
      title: "Let opposites cancel",
      progressPermille: 667,
      focus: [linearSolveAssetIds.cancel],
      segments: [
        { text: "On the left, " },
        { text: "+3 and −3 cancel", semanticRef: linearSolveAssetIds.cancel },
        { text: ". The x remains the same object throughout the rearrangement." }
      ]
    },
    {
      id: "read-solution",
      title: "Read what remains",
      progressPermille: 1000,
      focus: [linearSolveAssetIds.simplify, linearSolveAssetIds.solved],
      segments: [
        { text: "On the right, 7 − 3 becomes 4. The equation settles at " },
        { text: "x = 4", semanticRef: linearSolveAssetIds.solved },
        { text: "." }
      ]
    }
  ]
});

export function searchableLinearEquationStoryText(
  story: KpLinearEquationSymbolicStoryShape
): string {
  return [
    story.title,
    story.summary,
    ...story.beats.flatMap((beat) => [
      beat.title,
      beat.segments.map((segment) => segment.text).join("")
    ])
  ].join(" ");
}

function validateStory(story: KpLinearEquationSymbolicStoryShape): void {
  if (story.beats.length < 2) throw new TypeError("A symbolic story needs at least two beats.");
  let previousProgress = -1;
  const beatIds = new Set<string>();
  for (const beat of story.beats) {
    if (beatIds.has(beat.id)) throw new TypeError(`Duplicate symbolic story beat: ${beat.id}.`);
    beatIds.add(beat.id);
    if (!Number.isInteger(beat.progressPermille) || beat.progressPermille < 0 ||
      beat.progressPermille > 1000 || beat.progressPermille <= previousProgress) {
      throw new TypeError("Symbolic story progress must be strictly increasing from 0 to 1000.");
    }
    if (beat.segments.length === 0 || beat.segments.every((segment) => segment.text.trim() === "")) {
      throw new TypeError(`Symbolic story beat ${beat.id} needs searchable prose.`);
    }
    previousProgress = beat.progressPermille;
  }
  if (story.beats[0]?.progressPermille !== 0 || story.beats.at(-1)?.progressPermille !== 1000) {
    throw new TypeError("Symbolic story endpoints must be 0 and 1000.");
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export const KP_TUTORIAL_SCRUB_TOGGLE_EVENT = "kp:tutorial-scrub-toggle";
export const KP_TUTORIAL_SCRUB_REWIND_EVENT = "kp:tutorial-scrub-rewind";
export const KP_TUTORIAL_SCRUB_PREVIOUS_EVENT = "kp:tutorial-scrub-previous";
export const KP_TUTORIAL_SCRUB_NEXT_EVENT = "kp:tutorial-scrub-next";
export const KP_TUTORIAL_SCRUB_SEEK_EVENT = "kp:tutorial-scrub-seek";

export interface KpTutorialScrubSeekDetail {
  readonly progress: number;
}

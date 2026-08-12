import {
  compileKpSchemeFactorialTimeline
} from "./scheme-factorial-timeline.ts";
import { kpSchemeFactorialCheckpoints } from
  "../semantic/scheme-factorial-checkpoints.ts";
import { kpSchemeFactorialScore } from
  "../semantic/scheme-factorial-score.ts";

export const kpSchemeFactorialTimeline = compileKpSchemeFactorialTimeline({
  score: kpSchemeFactorialScore,
  checkpoints: kpSchemeFactorialCheckpoints
});

import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../../../animation/linear-solve-adapter.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const streamlinedDescriptor = {
  id: "streamlined",
  createAnimation: () => createLinearSolveAnimationAsset(),
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;

export const teacherZeroDescriptor = {
  id: "teacher-zero",
  createAnimation: () => createLinearSolveTeacherZeroAnimationAsset(),
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;

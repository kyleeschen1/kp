import { compileKpFractionalLinearEquationLesson } from '../reader/compiler/fractional-linear-equation-lesson.ts';
import { compileKpFractionalLinearEquationLessonModel } from '../reader/compiler/fractional-linear-equation-lesson-model.ts';
import { fractionalReadingCommentary } from '../reader/compiler/fractional-reading-commentary.ts';
import { importFractionReading, projectReading, readNotebook, readSteps } from './model.ts';

/** The existing fraction compiler admits meaning and targets. The editor never
 * manufactures an animation from its own text or serialized renderer state. */
export function compileFractionNotebook(value: unknown, canonical: string) {
  const notebook = readNotebook(value), { definition } = importFractionReading(canonical);
  if (!notebook.cells.some(c => c.type === 'story')) throw new Error('This fraction preview requires its animation. The content-only draft remains editable.');
  const markdown = projectReading(notebook, definition);
  const model = compileKpFractionalLinearEquationLessonModel(markdown);
  const notes = fractionalReadingCommentary(model.document, model.animation);
  // Compiling the complete page also validates the fixed passage/operation topology.
  compileKpFractionalLinearEquationLesson(markdown);
  const story = notebook.cells.find(c => c.type === 'story')!;
  if (story.type !== 'story') throw new Error('Missing story');
  const steps = readSteps(story.source, definition.beats.length, story.caption.text);
  return { notebook, notes, beats: definition.beats.map((beat, index) => ({ ...beat, ...steps[index] })) };
}
export function fractionPreviewPage(canonical: string): string {
  return compileKpFractionalLinearEquationLesson(canonical).html.replace('<body', '<body data-kp-fraction-notebook-preview="true"');
}

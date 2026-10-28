import { fractionalPassageOperation } from './fractional-passage-progress.ts';
import type { KpReaderPiecewiseScrollGeometry } from '../runtime/continuous-scroll-clock.ts';

/** Native controls project the host's rendered progress; they own no clock. */
export function mountFractionalPassageSliders(input: {
  beats: readonly HTMLElement[];
  passages: readonly HTMLElement[];
  geometry: () => KpReaderPiecewiseScrollGeometry | undefined;
  seek: (progress: number, position: number) => void;
}) {
  const bindings = input.beats.slice(1).map((beat, index) => {
    const operation = fractionalPassageOperation(Number(input.beats[index]!.dataset['kpCheckpoint']), Number(beat.dataset['kpCheckpoint']));
    const range = beat.ownerDocument.createElement('input');
    range.type = 'range';
    range.className = 'kp-caption-operation-slider';
    range.min = '0';
    range.max = '1000';
    range.step = '1';
    range.value = '0';
    range.setAttribute('aria-label', `${beat.querySelector('h2')!.textContent}: animation progress`);
    const copy = input.passages[index + 1]!.querySelector('.kp-beat-copy');
    if (copy === null) throw new Error('Passage slider requires its compiled prose.');
    copy.append(range);
    const onInput = () => {
      const geometry = input.geometry();
      if (geometry === undefined) return;
      const target = operation.seek(geometry, range.valueAsNumber / 1000);
      input.seek(target.progress, target.position);
    };
    // Arrow keys belong to the native range, not the page's scroll controls.
    const onKeyDown = (event: KeyboardEvent) => event.stopPropagation();
    range.addEventListener('input', onInput);
    range.addEventListener('keydown', onKeyDown);
    return { range, operation, onInput, onKeyDown };
  });
  return {
    render(progress: number) {
      for (const { range, operation } of bindings) {
        const fraction = operation.fraction(progress);
        const value = String(Math.round(fraction * 1000));
        if (range.value !== value) range.value = value;
        range.style.setProperty('--kp-operation-progress', `${fraction * 100}%`);
        range.setAttribute('aria-valuetext', `${Math.round(fraction * 100)}%${fraction === 0 ? ' — before the operation' : fraction === 1 ? ' — operation complete' : ''}`);
      }
    },
    dispose() {
      for (const { range, onInput, onKeyDown } of bindings) {
        range.removeEventListener('input', onInput);
        range.removeEventListener('keydown', onKeyDown);
        range.remove();
      }
    }
  };
}

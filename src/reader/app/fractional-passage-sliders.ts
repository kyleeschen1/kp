import { fractionalPassageOperation } from './fractional-passage-progress.ts';
import type { KpReaderPiecewiseScrollGeometry } from '../runtime/learner-public-api.ts';

/** One theater control, bound only to an explicitly associated operation. */
export function mountFractionalPassageSliders(input: {
  beats: readonly HTMLElement[];
  host: HTMLElement;
  geometry: () => KpReaderPiecewiseScrollGeometry | undefined;
  seek: (progress: number, position: number) => void;
}) {
  const bindings = input.beats.map((beat) => {
    const id = beat.dataset['kpOperationId'];
    if (id === undefined) return undefined;
    if (!id || beat.dataset['kpOperationStart'] === undefined || beat.dataset['kpOperationEnd'] === undefined) {
      throw new Error('An operation control requires its checked source and result.');
    }
    return { beat, operation: fractionalPassageOperation(Number(beat.dataset['kpOperationStart']), Number(beat.dataset['kpOperationEnd'])) };
  });
  const range = input.host.ownerDocument.createElement('input');
  range.type = 'range';
  range.className = 'kp-caption-operation-slider';
  range.min = '0'; range.max = '1000'; range.step = '1'; range.value = '0';
  range.hidden = true;
  input.host.append(range);
  let active: (typeof bindings)[number];
  const onInput = () => {
    const geometry = input.geometry();
    if (geometry === undefined || active === undefined) return;
    const target = active.operation.seek(geometry, range.valueAsNumber / 1000);
    input.seek(target.progress, target.position);
  };
  const onKeyDown = (event: KeyboardEvent) => event.stopPropagation();
  range.addEventListener('input', onInput);
  range.addEventListener('keydown', onKeyDown);
  return {
    operationAt: (index: number) => bindings[index]?.operation,
    render(index: number, progress: number, opacity: number) {
      const binding = bindings[index];
      if (binding !== active) {
        active = binding;
        if (binding !== undefined) {
          range.setAttribute('aria-label', `${binding.beat.querySelector('h2')!.textContent}: animation progress`);
          range.setAttribute('aria-describedby', `caption.${binding.beat.dataset['kpBeat']}`);
          range.dataset['kpOperationBeat'] = binding.beat.dataset['kpBeat'];
        } else delete range.dataset['kpOperationBeat'];
      }
      const hidden = active === undefined || opacity <= 0;
      if (range.hidden !== hidden) range.hidden = hidden;
      range.disabled = hidden;
      const paint = String(opacity);
      if (range.style.opacity !== paint) range.style.opacity = paint;
      if (active === undefined) return;
      const fraction = active.operation.fraction(progress);
      const value = String(Math.round(fraction * 1000));
      if (range.value !== value) range.value = value;
      const fill = `${fraction * 100}%`;
      if (range.style.getPropertyValue('--kp-operation-progress') !== fill) range.style.setProperty('--kp-operation-progress', fill);
      const description = `${Math.round(fraction * 100)}%${fraction === 0 ? ' — before the operation' : fraction === 1 ? ' — operation complete' : ''}`;
      if (range.getAttribute('aria-valuetext') !== description) range.setAttribute('aria-valuetext', description);
    },
    dispose() {
      range.removeEventListener('input', onInput);
      range.removeEventListener('keydown', onKeyDown);
      range.remove();
    }
  };
}

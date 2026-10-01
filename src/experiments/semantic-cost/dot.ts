import '../dot-product-passage/page.css';
import { mountDotPlayer } from '../dot-product-passage/player.ts';
import { dotPassage } from '../dot-product-passage/model.ts';
import type { CostProduct, MountedReading } from './cases.ts';

export async function mount(root: HTMLElement, product: CostProduct): Promise<MountedReading> {
  const dispose = await mountDotPlayer(root, dotPassage(product.cell(0, 0)));
  const slider = root.querySelector<HTMLInputElement>('[data-scrub]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-play]')!;
  return {
    seek(progress) { slider.value = String(progress); slider.dispatchEvent(new Event('input', { bubbles: true })); },
    play() { if (play.textContent !== 'Pause') play.click(); },
    pause() { if (play.textContent === 'Pause') play.click(); },
    dispose,
  };
}

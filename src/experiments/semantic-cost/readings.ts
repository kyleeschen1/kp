import '../matrix-column-combinations/style.css';
import '../matrix-column-product/style.css';
import '../matrix-example-page.css';
import { matrixEnvironmentFromProduct } from '../matrix-column-product/environment.ts';
import { matrixColumnStory, timeline } from '../matrix-column-product/score.ts';
import { matrixStageHtml, mountMatrixColumnPresentation } from '../matrix-column-product/presentation.ts';
import { columnExampleFromProduct, durationMs } from '../matrix-column-combinations/model.ts';
import { stageHtml, mountPresentation } from '../matrix-column-combinations/presentation.ts';
import { createKpReaderTimelinePlaybackClock } from '../../reader/runtime/timeline-playback-clock.ts';
import type { CostProduct, MountedReading } from './cases.ts';

// A measurement host for the real adapters and clock. It adds no choreography.
// Rows/columns costs here exclude the standalone pages' controls and static prose.
export async function mount(root: HTMLElement, product: CostProduct, reading: 'rows' | 'columns', column: number): Promise<MountedReading> {
  root.classList.add('matrix-player');
  const story = matrixColumnStory(matrixEnvironmentFromProduct(product));
  const scene = columnExampleFromProduct(product, column);
  root.innerHTML = `<section class="matrix-card kp-focus-deck"><div class="matrix-scroll">${reading === 'rows' ? matrixStageHtml(story.state.env) : stageHtml(scene)}</div></section>`;
  await document.fonts.ready;
  const view = reading === 'rows' ? mountMatrixColumnPresentation(root, story) : mountPresentation(root, scene);
  const clock = createKpReaderTimelinePlaybackClock({ id: root.id, durationMs: reading === 'rows' ? timeline(story).duration : durationMs });
  const render = () => { view.render(clock.getSnapshot().progress); };
  const stop = clock.subscribe(render);
  render();
  let disposed = false;
  return {
    seek(progress) { clock.pause(); clock.seek(progress); },
    play() { clock.play({ direction: 'forward', stopAt: 1 }); },
    pause() { clock.pause(); },
    dispose() { if (!disposed) { disposed = true; stop(); clock.dispose(); view.dispose(); } },
  };
}

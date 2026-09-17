/** Publish the reading before synchronous native measurement consumes a task.
 * Abort also releases this wait when a hidden/disposed page stops frames. */
export function yieldDerivationPreparation(signal: AbortSignal, paintFirst: boolean): Promise<void> {
  return new Promise(resolve => {
    let frame = 0;
    const channel = new MessageChannel();
    const finish = () => {
      cancelAnimationFrame(frame); channel.port1.close(); channel.port2.close();
      signal.removeEventListener('abort', finish);
      resolve();
    };
    if (signal.aborted) { finish(); return; }
    signal.addEventListener('abort', finish, { once: true });
    channel.port1.onmessage = finish;
    // One first-paint boundary, then interruptible tasks between scenes. Avoid
    // a timer/frame round trip for every native measurement in the batch.
    if (paintFirst) frame = requestAnimationFrame(() => channel.port2.postMessage(null));
    else channel.port2.postMessage(null);
  });
}

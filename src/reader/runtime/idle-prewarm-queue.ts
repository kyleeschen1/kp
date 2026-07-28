export interface KpReaderIdleDeadline {
  readonly didTimeout: boolean;
  readonly timeRemaining: () => number;
}

export interface KpReaderIdlePrewarmClock {
  readonly request: (callback: (deadline: KpReaderIdleDeadline) => void) => number;
  readonly cancel: (requestId: number) => void;
}

export interface KpReaderIdlePrewarmTask {
  readonly id: string;
  readonly run: () => void;
}

export interface KpReaderIdlePrewarmQueue {
  readonly replace: (tasks: readonly KpReaderIdlePrewarmTask[]) => void;
  readonly cancel: () => void;
  readonly dispose: () => void;
}

export function createKpReaderIdlePrewarmQueue(input: {
  readonly clock: KpReaderIdlePrewarmClock;
  readonly maximumPending?: number | undefined;
}): KpReaderIdlePrewarmQueue {
  const maximumPending = input.maximumPending ?? 2;
  if (!Number.isSafeInteger(maximumPending) || maximumPending <= 0) {
    throw new Error("Reader idle prewarm requires a positive pending bound.");
  }
  let disposed = false;
  let requestId: number | undefined;
  let generation = 0;
  let pending: readonly KpReaderIdlePrewarmTask[] = [];

  const cancel = (): void => {
    generation += 1;
    pending = [];
    if (requestId !== undefined) input.clock.cancel(requestId);
    requestId = undefined;
  };
  const request = (): void => {
    if (disposed || requestId !== undefined || pending.length === 0) return;
    const requestedGeneration = generation;
    requestId = input.clock.request((deadline) => {
      requestId = undefined;
      if (disposed || requestedGeneration !== generation) return;
      // One bounded task may use a timed-out idle callback; otherwise leave
      // foreground frames alone until the browser exposes actual idle budget.
      if (!deadline.didTimeout && deadline.timeRemaining() <= 1) {
        request();
        return;
      }
      const [task, ...remaining] = pending;
      pending = remaining;
      task?.run();
      request();
    });
  };

  return {
    replace(tasks) {
      if (disposed) return;
      cancel();
      const ids = new Set<string>();
      pending = Object.freeze(tasks.filter(({ id }) => {
        if (ids.has(id)) return false;
        ids.add(id);
        return true;
      }).slice(0, maximumPending));
      request();
    },
    cancel,
    dispose() {
      if (disposed) return;
      cancel();
      disposed = true;
    }
  };
}


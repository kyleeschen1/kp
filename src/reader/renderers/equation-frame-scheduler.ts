export type KpReaderEquationLayoutInvalidationReason =
  | "mount"
  | "resize"
  | "fonts"
  | "content";

export interface KpReaderEquationFrameClock {
  request(callback: FrameRequestCallback): number;
  cancel(requestId: number): void;
}

export interface KpReaderEquationFrameSchedulerState {
  readonly disposed: boolean;
  readonly pending: boolean;
  readonly layoutRevision: number;
  readonly pendingInvalidationReasons: readonly KpReaderEquationLayoutInvalidationReason[];
  readonly readCount: number;
  readonly layoutPlanCount: number;
  readonly framePlanCount: number;
  readonly writeCount: number;
}

export interface KpReaderEquationFrameScheduler<TInput> {
  render(input: TInput): void;
  invalidate(reason: KpReaderEquationLayoutInvalidationReason): void;
  inspect(): KpReaderEquationFrameSchedulerState;
  dispose(): void;
}

export function createKpReaderEquationFrameScheduler<
  TInput,
  TLayout,
  TLayoutPlan,
  TFrame
>(input: {
  readonly readLayout: (request: {
    readonly revision: number;
    readonly reasons: readonly KpReaderEquationLayoutInvalidationReason[];
  }) => TLayout;
  readonly planLayout: (layout: TLayout) => TLayoutPlan;
  readonly planFrame: (request: {
    readonly input: TInput;
    readonly layout: TLayout;
    readonly layoutPlan: TLayoutPlan;
  }) => TFrame;
  readonly writeFrame: (frame: TFrame) => void;
  readonly frameClock?: KpReaderEquationFrameClock | undefined;
}): KpReaderEquationFrameScheduler<TInput> {
  const frameClock = input.frameClock ?? browserFrameClock();
  const invalidationReasons = new Set<KpReaderEquationLayoutInvalidationReason>([
    "mount"
  ]);
  let disposed = false;
  let scheduledRequestId: number | undefined;
  let latestInput: TInput | undefined;
  let inputRevision = 0;
  let layoutRevision = -1;
  let layout: TLayout | undefined;
  let layoutPlan: TLayoutPlan | undefined;
  let readCount = 0;
  let layoutPlanCount = 0;
  let framePlanCount = 0;
  let writeCount = 0;

  const schedule = (): void => {
    if (disposed || latestInput === undefined || scheduledRequestId !== undefined) {
      return;
    }
    scheduledRequestId = frameClock.request(flush);
  };

  const flush = (): void => {
    scheduledRequestId = undefined;
    if (disposed || latestInput === undefined) return;
    const renderInput = latestInput;
    const renderInputRevision = inputRevision;

    if (layout === undefined || layoutPlan === undefined || invalidationReasons.size > 0) {
      const reasons = [...invalidationReasons];
      invalidationReasons.clear();
      const nextRevision = layoutRevision + 1;
      try {
        // This is the only phase permitted to touch layout. Planning and
        // ordinary scroll frames consume the resulting immutable values.
        layout = input.readLayout({ revision: nextRevision, reasons });
        readCount += 1;
        layoutPlan = input.planLayout(layout);
        layoutPlanCount += 1;
        layoutRevision = nextRevision;
      } catch (error) {
        for (const reason of reasons) invalidationReasons.add(reason);
        throw error;
      }
    }

    const frame = input.planFrame({
      input: renderInput,
      layout,
      layoutPlan
    });
    framePlanCount += 1;
    input.writeFrame(frame);
    writeCount += 1;

    if (inputRevision !== renderInputRevision || invalidationReasons.size > 0) {
      schedule();
    }
  };

  return {
    render(renderInput) {
      if (disposed) throw new Error("Equation frame scheduler is disposed.");
      latestInput = renderInput;
      inputRevision += 1;
      schedule();
    },
    invalidate(reason) {
      if (disposed) return;
      invalidationReasons.add(reason);
      schedule();
    },
    inspect() {
      return {
        disposed,
        pending: scheduledRequestId !== undefined,
        layoutRevision,
        pendingInvalidationReasons: [...invalidationReasons],
        readCount,
        layoutPlanCount,
        framePlanCount,
        writeCount
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (scheduledRequestId !== undefined) {
        frameClock.cancel(scheduledRequestId);
        scheduledRequestId = undefined;
      }
      latestInput = undefined;
      layout = undefined;
      layoutPlan = undefined;
      invalidationReasons.clear();
    }
  };
}

function browserFrameClock(): KpReaderEquationFrameClock {
  return {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (requestId) => cancelAnimationFrame(requestId)
  };
}

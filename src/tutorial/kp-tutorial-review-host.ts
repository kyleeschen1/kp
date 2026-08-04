export type KpTutorialDevelopmentReviewClient =
  typeof import("../dev-review/tutorial-review-bootstrap.ts");

// Keep the DEV branch at module scope so production builds erase the review
// client and its persistence protocol rather than shipping dormant tooling.
const loadKpTutorialDevelopmentReview:
  | (() => Promise<KpTutorialDevelopmentReviewClient>)
  | undefined = import.meta.env.DEV
    ? () => import("../dev-review/tutorial-review-bootstrap.ts")
    : undefined;

export interface KpTutorialReviewHost {
  mount(): Promise<void>;
  dispose(): void;
}

export function createKpTutorialReviewHost(input: {
  readonly ownerWindow?: Window | undefined;
  readonly load?: (() => Promise<KpTutorialDevelopmentReviewClient>) | undefined;
} = {}): KpTutorialReviewHost {
  const ownerWindow = input.ownerWindow ?? window;
  const load = input.load ?? loadKpTutorialDevelopmentReview;
  let disposed = false;
  let disposeReview: (() => void) | undefined;
  let pending: Promise<void> | undefined;

  return Object.freeze({
    mount(): Promise<void> {
      if (disposed || disposeReview !== undefined || load === undefined) {
        return Promise.resolve();
      }
      return pending ??= load().then((client) => {
        if (!disposed && disposeReview === undefined) {
          disposeReview = client.mountKpTutorialDevReview(ownerWindow);
        }
      }).finally(() => {
        pending = undefined;
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      disposeReview?.();
      disposeReview = undefined;
    }
  });
}

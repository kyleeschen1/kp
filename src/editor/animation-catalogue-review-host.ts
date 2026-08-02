import {
  loadKpAnimationCatalogueDevelopmentReview,
  type KpAnimationCatalogueDevelopmentReviewClient
} from "./animation-catalogue-review-capture-loader.ts";

export interface KpAnimationCatalogueReviewHost {
  mount(): Promise<void>;
  dispose(): void;
}

export function createKpAnimationCatalogueReviewHost(input: {
  readonly ownerWindow?: Window | undefined;
  readonly load?:
    | (() => Promise<KpAnimationCatalogueDevelopmentReviewClient>)
    | undefined;
} = {}): KpAnimationCatalogueReviewHost {
  const ownerWindow = input.ownerWindow ?? window;
  const load = input.load ?? loadKpAnimationCatalogueDevelopmentReview;
  let disposed = false;
  let disposeReview: (() => void) | undefined;
  let pending: Promise<void> | undefined;

  const mount = (): Promise<void> => {
    if (disposed || disposeReview !== undefined || load === undefined) {
      return Promise.resolve();
    }
    return pending ??= (async () => {
      const client = await load();
      if (disposed || disposeReview !== undefined) return;
      // The provider resolves the selected shell at capture time. One mount
      // therefore preserves the draft while assets, players, and URLs change.
      disposeReview = client.mountKpAnimationCatalogueDevReview(ownerWindow);
    })().finally(() => {
      pending = undefined;
    });
  };

  return Object.freeze({
    mount,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeReview?.();
      disposeReview = undefined;
    }
  });
}

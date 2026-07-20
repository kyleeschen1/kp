import type {
  KpDevReviewRenderContextV1,
  KpDevReviewSemanticContextV1,
  KpDevReviewTemporalSampleV1
} from "../../protocols/dev-review-v1.ts";
import type { KpDevReviewPointerGeometry } from "./semantic-target.ts";

export interface KpDevReviewCaptureContext {
  readonly route: URL;
  readonly capturedAtMs: number;
  readonly eventTarget: EventTarget | null;
  readonly pointer?: KpDevReviewPointerGeometry | undefined;
}

export interface KpDevReviewProviderEvidence {
  readonly semantic: KpDevReviewSemanticContextV1;
  readonly render: KpDevReviewRenderContextV1;
  readonly temporalTrace: readonly KpDevReviewTemporalSampleV1[];
}

export interface KpDevReviewCaptureProvider {
  readonly id: string;
  readonly priority?: number | undefined;
  matches(context: KpDevReviewCaptureContext): boolean;
  capture(
    context: KpDevReviewCaptureContext
  ): KpDevReviewProviderEvidence | Promise<KpDevReviewProviderEvidence>;
}

export interface KpDevReviewProviderCapture {
  readonly providerId: string;
  readonly evidence: KpDevReviewProviderEvidence;
}

export class KpDevReviewCaptureProviderRegistry {
  #providers: KpDevReviewCaptureProvider[] = [];

  register(provider: KpDevReviewCaptureProvider): () => void {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(provider.id)) {
      throw new Error(`Invalid capture provider id ${provider.id}`);
    }
    if (this.#providers.some((candidate) => candidate.id === provider.id)) {
      throw new Error(`Duplicate capture provider ${provider.id}`);
    }
    this.#providers = [...this.#providers, provider].sort(
      (left, right) => (right.priority ?? 0) - (left.priority ?? 0)
    );
    return () => {
      this.#providers = this.#providers.filter((candidate) => candidate !== provider);
    };
  }

  async capture(context: KpDevReviewCaptureContext): Promise<KpDevReviewProviderCapture | undefined> {
    const provider = this.#providers.find((candidate) => candidate.matches(context));
    if (provider === undefined) return undefined;
    return {
      providerId: provider.id,
      evidence: await provider.capture(context)
    };
  }

  providerIds(): readonly string[] {
    return this.#providers.map((provider) => provider.id);
  }
}

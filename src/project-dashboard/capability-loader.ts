export interface KpProjectDashboardCapabilityLoader<Data, Renderer> {
  readonly loadData: () => Promise<Data>;
  readonly loadSelectedRenderer: () => Promise<Renderer>;
  readonly load: () => Promise<{
    readonly data: Data;
    readonly render: Renderer;
  }>;
}

export function createKpProjectDashboardCapabilityLoader<Data, Renderer>(
  input: {
    readonly importData: () => Promise<Data>;
    readonly importSelectedRenderer: () => Promise<Renderer>;
  }
): KpProjectDashboardCapabilityLoader<Data, Renderer> {
  let dataPromise: Promise<Data> | undefined;
  let rendererPromise: Promise<Renderer> | undefined;

  const loadData = (): Promise<Data> =>
    dataPromise ??= retryable(input.importData, () => {
      dataPromise = undefined;
    });
  const loadSelectedRenderer = async (): Promise<Renderer> => {
    // Data establishes the cheap discovery boundary before any showcase,
    // interpreter, KaTeX fixture, or renderer implementation is requested.
    await loadData();
    return rendererPromise ??= retryable(input.importSelectedRenderer, () => {
      rendererPromise = undefined;
    });
  };

  return Object.freeze({
    loadData,
    loadSelectedRenderer,
    async load() {
      const data = await loadData();
      const render = await loadSelectedRenderer();
      return Object.freeze({ data, render });
    }
  });
}

function retryable<T>(
  load: () => Promise<T>,
  reset: () => void
): Promise<T> {
  return load().catch((error: unknown) => {
    reset();
    throw error;
  });
}

export type KpDistributionAreaStateId = "factored" | "distributed" | "expanded";

export interface KpDistributionAreaLayoutRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpDistributionAreaAnchorMeasurement {
  readonly stateId: KpDistributionAreaStateId;
  readonly selectorId: string;
  readonly lineage: string;
  readonly rect: KpDistributionAreaLayoutRect;
}

export interface KpDistributionAreaMeasuredAnchor extends KpDistributionAreaAnchorMeasurement {
  readonly center: { readonly x: number; readonly y: number };
}

export interface KpDistributionAreaLayoutSnapshot {
  readonly id: string;
  readonly kind: "distribution-area-layout-snapshot";
  readonly revision: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly anchors: readonly KpDistributionAreaMeasuredAnchor[];
  anchor(stateId: KpDistributionAreaStateId, selectorSuffix: string): KpDistributionAreaMeasuredAnchor;
}

export type KpDistributionAreaWidthAnchorId =
  | "source.x" | "source.plus" | "source.two" | "target.x" | "target.two";

export interface KpDistributionAreaWidthLayoutSnapshot {
  readonly id: string;
  readonly revision: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly anchors: readonly (KpDistributionAreaMeasuredAnchor & { readonly selectorId: KpDistributionAreaWidthAnchorId })[];
  anchor(id: KpDistributionAreaWidthAnchorId): KpDistributionAreaMeasuredAnchor;
}

const requiredSuffixes: Readonly<Record<KpDistributionAreaStateId, readonly string[]>> = {
  factored: ["factor.3", "left-paren", "term.x", "plus", "term.2", "right-paren"],
  distributed: ["left.factor.3", "left.term.x", "plus", "right.factor.3", "right.times", "right.term.2"],
  expanded: ["left.factor.3", "left.term.x", "plus", "right.product.6"]
};

export function measureKpDistributionAreaLayout(input: {
  readonly algebraRoot: HTMLElement;
  readonly measurementRoot: HTMLElement;
  readonly revision: number;
}): KpDistributionAreaLayoutSnapshot {
  if (input.measurementRoot.getAttribute("aria-hidden") !== "true") {
    throw new Error("Distribution layout measurement root must be aria-hidden.");
  }
  const rootRect = domRect(input.algebraRoot.getBoundingClientRect());
  const measurements = [...input.measurementRoot.querySelectorAll<HTMLElement>(
    "[data-kp-distribution-anchor]"
  )].map((element): KpDistributionAreaAnchorMeasurement => {
    const state = element.closest<HTMLElement>("[data-kp-distribution-state]");
    const stateId = parseStateId(state?.dataset["kpDistributionState"]);
    const selectorId = requiredData(element, "kpDistributionAnchor");
    return {
      stateId,
      selectorId,
      lineage: requiredData(element, "kpLineage"),
      rect: domRect(element.getBoundingClientRect())
    };
  });
  return createKpDistributionAreaLayoutSnapshot({
    revision: input.revision,
    rootRect,
    measurements
  });
}

export function measureKpDistributionAreaWidthLayout(input: {
  readonly areaRoot: HTMLElement;
  readonly revision: number;
}): KpDistributionAreaWidthLayoutSnapshot {
  const rootRect = domRect(input.areaRoot.getBoundingClientRect());
  const measurements = [...input.areaRoot.querySelectorAll<HTMLElement>("[data-kp-area-width-anchor]")]
    .map((element): KpDistributionAreaAnchorMeasurement => ({
      stateId: "factored",
      selectorId: requiredData(element, "kpAreaWidthAnchor"),
      lineage: requiredData(element, "kpLineage"),
      rect: domRect(element.getBoundingClientRect())
    }));
  return createKpDistributionAreaWidthLayoutSnapshot({ revision: input.revision, rootRect, measurements });
}

export function createKpDistributionAreaWidthLayoutSnapshot(input: {
  readonly revision: number;
  readonly rootRect: KpDistributionAreaLayoutRect;
  readonly measurements: readonly KpDistributionAreaAnchorMeasurement[];
}): KpDistributionAreaWidthLayoutSnapshot {
  if (!Number.isInteger(input.revision) || input.revision < 0) {
    throw new Error("Distribution width layout revision must be a non-negative integer.");
  }
  assertRect(input.rootRect, "Distribution area root");
  const requiredIds: readonly KpDistributionAreaWidthAnchorId[] = [
    "source.x", "source.plus", "source.two", "target.x", "target.two"
  ];
  const byId = new Map<
    KpDistributionAreaWidthAnchorId,
    KpDistributionAreaMeasuredAnchor & { readonly selectorId: KpDistributionAreaWidthAnchorId }
  >();
  for (const measurement of input.measurements) {
    const id = parseWidthAnchorId(measurement.selectorId);
    assertRect(measurement.rect, `Distribution width anchor ${id}`);
    if (byId.has(id)) throw new Error(`Distribution width layout repeats anchor ${id}.`);
    const rect = localRect(measurement.rect, input.rootRect);
    byId.set(id, { ...measurement, selectorId: id, rect, center: {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    } });
  }
  for (const id of requiredIds) {
    if (!byId.has(id)) throw new Error(`Distribution width layout expected anchor ${id}.`);
  }
  const anchors = requiredIds.map((id) => byId.get(id)!);
  return {
    id: `layout.distribution-area-width.r${input.revision}`,
    revision: input.revision,
    viewport: { width: input.rootRect.width, height: input.rootRect.height },
    anchors,
    anchor(id) { return byId.get(id)!; }
  };
}

export function createKpDistributionAreaLayoutSnapshot(input: {
  readonly revision: number;
  readonly rootRect: KpDistributionAreaLayoutRect;
  readonly measurements: readonly KpDistributionAreaAnchorMeasurement[];
}): KpDistributionAreaLayoutSnapshot {
  if (!Number.isInteger(input.revision) || input.revision < 0) {
    throw new Error("Distribution layout revision must be a non-negative integer.");
  }
  assertRect(input.rootRect, "Distribution algebra root");
  const byKey = new Map<string, KpDistributionAreaMeasuredAnchor>();
  const anchors = input.measurements.map((measurement) => {
    assertRect(measurement.rect, `Distribution anchor ${measurement.selectorId}`);
    const rect = localRect(measurement.rect, input.rootRect);
    const anchor = {
      ...measurement,
      rect,
      center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    };
    const key = anchorKey(measurement.stateId, measurement.selectorId);
    if (byKey.has(key)) throw new Error(`Distribution layout repeats anchor ${key}.`);
    byKey.set(key, anchor);
    return anchor;
  });

  for (const [stateId, suffixes] of Object.entries(requiredSuffixes) as Array<
    [KpDistributionAreaStateId, readonly string[]]
  >) {
    for (const suffix of suffixes) {
      const matches = anchors.filter((anchor) =>
        anchor.stateId === stateId && anchor.selectorId.endsWith(`.${suffix}`)
      );
      if (matches.length !== 1) {
        throw new Error(`Distribution layout expected one ${stateId} anchor for ${suffix}.`);
      }
    }
  }

  return {
    id: `layout.distribution-area.r${input.revision}`,
    kind: "distribution-area-layout-snapshot",
    revision: input.revision,
    viewport: { width: input.rootRect.width, height: input.rootRect.height },
    anchors,
    anchor(stateId, selectorSuffix) {
      const matches = anchors.filter((candidate) =>
        candidate.stateId === stateId && candidate.selectorId.endsWith(`.${selectorSuffix}`)
      );
      if (matches.length !== 1) {
        throw new Error(`Distribution layout expected one ${stateId} anchor for ${selectorSuffix}.`);
      }
      return matches[0]!;
    }
  };
}

function parseStateId(value: string | undefined): KpDistributionAreaStateId {
  const suffix = value?.split(".state.").at(-1);
  if (suffix === "factored" || suffix === "distributed" || suffix === "expanded") return suffix;
  throw new Error(`Unknown distribution measurement state ${String(value)}.`);
}

function parseWidthAnchorId(value: string): KpDistributionAreaWidthAnchorId {
  if (value === "source.x" || value === "source.plus" || value === "source.two" || value === "target.x" || value === "target.two") return value;
  throw new Error(`Unknown distribution width anchor ${value}.`);
}

function anchorKey(stateId: KpDistributionAreaStateId, selectorId: string): string {
  return `${stateId}:${selectorId}`;
}

function localRect(rect: KpDistributionAreaLayoutRect, root: KpDistributionAreaLayoutRect): KpDistributionAreaLayoutRect {
  return { left: rect.left - root.left, top: rect.top - root.top, width: rect.width, height: rect.height };
}

function assertRect(rect: KpDistributionAreaLayoutRect, label: string): void {
  if (![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)) {
    throw new Error(`${label} must have finite geometry.`);
  }
  if (rect.width <= 0 || rect.height <= 0) throw new Error(`${label} must be measurably rendered.`);
}

function domRect(rect: DOMRect): KpDistributionAreaLayoutRect {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value.length === 0) throw new Error(`Distribution anchor is missing ${key}.`);
  return value;
}

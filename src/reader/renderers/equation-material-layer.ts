import type { KpReaderLayoutRect } from "./equation-layout-snapshot.ts";
import { cloneElementWithComputedStyles } from "../../rendering/computed-style-clone.ts";

export interface KpReaderEquationMaterialFragmentFrame {
  readonly id: string;
  readonly visualRevision: string;
  readonly sourceElement: HTMLElement;
  readonly rect: KpReaderLayoutRect;
}

export interface KpReaderEquationMaterialOwnerFrame {
  readonly ownerId: string;
  readonly rect: KpReaderLayoutRect;
  readonly translateX: number;
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly opacity: number;
  readonly focused: boolean;
  readonly fragments: readonly KpReaderEquationMaterialFragmentFrame[];
}

export interface KpReaderEquationMaterialLayerSyncResult {
  readonly createdOwnerIds: readonly string[];
  readonly retainedOwnerIds: readonly string[];
  readonly removedOwnerIds: readonly string[];
}

export interface KpReaderEquationMaterialLayer {
  sync(
    frames: readonly KpReaderEquationMaterialOwnerFrame[]
  ): KpReaderEquationMaterialLayerSyncResult;
  clear(): void;
  dispose(): void;
}

interface KpReaderMaterialOwnerDomRecord {
  readonly element: HTMLElement;
  readonly fragments: Map<string, KpReaderMaterialFragmentDomRecord>;
}

interface KpReaderMaterialFragmentDomRecord {
  readonly element: HTMLElement;
  visualRevision: string;
}

export function createKpReaderEquationMaterialLayer(
  layer: HTMLElement
): KpReaderEquationMaterialLayer {
  if (layer.dataset["kpReaderEquationMaterialLayer"] !== "true") {
    throw new Error("Equation material layer is missing its reader contract marker.");
  }
  layer.setAttribute("aria-hidden", "true");
  const ownerRecords = new Map<string, KpReaderMaterialOwnerDomRecord>();
  let disposed = false;

  const clear = (): void => {
    for (const record of ownerRecords.values()) record.element.remove();
    ownerRecords.clear();
  };

  return {
    sync(frames) {
      if (disposed) throw new Error("Equation material layer is disposed.");
      assertUniqueFrames(frames);
      const activeIds = new Set(frames.map((frame) => frame.ownerId));
      const removedOwnerIds: string[] = [];
      for (const [ownerId, record] of ownerRecords) {
        if (activeIds.has(ownerId)) continue;
        record.element.remove();
        ownerRecords.delete(ownerId);
        removedOwnerIds.push(ownerId);
      }

      const createdOwnerIds: string[] = [];
      const retainedOwnerIds: string[] = [];
      for (const frame of frames) {
        validateFrame(frame);
        let record = ownerRecords.get(frame.ownerId);
        if (record === undefined) {
          const element = layer.ownerDocument.createElement("span");
          element.className = "kp-reader-equation-material-owner";
          element.dataset["kpReaderEquationMaterialOwnerId"] = frame.ownerId;
          element.setAttribute("aria-hidden", "true");
          element.style.position = "absolute";
          element.style.pointerEvents = "none";
          element.style.transformOrigin = "0 0";
          layer.append(element);
          record = { element, fragments: new Map() };
          ownerRecords.set(frame.ownerId, record);
          createdOwnerIds.push(frame.ownerId);
        } else {
          retainedOwnerIds.push(frame.ownerId);
        }
        syncOwner(record, frame);
      }
      return { createdOwnerIds, retainedOwnerIds, removedOwnerIds };
    },
    clear,
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
    }
  };
}

function syncOwner(
  record: KpReaderMaterialOwnerDomRecord,
  frame: KpReaderEquationMaterialOwnerFrame
): void {
  const activeFragmentIds = new Set(frame.fragments.map((fragment) => fragment.id));
  for (const [fragmentId, fragmentRecord] of record.fragments) {
    if (activeFragmentIds.has(fragmentId)) continue;
    fragmentRecord.element.remove();
    record.fragments.delete(fragmentId);
  }
  assertUniqueFragmentIds(frame);
  for (const fragment of frame.fragments) {
    let fragmentRecord = record.fragments.get(fragment.id);
    if (fragmentRecord === undefined) {
      fragmentRecord = createFragmentRecord(record.element, fragment);
      record.fragments.set(fragment.id, fragmentRecord);
    } else if (fragmentRecord.visualRevision !== fragment.visualRevision) {
      replaceFragmentVisual(fragmentRecord, fragment);
    }
    positionFragment(fragmentRecord.element, frame.rect, fragment.rect);
  }

  const element = record.element;
  element.style.left = `${frame.rect.left}px`;
  element.style.top = `${frame.rect.top}px`;
  element.style.width = `${frame.rect.width}px`;
  element.style.height = `${frame.rect.height}px`;
  element.style.opacity = String(frame.opacity);
  element.style.transform =
    `translate3d(${frame.translateX}px, ${frame.translateY}px, 0) ` +
    `scale(${frame.scaleX}, ${frame.scaleY})`;
  element.classList.toggle("kp-reader-equation-material-owner--focused", frame.focused);
  element.dataset["kpReaderEquationMaterialFocused"] = String(frame.focused);
}

function createFragmentRecord(
  owner: HTMLElement,
  frame: KpReaderEquationMaterialFragmentFrame
): KpReaderMaterialFragmentDomRecord {
  const element = owner.ownerDocument.createElement("span");
  element.className = "kp-reader-equation-material-fragment";
  element.dataset["kpReaderEquationMaterialFragmentId"] = frame.id;
  element.style.position = "absolute";
  element.style.pointerEvents = "none";
  owner.append(element);
  const record = { element, visualRevision: frame.visualRevision };
  replaceFragmentVisual(record, frame);
  return record;
}

function replaceFragmentVisual(
  record: KpReaderMaterialFragmentDomRecord,
  frame: KpReaderEquationMaterialFragmentFrame
): void {
  const visual = cloneElementWithComputedStyles(frame.sourceElement);
  sanitizeVisualClone(visual);
  visual.classList.add("kp-reader-equation-material-visual");
  visual.style.visibility = "visible";
  visual.style.opacity = "1";
  visual.style.transform = "none";
  record.element.replaceChildren(visual);
  record.visualRevision = frame.visualRevision;
  record.element.dataset["kpReaderEquationMaterialVisualRevision"] =
    frame.visualRevision;
}

function sanitizeVisualClone(visual: HTMLElement): void {
  for (const element of [visual, ...visual.querySelectorAll<HTMLElement>("*")]) {
    element.removeAttribute("id");
    element.removeAttribute("aria-label");
    element.removeAttribute("data-kp-reader-equation-anchor-id");
  }
}

function positionFragment(
  element: HTMLElement,
  ownerRect: KpReaderLayoutRect,
  fragmentRect: KpReaderLayoutRect
): void {
  element.style.left = `${fragmentRect.left - ownerRect.left}px`;
  element.style.top = `${fragmentRect.top - ownerRect.top}px`;
  element.style.width = `${fragmentRect.width}px`;
  element.style.height = `${fragmentRect.height}px`;
}

function assertUniqueFrames(
  frames: readonly KpReaderEquationMaterialOwnerFrame[]
): void {
  const ids = new Set<string>();
  for (const frame of frames) {
    if (ids.has(frame.ownerId)) {
      throw new Error(`Equation material layer repeats owner ${frame.ownerId}.`);
    }
    ids.add(frame.ownerId);
  }
}

function assertUniqueFragmentIds(frame: KpReaderEquationMaterialOwnerFrame): void {
  const ids = new Set<string>();
  for (const fragment of frame.fragments) {
    if (ids.has(fragment.id)) {
      throw new Error(`Equation material owner ${frame.ownerId} repeats fragment ${fragment.id}.`);
    }
    ids.add(fragment.id);
  }
}

function validateFrame(frame: KpReaderEquationMaterialOwnerFrame): void {
  const values = [
    frame.rect.left,
    frame.rect.top,
    frame.rect.width,
    frame.rect.height,
    frame.translateX,
    frame.translateY,
    frame.scaleX,
    frame.scaleY,
    frame.opacity
  ];
  if (!values.every(Number.isFinite)) {
    throw new Error(`Equation material owner ${frame.ownerId} has non-finite presentation.`);
  }
  if (
    frame.rect.width <= 0 || frame.rect.height <= 0 ||
    frame.scaleX <= 0 || frame.scaleY <= 0 ||
    frame.opacity < 0 || frame.opacity > 1
  ) {
    throw new Error(`Equation material owner ${frame.ownerId} has invalid presentation bounds.`);
  }
  for (const fragment of frame.fragments) {
    if (
      ![
        fragment.rect.left,
        fragment.rect.top,
        fragment.rect.width,
        fragment.rect.height
      ].every(Number.isFinite) ||
      fragment.rect.width <= 0 || fragment.rect.height <= 0
    ) {
      throw new Error(`Equation material fragment ${fragment.id} has invalid geometry.`);
    }
  }
}

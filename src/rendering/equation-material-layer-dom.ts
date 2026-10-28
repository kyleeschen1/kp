import {
  cloneElementWithComputedStyles,
  makeKpMaterialOwnerInert,
  stripKpMaterialCloneAuthority
} from "./computed-style-clone.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-types.ts";

export type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-types.ts";

interface KpEquationMaterialLayerState {
  readonly owners: Map<string, HTMLElement>;
}

const materialLayerStates =
  new WeakMap<HTMLElement, KpEquationMaterialLayerState>();
const paintTemplates = new WeakMap<HTMLElement, Map<string, WeakMap<Element, HTMLElement | SVGElement>>>();
const materialVisualCaches = new WeakMap<
  HTMLElement,
  Map<string, {
    readonly sourceElement: HTMLElement | SVGElement;
    readonly visual: HTMLElement | SVGElement;
  }>
>();

/** Color-only emphasis can refresh inert paint without replacing measured
 * geometry. Presence, transforms and typography remain compositor-owned. */
export function refreshKpEquationMaterialNativeColors(stage: HTMLElement): boolean {
  const layer = stage.querySelector<HTMLElement>('[data-kp-editor-equation-material-layer]');
  const state = layer && materialLayerStates.get(layer);
  if (!state) return false;
  const view = stage.ownerDocument.defaultView;
  if (view === null) return false;
  const colors = ['color', 'border-top-color', 'border-right-color',
    'border-bottom-color', 'border-left-color', 'text-decoration-color', 'fill', 'stroke'] as const;
  const reads = new Map<Element, readonly string[]>();
  const writes: { element: HTMLElement | SVGElement; values: readonly string[] }[] = [];
  const collect = (source: Element, visual: Element) => {
    if (!(visual instanceof HTMLElement || visual instanceof SVGElement)) return;
    let values = reads.get(source);
    if (!values) {
      const style = view.getComputedStyle(source);
      values = colors.map(property => style.getPropertyValue(property));
      reads.set(source, values);
    }
    writes.push({ element: visual, values });
    if (source.children.length !== visual.children.length) {
      throw new Error('Native color refresh requires the original clone topology.');
    }
    for (let index = 0; index < source.children.length; index++) {
      collect(source.children[index]!, visual.children[index]!);
    }
  };
  for (const owner of state.owners.values()) {
    for (const { sourceElement, visual } of materialVisualCaches.get(owner)?.values() ?? []) {
      const source = sourceElement instanceof SVGElement && !(sourceElement instanceof SVGSVGElement)
        ? sourceElement.ownerSVGElement ?? sourceElement : sourceElement;
      collect(source, visual);
    }
  }
  // Read all native paint first; no geometry reads or read/write interleaving.
  for (const { element, values } of writes) {
    // Native interpolation owns this interval; a second transition would lag.
    const transitions = element.style.transitionProperty.split(',').map(value => value.trim());
    if (transitions.includes('color') || transitions.includes('all')) {
      element.style.transitionProperty = transitions.filter(value => value !== 'color' && value !== 'all').join(', ') || 'none';
    }
    colors.forEach((property, index) => {
      if (element.style.getPropertyValue(property) !== values[index]) {
        element.style.setProperty(property, values[index]!);
      }
    });
  }
  // Native focus can be a CSS color transition. Follow its realized paint for
  // that bounded interval; a one-time snapshot would freeze the old color.
  return stage.getAnimations({ subtree: true }).some(animation =>
    animation instanceof CSSTransition && animation.transitionProperty === 'color'
      && animation.playState === 'running' && animation.effect instanceof KeyframeEffect
      && animation.effect.target !== null && !layer.contains(animation.effect.target));
}

export function syncKpEquationMaterialLayer(input: {
  readonly stage: HTMLElement;
  readonly owners: readonly KpEquationMaterialLayerOwnerFrame[];
}): void {
  const layer = input.stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  );
  if (layer === null) {
    throw new Error("Equation stage is missing its persistent material layer.");
  }
  const state = materialLayerState(layer);
  const activeOwnerIds = new Set(input.owners.map((owner) => owner.ownerId));
  for (const [ownerId, owner] of state.owners) {
    if (activeOwnerIds.has(ownerId)) continue;
    owner.remove();
    state.owners.delete(ownerId);
  }

  for (const frame of input.owners) {
    let owner = state.owners.get(frame.ownerId);
    if (owner === undefined) {
      // The stage document is the authority because reader surfaces may live
      // in an iframe or a headless document with no matching global document.
      owner = input.stage.ownerDocument.createElement("span");
      owner.className = "editor-equation-stage__material-owner";
      owner.dataset["kpEquationMaterialOwnerId"] = frame.ownerId;
      // Geometry is a renderer contract; host CSS may choose only presentation.
      owner.style.position = "absolute";
      makeKpMaterialOwnerInert(owner);
      layer.append(owner);
      state.owners.set(frame.ownerId, owner);
    }
    const visual = setKpEquationMaterialOwnerVisual({
      owner,
      sourceElement: frame.sourceElement,
      revisionKey: `source:${frame.ownerId}`
    });
    if (visual instanceof HTMLElement) {
      // KaTeX rule bounds already include their border. Without border-box,
      // sizing the clone to its owner adds the border a second time and makes
      // rule paint one pixel taller than the sampled native endpoint.
      if (frame.fragmentRole?.startsWith("rule:") === true) {
        setStyle(visual.style, "boxSizing", "border-box");
        // Computed-style cloning freezes KaTeX rule widths in pixels. Rules
        // are structural paint, so let their measured owner drive length
        // during a semantic introduction instead of retaining the endpoint
        // width and then popping into place.
        setStyle(visual.style, "width", "100%");
        setStyle(visual.style, "transformOrigin", "center center");
      }
      const focused = frame.focus !== undefined || frame.sourceElement.classList.contains("kp-focus-group");
      if (visual.classList.contains("kp-focus-group") !== focused) {
        visual.classList.toggle("kp-focus-group", focused);
      }
      for (const property of [
        "--kp-focus-z",
        "--kp-focus-scale",
        "--kp-focus-outline-strength",
        "--kp-focus-shadow-y",
        "--kp-focus-shadow-blur",
        "--kp-focus-shadow-opacity",
        "--kp-focus-context-dimming"
      ]) {
        const value = frame.focus?.variables[property] ?? frame.sourceElement.style.getPropertyValue(property);
        if (visual.style.getPropertyValue(property) === value) continue;
        if (value === "") {
          visual.style.removeProperty(property);
        } else {
          visual.style.setProperty(property, value);
        }
      }
      setStyle(visual.style, "clipPath", frame.clipPath ?? "none");
      setStyle(visual.style, "transform", frame.visualTransform ?? "none");
    }
    setStyle(owner.style, "left", `${frame.rect.left}px`);
    setStyle(owner.style, "top", `${frame.rect.top}px`);
    setStyle(owner.style, "width", `${frame.rect.width}px`);
    setStyle(owner.style, "height", `${frame.rect.height}px`);
    setStyle(owner.style, "opacity", String(frame.opacity));
    setStyle(owner.style, "transform", frame.transform);
    setStyle(owner.style, "transformOrigin", "center center");
    setStyle(owner.style, "filter", frame.filter ?? "none");
    setOptionalDataset(
      owner,
      "kpEquationSemanticDepth",
      frame.semanticDepth
    );
    setDataset(
      owner,
      "kpEquationMaterialSourceMotionId",
      frame.sourceMotionId ?? frame.sourceElement.dataset["kpMotionId"] ?? ""
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialSemanticEntityId",
      frame.semanticEntityId
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialEndpointPaintAtomId",
      frame.endpointPaintAtomId
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialSemanticContacts",
      frame.semanticContacts === undefined
        ? undefined
        : JSON.stringify(frame.semanticContacts)
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialVerifiedOperationCohortId",
      frame.verifiedOperationCohortId
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialForegroundOcclusionId",
      frame.intentionalForegroundOcclusion?.id
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialForegroundOcclusionRole",
      frame.intentionalForegroundOcclusion?.role
    );
    setOptionalDataset(
      owner,
      "kpEquationMaterialFragmentRole",
      frame.fragmentRole
    );
    if (
      (frame.paintAlignmentRect === undefined) !==
        (frame.expectedPaintRect === undefined)
    ) {
      throw new Error(
        `Material owner ${frame.ownerId} must provide unscaled alignment and ` +
        "post-transform paint geometry together."
      );
    }
    const paintAlignmentRect = frame.paintAlignmentRect;
    if (paintAlignmentRect === undefined || !(visual instanceof HTMLElement)) {
      for (const key of [
        "kpEquationMaterialPaintAlignment",
        "kpEquationMaterialPaintAlignmentKey",
        "kpEquationMaterialPaintInsetX",
        "kpEquationMaterialPaintInsetY",
        "kpEquationMaterialExpectedPaintInsetX",
        "kpEquationMaterialExpectedPaintInsetY",
        "kpEquationMaterialExpectedPaintInsetRight",
        "kpEquationMaterialExpectedPaintInsetBottom"
      ]) setOptionalDataset(owner, key, undefined);
    } else {
      const alignmentKey = [
        owner.dataset["kpEquationMaterialVisualRevision"],
        frame.rect.width,
        frame.rect.height,
        paintAlignmentRect.width,
        paintAlignmentRect.height
      ].join(":");
      if (
        owner.dataset["kpEquationMaterialPaintAlignmentKey"] !== alignmentKey
      ) {
        // Motion transforms can begin at scale(0). Measure the clone in its
        // stable owner box so endpoint alignment does not cache a collapsed
        // first-frame rectangle as the clone's intrinsic paint inset.
        const motionTransform = owner.style.transform;
        setStyle(owner.style, "transform", "none");
        let measured;
        let nativePaint;
        try {
          measured = measureKpNativeKatexSubtreePaintRect(
            input.stage,
            visual
          );
          // Text clone fidelity follows native source ink; owner-sized rules
          // are checked against their moving expected geometry below.
          nativePaint = measureKpNativeKatexSubtreePaintRect(
            input.stage,
            frame.sourceElement
          );
        } finally {
          setStyle(owner.style, "transform", motionTransform || "none");
        }
        if (measured === undefined || nativePaint === undefined) {
          throw new Error(
            `Material owner ${frame.ownerId} has no measurable native clone.`
          );
        }
        const paintReference = frame.fragmentRole?.startsWith("rule:") === true
          ? paintAlignmentRect
          : nativePaint;
        const widthResidual = Math.abs(
          measured.width - paintReference.width
        );
        const heightResidual = Math.abs(
          measured.height - paintReference.height
        );
        if (widthResidual > 0.75 || heightResidual > 0.75) {
          throw new Error(
            `Material owner ${frame.ownerId} changed cloned paint size ` +
            `(${widthResidual.toFixed(2)}px × ${heightResidual.toFixed(2)}px; ` +
            `visual=${visual.style.transform}; owner=${frame.rect.width}; ` +
            `expected=${paintReference.width}; measured=${measured.width}).`
          );
        }
        setDataset(owner, "kpEquationMaterialPaintAlignmentKey", alignmentKey);
        setDataset(
          owner,
          "kpEquationMaterialPaintInsetX",
          String(measured.left - frame.rect.left)
        );
        setDataset(
          owner,
          "kpEquationMaterialPaintInsetY",
          String(measured.top - frame.rect.top)
        );
      }
      // Register the unscaled clone before applying its material transform.
      // Post-scale collision geometry is a different authority and must never
      // translate the owner as it contracts.
      const correctionX =
        paintAlignmentRect.left -
        frame.rect.left -
        Number(owner.dataset["kpEquationMaterialPaintInsetX"]);
      const correctionY =
        paintAlignmentRect.top -
        frame.rect.top -
        Number(owner.dataset["kpEquationMaterialPaintInsetY"]);
      const ownerLeft = frame.rect.left + correctionX;
      const ownerTop = frame.rect.top + correctionY;
      setStyle(owner.style, "left", `${ownerLeft}px`);
      setStyle(owner.style, "top", `${ownerTop}px`);
      // KaTeX wrapper centers are not reliable ink centers. Scaling around the
      // measured paint pivot prevents asymmetric glyphs from drifting.
      setStyle(
        owner.style,
        "transformOrigin",
        `${paintAlignmentRect.left + paintAlignmentRect.width / 2 - ownerLeft}px ` +
        `${paintAlignmentRect.top + paintAlignmentRect.height / 2 - ownerTop}px`
      );
      const expected = frame.expectedPaintRect ?? paintAlignmentRect;
      for (const [key, value] of [
        ["kpEquationMaterialExpectedPaintInsetX", expected.left - frame.rect.left],
        ["kpEquationMaterialExpectedPaintInsetY", expected.top - frame.rect.top],
        ["kpEquationMaterialExpectedPaintInsetRight",
          frame.rect.left + frame.rect.width - expected.left - expected.width],
        ["kpEquationMaterialExpectedPaintInsetBottom",
          frame.rect.top + frame.rect.height - expected.top - expected.height],
        ["kpEquationMaterialPaintAlignment", "measured-ink"]
      ] as const) setDataset(owner, key, String(value));
    }
  }
}

function materialLayerState(layer: HTMLElement): KpEquationMaterialLayerState {
  const existing = materialLayerStates.get(layer);
  if (existing !== undefined) return existing;
  const owners = new Map<string, HTMLElement>();
  for (const owner of layer.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    const ownerId = owner.dataset["kpEquationMaterialOwnerId"];
    if (ownerId !== undefined) owners.set(ownerId, owner);
  }
  const created = { owners };
  materialLayerStates.set(layer, created);
  return created;
}

function setDataset(
  element: HTMLElement,
  key: string,
  value: string
): void {
  if (element.dataset[key] !== value) element.dataset[key] = value;
}

function setOptionalDataset(
  element: HTMLElement,
  key: string,
  value: string | undefined
): void {
  if (value === undefined) {
    if (element.dataset[key] !== undefined) delete element.dataset[key];
  } else {
    setDataset(element, key, value);
  }
}

function setStyle(
  style: CSSStyleDeclaration,
  key:
    | "boxSizing"
    | "clipPath"
    | "filter"
    | "height"
    | "left"
    | "opacity"
    | "top"
    | "transform"
    | "transformOrigin"
    | "width",
  value: string
): void {
  if (style[key] !== value) style[key] = value;
}

export function setKpEquationMaterialOwnerVisual(input: {
  readonly owner: HTMLElement;
  readonly sourceElement: HTMLElement;
  readonly revisionKey: string;
}): HTMLElement | SVGElement {
  if (input.revisionKey.trim() === "") {
    throw new Error("Material visual revision key must be non-empty.");
  }
  const cacheEnabled = input.owner.closest(
    '[data-kp-equation-material-visual-cache="dual-revision"]'
  ) !== null;
  if (!cacheEnabled) {
    const current = input.owner.firstElementChild;
    if (
      current !== null &&
      input.owner.dataset["kpEquationMaterialVisualRevision"] ===
        input.revisionKey
    ) return current as HTMLElement | SVGElement;
    const visual = cloneKpEquationMaterialVisual(input.sourceElement);
    input.owner.replaceChildren(visual);
    input.owner.dataset["kpEquationMaterialVisualRevision"] =
      input.revisionKey;
    return visual;
  }
  const cache = materialVisualCache(input.owner);
  const cached = cache.get(input.revisionKey);
  if (cached?.sourceElement === input.sourceElement) {
    activateKpEquationMaterialOwnerVisual(input.owner, cached.visual);
    input.owner.dataset["kpEquationMaterialVisualRevision"] =
      input.revisionKey;
    return cached.visual;
  }
  if (cached !== undefined) {
    // Compound scenes may reuse a stable owner ID for a new native endpoint.
    // Revision labels alone cannot authorize paint reuse across that boundary.
    cached.visual.remove();
    cache.delete(input.revisionKey);
  }
  const stage = input.owner.closest<HTMLElement>("[data-kp-equation-material-paint-revision]");
  const revision = stage?.dataset["kpEquationMaterialPaintRevision"];
  let templates: WeakMap<Element, HTMLElement | SVGElement> | undefined;
  if (stage && revision) {
    let revisions = paintTemplates.get(stage);
    if (!revisions) { revisions = new Map(); paintTemplates.set(stage, revisions); }
    templates = revisions.get(revision);
    if (!templates) {
      templates = new WeakMap();
      revisions.set(revision, templates);
      // Retain only a bounded pair of attention states plus endpoint revisions.
      if (revisions.size > 4) revisions.delete(revisions.keys().next().value!);
    }
  }
  let template = templates?.get(input.sourceElement);
  if (!template) {
    template = cloneKpEquationMaterialVisual(input.sourceElement);
    templates?.set(input.sourceElement, template);
  }
  // Templates never enter paint; each live owner receives its own mutable copy.
  const visual = templates ? template.cloneNode(true) as HTMLElement | SVGElement : template;
  cache.set(input.revisionKey, {
    sourceElement: input.sourceElement,
    visual
  });
  input.owner.append(visual);
  activateKpEquationMaterialOwnerVisual(input.owner, visual);
  input.owner.dataset["kpEquationMaterialVisualRevision"] = input.revisionKey;
  const misses = Number(
    input.owner.dataset["kpEquationMaterialVisualCacheMissCount"] ?? "0"
  );
  input.owner.dataset["kpEquationMaterialVisualCacheMissCount"] =
    String(misses + 1);
  return visual;
}

function cloneKpEquationMaterialVisual(
  sourceElement: HTMLElement
): HTMLElement | SVGElement {
  // A detached SVG path has no paint context. Clone its owning SVG so
  // structural ink remains native and intact inside the material layer.
  const cloneSource =
    sourceElement instanceof SVGElement &&
      !(sourceElement instanceof SVGSVGElement)
      ? sourceElement.ownerSVGElement ?? sourceElement
      : sourceElement;
  const visual = cloneElementWithComputedStyles(cloneSource);
  stripKpMaterialCloneAuthority(visual);
  visual.style.opacity = "1";
  visual.style.transform = "none";
  visual.style.translate = "none";
  visual.style.scale = "none";
  visual.style.width = "100%";
  visual.style.height = "100%";
  // Ordinary paint needs visible ink overflow, while computed structural
  // clones retain any deliberate cropping from their source.
  visual.style.position = "relative";
  visual.style.display = "block";
  visual.classList.add("editor-equation-stage__material-visual");
  return visual;
}

function activateKpEquationMaterialOwnerVisual(
  owner: HTMLElement,
  active: HTMLElement | SVGElement
): void {
  for (const child of owner.children) {
    if (!(child instanceof HTMLElement || child instanceof SVGElement)) {
      continue;
    }
    const selected = child === active;
    child.style.display = selected ? "block" : "none";
    if (selected) {
      child.dataset["kpEquationMaterialVisualActive"] = "true";
    } else {
      delete child.dataset["kpEquationMaterialVisualActive"];
    }
  }
}

function materialVisualCache(
  owner: HTMLElement
): Map<string, {
  readonly sourceElement: HTMLElement | SVGElement;
  readonly visual: HTMLElement | SVGElement;
}> {
  const existing = materialVisualCaches.get(owner);
  if (existing !== undefined) return existing;
  // An explicitly opted-in exemplar may retain source and target typography
  // as distinct paint identities. General callers keep replacement semantics
  // until a second caller proves this cache boundary.
  const created = new Map<string, {
    readonly sourceElement: HTMLElement | SVGElement;
    readonly visual: HTMLElement | SVGElement;
  }>();
  materialVisualCaches.set(owner, created);
  return created;
}

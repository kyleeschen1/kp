import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationBalanceExemplar,
  type KpBalanceExactPartitionMotionIr,
  type KpBalanceOperationApplicationIr,
  type KpBalanceMatchedRemovalMotionIr,
  type KpBalanceMotionIr,
  type KpBalancePartitionGroupIr,
  type KpBalancePhysicalUnitIr,
  type KpBalanceSceneIr,
  type KpBalanceSideIr,
  type KpSymbolicOperationWindow
} from "../projections/public-api.ts";

import { applyConceptRoomTheme } from "./concept-room-theme-adapters.ts";
import {
  applyConceptRoomThemeRoles,
  linearEquationExemplarTheme,
  type KpConceptRoomStyleRole,
  type KpConceptRoomThemeShape
} from "./concept-room-theme.ts";

const svgNamespace = "http://www.w3.org/2000/svg";
const htmlNamespace = "http://www.w3.org/1999/xhtml";
const panCenters = { left: 200, right: 520 } as const;

export interface KpBalanceSceneController {
  render(progressPermille: number, focusSemanticIds?: readonly string[]): KpBalanceSceneIr;
  dispose(): void;
}

export function createBalanceSceneController(
  root: HTMLElement,
  trace: KpLinearEquationTrace,
  options: {
    readonly diagramSemanticId: string;
    readonly operationWindows?: readonly KpSymbolicOperationWindow[];
    readonly theme?: KpConceptRoomThemeShape;
  }
): KpBalanceSceneController {
  let disposed = false;
  return {
    render(progressPermille, focusSemanticIds = []) {
      if (disposed) throw new Error("Balance scene controller is disposed.");
      const projection = projectLinearEquationBalanceExemplar(trace, progressPermille, options);
      renderBalanceScene(root, projection, {
        focusSemanticIds,
        theme: options.theme ?? linearEquationExemplarTheme
      });
      return projection;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.replaceChildren();
    }
  };
}

export function renderBalanceScene(
  root: HTMLElement,
  projection: KpBalanceSceneIr,
  options: {
    readonly focusSemanticIds?: readonly string[];
    readonly theme?: KpConceptRoomThemeShape;
  } = {}
): void {
  const focusSemanticIds = new Set(options.focusSemanticIds ?? []);
  const theme = options.theme ?? linearEquationExemplarTheme;
  const stageRoot = document.createElement("div");
  stageRoot.dataset["kpBalanceStageRoot"] = "true";
  stageRoot.style.position = "relative";
  stageRoot.style.display = "grid";
  stageRoot.style.width = "100%";
  stageRoot.style.isolation = "isolate";
  applyConceptRoomTheme(stageRoot, theme);
  const svg = svgElement("svg");
  svg.dataset["kpBalanceScene"] = "true";
  svg.dataset["kpBalanceStage"] = projection.stage;
  svg.dataset["kpTraceId"] = projection.traceId;
  svg.dataset["kpFrameId"] = projection.frameId;
  svg.dataset["kpEquationSemanticId"] = projection.equationSemanticId;
  svg.dataset["kpDiagramSemanticId"] = projection.diagramSemanticId;
  svg.dataset["kpProgressPermille"] = String(projection.progressPermille);
  if (projection.motion !== undefined) {
    svg.dataset["kpBalanceMotionKind"] = projection.motion.kind;
    svg.dataset["kpBalanceMotionPhase"] = projection.motion.phase;
    svg.dataset["kpBalanceMotionOperationId"] = projection.motion.operationSemanticId;
    svg.dataset["kpBalanceBeamTiltDegrees"] = String(projection.motion.beamTiltDegrees);
    if (projection.motion.kind === "exact-partition") {
      svg.dataset["kpBalanceSharedRemainderUnitId"] = projection.motion.sharedRemainder.unitId;
      svg.dataset["kpBalancePhysicalCuttingAllowed"] = String(projection.motion.physicalCuttingAllowed);
      svg.dataset["kpBalanceRoundingAllowed"] = String(projection.motion.roundingAllowed);
    }
  }
  svg.setAttribute("viewBox", "0 0 720 390");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", projection.accessibleText);
  svg.style.position = "relative";
  svg.style.gridArea = "1 / 1";
  svg.style.zIndex = "1";
  applyConceptRoomTheme(svg, theme);
  applyConceptRoomThemeRoles(
    svg,
    rolesFor(projection.diagramSemanticId, "diagram.balance", focusSemanticIds),
    theme
  );

  const title = svgElement("title");
  title.textContent = projection.accessibleText;
  const description = svgElement("desc");
  description.textContent = accessibleGeometryDescription(projection);
  svg.append(title, description, structuralBalance());
  projection.operationApplications.forEach((application) => {
    svg.append(renderOperation(application, projection.motion, focusSemanticIds, theme));
  });
  const motionActive = projection.motion !== undefined &&
    projection.motion.phase !== "source" && projection.motion.phase !== "target" &&
    !prefersReducedMotion(root);
  if (motionActive) {
    svg.append(projection.motion!.kind === "matched-removal"
      ? renderMatchedRemovalSides(projection, projection.motion!, focusSemanticIds, theme)
      : renderExactPartitionMotion(projection, projection.motion!, focusSemanticIds, theme));
  } else if (projection.stage === "solved-partition") {
    svg.append(renderPartitionedSides(projection, focusSemanticIds, theme));
  } else {
    projection.sides.forEach((side) => {
      svg.append(renderPanSide(side, projection.physicalUnits, focusSemanticIds, theme));
    });
  }
  const supportOverlay = document.createElement("div");
  supportOverlay.dataset["kpBalanceSupportOverlay"] = "true";
  supportOverlay.setAttribute("aria-hidden", "true");
  supportOverlay.style.position = "relative";
  supportOverlay.style.gridArea = "1 / 1";
  supportOverlay.style.width = "100%";
  supportOverlay.style.aspectRatio = "720 / 390";
  supportOverlay.style.pointerEvents = "none";
  supportOverlay.style.zIndex = "2";
  supportOverlay.style.transform = "translate3d(0, 0, 1px)";
  supportOverlay.style.willChange = "transform";
  const supportSvg = svgElement("svg");
  supportSvg.setAttribute("viewBox", "0 0 720 390");
  supportSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  supportSvg.style.display = "block";
  supportSvg.style.width = "100%";
  supportSvg.style.height = "100%";
  supportSvg.append(centralSupport());
  supportOverlay.append(supportSvg);
  // Chrome composites SVG foreignObjects independently; an HTML stacking boundary keeps the support above math layers.
  stageRoot.append(svg, supportOverlay);
  root.replaceChildren(stageRoot);
}

function renderExactPartitionMotion(
  projection: KpBalanceSceneIr,
  motion: KpBalanceExactPartitionMotionIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const root = svgElement("g");
  root.dataset["kpBalanceExactPartition"] = "true";
  applyConceptRoomThemeRoles(
    root,
    rolesFor(motion.operationSemanticId, "equation.operation", focusSemanticIds),
    theme
  );
  const variableUnits = motion.groups.map((group) => requireUnit(projection, group.variableUnitId));
  const rightUnits = [
    ...motion.groups.flatMap((group) => group.wholeRightUnitIds.map((unitId) => requireUnit(projection, unitId))),
    requireUnit(projection, motion.sharedRemainder.unitId)
  ];
  const sourceLayouts = {
    left: rowLayout(variableUnits, panCenters.left),
    right: rowLayout(rightUnits, panCenters.right)
  } as const;
  const targetLayouts = new Map<string, { x: number; y: number; width: number; height: number }>();
  motion.groups.forEach((group) => {
    targetLayouts.set(group.variableUnitId, {
      x: group.groupIndex === 0 ? 144 : 208, y: 239, width: 48, height: 48
    });
    group.wholeRightUnitIds.forEach((unitId, index) => targetLayouts.set(unitId, {
      x: (group.groupIndex === 0 ? 427 : 571) + index * 29,
      y: 258,
      width: 24,
      height: 24
    }));
  });
  targetLayouts.set(motion.sharedRemainder.unitId, { x: 508, y: 258, width: 24, height: 24 });
  const phaseProgress = motion.phaseProgressPermille / 1000;
  const partitionProgress = motion.phase === "transform" ? easeInOut(phaseProgress) :
    motion.phase === "settle" ? 1 : 0;
  const guideProgress = motion.phase === "transform" ? smoothstep(.12, .82, phaseProgress) :
    motion.phase === "settle" ? 1 : 0;
  const shareProgress = motion.phase === "transform" ? smoothstep(.58, 1, phaseProgress) :
    motion.phase === "settle" ? 1 : 0;
  const selectionProgress = motion.phase === "settle" ? easeInOut(phaseProgress) : 0;

  const leftSide = svgElement("g");
  leftSide.dataset["kpBalanceSide"] = "left";
  leftSide.dataset["kpBalancePartitionMotionSide"] = "left";
  leftSide.setAttribute("role", "group");
  leftSide.setAttribute("aria-label", "left side divided into two exact groups");
  const variableGroup = semanticGroup(variableUnits[0]!.semanticId, "two x units divided into two groups",
    focusSemanticIds, theme);
  variableUnits.forEach((unit) => variableGroup.append(renderPartitionMotionUnit(
    unit,
    sourceLayouts.left.get(unit.id)!,
    targetLayouts.get(unit.id)!,
    partitionProgress,
    motion
  )));
  leftSide.append(variableGroup);

  const rightSide = svgElement("g");
  rightSide.dataset["kpBalanceSide"] = "right";
  rightSide.dataset["kpBalancePartitionMotionSide"] = "right";
  rightSide.setAttribute("role", "group");
  rightSide.setAttribute("aria-label", "right side divided into two exact groups with one whole shared remainder");
  const constantGroup = semanticGroup(rightUnits[0]!.semanticId,
    "five whole units divided exactly without cutting the remainder", focusSemanticIds, theme);
  rightUnits.forEach((unit) => constantGroup.append(renderPartitionMotionUnit(
    unit,
    sourceLayouts.right.get(unit.id)!,
    targetLayouts.get(unit.id)!,
    partitionProgress,
    motion
  )));
  rightSide.append(constantGroup);
  root.append(leftSide, rightSide);

  if (guideProgress > .001) {
    motion.groups.forEach((group) => {
      const guide = renderPartitionGuide(group, focusSemanticIds, theme, selectionProgress > .5);
      guide.dataset["kpBalancePartitionMotionGuide"] = group.id;
      guide.setAttribute("opacity", String(guideProgress));
      root.append(guide);
    });
  }
  if (shareProgress > .001) {
    const links = sharedRemainderLinks({ opacity: shareProgress, transientLabels: true });
    links.dataset["kpBalancePartitionMotionRemainder"] = motion.sharedRemainder.unitId;
    root.append(links);
  }
  if (selectionProgress > .001) {
    const result = mathLabel({
      x: 110, y: 142, width: 180, height: 48, latex: "x=\\frac{5}{2}",
      color: "var(--kp-concept-relation)", kind: "result"
    });
    result.dataset["kpBalancePartitionMotionResult"] = motion.selectedGroupId;
    result.style.opacity = String(selectionProgress);
    root.append(result);
  }
  return root;
}

function renderPartitionMotionUnit(
  unit: KpBalancePhysicalUnitIr,
  source: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  target: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  progress: number,
  motion: KpBalanceExactPartitionMotionIr
): SVGGElement {
  const isSharedRemainder = unit.id === motion.sharedRemainder.unitId;
  // The whole remainder changes horizontal order; a lifted lane prevents it from crossing another physical unit.
  const arcY = isSharedRemainder ? -56 * Math.sin(Math.PI * progress) : 0;
  const box = {
    x: source.x + (target.x - source.x) * progress,
    y: source.y + (target.y - source.y) * progress + arcY,
    width: source.width + (target.width - source.width) * progress,
    height: source.height + (target.height - source.height) * progress
  };
  const node = isSharedRemainder ? renderMovingIntegerUnit(unit, box) : renderUnit(unit, box);
  node.dataset["kpBalanceMotionRole"] = isSharedRemainder
    ? "unsplit-shared-remainder"
    : "partition-assignment-unit";
  node.dataset["kpOperationSemanticId"] = motion.operationSemanticId;
  node.dataset["kpBalancePartitionProgress"] = String(progress);
  node.dataset["kpBalancePartitionArcY"] = String(arcY);
  return node;
}

function renderMatchedRemovalSides(
  projection: KpBalanceSceneIr,
  motion: KpBalanceMatchedRemovalMotionIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const root = svgElement("g");
  root.dataset["kpBalanceMatchedRemoval"] = "true";
  const removedIds = new Set(motion.pairs.flatMap((pair) => [pair.leftUnitId, pair.rightUnitId]));
  const sourceBySide = {
    left: projection.physicalUnits.filter((unit) => unit.side === "left"),
    right: projection.physicalUnits.filter((unit) => unit.side === "right")
  } as const;
  const targetBySide = {
    left: sourceBySide.left.filter((unit) => !removedIds.has(unit.id)),
    right: sourceBySide.right.filter((unit) => !removedIds.has(unit.id))
  } as const;
  const phaseProgress = motion.phaseProgressPermille / 1000;
  const removalProgress = motion.phase === "transform" ? easeInOut(phaseProgress) :
    motion.phase === "settle" ? 1 : 0;
  // Reflow waits for settle so paired removal remains the sole causal act during transformation.
  const reflowProgress = motion.phase === "settle" ? easeInOut(phaseProgress) : 0;

  (["left", "right"] as const).forEach((side) => {
    const sideGroup = svgElement("g");
    sideGroup.dataset["kpBalanceSide"] = side;
    sideGroup.dataset["kpBalanceMotionSide"] = side;
    sideGroup.setAttribute("role", "group");
    sideGroup.setAttribute("aria-label", `${side} side of the matched removal`);
    const sourceLayout = rowLayout(sourceBySide[side], panCenters[side]);
    const targetLayout = rowLayout(targetBySide[side], panCenters[side]);
    const termGroups = new Map<string, SVGGElement>();
    sourceBySide[side].forEach((unit) => {
      let termGroup = termGroups.get(unit.semanticId);
      if (termGroup === undefined) {
        termGroup = semanticGroup(unit.semanticId, unit.kind === "variable-unit" ? "x units" : "unit weights",
          focusSemanticIds, theme);
        termGroups.set(unit.semanticId, termGroup);
        sideGroup.append(termGroup);
      }
      const sourceBox = sourceLayout.get(unit.id)!;
      let renderedBox = sourceBox;
      let removalPair: KpBalanceMatchedRemovalMotionIr["pairs"][number] | undefined;
      let removalX = 0;
      let removalY = 0;
      if (removedIds.has(unit.id)) {
        removalPair = motion.pairs.find((candidate) =>
          candidate.leftUnitId === unit.id || candidate.rightUnitId === unit.id
        )!;
        const direction = side === "left" ? 1 : -1;
        removalX = direction * 52 * removalProgress;
        removalY = -96 * removalProgress;
        renderedBox = {
          ...sourceBox,
          x: sourceBox.x + removalX,
          y: sourceBox.y + removalY
        };
      } else {
        const targetBox = targetLayout.get(unit.id)!;
        renderedBox = {
          ...sourceBox,
          x: sourceBox.x + (targetBox.x - sourceBox.x) * reflowProgress,
          y: sourceBox.y + (targetBox.y - sourceBox.y) * reflowProgress
        };
      }
      const unitNode = removalPair === undefined
        ? renderUnit(unit, renderedBox)
        : renderMovingIntegerUnit(unit, renderedBox);
      if (removalPair !== undefined) {
        const removalOpacity = 1 - smoothstep(0.62, 1, removalProgress);
        // Retired copies leave the tree so focus semantics and the per-frame object budget stay exact.
        if (removalOpacity <= .001) return;
        unitNode.dataset["kpBalanceMotionRole"] = "matched-removal-unit";
        unitNode.dataset["kpBalanceRemovalPair"] = removalPair.id;
        unitNode.dataset["kpBalanceRemovalPairIndex"] = String(removalPair.pairIndex);
        unitNode.dataset["kpBalanceTranslationX"] = String(removalX);
        unitNode.dataset["kpBalanceTranslationY"] = String(removalY);
        unitNode.dataset["kpOperationSemanticId"] = motion.operationSemanticId;
        unitNode.setAttribute("opacity", String(removalOpacity));
        applyConceptRoomThemeRoles(
          unitNode,
          rolesFor(motion.operationSemanticId, "equation.operation", focusSemanticIds),
          theme
        );
      } else {
        unitNode.dataset["kpBalanceMotionRole"] = "persistent-balance-unit";
      }
      termGroup.append(unitNode);
    });
    root.append(sideGroup);
  });
  return root;
}

function structuralBalance(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceStructure"] = "true";
  group.setAttribute("aria-hidden", "true");

  const beam = svgElement("line");
  beam.dataset["kpBalanceBeam"] = "true";
  setAttributes(beam, {
    x1: "92", x2: "628", y1: "214", y2: "214",
    stroke: "var(--kp-concept-line)", "stroke-width": "4", "stroke-linecap": "round"
  });
  group.append(beam, pan("left"), pan("right"));
  return group;
}

function centralSupport(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceCentralSupport"] = "true";
  group.setAttribute("aria-hidden", "true");
  const pivot = svgElement("circle");
  pivot.dataset["kpBalancePivot"] = "true";
  setAttributes(pivot, {
    cx: "360", cy: "214", r: "7", fill: "var(--kp-concept-relation)"
  });
  const fulcrum = svgElement("path");
  fulcrum.dataset["kpBalanceSupport"] = "fulcrum";
  setAttributes(fulcrum, {
    d: "M 360 222 L 322 338 Q 360 348 398 338 Z",
    fill: "var(--kp-concept-surface)", stroke: "var(--kp-concept-line)", "stroke-width": "3",
    "stroke-linejoin": "round"
  });
  const base = svgElement("line");
  base.dataset["kpBalanceSupport"] = "base";
  setAttributes(base, {
    x1: "304", x2: "416", y1: "342", y2: "342",
    stroke: "var(--kp-concept-line)", "stroke-width": "4", "stroke-linecap": "round"
  });
  group.append(fulcrum, base, pivot);
  return group;
}

function pan(side: "left" | "right"): SVGGElement {
  const center = panCenters[side];
  const group = svgElement("g");
  group.dataset["kpBalancePan"] = side;
  const hanger = svgElement("path");
  setAttributes(hanger, {
    d: `M ${center} 218 L ${center - 112} 302 M ${center} 218 L ${center + 112} 302`,
    fill: "none", stroke: "var(--kp-concept-line)", "stroke-width": "1.5", "stroke-linecap": "round"
  });
  const bowl = svgElement("path");
  setAttributes(bowl, {
    d: `M ${center - 112} 302 Q ${center} 329 ${center + 112} 302`,
    fill: "none", stroke: "var(--kp-concept-line)", "stroke-width": "3", "stroke-linecap": "round"
  });
  const pin = svgElement("circle");
  setAttributes(pin, {
    cx: String(center), cy: "214", r: "4", fill: "var(--kp-concept-line)"
  });
  group.append(hanger, bowl, pin);
  return group;
}

function renderPanSide(
  side: KpBalanceSideIr,
  units: readonly KpBalancePhysicalUnitIr[],
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceSide"] = side.side;
  group.dataset["kpBalanceSideId"] = side.id;
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", `${side.side} side: ${side.accessibleText}`);
  const present = units.filter((unit) =>
    unit.placement.kind === "pan" && unit.placement.side === side.side
  );
  const layout = rowLayout(present, panCenters[side.side]);
  const terms = new Map<string, KpBalancePhysicalUnitIr[]>();
  present.forEach((unit) => terms.set(unit.semanticId, [...(terms.get(unit.semanticId) ?? []), unit]));
  for (const [semanticId, termUnits] of terms) {
    const term = side.terms.find((candidate) => candidate.semanticId === semanticId);
    const termGroup = semanticGroup(semanticId, term?.spoken ?? "weight", focusSemanticIds, theme);
    termUnits.forEach((unit) => termGroup.append(renderUnit(unit, layout.get(unit.id)!)));
    group.append(termGroup);
  }
  return group;
}

function renderPartitionedSides(
  projection: KpBalanceSceneIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const root = svgElement("g");
  root.dataset["kpBalancePartition"] = "true";
  projection.sides.forEach((side) => {
    const sideGroup = svgElement("g");
    sideGroup.dataset["kpBalanceSide"] = side.side;
    sideGroup.dataset["kpBalanceSideId"] = side.id;
    sideGroup.setAttribute("role", "group");
    sideGroup.setAttribute("aria-label", `${side.side} side: ${side.accessibleText}`);
    root.append(sideGroup);
  });

  const variableSemanticId = projection.sides[0].terms[0]!.semanticId;
  const constantSemanticId = projection.sides[1].terms[0]!.semanticId;
  const variableGroup = semanticGroup(variableSemanticId, "two x units divided into two groups", focusSemanticIds, theme);
  const constantGroup = semanticGroup(constantSemanticId, "five unit weights divided exactly into two groups", focusSemanticIds, theme);
  root.append(variableGroup, constantGroup);

  for (const group of projection.partitionGroups) {
    const groupNode = renderPartitionGuide(group, focusSemanticIds, theme);
    root.append(groupNode);
    const variable = requireUnit(projection, group.variableUnitId);
    const variableX = group.groupIndex === 0 ? 144 : 208;
    variableGroup.append(renderUnit(variable, { x: variableX, y: 239, width: 48, height: 48 }));
    group.wholeRightUnitIds.forEach((unitId, index) => {
      const unit = requireUnit(projection, unitId);
      const baseX = group.groupIndex === 0 ? 427 : 571;
      constantGroup.append(renderUnit(unit, { x: baseX + index * 29, y: 258, width: 24, height: 24 }));
    });
  }

  const remainder = requireUnit(projection, projection.partitionGroups[0]!.sharedRemainder.unitId);
  constantGroup.append(renderUnit(remainder, { x: 508, y: 258, width: 24, height: 24 }));
  root.append(sharedRemainderLinks(), mathLabel({
    x: 110, y: 142, width: 180, height: 48, latex: "x=\\frac{5}{2}",
    color: "var(--kp-concept-relation)", kind: "result"
  }));
  return root;
}

function renderPartitionGuide(
  group: KpBalancePartitionGroupIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape,
  selectionVisible = true
): SVGGElement {
  const node = svgElement("g");
  node.dataset["kpBalancePartitionGroup"] = group.id;
  node.dataset["kpBalancePartitionGroupIndex"] = String(group.groupIndex);
  applyConceptRoomThemeRoles(
    node,
    rolesFor(group.operationSemanticId, "equation.operation", focusSemanticIds),
    theme
  );
  const leftGuide = svgElement("rect");
  const rightGuide = svgElement("rect");
  const leftX = group.groupIndex === 0 ? 136 : 200;
  const rightX = group.groupIndex === 0 ? 419 : 563;
  const selected = group.selectedAsRepresentative && selectionVisible;
  node.dataset["kpBalancePartitionSelected"] = String(selected);
  [leftGuide, rightGuide].forEach((guide) => {
    guide.dataset["kpBalanceGroupGuide"] = "true";
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", selected
      ? "var(--kp-concept-relation)"
      : "var(--kp-concept-line)");
    guide.setAttribute("stroke-width", selected ? "2" : "1.5");
    guide.setAttribute("stroke-dasharray", selected ? "none" : "5 5");
    guide.setAttribute("rx", "10");
  });
  setAttributes(leftGuide, { x: String(leftX), y: "231", width: "64", height: "64" });
  setAttributes(rightGuide, { x: String(rightX), y: "249", width: "82", height: "42" });
  node.append(leftGuide, rightGuide);
  return node;
}

function sharedRemainderLinks(options: {
  readonly opacity?: number;
  readonly transientLabels?: boolean;
} = {}): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceSharedRemainder"] = "true";
  group.setAttribute("aria-hidden", "true");
  const left = svgElement("path");
  const right = svgElement("path");
  setAttributes(left, {
    d: "M 520 254 Q 503 232 482 247", fill: "none", stroke: "var(--kp-concept-accent)",
    "stroke-width": "1.5", "stroke-dasharray": "3 4"
  });
  setAttributes(right, {
    d: "M 520 254 Q 537 232 558 247", fill: "none", stroke: "var(--kp-concept-accent)",
    "stroke-width": "1.5", "stroke-dasharray": "3 4"
  });
  const opacity = options.opacity ?? 1;
  left.setAttribute("opacity", String(opacity));
  right.setAttribute("opacity", String(opacity));
  const leftLabel = options.transientLabels === true
    ? transientHalfLabel(494)
    : mathLabel({
      x: 474, y: 218, width: 40, height: 32, latex: "\\frac12",
      color: "var(--kp-concept-accent)", kind: "share"
    });
  const rightLabel = options.transientLabels === true
    ? transientHalfLabel(546)
    : mathLabel({
      x: 526, y: 218, width: 40, height: 32, latex: "\\frac12",
      color: "var(--kp-concept-accent)", kind: "share"
    });
  leftLabel.dataset["kpBalanceSymbolicHalfShare"] = "true";
  rightLabel.dataset["kpBalanceSymbolicHalfShare"] = "true";
  leftLabel.style.opacity = String(opacity);
  rightLabel.style.opacity = String(opacity);
  group.append(left, right, leftLabel, rightLabel);
  return group;
}

function transientHalfLabel(x: number): SVGTextElement {
  // Transient SVG labels avoid Chrome's foreignObject compositor bug; the settled fraction remains KaTeX.
  const label = svgElement("text");
  setAttributes(label, {
    x: String(x), y: "239",
    fill: "var(--kp-concept-accent)",
    "font-family": "KaTeX_Main, serif",
    "font-size": "16",
    "text-anchor": "middle"
  });
  label.textContent = "½";
  return label;
}

function renderOperation(
  application: KpBalanceOperationApplicationIr,
  motion: KpBalanceMotionIr | undefined,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGElement {
  if (motion?.kind === "exact-partition") {
    const phaseProgress = motion.phaseProgressPermille / 1000;
    const opacity = motion.phase === "introduce-operation" ? easeInOut(phaseProgress) :
      motion.phase === "settle" ? 1 - easeInOut(phaseProgress) : 1;
    const label = svgElement("text");
    label.dataset["kpBalanceOperationApplication"] = application.id;
    label.dataset["kpOperationSemanticId"] = application.operationSemanticId;
    label.dataset["kpBalanceSide"] = application.side;
    label.dataset["kpBalanceTransientOperationLabel"] = "true";
    setAttributes(label, {
      x: String(application.side === "left" ? 200 : 520),
      y: String(89 - (1 - opacity) * 8),
      fill: "var(--kp-concept-accent)",
      opacity: String(opacity),
      "font-family": "KaTeX_Main, serif",
      "font-size": "16",
      "text-anchor": "middle",
      "dominant-baseline": "central"
    });
    label.textContent = "÷2";
    applyConceptRoomThemeRoles(
      label,
      rolesFor(application.operationSemanticId, "equation.operation", focusSemanticIds),
      theme
    );
    return label;
  }
  const label = mathLabel({
    x: application.side === "left" ? 158 : 478,
    y: 68,
    width: 84,
    height: 42,
    latex: application.kind === "subtract-both-sides" ? "-3" : "\\div 2",
    color: "var(--kp-concept-accent)",
    kind: "operation"
  });
  label.dataset["kpBalanceOperationApplication"] = application.id;
  label.dataset["kpOperationSemanticId"] = application.operationSemanticId;
  label.dataset["kpBalanceSide"] = application.side;
  applyConceptRoomThemeRoles(
    label,
    rolesFor(application.operationSemanticId, "equation.operation", focusSemanticIds),
    theme
  );
  if (motion !== undefined) {
    const phaseProgress = motion.phaseProgressPermille / 1000;
    const opacity = motion.phase === "introduce-operation" ? easeInOut(phaseProgress) :
      motion.phase === "settle" ? 1 - easeInOut(phaseProgress) : 1;
    label.style.opacity = String(opacity);
    label.style.transform = `translateY(${(1 - opacity) * -8}px)`;
  }
  return label;
}

function semanticGroup(
  semanticId: string,
  spoken: string,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceTermGroup"] = "true";
  group.dataset["kpSemanticId"] = semanticId;
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", spoken);
  applyConceptRoomThemeRoles(group, rolesFor(semanticId, "equation.expression", focusSemanticIds), theme);
  return group;
}

function renderUnit(
  unit: KpBalancePhysicalUnitIr,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
): SVGGElement {
  const group = unitGroup(unit);
  const shape = unitShape(unit, box);
  const label = mathLabel({
    ...box,
    latex: unit.latex,
    color: unit.kind === "variable-unit" ? "var(--kp-concept-variable)" : "var(--kp-concept-ink)",
    kind: unit.kind === "variable-unit" ? "variable" : "unit"
  });
  group.append(shape, label);
  return group;
}

function renderMovingIntegerUnit(
  unit: KpBalancePhysicalUnitIr,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
): SVGGElement {
  if (unit.kind !== "integer-unit") throw new Error("Matched subtraction can move only integer units.");
  const group = unitGroup(unit);
  // Moving foreignObjects can erase sibling SVG layers in Chrome; this transient numeral uses KaTeX's own font.
  const label = svgElement("text");
  label.dataset["kpBalanceMotionLabel"] = "unit";
  setAttributes(label, {
    x: String(box.x + box.width / 2),
    y: String(box.y + box.height / 2),
    fill: "var(--kp-concept-ink)",
    "font-family": "KaTeX_Main, serif",
    "font-size": "13",
    "text-anchor": "middle",
    "dominant-baseline": "central"
  });
  label.textContent = unit.latex;
  group.append(unitShape(unit, box), label);
  return group;
}

function unitGroup(unit: KpBalancePhysicalUnitIr): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceUnit"] = unit.id;
  group.dataset["kpBalanceUnitKind"] = unit.kind;
  group.dataset["kpBalanceUnitOrdinal"] = String(unit.ordinal);
  group.setAttribute("aria-hidden", "true");
  return group;
}

function unitShape(
  unit: KpBalancePhysicalUnitIr,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
): SVGRectElement {
  const shape = svgElement("rect");
  shape.dataset["kpBalanceObjectShape"] = "true";
  setAttributes(shape, {
    x: String(box.x), y: String(box.y), width: String(box.width), height: String(box.height),
    rx: unit.kind === "variable-unit" ? "10" : "7",
    fill: unit.kind === "variable-unit" ? "var(--kp-concept-surface)" : "var(--kp-concept-unit)",
    "fill-opacity": unit.kind === "variable-unit" ? "1" : ".14",
    stroke: unit.kind === "variable-unit" ? "var(--kp-concept-variable)" : "var(--kp-concept-unit)",
    "stroke-width": unit.kind === "variable-unit" ? "2.5" : "2"
  });
  return shape;
}

function rowLayout(
  units: readonly KpBalancePhysicalUnitIr[],
  center: number
): ReadonlyMap<string, { x: number; y: number; width: number; height: number }> {
  const gap = 8;
  const widths = units.map((unit) => unit.kind === "variable-unit" ? 48 : 24);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, units.length - 1) * gap;
  let cursor = center - totalWidth / 2;
  return new Map(units.map((unit, index) => {
    const width = widths[index]!;
    const height = unit.kind === "variable-unit" ? 48 : 24;
    const box = { x: cursor, y: 287 - height, width, height };
    cursor += width + gap;
    return [unit.id, box] as const;
  }));
}

function easeInOut(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = Math.max(0, Math.min(1, (value - start) / Math.max(.0001, end - start)));
  return progress * progress * (3 - 2 * progress);
}

function prefersReducedMotion(root: HTMLElement): boolean {
  return root.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
}

function mathLabel(input: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly latex: string;
  readonly color: string;
  readonly kind: "variable" | "unit" | "operation" | "share" | "result";
}): SVGForeignObjectElement {
  const foreignObject = svgElement("foreignObject");
  foreignObject.dataset["kpBalanceMathLabel"] = input.kind;
  setAttributes(foreignObject, {
    x: String(input.x), y: String(input.y), width: String(input.width), height: String(input.height)
  });
  const math = document.createElementNS(htmlNamespace, "span");
  math.setAttribute("aria-hidden", "true");
  math.style.display = "grid";
  math.style.placeItems = "center";
  math.style.width = "100%";
  math.style.height = "100%";
  math.style.color = input.color;
  katex.render(input.latex, math, {
    displayMode: false,
    output: "htmlAndMathml",
    throwOnError: true,
    trust: false
  });
  foreignObject.append(math);
  return foreignObject;
}

function requireUnit(projection: KpBalanceSceneIr, unitId: string): KpBalancePhysicalUnitIr {
  const unit = projection.physicalUnits.find((candidate) => candidate.id === unitId);
  if (unit === undefined) throw new Error(`Balance partition references missing physical unit ${unitId}.`);
  return unit;
}

function accessibleGeometryDescription(projection: KpBalanceSceneIr): string {
  switch (projection.stage) {
    case "initial":
      return "Two x blocks and three unit weights balance eight unit weights.";
    case "after-subtraction":
      return "Three matched unit pairs have been removed, leaving two x blocks balanced with five unit weights.";
    case "solved-partition":
      return "The two x blocks and five unit weights form two equal groups. One whole remainder stays unsplit and contributes one symbolic half to each group, so x equals five halves.";
  }
}

function rolesFor(
  semanticId: string,
  baseRole: KpConceptRoomStyleRole,
  focusSemanticIds: ReadonlySet<string>
): KpConceptRoomStyleRole[] {
  return focusSemanticIds.has(semanticId) ? [baseRole, "focus.primary"] : [baseRole];
}

function setAttributes(element: Element, attributes: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

function svgElement<TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
): SVGElementTagNameMap[TagName] {
  return document.createElementNS(svgNamespace, tagName);
}

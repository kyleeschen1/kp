import {
  createKpSuccessorSynthesisPlan,
  sampleKpSuccessorSynthesis,
  type KpSuccessorSynthesisBinding,
  type KpSuccessorSynthesisFrame,
  type KpSuccessorSynthesisPose
} from "../animation/successor-synthesis.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import type {
  KpSelectorAnnotatedLatex
} from "../rendering/selector-annotated-latex.ts";

export interface KpOperationEvaluationReferenceComparisonSession {
  readonly root: HTMLElement;
  readonly currentStageHost: HTMLElement;
  bindCurrentStage(stage: HTMLElement): void;
  apply(progress: number): void;
  dispose(): void;
}

interface ReferenceMember {
  readonly element: HTMLElement;
  readonly width: number;
  readonly height: number;
}

interface ReferenceMemberGroup {
  readonly members: readonly ReferenceMember[];
}

/**
 * Development-only review harness. It deliberately reuses the existing player
 * clock and historical pure sampler; it is not another production renderer.
 */
export function mountKpOperationEvaluationReferenceComparison(input: {
  readonly slot: HTMLElement;
  readonly source: readonly KpSelectorAnnotatedLatex[];
  readonly target: readonly KpSelectorAnnotatedLatex[];
  readonly synthesis: KpSuccessorSynthesisBinding;
  readonly measurementHostId: string;
}): KpOperationEvaluationReferenceComparisonSession {
  const document = input.slot.ownerDocument;
  const root = document.createElement("section");
  root.className = "kp-operation-evaluation-comparison";
  root.dataset["kpOperationEvaluationReferenceComparison"] = "";
  root.dataset["kpOperationEvaluationPrimaryCandidate"] =
    "opaque-gather-and-recognize-v1";
  root.innerHTML = `
    <header class="kp-operation-evaluation-comparison__header">
      <p class="kp-operation-evaluation-comparison__eyebrow">
        Proposed canonical checkpoint
      </p>
      <h3>Gather, combine, and recognize</h3>
      <p>
        Review one corrected candidate: every contributor stays opaque while
        motion and scale carry the evaluation into its native result.
      </p>
    </header>
    <div class="kp-operation-evaluation-comparison__panels">
      <figure class="kp-operation-evaluation-comparison__panel"
        data-kp-operation-evaluation-primary-panel
        data-kp-operation-evaluation-reference-panel>
        <figcaption>
          <strong>Proposed canonical candidate</strong>
          <span>Opaque contributors · exact native endpoints</span>
        </figcaption>
        <div class="kp-operation-evaluation-stage
          kp-operation-evaluation-reference-stage"
          data-kp-operation-evaluation-reference-stage
          aria-label="Historical operation evaluation choreography">
          <div class="kp-operation-evaluation-stage__endpoint"
            data-kp-operation-evaluation-reference-source aria-hidden="true">
          </div>
          <div class="kp-operation-evaluation-stage__endpoint"
            data-kp-operation-evaluation-reference-target aria-hidden="true">
          </div>
        </div>
        ${telemetryMarkup("reference")}
      </figure>
    </div>
    <button class="kp-operation-evaluation-comparison__diagnostic-toggle"
      type="button"
      data-action="toggle-operation-evaluation-diagnostic"
      aria-expanded="false">
      Show rejected runtime diagnostic
    </button>
    <div class="kp-operation-evaluation-comparison__diagnostic"
      data-kp-operation-evaluation-diagnostic
      data-kp-operation-evaluation-diagnostic-open="false"
      aria-hidden="true">
      <figure class="kp-operation-evaluation-comparison__panel"
        data-kp-operation-evaluation-current-panel>
          <figcaption>
            <strong>Rejected zero-area runtime</strong>
            <span>Retained for diagnosis, not product selection</span>
          </figcaption>
          <div data-kp-operation-evaluation-current-stage-host></div>
          ${telemetryMarkup("current")}
        </figure>
    </div>`;
  const referenceStage = required(
    root,
    "[data-kp-operation-evaluation-reference-stage]"
  );
  const referenceSource = required(
    root,
    "[data-kp-operation-evaluation-reference-source]"
  );
  const referenceTarget = required(
    root,
    "[data-kp-operation-evaluation-reference-target]"
  );
  referenceSource.innerHTML = input.source.map((state) =>
    renderSelectorAnnotatedLatexToHtml(state)
  ).join("");
  referenceTarget.innerHTML = input.target.map((state) =>
    renderSelectorAnnotatedLatexToHtml(state)
  ).join("");
  bindMotionIds(referenceSource, input.source);
  bindMotionIds(referenceTarget, input.target);

  const currentStageHost = required(
    root,
    "[data-kp-operation-evaluation-current-stage-host]"
  );
  currentStageHost.dataset["kpOperationEvaluationMeasurementHostId"] =
    input.measurementHostId;
  input.slot.replaceChildren(root);
  const diagnostic = required(
    root,
    "[data-kp-operation-evaluation-diagnostic]"
  );
  const diagnosticToggle = required(
    root,
    "[data-action=\"toggle-operation-evaluation-diagnostic\"]"
  );
  diagnosticToggle.addEventListener("click", () => {
    const open =
      diagnostic.dataset["kpOperationEvaluationDiagnosticOpen"] !== "true";
    diagnostic.dataset["kpOperationEvaluationDiagnosticOpen"] =
      String(open);
    diagnostic.setAttribute("aria-hidden", String(!open));
    diagnosticToggle.setAttribute("aria-expanded", String(open));
    diagnosticToggle.textContent = open
      ? "Hide rejected runtime diagnostic"
      : "Show rejected runtime diagnostic";
  });

  let currentStage: HTMLElement | undefined;
  let reference:
    | {
        readonly sourceMembers: ReadonlyMap<string, ReferenceMemberGroup>;
        readonly targetMembers: ReadonlyMap<string, ReferenceMemberGroup>;
        readonly plan: ReturnType<typeof createKpSuccessorSynthesisPlan>;
        readonly typography: string;
      }
    | undefined;
  let pendingProgress = 0;
  let disposed = false;
  return {
    root,
    currentStageHost,
    bindCurrentStage(stage) {
      if (disposed) return;
      if (stage.parentElement !== currentStageHost) {
        throw new Error(
          "Operation evaluation must be mounted in its final host before " +
          "native paint is measured."
        );
      }
      currentStage = stage;
      const sourceMembers = resolveMemberGroups(
        referenceSource,
        input.synthesis.sourceAnnotations
      );
      const targetMembers = resolveMemberGroups(
        referenceTarget,
        input.synthesis.targetAnnotations
      );
      const measurements = Object.fromEntries([
        ...input.synthesis.sourceAnnotations.map((annotation) => [
          annotation.id,
          unionMemberRects(
            requiredGroup(sourceMembers, annotation.id).members
          )
        ]),
        ...input.synthesis.targetAnnotations.map((annotation) => [
          annotation.id,
          unionMemberRects(
            requiredGroup(targetMembers, annotation.id).members
          )
        ])
      ]);
      reference = {
        sourceMembers,
        targetMembers,
        plan: createKpSuccessorSynthesisPlan({
          id: `reference.${input.synthesis.id}`,
          authority: input.synthesis.authority,
          sourceAnnotations: input.synthesis.sourceAnnotations,
          targetAnnotations: input.synthesis.targetAnnotations,
          lineages: input.synthesis.lineages,
          measurements
        }),
        typography: typographyFingerprint([
          ...sourceMembers.values(),
          ...targetMembers.values()
        ].flatMap(({ members }) =>
          members.map(({ element }) => element)
        ))
      };
      referenceStage.dataset["kpOperationEvaluationStatus"] = "ready";
      referenceStage.dataset["kpOperationEvaluationPresentationMode"] =
        "opaque-gather-and-recognize";
      this.apply(pendingProgress);
    },
    apply(progress) {
      pendingProgress = progress;
      if (
        disposed ||
        reference === undefined ||
        currentStage === undefined
      ) {
        return;
      }
      referenceStage.dataset["kpOperationEvaluationMappedProgress"] =
        String(progress);
      referenceStage.dataset["kpOperationEvaluationBoundarySide"] =
        progress < 0.7 ? "source" : "target";
      const frame = sampleOpaqueGatherAndRecognize({
        plan: reference.plan,
        progress
      });
      applyReferenceFrame(
        frame,
        reference.sourceMembers,
        reference.targetMembers
      );
      syncReferenceTelemetry(
        root,
        frame,
        reference.sourceMembers,
        reference.targetMembers,
        reference.typography
      );
      syncCurrentTelemetry(root, currentStage, progress);
    },
    dispose() {
      disposed = true;
      root.remove();
    }
  };
}

function sampleOpaqueGatherAndRecognize(input: {
  readonly plan: ReturnType<typeof createKpSuccessorSynthesisPlan>;
  readonly progress: number;
}): KpSuccessorSynthesisFrame {
  const frame = sampleKpSuccessorSynthesis(input);
  return {
    ...frame,
    sources: frame.sources.map((source) => {
      const gatheredScale = source.contribution === "catalyst"
        ? 1 - 0.32 * source.activationProgress
        : source.pose.scale;
      return {
        ...source,
        pose: {
          ...source.pose,
          scale: gatheredScale * (1 - source.retirementProgress),
          opacity: source.retirementProgress >= 1 ? 0 : 1
        }
      };
    }),
    targets: frame.targets.map((target) => ({
      ...target,
      pose: {
        ...target.pose,
        scale: target.birthProgress,
        opacity: target.birthProgress > 0 ? 1 : 0
      }
    }))
  };
}

function telemetryMarkup(side: "reference" | "current"): string {
  return `
    <dl class="kp-operation-evaluation-comparison__telemetry"
      data-kp-operation-evaluation-${side}-telemetry>
      <div><dt>Phase</dt><dd data-kp-comparison-phase>preparing</dd></div>
      <div><dt>Paint owner</dt><dd data-kp-comparison-owner>preparing</dd></div>
      <div><dt>Ink estimate</dt><dd data-kp-comparison-ink>—</dd></div>
      <div><dt>Typography</dt><dd data-kp-comparison-typography>—</dd></div>
      <div><dt>Endpoint</dt><dd data-kp-comparison-endpoint>—</dd></div>
    </dl>`;
}

function bindMotionIds(
  root: HTMLElement,
  states: readonly KpSelectorAnnotatedLatex[]
): void {
  for (const annotation of states.flatMap(({ annotations }) => annotations)) {
    const element = root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(
        `Reference comparison omitted selector ${annotation.selectorId}.`
      );
    }
    element.dataset["kpSemanticSelectorId"] = annotation.selectorId;
    element.style.transformOrigin = "center";
    element.style.willChange = "opacity, transform";
  }
}

function resolveMemberGroups(
  root: HTMLElement,
  annotations: KpSuccessorSynthesisBinding[
    "sourceAnnotations" | "targetAnnotations"
  ]
): ReadonlyMap<string, ReferenceMemberGroup> {
  return new Map(annotations.map((annotation) => {
    const members = annotation.selectorIds.map((selectorId) => {
      const element = root.querySelector<HTMLElement>(
        `[data-kp-semantic-selector-id="${CSS.escape(selectorId)}"]`
      );
      if (element === null) {
        throw new Error(
          `Reference comparison cannot bind selector ${selectorId}.`
        );
      }
      const rect = element.getBoundingClientRect();
      return { element, width: rect.width, height: rect.height };
    });
    return [annotation.id, { members }] as const;
  }));
}

function unionMemberRects(
  members: readonly ReferenceMember[]
): { readonly left: number; readonly top: number;
  readonly width: number; readonly height: number } {
  const rects = members.map(({ element }) => element.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { left, top, width: right - left, height: bottom - top };
}

function applyReferenceFrame(
  frame: KpSuccessorSynthesisFrame,
  sourceMembers: ReadonlyMap<string, ReferenceMemberGroup>,
  targetMembers: ReadonlyMap<string, ReferenceMemberGroup>
): void {
  for (const source of frame.sources) {
    applyPose(requiredGroup(sourceMembers, source.annotationId), source.pose);
  }
  for (const target of frame.targets) {
    applyPose(requiredGroup(targetMembers, target.annotationId), target.pose);
  }
}

function applyPose(
  group: ReferenceMemberGroup,
  pose: KpSuccessorSynthesisPose
): void {
  for (const { element } of group.members) {
    element.style.opacity = String(pose.opacity);
    element.style.transform =
      `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})`;
  }
}

function syncReferenceTelemetry(
  root: HTMLElement,
  frame: KpSuccessorSynthesisFrame,
  sourceMembers: ReadonlyMap<string, ReferenceMemberGroup>,
  targetMembers: ReadonlyMap<string, ReferenceMemberGroup>,
  typography: string
): void {
  const sourceVisible = frame.sources.some(({ pose }) => pose.opacity > 0.01);
  const targetVisible = frame.targets.some(({ pose }) => pose.opacity > 0.01);
  const ink = [
    ...frame.sources.map(({ annotationId, pose }) =>
      poseInk(requiredGroup(sourceMembers, annotationId), pose)
    ),
    ...frame.targets.map(({ annotationId, pose }) =>
      poseInk(requiredGroup(targetMembers, annotationId), pose)
    )
  ].reduce((sum, area) => sum + area, 0);
  writeTelemetry(root, "reference", {
    phase: frame.phase,
    owner: ownerLabel(sourceVisible, targetVisible),
    ink: `${Math.round(ink)} px² est.`,
    typography,
    endpoint: referenceEndpointStatus(frame)
  });
  root.dataset["kpOperationEvaluationReferencePhase"] = frame.phase;
  root.dataset["kpOperationEvaluationReferencePaintOwner"] =
    ownerLabel(sourceVisible, targetVisible);
}

function syncCurrentTelemetry(
  root: HTMLElement,
  stage: HTMLElement,
  progress: number
): void {
  const source = required(stage, "[data-kp-operation-evaluation-source]");
  const target = required(stage, "[data-kp-operation-evaluation-target]");
  const material = [...stage.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )];
  const sourceVisible = isVisible(source);
  const targetVisible = isVisible(target);
  const materialVisible = material.some(isVisible);
  const visible = [source, target, ...material].filter(isVisible);
  const owner = materialVisible
    ? "material layer"
    : ownerLabel(sourceVisible, targetVisible);
  const phase = progress < 0.7
    ? "contract to zero"
    : progress === 0.7
      ? "zero-area junction"
      : "expand from zero";
  const endpoint = progress <= 0
    ? sourceVisible && !materialVisible ? "native source" : "residual paint"
    : progress >= 1
      ? targetVisible && !materialVisible ? "native target" : "residual paint"
      : "in flight";
  writeTelemetry(root, "current", {
    phase,
    owner,
    ink: `${Math.round(visible.reduce((sum, element) => {
      const rect = element.getBoundingClientRect();
      return sum + rect.width * rect.height *
        Number(getComputedStyle(element).opacity);
    }, 0))} px² est.`,
    typography: typographyFingerprint(visible),
    endpoint
  });
  root.dataset["kpOperationEvaluationCurrentPhase"] = phase;
  root.dataset["kpOperationEvaluationCurrentPaintOwner"] = owner;
}

function poseInk(
  group: ReferenceMemberGroup,
  pose: KpSuccessorSynthesisPose
): number {
  return group.members.reduce((sum, member) =>
    sum + member.width * member.height *
      pose.scale * pose.scale * pose.opacity, 0);
}

function referenceEndpointStatus(frame: KpSuccessorSynthesisFrame): string {
  if (frame.progress <= 0) {
    return frame.sources.every(({ pose }) => isIdentityPose(pose)) &&
      frame.targets.every(({ pose }) => pose.opacity === 0)
      ? "native source pose"
      : "source residual";
  }
  if (frame.progress >= 1) {
    return frame.sources.every(({ pose }) => pose.opacity === 0) &&
      frame.targets.every(({ pose }) => isIdentityPose(pose))
      ? "native target pose"
      : "target residual";
  }
  return "in flight";
}

function isIdentityPose(pose: KpSuccessorSynthesisPose): boolean {
  return pose.x === 0 && pose.y === 0 && pose.scale === 1 &&
    pose.opacity === 1;
}

function isVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0.01 &&
    rect.width * rect.height > 0.01;
}

function typographyFingerprint(elements: readonly HTMLElement[]): string {
  const fingerprints = new Set(elements.map((element) => {
    const paint = element.querySelector<HTMLElement>(".katex") ?? element;
    const style = getComputedStyle(paint);
    return `${style.fontFamily} · ${style.fontSize}`;
  }));
  return [...fingerprints].join(" / ") || "no visible paint";
}

function ownerLabel(source: boolean, target: boolean): string {
  return source && target
    ? "source + target"
    : source
      ? "source"
      : target
        ? "target"
        : "empty";
}

function writeTelemetry(
  root: HTMLElement,
  side: "reference" | "current",
  values: {
    readonly phase: string;
    readonly owner: string;
    readonly ink: string;
    readonly typography: string;
    readonly endpoint: string;
  }
): void {
  const telemetry = required(
    root,
    `[data-kp-operation-evaluation-${side}-telemetry]`
  );
  for (const [key, value] of Object.entries(values)) {
    required(telemetry, `[data-kp-comparison-${key}]`).textContent = value;
  }
}

function requiredGroup(
  groups: ReadonlyMap<string, ReferenceMemberGroup>,
  id: string
): ReferenceMemberGroup {
  const group = groups.get(id);
  if (group === undefined) {
    throw new Error(`Reference comparison is missing annotation ${id}.`);
  }
  return group;
}

function required(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Operation evaluation comparison is missing ${selector}.`);
  }
  return element;
}

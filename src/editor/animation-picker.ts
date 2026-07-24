import {
  dispatchKpEditorAnimationSurface
} from "./animation-surface-dispatch.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export interface KpEditorAnimationPickerOption {
  readonly id: string;
  readonly descriptorId: string;
  readonly animationId: string;
  readonly label: string;
  readonly index: number;
  readonly selected: boolean;
}

export interface KpEditorAnimationPickerGroup {
  readonly id: string;
  readonly label: string;
  readonly options: readonly KpEditorAnimationPickerOption[];
}

export interface KpEditorAnimationPickerModel {
  readonly selectedDescriptorId: string | undefined;
  readonly groups: readonly KpEditorAnimationPickerGroup[];
  readonly optionCount: number;
}

const GROUP_ORDER = [
  "algebra",
  "calculus",
  "linear-algebra",
  "equation",
  "diagram",
  "graph",
  "programming",
  "composite",
  "unsupported"
] as const;

export function createKpEditorAnimationPickerModel(input: {
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly selectedDescriptorId?: string | undefined;
}): KpEditorAnimationPickerModel {
  assertUniqueDescriptorIds(input.descriptors);
  const requested = input.descriptors.find(
    (descriptor) => descriptor.id === input.selectedDescriptorId
  );
  const canonicalDescriptors = collapseCanonicalAnimationDescriptors(
    input.descriptors,
    requested
  );
  const selectedDescriptorId =
    requested?.id ?? canonicalDescriptors[0]?.id;
  const options = canonicalDescriptors.map((descriptor, index) => ({
    id: `editor-animation-picker-option.${descriptor.id}`,
    descriptorId: descriptor.id,
    animationId: descriptor.animationId,
    label: descriptor.title,
    index,
    selected: descriptor.id === selectedDescriptorId
  }));

  return {
    selectedDescriptorId,
    groups: GROUP_ORDER.flatMap((groupId) => {
      const groupOptions = options.filter((option) => {
        const descriptor = canonicalDescriptors[option.index]!;
        return pickerGroupId(descriptor) === groupId;
      });

      return groupOptions.length === 0
        ? []
        : [{
            id: groupId,
            label: pickerGroupLabel(groupId),
            options: groupOptions
          }];
    }),
    optionCount: options.length
  };
}

function collapseCanonicalAnimationDescriptors(
  descriptors: readonly KpEditorAnimationDescriptor[],
  requested: KpEditorAnimationDescriptor | undefined
): readonly KpEditorAnimationDescriptor[] {
  const grouped = new Map<string, KpEditorAnimationDescriptor[]>();
  for (const descriptor of descriptors) {
    const group = grouped.get(descriptor.animationId) ?? [];
    group.push(descriptor);
    grouped.set(descriptor.animationId, group);
  }

  return [...grouped.values()].map((group) => {
    if (
      requested !== undefined &&
      requested.animationId === group[0]!.animationId
    ) {
      // A direct legacy route remains exactly resolvable, but it does not add a
      // second option for the same canonical animation to ordinary discovery.
      return requested;
    }
    return [...group].sort(
      (left, right) =>
        Number(right.familyId !== undefined) -
          Number(left.familyId !== undefined) ||
        left.id.localeCompare(right.id)
    )[0]!;
  });
}

export function renderKpEditorAnimationPicker(
  model: KpEditorAnimationPickerModel
): string {
  return `
    <label class="equation-motion__selector" data-kp-editor-animation-selector>
      <span>Animation library</span>
      <select data-action="set-editor-animation" aria-label="Select editor animation">
        ${model.groups.map((group) => `
          <optgroup label="${escapeHtml(group.label)}">
            ${group.options.map((option) =>
              `<option value="${escapeHtml(option.descriptorId)}"${option.selected ? " selected" : ""}>${escapeHtml(option.label)}</option>`
            ).join("")}
          </optgroup>
        `).join("")}
      </select>
    </label>
    <div class="equation-motion__keyboard-picker" data-kp-editor-animation-picker role="listbox" aria-label="Editor animation picker" hidden>
      ${model.groups.map((group) => `
        <div data-kp-editor-animation-picker-group="${escapeHtml(group.id)}" role="group" aria-label="${escapeHtml(group.label)}">
          ${group.options.map((option) =>
            `<div class="equation-motion__keyboard-picker-option" id="${escapeHtml(option.id)}" data-kp-editor-animation-picker-option data-kp-editor-animation-descriptor-id="${escapeHtml(option.descriptorId)}" data-kp-editor-animation-id="${escapeHtml(option.animationId)}" data-kp-editor-animation-index="${option.index}" role="option" aria-selected="${option.selected ? "true" : "false"}">${escapeHtml(option.label)}</div>`
          ).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function pickerGroupId(descriptor: KpEditorAnimationDescriptor): string {
  if (descriptor.domain !== undefined && descriptor.domain !== "graph") {
    return descriptor.domain;
  }

  const surfaceKind = dispatchKpEditorAnimationSurface(descriptor).kind;
  return descriptor.domain === "graph" ? "graph" : surfaceKind;
}

function pickerGroupLabel(groupId: string): string {
  switch (groupId) {
    case "algebra": return "Algebra";
    case "calculus": return "Calculus";
    case "linear-algebra": return "Linear algebra";
    case "equation": return "Equation catalog";
    case "diagram": return "Diagram catalog";
    case "graph": return "Graph catalog";
    case "programming": return "Programming catalog";
    case "composite": return "Composite catalog";
    case "unsupported": return "Unavailable";
    default: return groupId;
  }
}

function assertUniqueDescriptorIds(
  descriptors: readonly KpEditorAnimationDescriptor[]
): void {
  const seen = new Set<string>();

  descriptors.forEach((descriptor) => {
    if (seen.has(descriptor.id)) {
      throw new Error(`Duplicate editor animation descriptor id: ${descriptor.id}`);
    }
    seen.add(descriptor.id);
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

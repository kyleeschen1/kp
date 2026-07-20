import type {
  KpEditorAnimationPickerModel
} from "./animation-picker.ts";

export interface KpEditorAnimationPickerSurfaceIdentity {
  readonly surfaceId: string;
  readonly providerId: string;
}

export interface KpEditorAnimationPickerRow {
  readonly id: string;
  readonly label: string;
  readonly fields: Readonly<{
    animationId: string;
    groupId: string;
  }>;
}

export interface KpEditorAnimationPickerProtocolState
  extends KpEditorAnimationPickerSurfaceIdentity {
  readonly promptLabel: string;
  readonly query: string;
  readonly rows: readonly KpEditorAnimationPickerRow[];
  readonly cursorIndex: number;
  readonly cursorRowId?: string;
}

export type KpEditorAnimationPickerNavigationCommand =
  | "cursor.first"
  | "cursor.previous"
  | "cursor.next"
  | "cursor.last";

export type KpEditorAnimationPickerSelectionOutcome =
  | { readonly kind: "accepted"; readonly rowIds: readonly string[] }
  | { readonly kind: "no-selection" }
  | { readonly kind: "cancelled" };

export type KpEditorAnimationPickerSelectionIntent =
  KpEditorAnimationPickerSurfaceIdentity &
  KpEditorAnimationPickerSelectionOutcome & {
    readonly query: string;
    readonly command: "row.accept" | "row.cancel";
    readonly key?: string;
  };

const KP_EDITOR_ANIMATION_PICKER_IDENTITY = {
  surfaceId: "kp.editor.animation-picker",
  providerId: "kp.editor.animation-descriptors"
} as const;

export function createKpEditorAnimationPickerProtocolState(
  model: KpEditorAnimationPickerModel,
  options: {
    readonly cursorDescriptorId?: string;
    readonly query?: string;
  } = {}
): KpEditorAnimationPickerProtocolState {
  const rows = model.groups.flatMap((group) => group.options.map((option) => ({
    id: option.descriptorId,
    label: option.label,
    fields: {
      animationId: option.animationId,
      groupId: group.id
    }
  })));
  const requestedCursorId = options.cursorDescriptorId ?? model.selectedDescriptorId;
  const requestedCursorIndex = rows.findIndex((row) => row.id === requestedCursorId);
  const cursorIndex = rows.length === 0 ? -1 : Math.max(0, requestedCursorIndex);
  const cursorRowId = rows[cursorIndex]?.id;

  return {
    ...KP_EDITOR_ANIMATION_PICKER_IDENTITY,
    promptLabel: "Animation library",
    query: options.query ?? "",
    rows,
    cursorIndex,
    ...(cursorRowId === undefined ? {} : { cursorRowId })
  };
}

export function navigateKpEditorAnimationPicker(
  state: KpEditorAnimationPickerProtocolState,
  command: KpEditorAnimationPickerNavigationCommand
): KpEditorAnimationPickerProtocolState {
  if (state.rows.length === 0) return state;
  const lastIndex = state.rows.length - 1;
  const cursorIndex = Math.min(lastIndex, Math.max(0, nextCursorIndex(state.cursorIndex, lastIndex, command)));
  return {
    ...state,
    cursorIndex,
    cursorRowId: state.rows[cursorIndex]!.id
  };
}

export function acceptKpEditorAnimationPicker(
  state: KpEditorAnimationPickerProtocolState
): KpEditorAnimationPickerSelectionIntent {
  const rowId = state.cursorRowId;
  const outcome: KpEditorAnimationPickerSelectionOutcome = rowId === undefined
    ? { kind: "no-selection" }
    : { kind: "accepted", rowIds: [rowId] };
  return selectionIntent(state, outcome, "row.accept", "Enter");
}

export function cancelKpEditorAnimationPicker(
  state: KpEditorAnimationPickerProtocolState
): KpEditorAnimationPickerSelectionIntent {
  return selectionIntent(state, { kind: "cancelled" }, "row.cancel", "Escape");
}

function nextCursorIndex(
  currentIndex: number,
  lastIndex: number,
  command: KpEditorAnimationPickerNavigationCommand
): number {
  switch (command) {
    case "cursor.first": return 0;
    case "cursor.previous": return currentIndex - 1;
    case "cursor.next": return currentIndex + 1;
    case "cursor.last": return lastIndex;
  }
}

function selectionIntent(
  state: KpEditorAnimationPickerProtocolState,
  outcome: KpEditorAnimationPickerSelectionOutcome,
  command: "row.accept" | "row.cancel",
  key: string
): KpEditorAnimationPickerSelectionIntent {
  // The host resolves this intent later; the protocol layer never performs navigation effects.
  return {
    surfaceId: state.surfaceId,
    providerId: state.providerId,
    query: state.query,
    command,
    key,
    ...outcome
  };
}

export const conceptRoomStyleRoles = [
  "equation.expression",
  "equation.operation",
  "diagram.balance",
  "focus.primary"
] as const;

export type KpConceptRoomStyleRole = typeof conceptRoomStyleRoles[number];

export interface KpConceptRoomRoleBinding {
  readonly className: string;
}

export interface KpConceptRoomThemeShape {
  readonly id: string;
  readonly roles: { readonly [Role in KpConceptRoomStyleRole]: KpConceptRoomRoleBinding };
}

export function defineConceptRoomTheme<const Theme extends KpConceptRoomThemeShape>(
  theme: Theme
): Theme {
  return deepFreeze(theme);
}

// This names structural hooks only; the visual exemplar will supply reviewed type, color, and focus values later.
export const structuralConceptRoomTheme = defineConceptRoomTheme({
  id: "kp.concept-room.structural.v1",
  roles: {
    "equation.expression": { className: "kp-role-equation-expression" },
    "equation.operation": { className: "kp-role-equation-operation" },
    "diagram.balance": { className: "kp-role-diagram-balance" },
    "focus.primary": { className: "kp-role-focus-primary" }
  }
});

export function applyConceptRoomThemeRoles(
  element: Element,
  roles: readonly KpConceptRoomStyleRole[],
  theme: KpConceptRoomThemeShape = structuralConceptRoomTheme
): void {
  const uniqueRoles = [...new Set(roles)];
  const previousClasses = element.getAttribute("data-kp-theme-role-classes")?.split(" ") ?? [];
  previousClasses.forEach((className) => element.classList.remove(className));
  const roleClasses = uniqueRoles.map((role) => theme.roles[role].className);
  roleClasses.forEach((className) => element.classList.add(className));
  element.setAttribute("data-kp-style-roles", uniqueRoles.join(" "));
  element.setAttribute("data-kp-theme", theme.id);
  element.setAttribute("data-kp-theme-role-classes", roleClasses.join(" "));
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as Value & DeepReadonly<Value>;
}

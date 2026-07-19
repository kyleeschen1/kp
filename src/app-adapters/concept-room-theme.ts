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

export interface KpConceptRoomThemeTokens {
  readonly color: {
    readonly paper: string;
    readonly surface: string;
    readonly ink: string;
    readonly mutedInk: string;
    readonly accent: string;
    readonly relation: string;
    readonly focus: string;
    readonly variable: string;
    readonly unit: string;
    readonly line: string;
  };
  readonly typography: {
    readonly displayFamily: string;
    readonly bodyFamily: string;
    readonly controlFamily: string;
    readonly mathFamily: "KaTeX_Main";
    readonly displayWeight: number;
    readonly bodyWeight: number;
    readonly controlWeight: number;
  };
  readonly space: {
    readonly hairline: string;
    readonly compact: string;
    readonly control: string;
    readonly section: string;
    readonly stage: string;
  };
  readonly shape: {
    readonly surfaceRadius: string;
    readonly controlRadius: string;
    readonly lineWidth: string;
  };
  readonly focus: {
    readonly ringWidth: string;
    readonly ringOffset: string;
    readonly washOpacity: number;
  };
  readonly motion: {
    readonly focusMs: number;
    readonly reflowMs: number;
    readonly actMs: number;
    readonly settleMs: number;
  };
}

export interface KpConceptRoomThemeShape {
  readonly id: string;
  readonly roles: { readonly [Role in KpConceptRoomStyleRole]: KpConceptRoomRoleBinding };
  readonly tokens?: KpConceptRoomThemeTokens;
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

// These values are trusted presentation code, while published content remains limited to semantic role names.
export const linearEquationExemplarTheme = defineConceptRoomTheme({
  id: "kp.concept-room.linear-equation-exemplar.v1",
  roles: structuralConceptRoomTheme.roles,
  tokens: {
    color: {
      paper: "#f7f3e8",
      surface: "#fffaf0",
      ink: "#16231d",
      mutedInk: "#59645e",
      accent: "#df7047",
      relation: "#1f6371",
      focus: "#1f6371",
      variable: "#32618f",
      unit: "#df7047",
      line: "#68756e"
    },
    typography: {
      displayFamily: "Georgia, 'Times New Roman', serif",
      bodyFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      controlFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      mathFamily: "KaTeX_Main",
      displayWeight: 600,
      bodyWeight: 400,
      controlWeight: 650
    },
    space: {
      hairline: "0.25rem",
      compact: "0.625rem",
      control: "0.875rem",
      section: "1.5rem",
      stage: "2rem"
    },
    shape: {
      surfaceRadius: "1.125rem",
      controlRadius: "0.5rem",
      lineWidth: "1px"
    },
    focus: {
      ringWidth: "2px",
      ringOffset: "3px",
      washOpacity: 0.12
    },
    motion: {
      focusMs: 160,
      reflowMs: 420,
      actMs: 520,
      settleMs: 220
    }
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

export interface KpCanonicalEquationStageShell {
  readonly stage: HTMLElement;
  readonly viewport: HTMLElement;
  readonly materialFitSurface: HTMLElement;
  readonly materialLayer: HTMLElement;
  readonly transitions: readonly HTMLElement[];
  readonly accessibleEquation?: HTMLElement | undefined;
}

/**
 * The compiler owns stage markup; every host mounts that exact template. This
 * function only validates and exposes the canonical joints, preventing a host
 * from rebuilding a look-alike DOM tree with different paint or a11y owners.
 */
export function mountKpCanonicalEquationStageShell(input: {
  readonly target: HTMLElement;
  readonly template: HTMLTemplateElement;
}): KpCanonicalEquationStageShell {
  const fragment = input.template.content.cloneNode(true) as DocumentFragment;
  const stage = requireDescendant<HTMLElement>(
    fragment,
    "[data-kp-reader-equation-stage]"
  );
  const viewport = requireDescendant<HTMLElement>(
    stage,
    "[data-kp-reader-equation-viewport]"
  );
  const materialFitSurface = requireDescendant<HTMLElement>(
    viewport,
    "[data-kp-reader-material-fit-surface]"
  );
  const materialLayer = requireDescendant<HTMLElement>(
    materialFitSurface,
    "[data-kp-reader-equation-material-layer]"
  );
  const transitions = Object.freeze([
    ...stage.querySelectorAll<HTMLElement>("[data-kp-reader-transition]")
  ]);
  if (transitions.length === 0) {
    throw new Error("Canonical equation stage requires at least one transition.");
  }
  for (const transition of transitions) {
    requireDescendant<HTMLElement>(transition, "[data-kp-reader-fit-surface]");
    const measurement = requireDescendant<HTMLElement>(
      transition,
      "[data-kp-reader-equation-measurement]"
    );
    if (measurement.getAttribute("aria-hidden") !== "true") {
      throw new Error("Canonical equation measurement must be aria-hidden.");
    }
    requireDescendant<HTMLElement>(measurement, '[data-kp-reader-native="source"]');
    requireDescendant<HTMLElement>(measurement, '[data-kp-reader-native="target"]');
  }
  const accessibleEquation = stage.querySelector<HTMLElement>(
    "[data-kp-reader-accessible-equation]"
  ) ?? undefined;
  input.target.append(fragment);
  return Object.freeze({
    stage,
    viewport,
    materialFitSurface,
    materialLayer,
    transitions,
    ...(accessibleEquation === undefined ? {} : { accessibleEquation })
  });
}

function requireDescendant<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Canonical equation stage is missing ${selector}.`);
  }
  return element;
}
